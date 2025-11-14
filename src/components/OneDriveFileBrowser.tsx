import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { File, Folder, ChevronRight, CheckSquare, Square, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./ui/sonner";
// import { ingestData } from '../api/ingest'; // optional, see usage below
import { InteractionRequiredAuthError } from "@azure/msal-browser";

interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  children?: DriveItem[];
  isExpanded?: boolean;
  isLoading?: boolean;
  url?: string;
}

type OneDriveFileBrowserProps = {
  msalInstance: any; // PublicClientApplication
  apiScope: string[]; // ["api://<API_CLIENT_ID>/user_impersonation"]
  graphScopes: string[]; // ["Files.Read", "offline_access"]
  userName: string;
  userEmail: string;
  // optional: ingest endpoint override & optional ingestData helper (that accepts token)
  ingestEndpoint?: string;
  ingestData?: (payload: any, token?: string) => Promise<any>;
};

export function OneDriveFileBrowser({
  msalInstance,
  apiScope,
  graphScopes,
  userName,
  userEmail,
  ingestEndpoint = "http://localhost:8000/ingest_onedrive",
  ingestData,
}: OneDriveFileBrowserProps) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  async function getGraphToken() {
  // defensive checks + logging
  try {
    const accounts = msalInstance.getAllAccounts();
    console.log("MSAL accounts:", accounts);
    if (!accounts || accounts.length === 0) {
      // Not signed in — ask user to sign in (or throw so caller can handle)
      throw new Error("No signed-in account found. Please sign in first.");
    }
    const account = accounts[0];

    // Try silent first
    try {
      const silentResp = await msalInstance.acquireTokenSilent({
        scopes: graphScopes,
        account,
      });
      console.log("acquireTokenSilent succeeded, token length:", silentResp?.accessToken?.length ?? 0);
      if (!silentResp?.accessToken) {
        throw new Error("acquireTokenSilent returned no access token");
      }
      return silentResp.accessToken;
    } catch (silentErr: any) {
      console.warn("acquireTokenSilent failed:", silentErr);

      // If interaction required, try popup (user will see consent if needed)
      if (silentErr instanceof InteractionRequiredAuthError || (silentErr.errorCode && silentErr.errorCode === "interaction_required")) {
        try {
          const popupResp = await msalInstance.acquireTokenPopup({
            scopes: graphScopes,
            account,
          });
          console.log("acquireTokenPopup succeeded, token length:", popupResp?.accessToken?.length ?? 0);
          if (!popupResp?.accessToken) {
            throw new Error("acquireTokenPopup returned no access token");
          }
          return popupResp.accessToken;
        } catch (popupErr) {
          console.error("acquireTokenPopup failed:", popupErr);
          throw new Error("Interactive token acquisition failed. Please ensure popups are allowed and try again.");
        }
      }

      // Other silent error — rethrow
      throw silentErr;
    }
  } catch (err: any) {
    // Normalize error for caller
    const message = err?.message || String(err);
    console.error("getGraphToken error:", message);
    throw new Error(message);
  }
}

  // Acquire API token for backend calls (silent -> popup)
  async function getApiToken() {
    const accounts = msalInstance.getAllAccounts();
    if (!accounts || accounts.length === 0) throw new Error("No signed-in account found");
    const account = accounts[0];
    try {
      const silent = await msalInstance.acquireTokenSilent({ scopes: apiScope, account });
      return silent.accessToken;
    } catch (err: any) {
      if (err instanceof InteractionRequiredAuthError) {
        const popup = await msalInstance.acquireTokenPopup({ scopes: apiScope });
        return popup.accessToken;
      }
      throw err;
    }
  }

  useEffect(() => {
    // when access changes or component mounts, fetch root items with Graph token
    fetchRootItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const fetchRootItems = async () => {
  setIsLoading(true);
  try {
    const graphToken = await getGraphToken(); // will throw if not obtainable
    if (!graphToken) throw new Error("Graph token empty after acquisition.");

    // Log token length to ensure it's not empty (never log token value)
    console.log("Using graph token length:", graphToken.length);

    const response = await fetch("https://graph.microsoft.com/v1.0/me/drive/root/children", {
      headers: { Authorization: `Bearer ${graphToken}` },
    });

    const text = await response.text();
    console.log("Graph /me/drive response status:", response.status, "body:", text);

    if (!response.ok) {
      // Show the exact error from Graph to make debugging faster
      throw new Error(`Graph error ${response.status}: ${text}`);
    }

    const data = JSON.parse(text);
    const normalized = (data.value || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      folder: v.folder,
      file: v.file,
      // Graph sometimes provides direct download url in @microsoft.graph.downloadUrl for driveItem
      url: v["@microsoft.graph.downloadUrl"] || undefined,
    }));
    setItems(normalized);
  } catch (error: any) {
    console.error("Error fetching OneDrive items:", error);
    toast.error(error?.message || "Failed to load OneDrive files");
  } finally {
    setIsLoading(false);
  }
};

  const fetchFolderChildren = async (itemId: string): Promise<DriveItem[]> => {
    try {
      const graphToken = await getGraphToken();
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/children`, {
        headers: { Authorization: `Bearer ${graphToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch folder children");
      const data = await response.json();
      return (data.value || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        folder: v.folder,
        file: v.file,
        url: v["@microsoft.graph.downloadUrl"] || undefined,
      }));
    } catch (error) {
      console.error("Error fetching folder children:", error);
      toast.error("Failed to load folder contents");
      return [];
    }
  };

  const getAllDescendantIds = (item: DriveItem): string[] => {
    const ids: string[] = [item.id];
    if (item.children) {
      item.children.forEach((child) => {
        ids.push(...getAllDescendantIds(child));
      });
    }
    return ids;
  };

  const handleToggleSelection = (item: DriveItem) => {
    const newSelected = new Set(selectedIds);
    const isCurrentlySelected = newSelected.has(item.id);

    if (isCurrentlySelected) {
      const idsToRemove = getAllDescendantIds(item);
      idsToRemove.forEach((id) => newSelected.delete(id));
    } else {
      const idsToAdd = getAllDescendantIds(item);
      idsToAdd.forEach((id) => newSelected.add(id));
    }

    setSelectedIds(newSelected);
  };

  const handleToggleFolder = async (item: DriveItem, path: number[]) => {
    if (!item.folder) return;

    const updateItems = (items: DriveItem[], path: number[]): DriveItem[] => {
      if (path.length === 0) return items;
      const [index, ...restPath] = path;
      return items.map((it, idx) => {
        if (idx !== index) return it;
        if (restPath.length === 0) {
          return { ...it, isExpanded: !it.isExpanded };
        } else {
          return { ...it, children: it.children ? updateItems(it.children, restPath) : [] };
        }
      });
    };

    const wasExpanded = item.isExpanded;
    setItems(updateItems(items, path));

    if (!wasExpanded && !item.children) {
      const setLoading = (items: DriveItem[], path: number[]): DriveItem[] => {
        if (path.length === 0) return items;
        const [index, ...restPath] = path;
        return items.map((it, idx) => {
          if (idx !== index) return it;
          if (restPath.length === 0) {
            return { ...it, isLoading: true };
          }
          return { ...it, children: it.children ? setLoading(it.children, restPath) : [] };
        });
      };

      setItems(setLoading(items, path));
      const children = await fetchFolderChildren(item.id);

      const setChildren = (items: DriveItem[], path: number[]): DriveItem[] => {
        if (path.length === 0) return items;
        const [index, ...restPath] = path;
        return items.map((it, idx) => {
          if (idx !== index) return it;
          if (restPath.length === 0) {
            return { ...it, children, isLoading: false };
          }
          return { ...it, children: it.children ? setChildren(it.children, restPath) : [] };
        });
      };

      setItems(setChildren(items, path));
    }
  };

  const handleSelectAll = () => {
    const getAllIds = (items: DriveItem[]): string[] => {
      let ids: string[] = [];
      items.forEach((item) => {
        ids.push(item.id);
        if (item.children) {
          ids.push(...getAllIds(item.children));
        }
      });
      return ids;
    };

    setSelectedIds(new Set(getAllIds(items)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Helper to find item by id
  function findItemById(items: DriveItem[], id: string): DriveItem | null {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // FINAL: ingestion uses backend. Get API token and POST oneDrive share URLs (or IDs) to backend.
  const handleAddToKnowledgeBase = async () => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.error("Please select at least one file or folder");
      return;
    }

    // Build selected documents list - include share link if possible (we'll send id and name at minimum)
    const selectedDocs = Array.from(selectedIds)
      .map((id) => {
        const item = findItemById(items, id as string);
        if (!item) return null;
        // Only send url (if available) for each document
        return item.url ? item.url : null;
      })
      .filter(Boolean);

    toast.loading("Adding to Knowledge Base...", { duration: 1500 });

    try {
      // Acquire API token for backend (not a Graph token)
      const apiToken = await getApiToken();
      if (!apiToken) throw new Error("Unable to acquire API token");

      // Prepare form data (send only userName, userEmail, documents)
      const form = new FormData();
      form.append("userName", userName);
      form.append("userEmail", userEmail);
      form.append("documents", JSON.stringify(selectedDocs));
      // Optionally: tenant_id, access_tags, etc.
      // form.append("tenant_id", "");
      // form.append("access_tags", "investments,dealflow");
      console.log ("Prepared form data for ingestion:", { userName, userEmail, documents: selectedDocs });
      // POST to backend with Authorization header (API token)
      const resp = await fetch(ingestEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        body: form,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Ingest failed: ${resp.status}`);
      }

      const data = await resp.json();
      console.log("Ingest response:", data);

      toast.success(`Successfully added ${count} item${count > 1 ? "s" : ""} to Knowledge Base`, {
        description: "Your files are being indexed and will be searchable soon.",
      });
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error("Ingest error:", err);
      toast.error(err?.message || "Failed to ingest documents");
    }
  };

  const renderItem = (item: DriveItem, depth: number = 0, path: number[] = []) => {
    const isFolder = !!item.folder;
    const isExpanded = item.isExpanded;
    const isSelected = selectedIds.has(item.id);

    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors group"
          style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleToggleSelection(item)}
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black"
          />

          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => isFolder && handleToggleFolder(item, path)}
          >
            {isFolder ? <Folder className="w-5 h-5 text-white/70" /> : <File className="w-5 h-5 text-white/50" />}

            <span className="text-white/90" style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 300 }}>
              {item.name}
            </span>

            {isFolder && item.folder && (
              <span className="text-white/40 ml-2" style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 300 }}>
                ({item.folder.childCount})
              </span>
            )}
          </div>

          {isFolder && (
            <div className="flex items-center gap-2">
              {item.isLoading && <Loader2 className="w-4 h-4 text-white/40 animate-spin" />}
              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-4 h-4 text-white/60" />
              </motion.div>
            </div>
          )}
        </div>

        {isFolder && isExpanded && item.children && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
            {item.children.map((child, idx) => renderItem(child, depth + 1, [...path, idx]))}
          </motion.div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="mb-6">
        <h2 className="text-white mb-2" style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "1.5rem", fontWeight: 300, letterSpacing: "-0.01em" }}>
          OneDrive Files
        </h2>
        <p className="text-white/50" style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 300 }}>
          Select files and folders to add to your knowledge base
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        <Button onClick={handleSelectAll} variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/40">
          <CheckSquare className="w-4 h-4 mr-2" />
          Select All
        </Button>

        <Button onClick={handleDeselectAll} variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/40">
          <Square className="w-4 h-4 mr-2" />
          Deselect All
        </Button>
      </div>

      {/* File list */}
      <div className="rounded-xl border mb-6" style={{ background: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255, 255, 255, 0.1)" }}>
        <ScrollArea className="h-[500px] p-2">{items.length === 0 ? <div className="flex items-center justify-center py-12"><p className="text-white/40">No files found</p></div> : items.map((item, idx) => renderItem(item, 0, [idx]))}</ScrollArea>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between">
        <span className="text-white/50" style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 300 }}>
          {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
        </span>

        <Button onClick={handleAddToKnowledgeBase} className="px-8 py-6 bg-white text-black hover:bg-white/90 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]" style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, letterSpacing: "0.01em", borderRadius: "0.75rem" }}>
          Add to My Knowledge Base
        </Button>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(20, 20, 20, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            backdropFilter: "blur(20px)",
          },
        }}
      />
    </motion.div>
  );
}
