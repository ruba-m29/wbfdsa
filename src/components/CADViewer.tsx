import React from "react";
import { FileArchive, FileText, Download, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { PDFViewer } from "./PDFViewer";
import type { CADDrawing, FloorDetails, FloorStatistics } from "@/types/floor";

interface CADViewerProps {
  drawing?: CADDrawing;
  details?: FloorDetails;
  stats?: FloorStatistics;
  onDownload?: () => void;
}

export function CADViewer({ drawing, details, stats, onDownload }: CADViewerProps) {
  if (!drawing) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center min-h-[350px]">
        <FileText className="mx-auto h-10 w-10 mb-3 text-muted-foreground/60" />
        <h4 className="font-semibold text-foreground mb-1">No Floor Layout Loaded</h4>
        <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
          Please upload a PDF, DWG, DXF or image drawing for this floor level to activate the CAD
          viewer.
        </p>
      </div>
    );
  }

  const { type, name, url } = drawing;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full rounded-xl border border-border bg-secondary/20 overflow-hidden relative"
    >
      {type === "pdf" ? (
        <PDFViewer url={url} name={name} />
      ) : ["png", "jpg", "jpeg"].includes(type) ? (
        <div className="flex flex-col bg-card">
          {/* Image Toolbar */}
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 text-xs">
            <span className="font-medium text-foreground truncate max-w-[300px]" title={name}>
              {name}
            </span>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-background hover:bg-secondary text-primary font-semibold transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
          {/* Image View */}
          <div className="w-full overflow-auto p-4 flex justify-center bg-[#18181b] min-h-[400px] max-h-[600px]">
            <img
              src={url}
              alt={name}
              className="object-contain max-w-full h-auto rounded shadow-lg"
            />
          </div>
        </div>
      ) : (
        // DWG / DXF placeholder view
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[#131722] min-h-[400px] border border-border rounded-xl">
          <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500">
            <FileArchive className="h-8 w-8" />
          </div>
          <h4 className="font-semibold text-foreground text-sm mb-1">
            CAD Drawing Format ({type.toUpperCase()})
          </h4>
          <p className="max-w-md text-xs text-muted-foreground leading-relaxed mb-6">
            Browser previews are unavailable for <strong>.{type}</strong> files. You can download
            the CAD source file below to open it in AutoCAD or a DXF/DWG vector viewer.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-sm transition-all"
            >
              <Download className="h-4 w-4" /> Download CAD Source File
            </button>
            <span className="text-[10px] text-muted-foreground uppercase bg-secondary/80 px-2 py-1 rounded">
              Filename: {name}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
