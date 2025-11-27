import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_URL } from '../config/apiConfig';

const API_BASE_URL = BACKEND_URL;
const ADMIN_TOKEN = 'admin-bypass-token-mgfo-2025-secure';

interface UploadResult {
  filename: string;
  status: 'success' | 'failed' | 'skipped';
  chunks?: number;
  size_mb?: number;
  reason?: string;
}

interface ManualUploadProps {
  msalInstance?: any;
  apiScope?: string[];
}

export function ManualUpload({ msalInstance, apiScope }: ManualUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [additionalUsers, setAdditionalUsers] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const validFiles = files.filter(file => {
      const isValidType = allowedTypes.includes(file.type) || 
                         file.name.match(/\.(pdf|doc|docx|txt|ppt|pptx)$/i);
      if (!isValidType) {
        toast.error(`Invalid file type: ${file.name}`);
      }
      return isValidType;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setIsUploading(true);
    setUploadResults([]);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('additional_users', additionalUsers);

      const response = await fetch(`${API_BASE_URL}/upload-manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setUploadResults(data.results || []);

      toast.success(`Upload complete!`, {
        description: `${data.processed} files processed successfully, ${data.total_chunks} chunks created`,
      });

      // Clear files on success
      setSelectedFiles([]);
      setAdditionalUsers('');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h2 
            className="text-white text-2xl mb-2"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 300,
            }}
          >
            Manual File Upload
          </h2>
          <p 
            className="text-white/60"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 300,
              fontSize: '0.875rem'
            }}
          >
            Upload PDF, DOC, DOCX, TXT, or PPTX files directly to the knowledge base
          </p>
        </div>

        {/* File Selection */}
        <div className="mb-6">
          <label htmlFor="file-upload">
            <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-white/40 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
              <p 
                className="text-white/80 mb-2"
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 400,
                }}
              >
                Click to select files or drag and drop
              </p>
              <p 
                className="text-white/40 text-sm"
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: 300,
                }}
              >
                Supported: PDF, DOC, DOCX, TXT, PPTX (max 80MB per file)
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 
              className="text-white/80 text-sm mb-3"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 400,
              }}
            >
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-white/60" />
                    <div>
                      <p 
                        className="text-white text-sm"
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontWeight: 400,
                        }}
                      >
                        {file.name}
                      </p>
                      <p 
                        className="text-white/40 text-xs"
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Users */}
        <div className="mb-6">
          <label 
            htmlFor="additional-users"
            className="block text-white/80 text-sm mb-2"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 400,
            }}
          >
            Additional Users (optional)
          </label>
          <input
            id="additional-users"
            type="text"
            value={additionalUsers}
            onChange={(e) => setAdditionalUsers(e.target.value)}
            placeholder="user1@company.com, user2@company.com"
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-white/40 rounded-xl px-4 py-3 focus:border-white/40 focus:ring-0 focus:outline-none"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 300,
            }}
          />
          <p 
            className="text-white/40 text-xs mt-2"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 300,
            }}
          >
            Comma-separated list of emails who can access these documents
          </p>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-30 py-6 text-base"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 400,
            borderRadius: '0.75rem'
          }}
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
            </>
          )}
        </Button>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="mt-8">
            <h3 
              className="text-white/80 text-lg mb-4"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 400,
              }}
            >
              Upload Results
            </h3>
            <div className="space-y-2">
              {uploadResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`border rounded-lg p-4 ${
                    result.status === 'success' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : result.status === 'failed'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        result.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                    )}
                    <div className="flex-1">
                      <p 
                        className="text-white font-medium text-sm"
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                      >
                        {result.filename}
                      </p>
                      {result.status === 'success' && (
                        <p 
                          className="text-white/60 text-xs mt-1"
                          style={{
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {result.chunks} chunks created • {result.size_mb} MB
                        </p>
                      )}
                      {result.reason && (
                        <p 
                          className="text-white/60 text-xs mt-1"
                          style={{
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {result.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
