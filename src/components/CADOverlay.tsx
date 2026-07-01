import React, { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { CADDrawing } from "@/types/floor";
import { FileArchive, Maximize2 } from "lucide-react";

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface CADOverlayProps {
  drawing?: CADDrawing;
  visible: boolean;
  opacity: number;
  panEnabled?: boolean;
}

export function CADOverlay({ drawing, visible, opacity, panEnabled = false }: CADOverlayProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Reset pan offset when drawing changes
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [drawing?.name]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!panEnabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      setIsDragging(true);
    },
    [panEnabled, offset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current || !isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  const resetPan = () => setOffset({ x: 0, y: 0 });

  if (!drawing || !visible) return null;

  const { type, name, url } = drawing;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        opacity: opacity / 100,
        zIndex: 0,
        cursor: panEnabled ? (isDragging ? "grabbing" : "grab") : "default",
        pointerEvents: panEnabled ? "auto" : "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Fit-to-screen reset button (only in pan mode) */}
      {panEnabled && (offset.x !== 0 || offset.y !== 0) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetPan();
          }}
          className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-black/70 text-white border border-white/20 hover:bg-black/90 transition-colors"
          style={{ pointerEvents: "auto" }}
        >
          <Maximize2 className="h-3 w-3" /> Fit
        </button>
      )}

      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: isDragging ? "none" : "transform 0.15s ease",
        }}
      >
        {type === "pdf" ? (
          <Document
            file={url}
            loading={null}
            error={null}
            className="w-full h-full flex items-center justify-center"
          >
            <Page
              pageNumber={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="w-full h-full flex items-center justify-center [&>.react-pdf__Page__canvas]:!w-full [&>.react-pdf__Page__canvas]:!h-full [&>.react-pdf__Page__canvas]:object-contain"
            />
          </Document>
        ) : ["png", "jpg", "jpeg"].includes(type) ? (
          <img src={url} alt={name} draggable={false} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center bg-card/80 border border-border rounded-xl backdrop-blur">
            <FileArchive className="h-8 w-8 text-amber-500 mb-2" />
            <h4 className="font-semibold text-foreground text-xs">.{type.toUpperCase()} Format</h4>
            <p className="text-[10px] text-muted-foreground">
              Binary CAD file — overlay preview unavailable
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
