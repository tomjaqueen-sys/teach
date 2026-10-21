import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, RotateCw, Sparkles, SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CameraScannerProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [enhancedContrast, setEnhancedContrast] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Initialize camera
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function initCamera() {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      } catch (err: unknown) {
        console.error('Camera error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Unable to access device camera';
        setCameraError(
          errorMsg.includes('Permission') || errorMsg.includes('denied')
            ? 'Camera permission was denied. Please allow camera access in your browser settings or use the File Upload tab.'
            : 'Camera could not be started. You can upload an image or choose one of our sample rough sheets instead.'
        );
      }
    }

    if (!capturedImage) {
      initCamera();
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, capturedImage]);

  const toggleFacingMode = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleTakeShutter = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Stop video tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setCapturedImage(rawDataUrl);
    setRotation(0);
    setEnhancedContrast(false);
    setIsCapturing(false);
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
    canvas.width = isRotated90or270 ? img.naturalHeight || 720 : img.naturalWidth || 1280;
    canvas.height = isRotated90or270 ? img.naturalWidth || 1280 : img.naturalHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceDataUrl;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      -((img.naturalWidth || 1280) / 2),
      -((img.naturalHeight || 720) / 2)
    );
    ctx.restore();

    if (enhancedContrast) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      // High contrast B&W document enhancement
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

  const handleConfirmImage = () => {
    if (!capturedImage) return;
    const finalImage = applyPostProcessing(capturedImage);
    onCapture(finalImage);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRotation(0);
    setEnhancedContrast(false);
  };

  return (
    <div className="bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-100">Live Paper Scanner</h3>
            <p className="text-xs text-zinc-400">Position the rough score sheet inside the frame</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative min-h-[420px] max-h-[580px] bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-8 text-center max-w-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-zinc-100 mb-2">Camera Unavailable</h4>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{cameraError}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Use File Upload / Sample Sheet
              </button>
            </div>
          </div>
        ) : !capturedImage ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-contain max-h-[540px]"
            />

            {/* Document alignment overlay guidelines */}
            <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-indigo-500/40 rounded-xl flex flex-col justify-between p-4 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
              {/* Corner crosshairs */}
              <div className="flex justify-between">
                <span className="w-6 h-6 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl-sm"></span>
                <span className="w-6 h-6 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr-sm"></span>
              </div>
              <div className="text-center">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-medium text-indigo-200 border border-indigo-500/30">
                  Align paper edges within box
                </span>
              </div>
              <div className="flex justify-between">
                <span className="w-6 h-6 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl-sm"></span>
                <span className="w-6 h-6 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br-sm"></span>
              </div>
            </div>

            {/* Flash animation during capture */}
            {isCapturing && <div className="absolute inset-0 bg-white animate-fade-out" />}
          </>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={capturedImage}
              alt="Scanned Rough Sheet"
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: enhancedContrast ? 'contrast(160%) grayscale(100%) brightness(105%)' : 'none',
              }}
              className="max-h-[500px] w-auto max-w-full object-contain rounded-lg transition-all shadow-xl"
            />
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        {!capturedImage ? (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={toggleFacingMode}
              type="button"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
              title="Switch between front and back camera"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Flip Camera</span>
            </button>

            {/* Shutter Button */}
            <button
              onClick={handleTakeShutter}
              disabled={isCapturing}
              className="relative p-1 rounded-full border-4 border-indigo-400/80 hover:border-indigo-300 transition-transform active:scale-95"
              title="Capture Photo"
            >
              <div className="w-14 h-14 rounded-full bg-white hover:bg-zinc-100 flex items-center justify-center shadow-lg">
                <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-indigo-600 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>

            <div className="text-xs text-zinc-400 text-right">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              Live Camera
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRotate}
                type="button"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
              <button
                onClick={() => setEnhancedContrast((prev) => !prev)}
                type="button"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  enhancedContrast
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
                title="Sharpen pencil & ink contrast for higher OCR accuracy"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Document B&W Mode</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetake}
                type="button"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleConfirmImage}
                type="button"
                className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Digitize with AI</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
