import React from 'react';
import {
  FolderOpen,
  Calendar,
  Users,
  Award,
  Trash2,
  Copy,
  Download,
  FileSpreadsheet,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { GradebookData, GradingScale } from '../types';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import { calculateMaxPossibleTotal } from '../utils/gradeCalculations';

interface GradebookHistoryProps {
  history: GradebookData[];
  currentGradebookId: string;
  gradingScale: GradingScale;
  onSelectGradebook: (gradebook: GradebookData) => void;
  onDeleteGradebook: (id: string) => void;
  onDuplicateGradebook: (gradebook: GradebookData) => void;
  onNewScan: () => void;
}

export const GradebookHistory: React.FC<GradebookHistoryProps> = ({
  history,
  currentGradebookId,
  gradingScale,
  onSelectGradebook,
  onDeleteGradebook,
  onDuplicateGradebook,
  onNewScan,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Saved Digital Gradebooks</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Access previous assessments digitized from rough score sheets. Automatically saved in your browser.
          </p>
        </div>
        <button
          onClick={onNewScan}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Scan / Upload New Sheet</span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-zinc-800">No Gradebooks Saved Yet</h3>
          <p className="text-xs text-zinc-400 mt-1 mb-5">
            Scan your first paper rough sheet or try one of our realistic samples to start building your digital gradebook.
          </p>
          <button
            onClick={onNewScan}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Scan Rough Sheet Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((item) => {
            const isActive = item.id === currentGradebookId;
            const maxPts = calculateMaxPossibleTotal(item.columns);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                      {item.subject || 'General'}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-zinc-900 line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <div className="space-y-1 text-[11px] text-zinc-500 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{item.students.length} students enrolled</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{item.columns.length} columns • {maxPts} max points</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => exportToExcel(item, gradingScale)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Direct Excel Download"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicateGradebook(item)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                      title="Duplicate Gradebook"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${item.title}"?`)) {
                          onDeleteGradebook(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete Gradebook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectGradebook(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Open Sheet</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
