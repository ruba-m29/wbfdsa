import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface PDFViewerProps {
  url: string;
  name: string;
}

export function PDFViewer({ url, name }: PDFViewerProps) {
  const [page, setPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [fitWidth, setFitWidth] = useState<boolean>(true);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  
  const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setPage((prev) => prev + 1);

  // Construct standard PDF view parameters hash
  const pdfHash = `#page=${page}&zoom=${zoom}${fitWidth ? "&view=FitH" : ""}`;
  const viewerUrl = `${url}${pdfHash}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-[500px] w-full rounded-xl border border-border bg-card overflow-hidden">
      {/* PDF Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-foreground truncate max-w-[200px]">
          <span className="truncate" title={name}>{name}</span>
        </div>

        {/* Page Nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className="grid h-7 w-7 place-items-center rounded border border-border bg-background hover:bg-secondary disabled:opacity-40"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[50px] text-center font-mono">Page {page}</span>
          <button
            onClick={handleNextPage}
            className="grid h-7 w-7 place-items-center rounded border border-border bg-background hover:bg-secondary"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="grid h-7 w-7 place-items-center rounded border border-border bg-background hover:bg-secondary disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[45px] text-center font-mono">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="grid h-7 w-7 place-items-center rounded border border-border bg-background hover:bg-secondary disabled:opacity-40"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFitWidth(!fitWidth)}
            className={`grid h-7 w-7 place-items-center rounded border hover:bg-secondary ${
              fitWidth ? "border-primary text-primary bg-primary/5" : "border-border bg-background"
            }`}
            title="Fit to Width"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setPage(1);
              setZoom(100);
              setFitWidth(true);
            }}
            className="grid h-7 w-7 place-items-center rounded border border-border bg-background hover:bg-secondary"
            title="Reset view"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="grid h-7 w-7 place-items-center rounded border border-border bg-background hover:bg-secondary text-primary"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF View Container */}
      <div className="flex-1 bg-[#1e1e1e] relative">
        <iframe
          src={viewerUrl}
          className="w-full h-full border-none"
          title="PDF Document Viewer"
        />
      </div>
    </div>
  );
}
