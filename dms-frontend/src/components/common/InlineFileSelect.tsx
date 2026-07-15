import { useEffect, useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";

export interface InlineFileSelectProps {
  /** Short label used for headings/messages, e.g. "Driver Photo", "Licence Document" */
  label: string;
  /** `accept` attribute for the native file input, e.g. "image/jpeg,image/png" */
  accept: string;
  /** Allowed extensions (lowercase, with dot) used for client-side validation, e.g. [".jpg", ".png"] */
  allowedExtensions: string[];
  /** Maximum file size in MB, used for client-side validation */
  maxSizeMb: number;
  /** Helper text shown under the label, e.g. "JPG or PNG, up to 5 MB" */
  hint?: string;
  /** "photo" shows an inline image thumbnail preview; "document" shows a generic file tile */
  variant?: "photo" | "document";
  /** Currently selected file, or null if none */
  value: File | null;
  /** Called with the newly selected file, or null when removed */
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

/**
 * Lets the user pick a file to be submitted together with a Create form (no
 * upload happens here - the parent form sends the file alongside the entity
 * fields in one multipart/form-data request). Supports preview, replace, and
 * remove, plus client-side type/size validation before the file is ever handed
 * back to the parent.
 */
export function InlineFileSelect({
  label,
  accept,
  allowedExtensions,
  maxSizeMb,
  hint,
  variant = "document",
  value,
  onChange,
  disabled = false,
}: InlineFileSelectProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (variant === "photo" && value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [value, variant]);

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const validate = (file: File): string | null => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!allowedExtensions.includes(extension)) {
      return `Unsupported file type '${extension}'. Allowed types: ${allowedExtensions.join(", ")}.`;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `File exceeds the maximum allowed size of ${maxSizeMb} MB.`;
    }
    return null;
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onChange(file);
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelected}
        disabled={disabled}
      />
      <div className="flex items-center gap-4">
        {variant === "photo" ? (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {previewUrl ? (
              <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
            ) : (
              <Paperclip size={20} className="text-slate-300 dark:text-slate-600" />
            )}
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <FileText size={22} className={value ? "text-blue-500" : "text-slate-300 dark:text-slate-600"} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</div>
          <div className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
            {value ? value.name : hint || "No file selected yet"}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePick}
              disabled={disabled}
              className={
                value
                  ? "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  : "inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-650"
              }
            >
              <Paperclip size={13} />
              {value ? "Replace" : variant === "photo" ? "Select Image" : "Select File"}
            </button>

            {value && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-white disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-900"
              >
                <X size={13} />
                Remove
              </button>
            )}
          </div>
          {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default InlineFileSelect;
