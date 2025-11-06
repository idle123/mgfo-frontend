import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { File, Folder, ChevronRight, CheckSquare, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './ui/sonner';

interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  children?: DriveItem[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface OneDriveFileBrowserProps {
  accessToken: string;
}

export function OneDriveFileBrowser({ accessToken }: OneDriveFileBrowserProps) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRootItems();
  }, [accessToken]);

  const fetchRootItems = async () => {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/children', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch items');

      const data = await response.json();
      setItems(data.value || []);
    } catch (error) {
      console.error('Error fetching OneDrive items:', error);
      toast.error('Failed to load OneDrive files');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolderChildren = async (itemId: string): Promise<DriveItem[]> => {
    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/children`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch folder children');

      const data = await response.json();
      return data.value || [];
    } catch (error) {
      console.error('Error fetching folder children:', error);
      toast.error('Failed to load folder contents');
      return [];
    }
  };

  const getAllDescendantIds = (item: DriveItem): string[] => {
    const ids: string[] = [item.id];
    if (item.children) {
      item.children.forEach(child => {
        ids.push(...getAllDescendantIds(child));
      });
    }
    return ids;
  };

  const handleToggleSelection = (item: DriveItem) => {
    const newSelected = new Set(selectedIds);
    const isCurrentlySelected = newSelected.has(item.id);

    if (isCurrentlySelected) {
      // Deselect this item and all descendants
      const idsToRemove = getAllDescendantIds(item);
      idsToRemove.forEach(id => newSelected.delete(id));
    } else {
      // Select this item and all descendants
      const idsToAdd = getAllDescendantIds(item);
      idsToAdd.forEach(id => newSelected.add(id));
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
          // This is the target item
          return {
            ...it,
            isExpanded: !it.isExpanded
          };
        } else {
          // Continue down the tree
          return {
            ...it,
            children: it.children ? updateItems(it.children, restPath) : []
          };
        }
      });
    };

    // Toggle expansion
    const wasExpanded = item.isExpanded;
    setItems(updateItems(items, path));

    // If expanding and children not loaded, fetch them
    if (!wasExpanded && !item.children) {
      // Set loading state
      const setLoading = (items: DriveItem[], path: number[]): DriveItem[] => {
        if (path.length === 0) return items;
        const [index, ...restPath] = path;
        return items.map((it, idx) => {
          if (idx !== index) return it;
          if (restPath.length === 0) {
            return { ...it, isLoading: true };
          }
          return {
            ...it,
            children: it.children ? setLoading(it.children, restPath) : []
          };
        });
      };

      setItems(setLoading(items, path));

      // Fetch children
      const children = await fetchFolderChildren(item.id);

      // Update with children
      const setChildren = (items: DriveItem[], path: number[]): DriveItem[] => {
        if (path.length === 0) return items;
        const [index, ...restPath] = path;
        return items.map((it, idx) => {
          if (idx !== index) return it;
          if (restPath.length === 0) {
            return { ...it, children, isLoading: false };
          }
          return {
            ...it,
            children: it.children ? setChildren(it.children, restPath) : []
          };
        });
      };

      setItems(setChildren(items, path));
    }
  };

  const handleSelectAll = () => {
    const getAllIds = (items: DriveItem[]): string[] => {
      let ids: string[] = [];
      items.forEach(item => {
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

  const handleAddToKnowledgeBase = () => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.error('Please select at least one file or folder');
      return;
    }

    toast.loading('Adding to Knowledge Base...', { duration: 1500 });
    
    setTimeout(() => {
      toast.success(`Successfully added ${count} item${count > 1 ? 's' : ''} to Knowledge Base`, {
        description: 'Your files are being indexed and will be searchable soon.'
      });
    }, 1500);
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
            {isFolder ? (
              <Folder className="w-5 h-5 text-white/70" />
            ) : (
              <File className="w-5 h-5 text-white/50" />
            )}

            <span
              className="text-white/90"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 300
              }}
            >
              {item.name}
            </span>

            {isFolder && item.folder && (
              <span
                className="text-white/40 ml-2"
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 300
                }}
              >
                ({item.folder.childCount})
              </span>
            )}
          </div>

          {isFolder && (
            <div className="flex items-center gap-2">
              {item.isLoading && <Loader2 className="w-4 h-4 text-white/40 animate-spin" />}
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-white/60" />
              </motion.div>
            </div>
          )}
        </div>

        {isFolder && isExpanded && item.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-6">
        <h2
          className="text-white mb-2"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 300,
            letterSpacing: '-0.01em'
          }}
        >
          OneDrive Files
        </h2>
        <p
          className="text-white/50"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 300
          }}
        >
          Select files and folders to add to your knowledge base
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={handleSelectAll}
          variant="outline"
          className="bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/40"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 300
          }}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Select All
        </Button>

        <Button
          onClick={handleDeselectAll}
          variant="outline"
          className="bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/40"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 300
          }}
        >
          <Square className="w-4 h-4 mr-2" />
          Deselect All
        </Button>
      </div>

      {/* File list */}
      <div
        className="rounded-xl border mb-6"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <ScrollArea className="h-[500px] p-2">
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p
                className="text-white/40"
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 300
                }}
              >
                No files found
              </p>
            </div>
          ) : (
            items.map((item, idx) => renderItem(item, 0, [idx]))
          )}
        </ScrollArea>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between">
        <span
          className="text-white/50"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 300
          }}
        >
          {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
        </span>

        <Button
          onClick={handleAddToKnowledgeBase}
          className="px-8 py-6 bg-white text-black hover:bg-white/90 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '1rem',
            fontWeight: 400,
            letterSpacing: '0.01em',
            borderRadius: '0.75rem'
          }}
        >
          Add to My Knowledge Base
        </Button>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 20, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            backdropFilter: 'blur(20px)',
          },
        }}
      />
    </motion.div>
  );
}
