import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  ArrowUpDown,
  Download,
  Eye,
  Sliders,
  Check,
  Edit2,
  FileSpreadsheet,
  X,
  HelpCircle,
  Copy,
  Info,
} from 'lucide-react';
import { ColumnDef, GradebookData, GradingScale, StudentRow } from '../types';
import {
  calculateMaxPossibleTotal,
  calculateStudentPercentage,
  calculateStudentTotal,
  getGradeBadgeColor,
  getLetterGrade,
} from '../utils/gradeCalculations';

interface GradebookGridProps {
  gradebook: GradebookData;
  gradingScale: GradingScale;
  onUpdateGradebook: (updated: GradebookData) => void;
  onOpenExportModal: () => void;
  onViewOriginalImage: () => void;
  onSaveToHistory: () => void;
}

export const GradebookGrid: React.FC<GradebookGridProps> = ({
  gradebook,
  gradingScale,
  onUpdateGradebook,
  onOpenExportModal,
  onViewOriginalImage,
  onSaveToHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'flagged' | 'failing'>('all');
  const [sortField, setSortField] = useState<'name' | 'id' | 'total' | 'grade'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals & popovers
  const [editingColumn, setEditingColumn] = useState<ColumnDef | null>(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColMaxPoints, setNewColMaxPoints] = useState(20);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  const [showCurveModal, setShowCurveModal] = useState(false);
  const [curvePoints, setCurvePoints] = useState(2);
  const [curveTargetCol, setCurveTargetCol] = useState<string>('all');

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(gradebook.title);
  const [subjectInput, setSubjectInput] = useState(gradebook.subject || '');
  const [sectionInput, setSectionInput] = useState(gradebook.classSection || '');

  // Helpers
  const maxPossible = calculateMaxPossibleTotal(gradebook.columns);
  const flaggedCount = gradebook.students.filter((s) => s.flagged).length;

  // Update cell score
  const handleScoreChange = (studentId: string, colKey: string, value: string) => {
    const num = value === '' ? null : Number(value);
    const updatedStudents = gradebook.students.map((student) => {
      if (student.id === studentId) {
        return {
          ...student,
          scores: {
            ...student.scores,
            [colKey]: isNaN(num as number) ? null : num,
          },
        };
      }
      return student;
    });

    onUpdateGradebook({
      ...gradebook,
      students: updatedStudents,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update student metadata (name / ID / notes)
  const handleStudentFieldChange = (
    studentId: string,
    field: 'name' | 'id' | 'notes',
    value: string
  ) => {
    const updatedStudents = gradebook.students.map((student) => {
      if (student.id === studentId) {
        return { ...student, [field]: value };
      }
      return student;
    });

    onUpdateGradebook({
      ...gradebook,
      students: updatedStudents,
      updatedAt: new Date().toISOString(),
    });
  };

  // Resolve flagged item
  const handleClearFlag = (studentId: string) => {
    const updatedStudents = gradebook.students.map((s) => {
      if (s.id === studentId) {
        return { ...s, flagged: false, flagReason: undefined };
      }
      return s;
    });
    onUpdateGradebook({
      ...gradebook,
      students: updatedStudents,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student row?')) return;
    const updatedStudents = gradebook.students.filter((s) => s.id !== studentId);
    onUpdateGradebook({
      ...gradebook,
      students: updatedStudents,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add column
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;

    const key = `col_${Date.now()}`;
    const newCol: ColumnDef = {
      key,
      label: newColLabel.trim(),
      maxPoints: Number(newColMaxPoints) || 20,
    };

    onUpdateGradebook({
      ...gradebook,
      columns: [...gradebook.columns, newCol],
      updatedAt: new Date().toISOString(),
    });

    setNewColLabel('');
    setShowAddColumnModal(false);
  };

  // Save edited column
  const handleSaveColumnEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn) return;

    const updatedCols = gradebook.columns.map((col) =>
      col.key === editingColumn.key ? editingColumn : col
    );

    onUpdateGradebook({
      ...gradebook,
      columns: updatedCols,
      updatedAt: new Date().toISOString(),
    });
    setEditingColumn(null);
  };

  // Delete column
  const handleDeleteColumn = (colKey: string) => {
    if (gradebook.columns.length <= 1) {
      alert('A gradebook must have at least one score column.');
      return;
    }
    if (!confirm('Delete this assessment column and its marks?')) return;

    const updatedCols = gradebook.columns.filter((c) => c.key !== colKey);
    onUpdateGradebook({
      ...gradebook,
      columns: updatedCols,
      updatedAt: new Date().toISOString(),
    });
    setEditingColumn(null);
  };

  // Add Student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const id = newStudentId.trim() || `ID-${gradebook.students.length + 1}`;
    const newStudent: StudentRow = {
      id,
      name: newStudentName.trim(),
      scores: {},
      notes: '',
    };

    onUpdateGradebook({
      ...gradebook,
      students: [...gradebook.students, newStudent],
      updatedAt: new Date().toISOString(),
    });

    setNewStudentName('');
    setNewStudentId('');
    setShowAddStudentModal(false);
  };

  // Apply curve / score adjustment
  const handleApplyCurve = (e: React.FormEvent) => {
    e.preventDefault();
    const pts = Number(curvePoints) || 0;
    if (pts === 0) return;

    const updatedStudents = gradebook.students.map((student) => {
      const newScores = { ...student.scores };
      if (curveTargetCol === 'all') {
        gradebook.columns.forEach((col) => {
          const current = newScores[col.key];
          if (typeof current === 'number') {
            newScores[col.key] = Math.min(col.maxPoints, Math.max(0, current + pts));
          }
        });
      } else {
        const current = newScores[curveTargetCol];
        const targetColDef = gradebook.columns.find((c) => c.key === curveTargetCol);
        if (typeof current === 'number' && targetColDef) {
          newScores[curveTargetCol] = Math.min(
            targetColDef.maxPoints,
            Math.max(0, current + pts)
          );
        }
      }
      return { ...student, scores: newScores };
    });

    onUpdateGradebook({
      ...gradebook,
      students: updatedStudents,
      updatedAt: new Date().toISOString(),
    });
    setShowCurveModal(false);
  };

  // Save Title Header
  const handleSaveHeader = () => {
    onUpdateGradebook({
      ...gradebook,
      title: titleInput || 'Untitled Gradebook',
      subject: subjectInput,
      classSection: sectionInput,
      updatedAt: new Date().toISOString(),
    });
    setEditingTitle(false);
  };

  // Sorting & Filtering logic
  const filteredStudents = gradebook.students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'flagged') return student.flagged;
    if (filterMode === 'failing') {
      const pct = calculateStudentPercentage(student, gradebook.columns);
      return pct < gradingScale.dMin;
    }
    return true;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'id') {
      comparison = a.id.localeCompare(b.id, undefined, { numeric: true });
    } else if (sortField === 'total') {
      const totA = calculateStudentTotal(a, gradebook.columns);
      const totB = calculateStudentTotal(b, gradebook.columns);
      comparison = totA - totB;
    } else if (sortField === 'grade') {
      const pctA = calculateStudentPercentage(a, gradebook.columns);
      const pctB = calculateStudentPercentage(b, gradebook.columns);
      comparison = pctA - pctB;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: 'name' | 'id' | 'total' | 'grade') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Assessment Header Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {!editingTitle ? (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                  {gradebook.title || 'Untitled Assessment'}
                </h1>
                <button
                  onClick={() => {
                    setTitleInput(gradebook.title);
                    setSubjectInput(gradebook.subject || '');
                    setSectionInput(gradebook.classSection || '');
                    setEditingTitle(true);
                  }}
                  className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                  title="Edit Assessment Details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-zinc-500">
                {gradebook.subject && <span>Subject: <strong className="text-zinc-700">{gradebook.subject}</strong></span>}
                {gradebook.classSection && <span>Section: <strong className="text-zinc-700">{gradebook.classSection}</strong></span>}
                <span>Enrolled: <strong className="text-zinc-700">{gradebook.students.length} students</strong></span>
                <span>Max Points: <strong className="text-zinc-700">{maxPossible} pts</strong></span>
                {gradebook.date && <span>Date: <strong className="text-zinc-700">{gradebook.date}</strong></span>}
              </div>
            </div>
          ) : (
            <div className="flex-1 max-w-2xl bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">Title</label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">Subject</label>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Class Section (e.g. Period 2)"
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  className="text-xs px-2.5 py-1 bg-white border border-zinc-300 rounded-lg w-48"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="px-2.5 py-1 text-xs text-zinc-600 hover:text-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveHeader}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg"
                  >
                    Save Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {gradebook.originalImage && (
              <button
                onClick={onViewOriginalImage}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 transition-colors shadow-xs"
                title="View original rough sheet photo side-by-side"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Original Sheet</span>
              </button>
            )}

            <button
              onClick={() => setShowCurveModal(true)}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 transition-colors shadow-xs"
              title="Add curve or bonus points across scores"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Curve / Adjust</span>
            </button>

            <button
              onClick={onOpenExportModal}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Flag Alert Banner */}
        {flaggedCount > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{flaggedCount} score{flaggedCount > 1 ? 's' : ''}</strong> marked with ambiguous handwriting from the rough sheet.
              </span>
            </div>
            <button
              onClick={() => setFilterMode((prev) => (prev === 'flagged' ? 'all' : 'flagged'))}
              className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors"
            >
              {filterMode === 'flagged' ? 'Show All Students' : 'Review Flagged Only'}
            </button>
          </div>
        )}
      </div>

      {/* Gradebook Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="inline-flex rounded-xl bg-zinc-100 p-0.5 border border-zinc-200/80 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({gradebook.students.length})
            </button>
            <button
              onClick={() => setFilterMode('flagged')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'flagged'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Flagged ({flaggedCount})
            </button>
            <button
              onClick={() => setFilterMode('failing')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'failing'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Failing (&lt;{gradingScale.dMin}%)
            </button>
          </div>
        </div>

        {/* Add column & Add student buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowAddStudentModal(true)}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-600" />
            <span>Add Student</span>
          </button>
          <button
            onClick={() => setShowAddColumnModal(true)}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-600" />
            <span>Add Column</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/90 border-b border-zinc-200 text-zinc-700 font-semibold select-none">
                <th className="py-3 px-3 w-16 text-center">
                  <button
                    onClick={() => toggleSort('id')}
                    className="inline-flex items-center gap-1 hover:text-zinc-900"
                  >
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </button>
                </th>

                <th className="py-3 px-4 min-w-[180px]">
                  <button
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-zinc-900"
                  >
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </button>
                </th>

                {/* Dynamic Assessment Columns */}
                {gradebook.columns.map((col) => (
                  <th key={col.key} className="py-3 px-3 min-w-[120px] text-center border-l border-zinc-200/60">
                    <div className="flex items-center justify-center gap-1">
                      <span>{col.label}</span>
                      <button
                        onClick={() => setEditingColumn(col)}
                        className="p-0.5 text-zinc-400 hover:text-indigo-600 transition-colors"
                        title="Edit Column / Max Points"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[10px] font-normal text-zinc-400">
                      Max: {col.maxPoints} pts
                    </div>
                  </th>
                ))}

                {/* Total Column */}
                <th className="py-3 px-3 w-24 text-center border-l border-zinc-200 bg-zinc-100/60 font-bold text-zinc-800">
                  <button
                    onClick={() => toggleSort('total')}
                    className="inline-flex items-center gap-1 hover:text-zinc-900"
                  >
                    <span>Total</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </button>
                  <div className="text-[10px] font-normal text-zinc-500">/{maxPossible}</div>
                </th>

                {/* Percentage & Grade Column */}
                <th className="py-3 px-3 w-24 text-center border-l border-zinc-200 bg-zinc-100/60 font-bold text-zinc-800">
                  <button
                    onClick={() => toggleSort('grade')}
                    className="inline-flex items-center gap-1 hover:text-zinc-900"
                  >
                    <span>Grade</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </button>
                </th>

                {/* Teacher Remarks / Notes */}
                <th className="py-3 px-4 min-w-[180px] border-l border-zinc-200/60">
                  Remarks / Notes
                </th>

                {/* Row delete action */}
                <th className="py-3 px-2 w-10 text-center"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200/70">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={gradebook.columns.length + 5}
                    className="py-12 text-center text-zinc-400"
                  >
                    No students match the selected filter.
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student, idx) => {
                  const total = calculateStudentTotal(student, gradebook.columns);
                  const percentage = calculateStudentPercentage(student, gradebook.columns);
                  const letterGrade = getLetterGrade(percentage, gradingScale);
                  const badge = getGradeBadgeColor(letterGrade);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-indigo-50/30 transition-colors ${
                        student.flagged ? 'bg-amber-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'
                      }`}
                    >
                      {/* ID */}
                      <td className="py-2.5 px-3 text-center font-mono text-zinc-500 text-[11px]">
                        <input
                          type="text"
                          value={student.id}
                          onChange={(e) => handleStudentFieldChange(student.id, 'id', e.target.value)}
                          className="w-full text-center bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:bg-white focus:outline-none rounded px-1 py-0.5"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-4 font-medium text-zinc-800">
                        <div className="flex items-center justify-between gap-1.5">
                          <input
                            type="text"
                            value={student.name}
                            onChange={(e) =>
                              handleStudentFieldChange(student.id, 'name', e.target.value)
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:bg-white focus:outline-none rounded px-1.5 py-0.5 font-medium"
                          />
                          {student.flagged && (
                            <button
                              onClick={() => handleClearFlag(student.id)}
                              className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                              title={`Flagged: ${student.flagReason || 'Check handwritten score'}. Click to approve.`}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Verify</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Scores */}
                      {gradebook.columns.map((col) => {
                        const scoreVal = student.scores[col.key];
                        const isScoreOver =
                          typeof scoreVal === 'number' && scoreVal > col.maxPoints;

                        return (
                          <td
                            key={col.key}
                            className="py-2.5 px-3 text-center border-l border-zinc-200/60"
                          >
                            <input
                              type="number"
                              step="0.5"
                              value={typeof scoreVal === 'number' ? scoreVal : ''}
                              placeholder="-"
                              onChange={(e) =>
                                handleScoreChange(student.id, col.key, e.target.value)
                              }
                              className={`w-16 text-center font-medium rounded px-1 py-1 text-xs transition-colors border ${
                                isScoreOver
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-zinc-50/60 hover:bg-white focus:bg-white border-zinc-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="py-2.5 px-3 text-center border-l border-zinc-200 bg-zinc-50/40 font-semibold text-zinc-900">
                        {total}
                      </td>

                      {/* Percentage & Letter Grade Badge */}
                      <td className="py-2.5 px-3 text-center border-l border-zinc-200 bg-zinc-50/40">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-xs border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {letterGrade}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="py-2.5 px-4 border-l border-zinc-200/60 text-zinc-600">
                        <input
                          type="text"
                          value={student.notes || ''}
                          placeholder="Add comment..."
                          onChange={(e) =>
                            handleStudentFieldChange(student.id, 'notes', e.target.value)
                          }
                          className="w-full bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-indigo-500 focus:bg-white focus:outline-none rounded px-1.5 py-0.5 text-xs text-zinc-600 placeholder:text-zinc-300"
                        />
                      </td>

                      {/* Row Delete */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1 text-zinc-300 hover:text-rose-600 transition-colors"
                          title="Remove student row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Column Modal */}
      {editingColumn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900">Edit Column: {editingColumn.label}</h3>
              <button
                onClick={() => setEditingColumn(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveColumnEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Column Label</label>
                <input
                  type="text"
                  value={editingColumn.label}
                  onChange={(e) => setEditingColumn({ ...editingColumn, label: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Maximum Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingColumn.maxPoints}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      maxPoints: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(editingColumn.key)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Delete Column
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingColumn(null)}
                    className="px-3 py-1.5 text-xs text-zinc-600 rounded-lg hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900">Add New Assessment Column</h3>
              <button
                onClick={() => setShowAddColumnModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Column Name (e.g. Quiz 3, Lab 1, Bonus)
                </label>
                <input
                  type="text"
                  required
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="e.g. Lab Report #2"
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Max Points Possible
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newColMaxPoints}
                  onChange={(e) => setNewColMaxPoints(Number(e.target.value) || 1)}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 rounded-lg hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Create Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900">Add Student Row</h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Roll / Student ID (Optional)
                </label>
                <input
                  type="text"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder={`e.g. ${gradebook.students.length + 1}`}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 rounded-lg hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Curve / Adjust Scores Modal */}
      {showCurveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900">Adjust / Curve Scores</h3>
              <button
                onClick={() => setShowCurveModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleApplyCurve} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Target Assessment
                </label>
                <select
                  value={curveTargetCol}
                  onChange={(e) => setCurveTargetCol(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Assessment Columns</option>
                  {gradebook.columns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label} (Max {col.maxPoints})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Score Adjustment (Points to Add or Subtract)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={curvePoints}
                  onChange={(e) => setCurvePoints(Number(e.target.value))}
                  placeholder="e.g. +3 or -1"
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Values will automatically be clamped between 0 and each column's max points.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCurveModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 rounded-lg hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                >
                  Apply Curve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
