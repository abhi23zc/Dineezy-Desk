"use client";

/**
 * AttachmentManager Component
 * Handles file uploads, displays attachment list, and manages file operations.
 * Features an interactive image slider carousel and fullscreen lightbox viewer for images.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  useAttachments,
  type Attachment,
  formatFileSize,
  getFileIcon,
} from "../hooks/useAttachments";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AttachmentManagerProps {
  taskId: string;
  isExpanded: boolean;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icons = {
  attachment: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  download: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  delete: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  file: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  pdf: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  ),
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AttachmentManager({ taskId, isExpanded }: AttachmentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Carousel & Lightbox state
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const {
    attachments,
    loading,
    uploading,
    error,
    uploadError,
    deleteError,
    uploadAttachments,
    deleteAttachment,
    generateDownloadUrl,
    clearErrors,
  } = useAttachments(taskId);

  // Prefetch signed URLs for image attachments
  useEffect(() => {
    const loadUrls = async () => {
      const images = attachments.filter((a) => a.mime_type.startsWith("image/"));
      const newUrls: Record<string, string> = { ...imageUrls };
      let changed = false;

      for (const img of images) {
        if (!newUrls[img.id]) {
          try {
            const url = await generateDownloadUrl(img);
            newUrls[img.id] = url;
            changed = true;
          } catch (err) {
            console.error("Failed to generate url for image:", img.file_name, err);
          }
        }
      }

      // Cleanup deleted urls
      const activeIds = new Set(images.map((img) => img.id));
      for (const key of Object.keys(newUrls)) {
        if (!activeIds.has(key)) {
          delete newUrls[key];
          changed = true;
        }
      }

      if (changed) {
        setImageUrls(newUrls);
      }
    };

    if (attachments.length > 0) {
      loadUrls();
    } else {
      setImageUrls({});
    }
  }, [attachments, generateDownloadUrl]);

  // Manage body scroll lock when modal or lightbox is open
  useEffect(() => {
    if (isModalOpen || lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, lightboxIndex]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxIndex === null) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, lightboxIndex]);

  // Separate images vs non-images
  const imageAttachments = attachments.filter((a) => a.mime_type.startsWith("image/"));
  const documentAttachments = attachments.filter((a) => !a.mime_type.startsWith("image/"));

  // Adjust index if images are deleted
  useEffect(() => {
    if (currentImgIndex >= imageAttachments.length && imageAttachments.length > 0) {
      setCurrentImgIndex(imageAttachments.length - 1);
    }
  }, [imageAttachments.length, currentImgIndex]);

  // Lightbox keyboard handler
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft" && imageAttachments.length > 1) {
        setLightboxIndex((prev) => (prev! === 0 ? imageAttachments.length - 1 : prev! - 1));
      } else if (e.key === "ArrowRight" && imageAttachments.length > 1) {
        setLightboxIndex((prev) => (prev! === imageAttachments.length - 1 ? 0 : prev! + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, imageAttachments.length]);

  // Only show attachments section when task is expanded
  if (!isExpanded) return null;

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await uploadAttachments(Array.from(files));

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Handle delete
  const handleDelete = async (attachment: Attachment) => {
    setDeletingId(attachment.id);
    try {
      await deleteAttachment(attachment);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle download
  const handleDownload = async (attachment: Attachment) => {
    setDownloadingId(attachment.id);
    try {
      const url = await generateDownloadUrl(attachment);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate download link");
    } finally {
      setDownloadingId(null);
    }
  };

  // Get icon based on file type
  const getFileIconComponent = (mimeType: string) => {
    const iconType = getFileIcon(mimeType);
    switch (iconType) {
      case "image":
        return Icons.image;
      case "pdf":
        return Icons.pdf;
      default:
        return Icons.file;
    }
  };

  return (
    <div className="mt-[12px] pt-[12px] border-t border-border-custom flex items-center">
      {/* Trigger Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-[8px] h-[28px] px-[12px] rounded-[6px] border border-border-custom bg-bg-card text-text-secondary hover:text-foreground hover:bg-bg-raised transition-all duration-75 active:scale-95 cursor-pointer text-[11px] font-semibold"
      >
        {Icons.attachment}
        <span>
          {attachments.length > 0
            ? `View attachments (${attachments.length})`
            : "Add attachments"}
        </span>
      </button>

      {uploading && (
        <span className="text-[11px] text-text-muted ml-[10px] animate-pulse">
          Uploading...
        </span>
      )}

      {/* Modal Dialog Overlay */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-[16px] animate-fade-in"
        >
          <div className="bg-bg-panel border border-border-custom rounded-[12px] w-full max-w-[480px] p-[20px] shadow-lg animate-slide-down-in flex flex-col gap-[14px]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[8px]">
                <span className="text-text-secondary">{Icons.attachment}</span>
                <h3 className="text-[14px] font-semibold text-foreground">Attachments</h3>
                {attachments.length > 0 && !loading && (
                  <span className="text-[12px] text-text-muted">({attachments.length})</span>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-text-muted hover:bg-bg-raised hover:text-foreground transition-colors cursor-pointer"
              >
                {Icons.close}
              </button>
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border border-dashed rounded-[8px] p-[16px] text-center cursor-pointer transition-colors duration-100 ${
                dragActive
                  ? "border-foreground bg-bg-raised"
                  : "border-border-custom hover:border-text-secondary"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.js,.ts,.css,.html,.zip"
              />
              <div className="flex flex-col items-center gap-[4px]">
                <span className="text-text-muted">{Icons.upload}</span>
                <span className="text-[12px] font-medium text-foreground">
                  Click to upload files or drag and drop
                </span>
                <span className="text-[10px] text-text-muted">
                  Max 10MB each • Images, PDFs, documents
                </span>
              </div>
            </div>

            {/* Error notifications */}
            {(error || uploadError || deleteError) && (
              <div className="p-[8px] rounded-[6px] bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] border border-red-200 dark:border-red-500/20">
                <div className="flex items-start gap-[6px]">
                  <span className="text-[#991B1B] dark:text-[#F87171] mt-[1px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] text-[#991B1B] dark:text-[#F87171]">
                      {uploadError || deleteError || error}
                    </p>
                  </div>
                  <button
                    onClick={clearErrors}
                    className="text-text-muted hover:text-foreground"
                  >
                    {Icons.close}
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Content Container */}
            <div className="max-h-[300px] overflow-y-auto pr-[2px] flex flex-col gap-[14px]">
              
              {/* Image Carousel / Slider */}
              {!loading && imageAttachments.length > 0 && (
                <div className="flex flex-col gap-[6px]">
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider pl-[4px]">
                    Images ({imageAttachments.length})
                  </span>
                  
                  <div className="relative group/slider w-full h-[180px] bg-bg-card border border-border-custom rounded-[8px] overflow-hidden flex items-center justify-center">
                    
                    {/* Active Image Render */}
                    {imageUrls[imageAttachments[currentImgIndex]?.id] ? (
                      <div
                        onClick={() => setLightboxIndex(currentImgIndex)}
                        className="w-full h-full flex items-center justify-center cursor-zoom-in relative bg-[#09090b]/10 dark:bg-[#000000]/30 hover:opacity-95 transition-opacity"
                      >
                        <img
                          src={imageUrls[imageAttachments[currentImgIndex].id]}
                          alt={imageAttachments[currentImgIndex].file_name}
                          className="max-w-full max-h-full object-contain p-[4px]"
                        />
                        
                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-[8px] flex items-center justify-between opacity-0 group-hover/slider:opacity-100 transition-opacity duration-150 text-white">
                          <div className="flex flex-col min-w-0 flex-1 pr-[8px]">
                            <span className="text-[11px] font-medium truncate" title={imageAttachments[currentImgIndex].file_name}>
                              {imageAttachments[currentImgIndex].file_name}
                            </span>
                            <span className="text-[9px] text-white/75">
                              {formatFileSize(imageAttachments[currentImgIndex].file_size)}
                            </span>
                          </div>
                          <div className="flex items-center gap-[4px] shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(imageAttachments[currentImgIndex]);
                              }}
                              disabled={downloadingId === imageAttachments[currentImgIndex].id}
                              className="w-[24px] h-[24px] rounded-[4px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                              title="Download"
                            >
                              {Icons.download}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(imageAttachments[currentImgIndex]);
                              }}
                              disabled={deletingId === imageAttachments[currentImgIndex].id}
                              className="w-[24px] h-[24px] rounded-[4px] bg-[#991B1B]/85 hover:bg-[#991B1B] flex items-center justify-center text-white cursor-pointer transition-colors"
                              title="Delete"
                            >
                              {Icons.delete}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-[12px] text-text-muted animate-pulse">
                        Generating preview...
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {imageAttachments.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImgIndex((prev) => (prev === 0 ? imageAttachments.length - 1 : prev - 1));
                          }}
                          className="absolute left-[8px] w-[26px] h-[26px] rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImgIndex((prev) => (prev === imageAttachments.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-[8px] w-[26px] h-[26px] rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                        
                        {/* Slide Dots Indicator */}
                        <div className="absolute top-[8px] right-[8px] bg-black/60 px-[6px] py-[2px] rounded-[4px] text-white text-[9px] font-semibold">
                          {currentImgIndex + 1} / {imageAttachments.length}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Other Documents & Files List */}
              <div className="flex flex-col gap-[6px]">
                {!loading && documentAttachments.length > 0 && (
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider pl-[4px]">
                    Documents & Files ({documentAttachments.length})
                  </span>
                )}

                <div className="flex flex-col gap-[6px]">
                  {loading ? (
                    <>
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-[8px] p-[8px] rounded-[6px] bg-bg-raised animate-pulse">
                          <div className="w-[32px] h-[32px] rounded-[4px] bg-border-custom" />
                          <div className="flex-1">
                            <div className="h-[12px] w-[120px] rounded bg-border-custom" />
                            <div className="h-[10px] w-[60px] mt-[4px] rounded bg-border-custom" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : documentAttachments.length > 0 ? (
                    <>
                      {documentAttachments.map((attachment) => (
                        <AttachmentItem
                          key={attachment.id}
                          attachment={attachment}
                          isDeleting={deletingId === attachment.id}
                          isDownloading={downloadingId === attachment.id}
                          onDelete={() => handleDelete(attachment)}
                          onDownload={() => handleDownload(attachment)}
                          getFileIcon={getFileIconComponent}
                        />
                      ))}
                    </>
                  ) : null}
                </div>
              </div>

              {!loading && attachments.length === 0 && (
                <div className="py-[32px] text-center">
                  <span className="text-[12px] text-text-muted italic">No attachments yet</span>
                </div>
              )}
            </div>

            {/* Footer / Done Action */}
            <div className="flex justify-end pt-[8px] border-t border-border-custom">
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-[32px] px-[16px] rounded-[6px] bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Overlay */}
      {lightboxIndex !== null && imageAttachments[lightboxIndex] && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
          className="fixed inset-0 z-60 bg-black/90 dark:bg-black/95 flex flex-col items-center justify-center p-[20px] animate-fade-in"
        >
          {/* Lightbox Header */}
          <div className="absolute top-[16px] left-[16px] text-white/90 max-w-[calc(100%-120px)] flex flex-col">
            <h4 className="text-[13px] sm:text-[14px] font-semibold truncate" title={imageAttachments[lightboxIndex].file_name}>
              {imageAttachments[lightboxIndex].file_name}
            </h4>
            <span className="text-[10px] sm:text-[11px] text-white/60">
              {formatFileSize(imageAttachments[lightboxIndex].file_size)}
            </span>
          </div>

          {/* Close Lightbox */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-[16px] right-[16px] w-[36px] h-[36px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
            title="Close viewer"
          >
            {Icons.close}
          </button>

          {/* Large Image Frame */}
          <div className="w-full max-w-5xl max-h-[80vh] flex items-center justify-center p-[10px]">
            {imageUrls[imageAttachments[lightboxIndex].id] ? (
              <img
                src={imageUrls[imageAttachments[lightboxIndex].id]}
                alt={imageAttachments[lightboxIndex].file_name}
                className="max-w-full max-h-[80vh] object-contain rounded-[6px] shadow-2xl animate-scale-in"
              />
            ) : (
              <span className="text-white/60 animate-pulse text-[12px]">Loading image...</span>
            )}
          </div>

          {/* Lightbox Side Navigation Controls */}
          {imageAttachments.length > 1 && (
            <>
              {/* Prev Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! === 0 ? imageAttachments.length - 1 : prev! - 1));
                }}
                className="absolute left-[16px] sm:left-[24px] w-[40px] h-[40px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
                title="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              
              {/* Next Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! === imageAttachments.length - 1 ? 0 : prev! + 1));
                }}
                className="absolute right-[16px] sm:right-[24px] w-[40px] h-[40px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
                title="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Index Tracker */}
              <div className="absolute bottom-[20px] bg-white/10 px-[10px] py-[4px] rounded-full text-white/80 text-[11px] font-semibold">
                {lightboxIndex + 1} / {imageAttachments.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Attachment Item Sub-component ─────────────────────────────────────────────

interface AttachmentItemProps {
  attachment: Attachment;
  isDeleting: boolean;
  isDownloading: boolean;
  onDelete: () => void;
  onDownload: () => void;
  getFileIcon: (mimeType: string) => React.ReactNode;
}

function AttachmentItem({
  attachment,
  isDeleting,
  isDownloading,
  onDelete,
  onDownload,
  getFileIcon,
}: AttachmentItemProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showConfirmDelete) {
      onDelete();
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
    }
  };

  return (
    <div className="group flex items-center gap-[8px] p-[8px] rounded-[6px] bg-bg-card border border-border-custom hover:border-text-secondary transition-colors">
      {/* File Icon */}
      <div className="w-[36px] h-[36px] flex items-center justify-center rounded-[4px] bg-bg-raised text-text-secondary shrink-0">
        {getFileIcon(attachment.mime_type)}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-foreground truncate" title={attachment.file_name}>
          {attachment.file_name}
        </p>
        <p className="text-[10px] text-text-muted">
          {formatFileSize(attachment.file_size)} • {formatDate(attachment.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[4px] md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {/* Download Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          disabled={isDownloading}
          className="w-[28px] h-[28px] flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-bg-raised hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
          title="Download"
        >
          {isDownloading ? (
            <svg className="animate-spin w-[14px] h-[14px]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            Icons.download
          )}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className={`w-[28px] h-[28px] flex items-center justify-center rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer ${
            showConfirmDelete
              ? "bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.15)] text-[#991B1B] dark:text-[#F87171]"
              : "text-text-secondary hover:bg-[#FEF2F2] dark:hover:bg-[rgba(239,68,68,0.1)] hover:text-[#991B1B] dark:hover:text-[#F87171]"
          }`}
          title={showConfirmDelete ? "Click again to confirm" : "Delete"}
        >
          {isDeleting ? (
            <svg className="animate-spin w-[14px] h-[14px]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            Icons.delete
          )}
        </button>
      </div>
    </div>
  );
}

// Re-export for use in dashboard
export { useAttachments, formatFileSize, getFileIcon };
export type { Attachment };
