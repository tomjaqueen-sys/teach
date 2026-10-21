import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Copy,
  Printer,
  Check,
  X,
  Sparkles,
  Download,
  Info,
} from 'lucide-react';
import { GradebookData, GradingScale } from '../types';
import { copyGradebookToClipboard, exportToCSV, exportToExcel } from '../utils/exportUtils';
import { calculateMaxPossibleTotal } from '../utils/gradeCalculations';

interface ExportModalProps {
  gradebook: GradebookData;
  gradingScale: GradingScale;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  gradebook,
  gradingScale,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const maxPossible = calculateMaxPossibleTotal(gradebook.columns);

  const handleExportExcel = () => {
    exportToExcel(gradebook, gradingScale);
  };

  const handleExportCSV = () => {
    exportToCSV(gradebook, gradingScale);
  };

  const handleCopyClipboard = async () => {
    const success = await copyGradebookToClipboard(gradebook, gradingScale);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-zinc-900 to-indigo-950 text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[11px] font-medium mb-1">
              <Download className="w-3 h-3" />
              Direct Data Export
            </div>
            <h2 className="text-lg font-bold">Export Digital Gradebook</h2>
            <p className="text-xs text-zinc-300">
              {gradebook.title} • {gradebook.students.length} students • {maxPossible} pts total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="p-6 space-y-4">
          {/* 1. Microsoft Excel (.xlsx) */}
          <button
            onClick={handleExportExcel}
            type="button"
            className="w-full p-4 rounded-2xl border border-zinc-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 text-left transition-all group flex items-start justify-between shadow-xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-zinc-900">Microsoft Excel Workbook (.xlsx)</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Full formatted spreadsheet with 2 sheets: <strong>Gradebook</strong> (totals, % and letter grades) plus <strong>Class Statistics &amp; Analytics</strong>.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
          </button>

          {/* 2. CSV Spreadsheet (.csv) */}
          <button
            onClick={handleExportCSV}
            type="button"
            className="w-full p-4 rounded-2xl border border-zinc-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 text-left transition-all group flex items-start justify-between shadow-xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900">Standard CSV Spreadsheet (.csv)</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Universal comma-separated format. Perfect for direct import into Google Classroom, Canvas, Blackboard, Moodle, or PowerSchool.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-colors shrink-0 mt-1" />
          </button>

          {/* 3. Copy to Clipboard (TSV) */}
          <button
            onClick={handleCopyClipboard}
            type="button"
            className="w-full p-4 rounded-2xl border border-zinc-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 text-left transition-all group flex items-start justify-between shadow-xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900">
                  {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard (Paste into Google Sheets)'}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tab-separated matrix. Click once, then open Google Sheets or Excel and press <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-mono text-[10px]">Ctrl+V</kbd> / <kbd className="px-1 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-mono text-[10px]">Cmd+V</kbd>.
                </p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 mt-1 transition-colors ${
              copied ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>

          {/* 4. Print / PDF */}
          <button
            onClick={handlePrint}
            type="button"
            className="w-full p-4 rounded-2xl border border-zinc-200 hover:border-purple-500 bg-white hover:bg-purple-50/20 text-left transition-all group flex items-start justify-between shadow-xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900">Print or Save as PDF</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Opens browser print dialog with printer-friendly styling, suitable for physical staff meetings or filing.
                </p>
              </div>
            </div>
            <Printer className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 transition-colors shrink-0 mt-1" />
          </button>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-zinc-400" />
            <span>Files are generated locally in your browser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
