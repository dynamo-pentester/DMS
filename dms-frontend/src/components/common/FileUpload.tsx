import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Eye, FileText, Loader2, Paperclip } from "lucide-react";
import { api } from "@/api/axiosInstance";
import AppModal from "./AppModal";
import clsx from "clsx";

export interface FileUploadProps {
  /** Short label used in toasts/tooltips, e.g. "Driver Photo", "Licence Document" */
  label: string;
  /** HasPhoto / HasDocument / HasCertificate / HasReport flag from the record's DTO */
  hasFile: boolean;
  /** GET endpoint (relative to the API base) that streams the file back, e.g. `/drivers/5/photo` */
  fileUrl: string;
  /** Uploads the selected file - callers pass the corresponding service.upload* call */
  onUpload: (file: File) => Promise<void>;
  /** `accept` attribute for the native file input */
  accept?: string;
  /** Helper text, e.g. "JPG or PNG, up to 5 MB" */
  hint?: string;
  /** "photo" shows an inline thumbnail preview; "document" shows a generic file tile */
  variant?: "photo" | "document";
  /** Compact icon-only rendering, for use inside table cells */
  compact?: boolean;
  /** Disables all actions (e.g. no permission) */
  disabled?: boolean;
}

/**
 * Reusable upload / preview / download / replace control for the document & photo
 * attachments added across Drivers, Licenses, Medical Records, and Incidents.
 * Works purely off the `HasPhoto`/`HasDocument`/`HasCertificate`/`HasReport` flags -
 * the raw storage path never reaches the client, files are only ever fetched by ID
 * through the corresponding GET route.
 */
export function FileUpload({
  label,
  hasFile,
  fileUrl,
  onUpload,
  accept = "image/jpeg,image/png",
  hint,
  variant = "document",
  compact = false,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Revoke blob URLs on unmount to avoid leaking memory
  useEffect(() => {
    return () => {
      if (lightboxUrl) URL.revokeObjectURL(lightboxUrl);
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For the full photo panel, auto-load a thumbnail if a photo already exists
  useEffect(() => {
    if (!compact && variant === "photo" && hasFile && !thumbnailUrl) {
      fetchThumbnail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFile, compact, variant]);

  const fetchThumbnail = async () => {
    try {
      const { data } = await api.get(fileUrl, { responseType: "blob" });
      const url = URL.createObjectURL(data as Blob);
      setThumbnailUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      // silently ignore - the panel just falls back to the placeholder
    }
  };

  const handlePickFile = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    try {
      setUploading(true);
      await onUpload(file);
      toast.success(`${label} uploaded successfully`);
      if (variant === "photo") {
        const url = URL.createObjectURL(file);
        setThumbnailUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${label.toLowerCase()}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async () => {
    if (!hasFile || previewLoading) return;
    try {
      setPreviewLoading(true);
      const res = await api.get(fileUrl, { responseType: "blob" });
      const blob = res.data as Blob;
      const contentType = (res.headers?.["content-type"] as string) || blob.type;
      const url = URL.createObjectURL(blob);
      if (contentType.startsWith("image/")) {
        setLightboxUrl(url);
      } else {
        // PDFs/Word docs open in a new tab - the browser handles previewing those natively
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!hasFile || downloading) return;
    try {
      setDownloading(true);
      const res = await api.get(`${fileUrl}?download=true`, { responseType: "blob" });
      const disposition = res.headers?.["content-disposition"] as string | undefined;
      const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const fileName = match?.[1] || label.replace(/\s+/g, "_").toLowerCase();
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  const hiddenInput = (
    <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileSelected} />
  );

  const lightbox = (
    <AppModal isOpen={!!lightboxUrl} onClose={() => setLightboxUrl(null)} title={label} size="lg">
      {lightboxUrl && (
        <img src={lightboxUrl} alt={label} className="mx-auto max-h-[70vh] w-auto rounded-xl object-contain" />
      )}
    </AppModal>
  );

  // ---- Compact (table cell) rendering ----
  if (compact) {
    return (
      <div className="flex items-center justify-end gap-1">
        {hiddenInput}
        {lightbox}
        {hasFile ? (
          <>
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading}
              title={`Preview ${label}`}
              className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 disabled:opacity-50"
            >
              {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title={`Download ${label}`}
              className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 disabled:opacity-50"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            </button>
          </>
        ) : (
          <span className="text-[10px] font-medium text-slate-350 dark:text-slate-600 mr-1">No file</span>
        )}
        <button
          type="button"
          onClick={handlePickFile}
          disabled={disabled || uploading}
          title={hasFile ? `Replace ${label}` : `Upload ${label}`}
          className="p-1.5 hover:bg-slate-100 rounded-md dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
        </button>
      </div>
    );
  }

  // ---- Full panel rendering (photo dropzone / document tile) ----
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
      {hiddenInput}
      {lightbox}
      <div className="flex items-center gap-4">
        {variant === "photo" ? (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={label} className="h-full w-full object-cover" />
            ) : (
              <Paperclip size={20} className="text-slate-300 dark:text-slate-600" />
            )}
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <FileText size={22} className={hasFile ? "text-blue-500" : "text-slate-300 dark:text-slate-600"} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</div>
          <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {hasFile ? "Uploaded" : hint || "No file uploaded yet"}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePickFile}
              disabled={disabled || uploading}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50",
                hasFile
                  ? "border border-slate-200 text-slate-700 hover:bg-white dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-650"
              )}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
              {hasFile ? "Replace" : "Upload"}
            </button>

            {hasFile && (
              <>
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  {previewLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
