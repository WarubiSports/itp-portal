"use client";

import { useState, useRef } from "react";
import { Upload, Check, X, Loader2, Camera } from "lucide-react";

type Props = {
  label: string;
  prospectId: string;
  documentType: string;
  currentPath: string;
  onUploaded: (path: string) => void;
};

export const FileUpload = ({
  label,
  prospectId,
  documentType,
  currentPath,
  onUploaded,
}: Props) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prospectId", prospectId);
      formData.append("documentType", documentType);

      const res = await fetch("/api/onboarding/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Upload failed");
      }

      const { path } = await res.json();
      onUploaded(path);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
      if (fileRef.current) fileRef.current.removeAttribute("capture");
    }
  };

  const isUploaded = !!currentPath;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
        {label}
      </p>
      <div
        className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          isUploaded
            ? "border-green-700 bg-green-950/20"
            : "border-[var(--color-border)] bg-[var(--color-surface)]"
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-[var(--color-text-secondary)]">
            <Loader2 size={16} className="animate-spin" /> Uploading...
          </div>
        ) : isUploaded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Check size={16} />
              <span>{fileName || "Uploaded"}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onUploaded("");
                setFileName("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-surface)]"
              >
                <Upload size={14} /> Choose File
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.setAttribute("capture", "environment");
                    fileRef.current.click();
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-surface)]"
              >
                <Camera size={14} /> Take Photo
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">PDF, JPG, or PNG up to 10 MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};
