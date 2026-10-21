import React, { useEffect, useState } from 'react';
import {
  Camera,
  Upload,
  FileSpreadsheet,
  BarChart2,
  History,
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  GraduationCap,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import {
  ActiveTab,
  DEFAULT_GRADING_SCALE,
  GradebookData,
  GradingScale,
} from './types';
import { CameraScanner } from './components/CameraScanner';
import { DropzoneUploader } from './components/DropzoneUploader';
import { GradebookGrid } from './components/GradebookGrid';
import { GradeAnalytics } from './components/GradeAnalytics';
import { ExportModal } from './components/ExportModal';
import { OriginalSheetViewer } from './components/OriginalSheetViewer';
import { GradebookHistory } from './components/GradebookHistory';
import { SAMPLE_SHEETS, SampleSheetPreset } from './utils/sampleSheets';

const STORAGE_KEY = 'gradesnap_gradebooks_v1';
const SCALE_STORAGE_KEY = 'gradesnap_grading_scale_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gradebook');
  const [history, setHistory] = useState<GradebookData[]>([]);
  const [currentGradebook, setCurrentGradebook] = useState<GradebookData | null>(null);
  const [gradingScale, setGradingScale] = useState<GradingScale>(DEFAULT_GRADING_SCALE);

  // Modals & Overlays
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isOriginalSheetOpen, setIsOriginalSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initialize from localStorage or load initial sample
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      const savedScale = localStorage.getItem(SCALE_STORAGE_KEY);

      if (savedScale) {
        setGradingScale(JSON.parse(savedScale));
      }

      if (savedHistory) {
        const parsed: GradebookData[] = JSON.parse(savedHistory);
        if (parsed && parsed.length > 0) {
          setHistory(parsed);
          setCurrentGradebook(parsed[0]);
          return;
        }
      }

      // Default seed with the first realistic sample sheet so the teacher has a ready-to-test gradebook
      const sample = SAMPLE_SHEETS[0];
      const initialGradebook: GradebookData = {
        ...sample.preExtractedData,
        id: `gradebook_${Date.now()}`,
        originalImage: sample.generateImage(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setHistory([initialGradebook]);
      setCurrentGradebook(initialGradebook);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([initialGradebook]));
    } catch (err) {
      console.error('Failed to load initial gradebook data:', err);
    }
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = (updatedList: GradebookData[]) => {
    setHistory(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage quota or serialization error:', e);
    }
  };

  const handleUpdateGradebook = (updated: GradebookData) => {
    setCurrentGradebook(updated);
    const updatedHistory = history.map((item) => (item.id === updated.id ? updated : item));
    saveHistoryToStorage(updatedHistory);
  };

  const handleUpdateGradingScale = (newScale: GradingScale) => {
    setGradingScale(newScale);
    localStorage.setItem(SCALE_STORAGE_KEY, JSON.stringify(newScale));
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Perform AI extraction via backend
  const handleExtractGradebook = async (
    imageDataUrl: string,
    userHints?: string,
    defaultMaxScore?: number
  ) => {
    setIsProcessing(true);
    setProcessingStatus('Connecting to AI Vision OCR...');

    try {
      const statusUpdates = [
        'Analyzing handwritten paper format...',
        'Detecting student names and roll numbers...',
        'Extracting score columns and fractions...',
        'Verifying markings and teacher notes...',
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < statusUpdates.length) {
          setProcessingStatus(statusUpdates[step]);
          step++;
        }
      }, 1200);

      const response = await fetch('/api/extract-gradebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          userPromptHints: userHints,
          defaultMaxScore,
        }),
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server extraction failed (${response.status})`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid gradebook data received from server.');
      }

      const raw = result.data;

      // Transform into our clean GradebookData model
      const newGradebook: GradebookData = {
        id: `gb_${Date.now()}`,
        title: raw.title || 'Extracted Rough Sheet',
        subject: raw.subject || '',
        date: raw.date || new Date().toISOString().split('T')[0],
        classSection: raw.classSection || '',
        columns: raw.columns || [{ key: 'score_1', label: 'Score', maxPoints: 100 }],
        students: (raw.students || []).map((s: any, idx: number) => {
          const scoreMap: Record<string, number | null> = {};
          if (Array.isArray(s.scores)) {
            s.scores.forEach((sc: any) => {
              if (sc.columnKey) {
                scoreMap[sc.columnKey] = typeof sc.value === 'number' ? sc.value : null;
              }
            });
          }
          return {
            id: s.id || `ID-${idx + 1}`,
            name: s.name || `Student ${idx + 1}`,
            scores: scoreMap,
            notes: s.notes || '',
            flagged: Boolean(s.flagged),
            flagReason: s.flagReason,
          };
        }),
        rawNotes: raw.rawNotes || '',
        summaryAnalysis: raw.summaryAnalysis || '',
        originalImage: imageDataUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newHistory = [newGradebook, ...history];
      saveHistoryToStorage(newHistory);
      setCurrentGradebook(newGradebook);
      setIsLiveCameraOpen(false);
      setActiveTab('gradebook');
      showNotification(`Successfully digitized ${newGradebook.students.length} students into digital gradebook!`);
    } catch (err: unknown) {
      console.error('OCR Error:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to extract gradebook from image';
      showNotification(errMsg, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Instant demo from realistic preset
  const handleLoadPresetDirectly = (preset: SampleSheetPreset) => {
    const dataUrl = preset.generateImage();
    const newGradebook: GradebookData = {
      ...preset.preExtractedData,
      id: `gb_${Date.now()}`,
      originalImage: dataUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newHistory = [newGradebook, ...history];
    saveHistoryToStorage(newHistory);
    setCurrentGradebook(newGradebook);
    setActiveTab('gradebook');
    showNotification(`Loaded demo: "${preset.name}"!`);
  };

  const handleDuplicateGradebook = (gb: GradebookData) => {
    const copy: GradebookData = {
      ...gb,
      id: `gb_${Date.now()}`,
      title: `${gb.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newHistory = [copy, ...history];
    saveHistoryToStorage(newHistory);
    setCurrentGradebook(copy);
    showNotification(`Duplicated "${gb.title}"`);
  };

  const handleDeleteGradebook = (id: string) => {
    const filtered = history.filter((item) => item.id !== id);
    saveHistoryToStorage(filtered);
    if (currentGradebook?.id === id) {
      setCurrentGradebook(filtered[0] || null);
    }
    showNotification('Gradebook removed from history');
  };

  return (
    <div className="min-h-screen bg-zinc-100/70 text-zinc-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-zinc-900">
                  GradeSnap <span className="text-indigo-600">AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Rough Sheet to Digital Gradebook
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden md:block">
                Auto-digitize handwritten score sheets into Excel &amp; CSV
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'scanner'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan / Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('gradebook')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'gradebook'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Gradebook</span>
              {currentGradebook && (
                <span className="hidden sm:inline-block ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                  {currentGradebook.students.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved Sheets</span>
            </button>
          </nav>

          {/* Quick Action Export */}
          <div className="flex items-center gap-2">
            {currentGradebook && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Export</span>
                <span className="text-[10px] text-zinc-400 font-normal">(.xlsx/.csv)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-sm transition-all animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-zinc-400 hover:text-zinc-600 text-xs px-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Camera Modal Overlay */}
        {isLiveCameraOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-3xl w-full">
              <CameraScanner
                onCapture={(imageData) => {
                  setIsLiveCameraOpen(false);
                  handleExtractGradebook(imageData);
                }}
                onCancel={() => setIsLiveCameraOpen(false)}
              />
            </div>
          </div>
        )}

        {/* AI Processing Loading Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center relative">
                <Sparkles className="w-8 h-8 animate-pulse text-indigo-600" />
                <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 mb-1">Digitizing Rough Sheet</h3>
              <p className="text-xs text-indigo-600 font-semibold mb-3">{processingStatus}</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Gemini AI is parsing handwritten names, scores, fractions, and teachers remarks...
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: Scanner & Uploader */}
        {activeTab === 'scanner' && (
          <DropzoneUploader
            onImageSelected={handleExtractGradebook}
            onOpenLiveCamera={() => setIsLiveCameraOpen(true)}
            onLoadPresetDirectly={handleLoadPresetDirectly}
            isProcessing={isProcessing}
          />
        )}

        {/* TAB 2: Editable Gradebook Grid */}
        {activeTab === 'gradebook' && (
          <>
            {currentGradebook ? (
              <GradebookGrid
                gradebook={currentGradebook}
                gradingScale={gradingScale}
                onUpdateGradebook={handleUpdateGradebook}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onViewOriginalImage={() => setIsOriginalSheetOpen(true)}
                onSaveToHistory={() => {
                  showNotification('Gradebook changes saved');
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-zinc-800">No Active Gradebook</h3>
                <p className="text-xs text-zinc-400 mt-1 mb-5">
                  Scan a rough score sheet using your camera or choose a sample to start.
                </p>
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Scan Rough Sheet
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 3: Analytics & Statistics */}
        {activeTab === 'analytics' && (
          <>
            {currentGradebook ? (
              <GradeAnalytics
                gradebook={currentGradebook}
                gradingScale={gradingScale}
                onUpdateGradingScale={handleUpdateGradingScale}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto">
                <p className="text-xs text-zinc-500">Please scan or open a gradebook first to view class analytics.</p>
              </div>
            )}
          </>
        )}

        {/* TAB 4: Saved Gradebooks History */}
        {activeTab === 'history' && (
          <GradebookHistory
            history={history}
            currentGradebookId={currentGradebook?.id || ''}
            gradingScale={gradingScale}
            onSelectGradebook={(gb) => {
              setCurrentGradebook(gb);
              setActiveTab('gradebook');
            }}
            onDeleteGradebook={handleDeleteGradebook}
            onDuplicateGradebook={handleDuplicateGradebook}
            onNewScan={() => setActiveTab('scanner')}
          />
        )}
      </main>

      {/* Export Modal */}
      {isExportModalOpen && currentGradebook && (
        <ExportModal
          gradebook={currentGradebook}
          gradingScale={gradingScale}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Original Sheet Viewer Modal */}
      {isOriginalSheetOpen && currentGradebook?.originalImage && (
        <OriginalSheetViewer
          imageUrl={currentGradebook.originalImage}
          title={currentGradebook.title}
          rawNotes={currentGradebook.rawNotes}
          summaryAnalysis={currentGradebook.summaryAnalysis}
          onClose={() => setIsOriginalSheetOpen(false)}
        />
      )}
    </div>
  );
}
