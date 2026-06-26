import React, { useRef, useState, useCallback } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, FileImage, FileArchive } from "lucide-react";

interface UploadCADProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

const ACCEPTED_EXTENSIONS = [".dwg", ".dxf", ".pdf", ".png", ".jpg", ".jpeg"];

export function UploadCAD({ onUpload, isUploading = false }: UploadCADProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(null);
      onUpload(file);
    } else {
      setError(`Unsupported extension. Please upload one of: ${ACCEPTED_EXTENSIONS.join(", ")}`);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
          isUploading ? "opacity-60 cursor-not-allowed border-border" : "cursor-pointer"
        } ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 bg-secondary/15"
        }`}
      >
        <div className={`h-11 w-11 rounded-full flex items-center justify-center mb-3 transition-colors ${dragOver ? "bg-primary/20" : "bg-primary/10"}`}>
          <UploadCloud className={`h-5.5 w-5.5 ${dragOver ? "text-primary animate-bounce" : "text-primary"}`} />
        </div>
        <h4 className="font-semibold text-xs text-foreground mb-0.5">
          {isUploading ? "Uploading drawing..." : "Upload Floor CAD/Drawing"}
        </h4>
        <p className="text-[10px] text-muted-foreground mb-3">
          Drag & drop a file here or click to browse
        </p>
        <span className="rounded-md bg-secondary border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80">
          Select CAD File
        </span>
        <p className="text-[9px] text-muted-foreground mt-2">
          Supported: .dwg, .dxf, .pdf, .png, .jpg
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={isUploading}
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-risk-red bg-risk-red/10 border border-risk-red/20 p-2.5 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
