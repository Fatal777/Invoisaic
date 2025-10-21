import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import type { Annotation } from '../hooks/useAnnotations';

// Configure PDF.js worker - version 3.x uses .js not .mjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  annotations?: Annotation[];
  onPageChange?: (page: number) => void;
}

/**
 * PDF Viewer Component with Annotation Overlay
 * Renders PDF documents using PDF.js and images (PNG/JPG) with live annotations
 */
export const PDFViewer: React.FC<PDFViewerProps> = ({ url, annotations = [], onPageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [isImage, setIsImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect if URL is an image (only by file extension, not blob URLs)
  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // Load PDF document or image
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading document from:', url);

        // Check if it's an image
        if (isImageFile(url)) {
          console.log('Detected image file');
          setIsImage(true);
          setPdf(null);
          setNumPages(1);
          setLoading(false);
          return;
        }

        // Load as PDF
        console.log('Loading as PDF');
        setIsImage(false);
        const loadingTask = pdfjsLib.getDocument(url);
        const pdfDoc = await loadingTask.promise;

        console.log('PDF loaded successfully. Pages:', pdfDoc.numPages);

        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading document:', err);
        setError('Failed to load document');
        setLoading(false);
      }
    };

    if (url) {
      loadDocument();
    }
  }, [url]);

  // Store canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Render image
  useEffect(() => {
    if (!isImage || !canvasRef.current || !url) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const img = new Image();
    img.onload = () => {
      // Scale image to fit while maintaining aspect ratio
      const maxWidth = 800;
      const maxHeight = 1000;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Apply scale
      width *= scale;
      height *= scale;

      canvas.width = width;
      canvas.height = height;

      // Store dimensions for annotation overlay
      setCanvasDimensions({ width, height });

      // Draw image
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, width, height);

      console.log('Rendered image');
    };

    img.onerror = () => {
      console.error('Failed to load image');
      setError('Failed to load image');
    };

    img.src = url;
  }, [isImage, url, scale]);

  // Render PDF page (without annotations)
  useEffect(() => {
    if (!pdf || !canvasRef.current || isImage) return;

    let cancelled = false;
    let renderTask: any = null;

    const renderPage = async () => {
      if (cancelled) return;

      try {
        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const context = canvas.getContext('2d');
        if (!context || cancelled) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Store dimensions for annotation overlay
        setCanvasDimensions({ width: viewport.width, height: viewport.height });

        // Cancel any previous render task
        if (renderTask) {
          renderTask.cancel();
        }

        // Render PDF page only (no annotations on canvas)
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;

        console.log(`Rendered PDF page ${currentPage}`);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !cancelled) {
          console.error('Error rendering page:', err);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdf, currentPage, scale, isImage]); // Removed 'annotations' from dependencies

  // Handle page change
  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, numPages));
    setCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  // Handle zoom
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97272] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg border border-[#F97272]">
        <div className="text-center p-8">
          <p className="text-[#F76B5E] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 rounded-t-lg">
        {/* Page Navigation - Only show for PDFs */}
        {!isImage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm font-semibold px-4">
              Page {currentPage} of {numPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === numPages}
              className="p-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {isImage && <div></div>}

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <span className="text-sm font-semibold px-4">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Canvas with Annotation Overlay */}
      <div className="flex-1 overflow-auto bg-gray-950 p-8 flex items-start justify-center">
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            className="shadow-2xl block"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {/* Annotation Overlay - Positioned absolutely over the canvas */}
          {canvasDimensions.width > 0 && (
            <div
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                transform: 'scale(1)',
                transformOrigin: 'top left'
              }}
            >
              {annotations
                .filter(ann => ann.page === currentPage)
                .map((ann, idx) => {
                  const x = ann.x * canvasDimensions.width;
                  const y = ann.y * canvasDimensions.height;
                  const width = ann.width * canvasDimensions.width;
                  const height = ann.height * canvasDimensions.height;
                  const labelPadding = 4;
                  const labelHeight = 20;
                  const labelY = y > labelHeight + labelPadding ? y - labelHeight - labelPadding : y + height + labelPadding;

                  return (
                    <div key={`annotation-${idx}`}>
                      {/* Bounding Box */}
                      <div
                        className="absolute"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                          border: `3px solid ${ann.color}`,
                          backgroundColor: `${ann.color}20`,
                        }}
                      />

                      {/* Label */}
                      <div
                        className="absolute flex items-center gap-1"
                        style={{
                          left: `${x}px`,
                          top: `${labelY}px`,
                          height: `${labelHeight}px`,
                        }}
                      >
                        <div
                          className="px-1 flex items-center justify-center"
                          style={{
                            backgroundColor: ann.color,
                            height: `${labelHeight}px`,
                            fontSize: '12px',
                            fontFamily: 'Inter, sans-serif',
                            color: 'white',
                            paddingLeft: `${labelPadding}px`,
                            paddingRight: `${labelPadding}px`,
                          }}
                        >
                          {ann.label}
                        </div>

                        {/* Confidence Badge */}
                        {ann.confidence !== undefined && (
                          <div
                            className="px-1 flex items-center justify-center"
                            style={{
                              backgroundColor: '#10b981',
                              height: `${labelHeight}px`,
                              fontSize: '12px',
                              fontFamily: 'Inter, sans-serif',
                              color: 'white',
                              paddingLeft: `${labelPadding}px`,
                              paddingRight: `${labelPadding}px`,
                            }}
                          >
                            {ann.confidence.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
