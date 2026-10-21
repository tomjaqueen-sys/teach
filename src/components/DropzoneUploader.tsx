import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  Camera,
  FileImage,
  Sparkles,
  SlidersHorizontal,
  RotateCw,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SAMPLE_SHEETS, SampleSheetPreset } from '../utils/sampleSheets';

interface DropzoneUploaderProps {
  onImageSelected: (imageDataUrl: string, hints?: string, defaultMaxScore?: number) => void;
  onOpenLiveCamera: () => void;
  onLoadPresetDirectly: (preset: SampleSheetPreset) => void;
  isProcessing: boolean;
}

export const DropzoneUploader: React.FC<DropzoneUploaderProps> = ({
  onImageSelected,
  onOpenLiveCamera,
  onLoadPresetDirectly,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [enhancedContrast, setEnhancedContrast] = useState(false);
  const [userHints, setUserHints] = useState('');
  const [defaultMaxScore, setDefaultMaxScore] = useState<number | undefined>(undefined);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  // Clipboard paste listener (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setSelectedImage(event.target.result as string);
                setRotation(0);
                setEnhancedContrast(false);
                setActiveSampleId(null);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
        setRotation(0);
        setEnhancedContrast(false);
        setActiveSampleId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const applyPostProcessing = (sourceDataUrl: string): string => {
    if (rotation === 0 && !enhancedContrast) {
      return sourceDataUrl;
    }

    const img = new Image();
    img.src = sourceDataUrl;

    const canvas = document.createElement('canvas');
    const isRotated90or270 = rotation === 90 || rotation === 270;
    canvas.width = isRotated90or270 ? img.naturalHeight || 800 : img.naturalWidth || 1200;
    canvas.height = isRotated90or270 ? img.naturalWidth || 1200 : img.naturalHeight || 800;

    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceDataUrl;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      -((img.naturalWidth || 1200) / 2),
      -((img.naturalHeight || 800) / 2)
    );
    ctx.restore();

    if (enhancedContrast) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const contrastFactor = 1.6;
        let enhanced = (gray - 128) * contrastFactor + 128;
        enhanced = Math.min(255, Math.max(0, enhanced));
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleSubmit = () => {
    if (!selectedImage) return;
    const finalImage = applyPostProcessing(selectedImage);
    onImageSelected(finalImage, userHints, defaultMaxScore);
  };

  const handleSelectSample = (sample: SampleSheetPreset) => {
    setActiveSampleId(sample.id);
    const dataUrl = sample.generateImage();
    setSelectedImage(dataUrl);
    setRotation(0);
    setEnhancedContrast(false);
  };

  return (
    <div className="space-y-6">
      {/* Primary Upload / Capture Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
        {!selectedImage ? (
          <div>
            {/* Header instructions */}
            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Rough Sheet OCR
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Digitize Your Rough Grading Sheet
              </h2>
              <p className="text-sm text-zinc-500 mt-1.5">
                Snap a photo with your phone or webcam, drag & drop an image, or paste directly from clipboard.
              </p>
            </div>

            {/* Action buttons: Camera vs File Browse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
              <button
                onClick={onOpenLiveCamera}
                type="button"
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                <span>Open Live Camera</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-sm border border-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="w-4 h-4 text-zinc-600" />
                <span>Upload Sheet Photo</span>
              </button>
            </div>

            {/* Drag & drop dropzone box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                  : 'border-zinc-300 hover:border-indigo-400 bg-zinc-50/50 hover:bg-indigo-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                <FileImage className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-zinc-800">
                Click to browse or drop your rough score sheet here
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Supports JPG, PNG, WEBP • Or press <kbd className="px-1.5 py-0.5 bg-zinc-200 rounded text-zinc-700 font-mono text-[10px]">Ctrl+V</kbd> to paste
              </p>
            </div>
          </div>
        ) : (
          /* Selected Image Preview & Tuning */
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-semibold text-base text-zinc-900">Score Sheet Preview</h3>
                <p className="text-xs text-zinc-500">Verify orientation and legibility before extraction</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRotate}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>
                <button
                  onClick={() => setEnhancedContrast((prev) => !prev)}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    enhancedContrast
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>High-Contrast Document Mode</span>
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Change Image
                </button>
              </div>
            </div>

            {/* Image display */}
            <div className="relative bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center p-4 min-h-[300px] max-h-[460px]">
              <img
                src={selectedImage}
                alt="Selected Sheet"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  filter: enhancedContrast ? 'contrast(160%) grayscale(100%) brightness(105%)' : 'none',
                }}
                className="max-h-[420px] w-auto max-w-full object-contain rounded transition-all shadow-md"
              />
            </div>

            {/* Optional hints toggle */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200/80 p-4">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-semibold text-zinc-700 hover:text-zinc-900"
              >
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Add Teacher Context or Grading Notes (Optional)
                </span>
                {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvancedOptions && (
                <div className="mt-3 space-y-3 pt-3 border-t border-zinc-200">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Guidance for AI (e.g., column descriptions or special rules):
                    </label>
                    <input
                      type="text"
                      value={userHints}
                      onChange={(e) => setUserHints(e.target.value)}
                      placeholder="e.g. Columns are Quiz (20) and Exam (80); roll numbers are in column 1"
                      className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Expected Default Maximum Score (if unstated on sheet):
                    </label>
                    <input
                      type="number"
                      value={defaultMaxScore ?? ''}
                      onChange={(e) => setDefaultMaxScore(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 20, 50, or 100"
                      className="w-40 text-xs px-3 py-2 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Primary Submit Button */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedImage(null)}
                type="button"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                type="button"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isProcessing ? 'Transcribing Sheet...' : 'Extract & Create Digital Gradebook'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Rough Sheet Gallery */}
      <div className="bg-zinc-50/80 rounded-2xl border border-zinc-200/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Try Realistic Teacher Rough Sheets</h3>
            <p className="text-xs text-zinc-500">
              No paper sheet at hand? Test the complete extraction and export workflow instantly with sample rough sheets:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_SHEETS.map((sample) => (
            <div
              key={sample.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md flex flex-col justify-between ${
                activeSampleId === sample.id
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 mb-2">
                  {sample.category}
                </span>
                <h4 className="font-semibold text-xs text-zinc-900 leading-snug mb-1">
                  {sample.name}
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 mb-3">
                  {sample.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                >
                  Load Image
                </button>
                <button
                  type="button"
                  onClick={() => onLoadPresetDirectly(sample)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                >
                  Instant Demo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
