import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, FileText } from 'lucide-react';

interface OriginalSheetViewerProps {
  imageUrl: string;
  title: string;
  rawNotes?: string;
  summaryAnalysis?: string;
  onClose: () => void;
}

export const OriginalSheetViewer: React.FC<OriginalSheetViewerProps> = ({
  imageUrl,
  title,
  rawNotes,
  summaryAnalysis,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setScale((prev) => Math.max(0.5, prev - 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_rough_sheet.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in">
      <div className="bg-zinc-950 text-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-800">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-100">Original Rough Sheet Verification</h3>
              <p className="text-xs text-zinc-400">{title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleDownloadImage}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-200 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content split: Image viewer + Notes */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-black/50">
          {/* Main Image Viewport with zoom/pan */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 relative">
            <div
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="origin-center"
            >
              <img
                src={imageUrl}
                alt="Original Rough Grading Sheet"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-zinc-800"
              />
            </div>
          </div>

          {/* Teacher AI Observations & Notes sidebar */}
          {(rawNotes || summaryAnalysis) && (
            <div className="w-full lg:w-80 bg-zinc-900 p-5 border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Extracted Sheet Notes
              </h4>

              {summaryAnalysis && (
                <div className="p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/60">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide block mb-1">
                    AI Summary
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{summaryAnalysis}</p>
                </div>
              )}

              {rawNotes && (
                <div className="p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/60">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block mb-1">
                    Teacher Margin Scribbles
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                    {rawNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
