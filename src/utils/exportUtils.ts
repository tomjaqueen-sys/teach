import * as XLSX from 'xlsx';
import { GradebookData, GradingScale } from '../types';
import {
  calculateMaxPossibleTotal,
  calculateStudentPercentage,
  calculateStudentTotal,
  computeClassStatistics,
  getLetterGrade,
} from './gradeCalculations';

export function exportToExcel(gradebook: GradebookData, scale: GradingScale) {
  const wb = XLSX.utils.book_new();

  // 1. Gradebook Sheet
  const headers = ['Student ID', 'Student Name'];
  gradebook.columns.forEach((col) => {
    headers.push(`${col.label} (Max: ${col.maxPoints})`);
  });
  headers.push('Total Score', 'Max Possible', 'Percentage (%)', 'Letter Grade', 'Teacher Notes');

  const rows: (string | number)[][] = [headers];

  const maxTotal = calculateMaxPossibleTotal(gradebook.columns);

  gradebook.students.forEach((student) => {
    const total = calculateStudentTotal(student, gradebook.columns);
    const pct = calculateStudentPercentage(student, gradebook.columns);
    const grade = getLetterGrade(pct, scale);

    const row: (string | number)[] = [
      student.id,
      student.name,
    ];

    gradebook.columns.forEach((col) => {
      const val = student.scores[col.key];
      row.push(typeof val === 'number' ? val : '');
    });

    row.push(total, maxTotal, `${pct.toFixed(1)}%`, grade, student.notes || '');
    rows.push(row);
  });

  const wsGradebook = XLSX.utils.aoa_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    rows.forEach((r) => {
      const cellVal = String(r[i] ?? '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.max(maxLen + 3, 12) };
  });
  wsGradebook['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsGradebook, 'Gradebook');

  // 2. Class Statistics Sheet
  const stats = computeClassStatistics(gradebook, scale);
  const statsRows: (string | number)[][] = [
    ['Class Assessment Summary'],
    ['Assessment Title', gradebook.title || 'Untitled Assessment'],
    ['Subject', gradebook.subject || 'N/A'],
    ['Section / Class', gradebook.classSection || 'N/A'],
    ['Date', gradebook.date || new Date().toLocaleDateString()],
    [''],
    ['Key Metrics', 'Value'],
    ['Total Enrolled / Graded Students', stats.count],
    ['Total Maximum Possible Points', stats.maxPossible],
    ['Class Average Score', stats.averageScore],
    ['Class Average Percentage', `${stats.averagePercent}%`],
    ['Class Median Score', stats.medianScore],
    ['Highest Score', stats.highestScore],
    ['Lowest Score', stats.lowestScore],
    ['Passing Students', stats.passingCount],
    ['Passing Rate (%)', `${stats.passingRate}%`],
    [''],
    ['Grade Distribution', 'Number of Students', 'Percentage of Class'],
    ['A (90%+)', stats.gradeDistribution.A, stats.count ? `${((stats.gradeDistribution.A / stats.count) * 100).toFixed(1)}%` : '0%'],
    ['B (80-89%)', stats.gradeDistribution.B, stats.count ? `${((stats.gradeDistribution.B / stats.count) * 100).toFixed(1)}%` : '0%'],
    ['C (70-79%)', stats.gradeDistribution.C, stats.count ? `${((stats.gradeDistribution.C / stats.count) * 100).toFixed(1)}%` : '0%'],
    ['D (60-69%)', stats.gradeDistribution.D, stats.count ? `${((stats.gradeDistribution.D / stats.count) * 100).toFixed(1)}%` : '0%'],
    ['F (<60%)', stats.gradeDistribution.F, stats.count ? `${((stats.gradeDistribution.F / stats.count) * 100).toFixed(1)}%` : '0%'],
    [''],
    ['Column Breakdown', 'Column Average', 'Max Points', 'Average %'],
  ];

  gradebook.columns.forEach((col) => {
    const colStat = stats.columnAverages[col.key];
    if (colStat) {
      statsRows.push([col.label, colStat.avg, colStat.max, `${colStat.percent}%`]);
    }
  });

  const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
  wsStats['!cols'] = [{ wch: 32 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Class Statistics');

  const safeFilename = `${(gradebook.title || 'Gradebook').replace(/[^a-zA-Z0-9_-]/g, '_')}_grades.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

export function exportToCSV(gradebook: GradebookData, scale: GradingScale) {
  const headers = ['Student ID', 'Student Name'];
  gradebook.columns.forEach((col) => {
    headers.push(`${col.label} [Max ${col.maxPoints}]`);
  });
  headers.push('Total Score', 'Max Points', 'Percentage', 'Letter Grade', 'Notes');

  const maxTotal = calculateMaxPossibleTotal(gradebook.columns);

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvValue).join(','));

  gradebook.students.forEach((student) => {
    const total = calculateStudentTotal(student, gradebook.columns);
    const pct = calculateStudentPercentage(student, gradebook.columns);
    const grade = getLetterGrade(pct, scale);

    const row: string[] = [
      escapeCsvValue(student.id),
      escapeCsvValue(student.name),
    ];

    gradebook.columns.forEach((col) => {
      const val = student.scores[col.key];
      row.push(escapeCsvValue(typeof val === 'number' ? val.toString() : ''));
    });

    row.push(
      escapeCsvValue(total.toString()),
      escapeCsvValue(maxTotal.toString()),
      escapeCsvValue(`${pct.toFixed(1)}%`),
      escapeCsvValue(grade),
      escapeCsvValue(student.notes || '')
    );

    csvRows.push(row.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFilename = `${(gradebook.title || 'Gradebook').replace(/[^a-zA-Z0-9_-]/g, '_')}_grades.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyGradebookToClipboard(gradebook: GradebookData, scale: GradingScale): Promise<boolean> {
  const headers = ['Student ID', 'Student Name'];
  gradebook.columns.forEach((col) => {
    headers.push(`${col.label} (${col.maxPoints})`);
  });
  headers.push('Total', 'Percentage', 'Grade', 'Notes');

  const rows: string[] = [headers.join('\t')];

  gradebook.students.forEach((student) => {
    const total = calculateStudentTotal(student, gradebook.columns);
    const pct = calculateStudentPercentage(student, gradebook.columns);
    const grade = getLetterGrade(pct, scale);

    const row: (string | number)[] = [student.id, student.name];
    gradebook.columns.forEach((col) => {
      const val = student.scores[col.key];
      row.push(typeof val === 'number' ? val : '');
    });
    row.push(total, `${pct.toFixed(1)}%`, grade, student.notes || '');
    rows.push(row.join('\t'));
  });

  const textToCopy = rows.join('\n');
  try {
    await navigator.clipboard.writeText(textToCopy);
    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
