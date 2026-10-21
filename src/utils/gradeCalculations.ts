import { GradebookData, GradingScale, StudentRow } from '../types';

export function calculateStudentTotal(student: StudentRow, columns: GradebookData['columns']): number {
  return columns.reduce((sum, col) => {
    const val = student.scores[col.key];
    return typeof val === 'number' ? sum + val : sum;
  }, 0);
}

export function calculateMaxPossibleTotal(columns: GradebookData['columns']): number {
  return columns.reduce((sum, col) => sum + (col.maxPoints || 0), 0);
}

export function calculateStudentPercentage(student: StudentRow, columns: GradebookData['columns']): number {
  const max = calculateMaxPossibleTotal(columns);
  if (max === 0) return 0;
  const total = calculateStudentTotal(student, columns);
  return Math.min(100, Math.max(0, (total / max) * 100));
}

export function getLetterGrade(percentage: number, scale: GradingScale): string {
  if (percentage >= scale.aMin) return 'A';
  if (percentage >= scale.bMin) return 'B';
  if (percentage >= scale.cMin) return 'C';
  if (percentage >= scale.dMin) return 'D';
  return 'F';
}

export function getGradeBadgeColor(grade: string): { bg: string; text: string; border: string } {
  switch (grade) {
    case 'A':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'B':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'C':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'D':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'F':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200' };
  }
}

export interface ClassStatistics {
  count: number;
  maxPossible: number;
  averageScore: number;
  averagePercent: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  passingCount: number;
  passingRate: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  columnAverages: Record<string, { avg: number; max: number; percent: number }>;
}

export function computeClassStatistics(gradebook: GradebookData, scale: GradingScale): ClassStatistics {
  const students = gradebook.students;
  const count = students.length;
  const maxPossible = calculateMaxPossibleTotal(gradebook.columns);

  if (count === 0 || maxPossible === 0) {
    return {
      count: 0,
      maxPossible: 0,
      averageScore: 0,
      averagePercent: 0,
      medianScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passingCount: 0,
      passingRate: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      columnAverages: {},
    };
  }

  const totals = students.map((s) => calculateStudentTotal(s, gradebook.columns));
  totals.sort((a, b) => a - b);

  const sum = totals.reduce((acc, t) => acc + t, 0);
  const averageScore = Math.round((sum / count) * 10) / 10;
  const averagePercent = Math.round((averageScore / maxPossible) * 1000) / 10;

  const mid = Math.floor(count / 2);
  const medianScore = count % 2 !== 0 ? totals[mid] : Math.round(((totals[mid - 1] + totals[mid]) / 2) * 10) / 10;
  const highestScore = totals[totals.length - 1];
  const lowestScore = totals[0];

  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let passingCount = 0;

  students.forEach((student) => {
    const pct = calculateStudentPercentage(student, gradebook.columns);
    const letter = getLetterGrade(pct, scale);
    if (letter in distribution) {
      distribution[letter as keyof typeof distribution]++;
    }
    if (pct >= scale.dMin) {
      passingCount++;
    }
  });

  const passingRate = Math.round((passingCount / count) * 1000) / 10;

  // Column specific averages
  const columnAverages: Record<string, { avg: number; max: number; percent: number }> = {};
  gradebook.columns.forEach((col) => {
    let colSum = 0;
    let colCount = 0;
    students.forEach((s) => {
      const val = s.scores[col.key];
      if (typeof val === 'number') {
        colSum += val;
        colCount++;
      }
    });
    const avg = colCount > 0 ? Math.round((colSum / colCount) * 10) / 10 : 0;
    const percent = col.maxPoints > 0 ? Math.round((avg / col.maxPoints) * 1000) / 10 : 0;
    columnAverages[col.key] = {
      avg,
      max: col.maxPoints,
      percent,
    };
  });

  return {
    count,
    maxPossible,
    averageScore,
    averagePercent,
    medianScore,
    highestScore,
    lowestScore,
    passingCount,
    passingRate,
    gradeDistribution: distribution,
    columnAverages,
  };
}
