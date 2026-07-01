import React, { useRef, useState, useCallback } from "react";
import {
  UploadCloud,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  X,
  Calendar,
  User,
  FileArchive,
  Loader2,
} from "lucide-react";
import type { CADDrawing } from "@/types/floor";

interface UploadCADProps {
  onUpload: (file: File) => void;
  onDelete?: () => void;
  isUploading?: boolean;
  currentCAD?: CADDrawing;
}

const ACCEPTED_EXTENSIONS = [".dwg", ".dxf", ".pdf", ".png", ".jpg", ".jpeg"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function UploadCAD({ onUpload, onDelete, isUploading = false, currentCAD }: UploadCADProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(null);
      onUpload(file);
    } else {
      setError(`Unsupported format. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDownload = () => {
    if (!currentCAD?.url) return;
    const link = document.createElement("a");
    link.href = currentCAD.url;
    link.download = currentCAD.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canPreview =
    currentCAD && (currentCAD.type === "pdf" || ["png", "jpg", "jpeg"].includes(currentCAD.type));

  return (
    <div className="w-full space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
      />

      {/* ── Active CAD card ──────────────────────────────────────────── */}
      {currentCAD ? (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-card shadow-sm">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-xs font-semibold truncate" title={currentCAD.name}>
                {currentCAD.name}
              </span>
              <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                {currentCAD.type}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {canPreview && (
                <button
                  onClick={() => setShowPreview(true)}
                  title="Preview CAD"
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={handleDownload}
                title="Download CAD"
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => !isUploading && fileInputRef.current?.click()}
                title="Replace CAD"
                disabled={isUploading}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isUploading ? "animate-spin" : ""}`} />
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  title="Delete CAD"
                  disabled={isUploading}
                  className="p-1.5 text-muted-foreground hover:text-risk-red hover:bg-risk-red/10 rounded-md transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground px-0.5">
            {currentCAD.size && (
              <div className="flex items-center gap-1">
                <FileArchive className="h-3 w-3 shrink-0" />
                <span>{formatBytes(currentCAD.size)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{formatDate(currentCAD.uploadDate)}</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{currentCAD.uploadedBy || "WB-FDVA System"}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Drop zone ───────────────────────────────────────────────── */
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={`w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed hover:bg-secondary/50 transition-colors p-5 shadow-sm ${
            dragOver ? "border-blue-500 bg-blue-500/10" : "border-border bg-card"
          } ${isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="text-xs font-medium text-primary">Analysing CAD with AI...</span>
            </>
          ) : (
            <>
              <UploadCloud
                className={`h-6 w-6 ${dragOver ? "text-blue-500" : "text-muted-foreground"}`}
              />
              <span className="text-xs font-medium text-foreground">
                Drag & Drop or Click to Upload CAD
              </span>
              <span className="text-[10px] text-muted-foreground">DWG · DXF · PDF · PNG · JPG</span>
            </>
          )}
        </button>
      )}

      {/* AI processing overlay on existing card */}
      {isUploading && currentCAD && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 p-2.5 rounded-lg">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span>AI extraction in progress — please wait...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-risk-red bg-risk-red/10 border border-risk-red/20 p-2.5 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Preview modal ─────────────────────────────────────────────── */}
      {showPreview && currentCAD && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
              <span className="text-xs font-semibold text-foreground truncate">
                {currentCAD.name}
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-48px)] bg-[#0f172a] flex items-center justify-center p-4 min-h-[400px]">
              {currentCAD.type === "pdf" ? (
                <iframe
                  src={currentCAD.url}
                  title={currentCAD.name}
                  className="w-full h-[70vh] rounded border border-border"
                />
              ) : (
                <img
                  src={currentCAD.url}
                  alt={currentCAD.name}
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
