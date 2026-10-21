import React from 'react';
import {
  Award,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertCircle,
  Sliders,
  BarChart2,
  Users,
} from 'lucide-react';
import { GradebookData, GradingScale } from '../types';
import {
  calculateMaxPossibleTotal,
  calculateStudentPercentage,
  calculateStudentTotal,
  computeClassStatistics,
  getGradeBadgeColor,
  getLetterGrade,
} from '../utils/gradeCalculations';

interface GradeAnalyticsProps {
  gradebook: GradebookData;
  gradingScale: GradingScale;
  onUpdateGradingScale: (scale: GradingScale) => void;
}

export const GradeAnalytics: React.FC<GradeAnalyticsProps> = ({
  gradebook,
  gradingScale,
  onUpdateGradingScale,
}) => {
  const stats = computeClassStatistics(gradebook, gradingScale);
  const maxPossible = calculateMaxPossibleTotal(gradebook.columns);

  const atRiskStudents = gradebook.students.filter((s) => {
    const pct = calculateStudentPercentage(s, gradebook.columns);
    return pct < gradingScale.dMin || s.flagged;
  });

  const topStudents = [...gradebook.students]
    .sort(
      (a, b) =>
        calculateStudentTotal(b, gradebook.columns) -
        calculateStudentTotal(a, gradebook.columns)
    )
    .slice(0, 3);

  const gradeBands: Array<{
    letter: 'A' | 'B' | 'C' | 'D' | 'F';
    label: string;
    range: string;
    color: string;
    bg: string;
  }> = [
    { letter: 'A', label: 'Excellent', range: `>= ${gradingScale.aMin}%`, color: 'bg-emerald-500', bg: 'text-emerald-700 bg-emerald-50' },
    { letter: 'B', label: 'Good', range: `${gradingScale.bMin}% - ${gradingScale.aMin - 1}%`, color: 'bg-blue-500', bg: 'text-blue-700 bg-blue-50' },
    { letter: 'C', label: 'Average', range: `${gradingScale.cMin}% - ${gradingScale.bMin - 1}%`, color: 'bg-amber-500', bg: 'text-amber-700 bg-amber-50' },
    { letter: 'D', label: 'Passing', range: `${gradingScale.dMin}% - ${gradingScale.cMin - 1}%`, color: 'bg-orange-500', bg: 'text-orange-700 bg-orange-50' },
    { letter: 'F', label: 'Failing', range: `< ${gradingScale.dMin}%`, color: 'bg-rose-500', bg: 'text-rose-700 bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Level Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Class Average</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900">{stats.averageScore} <span className="text-xs text-zinc-400 font-normal">/{maxPossible}</span></div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">{stats.averagePercent}% avg</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Median Score</span>
            <BarChart2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900">{stats.medianScore} <span className="text-xs text-zinc-400 font-normal">/{maxPossible}</span></div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Middle ranking mark</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Passing Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.passingRate}%</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{stats.passingCount} of {stats.count} students</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Highest Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900">{stats.highestScore}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{maxPossible > 0 ? `${((stats.highestScore / maxPossible) * 100).toFixed(0)}%` : ''}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Lowest Score</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900">{stats.lowestScore}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{maxPossible > 0 ? `${((stats.lowestScore / maxPossible) * 100).toFixed(0)}%` : ''}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Students</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900">{stats.count}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{gradebook.columns.length} assessments</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Grade Distribution</h3>
              <p className="text-xs text-zinc-500">Breakdown of student letter grades across the class</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">
              {stats.count} Graded Students
            </span>
          </div>

          <div className="space-y-4">
            {gradeBands.map((band) => {
              const count = stats.gradeDistribution[band.letter] || 0;
              const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;

              return (
                <div key={band.letter} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md font-bold flex items-center justify-center text-xs ${band.bg}`}>
                        {band.letter}
                      </span>
                      <span className="font-semibold text-zinc-800">{band.label}</span>
                      <span className="text-zinc-400 text-[11px]">({band.range})</span>
                    </div>
                    <div className="font-semibold text-zinc-700">
                      {count} <span className="font-normal text-zinc-400 text-[11px]">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${band.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assessment Columns Average Breakdown */}
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3">
              Assessment Columns Performance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {gradebook.columns.map((col) => {
                const cStat = stats.columnAverages[col.key];
                return (
                  <div key={col.key} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60">
                    <div className="text-xs font-semibold text-zinc-800 truncate mb-1">
                      {col.label}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-zinc-900">{cStat?.avg ?? 0}</span>
                      <span className="text-xs text-zinc-500">/ {col.maxPoints} pts</span>
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-indigo-600">
                      {cStat?.percent ?? 0}% average
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Grading Scale Config & At-Risk / Top Performers */}
        <div className="space-y-6">
          {/* Grading Scale Customizer */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Grading Scale Cutoffs
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4">
              Adjust minimum percentages. Grade distribution updates automatically.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Grade A Min %
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={gradingScale.aMin}
                  onChange={(e) =>
                    onUpdateGradingScale({ ...gradingScale, aMin: Number(e.target.value) || 90 })
                  }
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Grade B Min %
                </label>
                <input
                  type="number"
                  min="40"
                  max="99"
                  value={gradingScale.bMin}
                  onChange={(e) =>
                    onUpdateGradingScale({ ...gradingScale, bMin: Number(e.target.value) || 80 })
                  }
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Grade C Min %
                </label>
                <input
                  type="number"
                  min="30"
                  max="89"
                  value={gradingScale.cMin}
                  onChange={(e) =>
                    onUpdateGradingScale({ ...gradingScale, cMin: Number(e.target.value) || 70 })
                  }
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Grade D Min %
                </label>
                <input
                  type="number"
                  min="20"
                  max="79"
                  value={gradingScale.dMin}
                  onChange={(e) =>
                    onUpdateGradingScale({ ...gradingScale, dMin: Number(e.target.value) || 60 })
                  }
                  className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* At-Risk / Needs Attention */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-zinc-900 mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Follow-Up &amp; At-Risk ({atRiskStudents.length})
            </h3>
            <p className="text-[11px] text-zinc-500 mb-3">
              Students scoring below {gradingScale.dMin}% or with ambiguous marks flagged from the rough paper.
            </p>

            {atRiskStudents.length === 0 ? (
              <div className="p-3 text-center text-xs text-emerald-600 bg-emerald-50 rounded-xl">
                Great news! All students scored at or above {gradingScale.dMin}%.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {atRiskStudents.map((s) => {
                  const pct = calculateStudentPercentage(s, gradebook.columns);
                  const letter = getLetterGrade(pct, gradingScale);
                  const badge = getGradeBadgeColor(letter);

                  return (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-zinc-800">{s.name}</div>
                        <div className="text-[10px] text-zinc-400">ID: {s.id}</div>
                        {s.flagged && (
                          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                            OCR Flag: {s.flagReason || 'Check handwriting'}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {pct.toFixed(0)}% ({letter})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
