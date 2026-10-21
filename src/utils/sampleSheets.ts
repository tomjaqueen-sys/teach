import { GradebookData } from '../types';

export interface SampleSheetPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  generateImage: () => string; // returns data URL
  preExtractedData: Omit<GradebookData, 'id' | 'createdAt' | 'updatedAt' | 'originalImage'>;
}

// Generate realistic lined rough paper image with handwritten look
function createSampleCanvasImage(title: string, date: string, rows: Array<{ id: string; name: string; scores: string; comment?: string }>): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - yellowish rough paper
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper texture / noise
  ctx.fillStyle = 'rgba(230, 220, 200, 0.2)';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }

  // Notebook vertical margin line in faint pink/red
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(180, 0);
  ctx.lineTo(180, canvas.height);
  ctx.stroke();

  // Horizontal ruled lines (blue faint)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  const lineSpacing = 42;
  for (let y = 140; y < canvas.height - 40; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Teacher Header in handwriting style
  ctx.font = 'bold 36px "Courier New", Courier, monospace';
  ctx.fillStyle = '#1e3a8a'; // Blue ink
  ctx.fillText(title, 210, 85);

  ctx.font = '22px "Courier New", Courier, monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText(`Date: ${date}   |   Rough Grading Sheet - Class Record`, 210, 125);

  // Column header guide
  ctx.font = 'bold 24px "Courier New", Courier, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('# ID', 70, 180);
  ctx.fillText('Student Name', 210, 180);
  ctx.fillText('Scores / Marks', 620, 180);
  ctx.fillText('Teacher Notes', 920, 180);

  // Rows of student marks
  let currentY = 225;
  rows.forEach((row, idx) => {
    // Slight handwriting tilt/jitter
    const tilt = (Math.random() - 0.5) * 4;

    ctx.save();
    ctx.translate(0, tilt);

    // Ink color variation: mostly dark blue ink
    ctx.font = '24px "Courier New", Courier, monospace';
    ctx.fillStyle = idx % 3 === 0 ? '#1d4ed8' : '#1e293b';

    // ID
    ctx.fillText(row.id, 80, currentY);

    // Name
    ctx.fillText(row.name, 210, currentY);

    // Scores
    ctx.fillText(row.scores, 620, currentY);

    // Teacher red pen corrections or notes
    if (row.comment) {
      ctx.fillStyle = '#dc2626'; // Red pen
      ctx.font = 'italic 20px "Courier New", Courier, monospace';
      ctx.fillText(row.comment, 920, currentY);
    }

    ctx.restore();
    currentY += lineSpacing;
  });

  // Stamp / Teacher Scribble at bottom
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 3;
  ctx.strokeRect(850, 1180, 280, 90);
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 22px "Courier New", Courier, monospace';
  ctx.fillText('VERIFIED BY TEACHER', 870, 1225);
  ctx.font = '18px "Courier New", Courier, monospace';
  ctx.fillText('Period 3 Grade Tally', 870, 1255);

  // Coffee mug faint stain ring!
  ctx.beginPath();
  ctx.arc(1060, 200, 75, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(180, 140, 100, 0.15)';
  ctx.lineWidth = 14;
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const SAMPLE_SHEETS: SampleSheetPreset[] = [
  {
    id: 'biology-quiz',
    name: 'Period 3 Biology Quiz (Handwritten Rough Sheet)',
    category: 'Science / Pop Quiz',
    description: 'Messy pop quiz marks out of 20 with handwritten fractions (18/20), red pen corrections, and absences.',
    generateImage: () =>
      createSampleCanvasImage('Bio 101: Cell Structure Pop Quiz', '10/18/2026', [
        { id: '01', name: 'Alexander Wright', scores: '18 / 20', comment: 'Great diagram!' },
        { id: '02', name: 'Brianna Chen', scores: '20 / 20', comment: 'Top score' },
        { id: '03', name: 'Carlos Mendez', scores: '14 / 20', comment: 'Review mitosis' },
        { id: '04', name: 'Danielle Brooks', scores: '17 / 20', comment: 'Corrected +2' },
        { id: '05', name: 'Ethan Harper', scores: 'ABSENT', comment: 'Excused sick' },
        { id: '06', name: 'Fatima Al-Sayed', scores: '19 / 20', comment: 'Near perfect' },
        { id: '07', name: 'George Miller', scores: '12 / 20', comment: 'Needs retake' },
        { id: '08', name: 'Hannah Abbott', scores: '16 / 20', comment: 'Good effort' },
        { id: '09', name: 'Ian O\'Connor', scores: '15 / 20', comment: '' },
        { id: '10', name: 'Jessica Taylor', scores: '18 / 20', comment: 'Clear labels' },
        { id: '11', name: 'Kevin Zhang', scores: '19 / 20', comment: 'Bonus +1' },
        { id: '12', name: 'Luna Lovecraft', scores: '13 / 20', comment: 'Incomplete part B' },
      ]),
    preExtractedData: {
      title: 'Biology 101: Cell Structure Pop Quiz',
      subject: 'Biology',
      date: '2026-10-18',
      classSection: 'Period 3',
      columns: [
        { key: 'quiz_score', label: 'Cell Quiz', maxPoints: 20 },
      ],
      students: [
        { id: '01', name: 'Alexander Wright', scores: { quiz_score: 18 }, notes: 'Great diagram!' },
        { id: '02', name: 'Brianna Chen', scores: { quiz_score: 20 }, notes: 'Top score' },
        { id: '03', name: 'Carlos Mendez', scores: { quiz_score: 14 }, notes: 'Review mitosis' },
        { id: '04', name: 'Danielle Brooks', scores: { quiz_score: 17 }, notes: 'Corrected +2 from original 15' },
        { id: '05', name: 'Ethan Harper', scores: { quiz_score: null }, notes: 'Absent (Excused sick)' },
        { id: '06', name: 'Fatima Al-Sayed', scores: { quiz_score: 19 }, notes: 'Near perfect' },
        { id: '07', name: 'George Miller', scores: { quiz_score: 12 }, notes: 'Needs retake', flagged: true, flagReason: 'Score digit 12 faintly written' },
        { id: '08', name: 'Hannah Abbott', scores: { quiz_score: 16 }, notes: 'Good effort' },
        { id: '09', name: 'Ian O\'Connor', scores: { quiz_score: 15 }, notes: '' },
        { id: '10', name: 'Jessica Taylor', scores: { quiz_score: 18 }, notes: 'Clear labels' },
        { id: '11', name: 'Kevin Zhang', scores: { quiz_score: 19 }, notes: 'Bonus +1 included' },
        { id: '12', name: 'Luna Lovecraft', scores: { quiz_score: 13 }, notes: 'Incomplete part B' },
      ],
      rawNotes: 'Total possible: 20 points. Passing mark is 12 (60%). Retest scheduled for Friday.',
      summaryAnalysis: 'Successfully digitized 12 student entries for Period 3 Biology with 1 absent student recorded.',
    },
  },
  {
    id: 'algebra-midterm',
    name: 'Algebra II: Midterm Exam & Homework Grid',
    category: 'Mathematics / Multi-Column',
    description: 'Multi-column assessment sheet with Homework (15 pts), Quiz 1 (25 pts), and Midterm Exam (100 pts).',
    generateImage: () =>
      createSampleCanvasImage('Grade 10 Algebra II: Unit 4 Assessment', '10/12/2026', [
        { id: 'A-101', name: 'Marcus Vance', scores: 'HW:14 | Q1:23 | Mid:92', comment: 'Consistent' },
        { id: 'A-102', name: 'Natalie Portman', scores: 'HW:15 | Q1:25 | Mid:98', comment: 'Honor roll' },
        { id: 'A-103', name: 'Omar Farooq', scores: 'HW:12 | Q1:19 | Mid:78', comment: 'Study group' },
        { id: 'A-104', name: 'Priya Sharma', scores: 'HW:15 | Q1:24 | Mid:89', comment: 'Solid work' },
        { id: 'A-105', name: 'Quentin Blake', scores: 'HW:10 | Q1:16 | Mid:64', comment: 'Tutoring needed' },
        { id: 'A-106', name: 'Rebecca Torres', scores: 'HW:13 | Q1:21 | Mid:85', comment: '' },
        { id: 'A-107', name: 'Samuel Jackson', scores: 'HW:15 | Q1:22 | Mid:88', comment: 'Good pacing' },
        { id: 'A-108', name: 'Tara Campbell', scores: 'HW:11 | Q1:18 | Mid:72', comment: 'Formula sheet' },
        { id: 'A-109', name: 'Victor Hugo', scores: 'HW:14 | Q1:24 | Mid:94', comment: 'Excellent' },
        { id: 'A-110', name: 'Wendy Darling', scores: 'HW:15 | Q1:20 | Mid:81', comment: '' },
      ]),
    preExtractedData: {
      title: 'Grade 10 Algebra II: Unit 4 Assessment',
      subject: 'Mathematics',
      date: '2026-10-12',
      classSection: 'Grade 10 - Section B',
      columns: [
        { key: 'homework', label: 'Homework #4', maxPoints: 15 },
        { key: 'quiz_1', label: 'Quiz 1', maxPoints: 25 },
        { key: 'midterm', label: 'Midterm Exam', maxPoints: 100 },
      ],
      students: [
        { id: 'A-101', name: 'Marcus Vance', scores: { homework: 14, quiz_1: 23, midterm: 92 }, notes: 'Consistent performance' },
        { id: 'A-102', name: 'Natalie Portman', scores: { homework: 15, quiz_1: 25, midterm: 98 }, notes: 'Honor roll candidate' },
        { id: 'A-103', name: 'Omar Farooq', scores: { homework: 12, quiz_1: 19, midterm: 78 }, notes: 'Recommended for study group' },
        { id: 'A-104', name: 'Priya Sharma', scores: { homework: 15, quiz_1: 24, midterm: 89 }, notes: 'Solid work' },
        { id: 'A-105', name: 'Quentin Blake', scores: { homework: 10, quiz_1: 16, midterm: 64 }, notes: 'Peer tutoring needed', flagged: true, flagReason: 'Check if homework score was 10 or 12' },
        { id: 'A-106', name: 'Rebecca Torres', scores: { homework: 13, quiz_1: 21, midterm: 85 }, notes: '' },
        { id: 'A-107', name: 'Samuel Jackson', scores: { homework: 15, quiz_1: 22, midterm: 88 }, notes: 'Good pacing' },
        { id: 'A-108', name: 'Tara Campbell', scores: { homework: 11, quiz_1: 18, midterm: 72 }, notes: 'Used formula sheet' },
        { id: 'A-109', name: 'Victor Hugo', scores: { homework: 14, quiz_1: 24, midterm: 94 }, notes: 'Excellent logic proofs' },
        { id: 'A-110', name: 'Wendy Darling', scores: { homework: 15, quiz_1: 20, midterm: 81 }, notes: '' },
      ],
      rawNotes: 'Homework weighted 15pts, Quiz 25pts, Midterm 100pts (Total 140pts).',
      summaryAnalysis: 'Extracted 3 assessment columns across 10 students with total point ceiling of 140.',
    },
  },
  {
    id: 'history-essay',
    name: 'World History Essay & Seminar Rubric',
    category: 'Humanities / Rubric',
    description: 'Rough score list tracking Research Draft (30 pts), Peer Seminar (20 pts), and Final Essay (50 pts).',
    generateImage: () =>
      createSampleCanvasImage('AP World History: Industrial Rev Essays', '10/15/2026', [
        { id: 'H-01', name: 'Aaron Paul', scores: 'Draft:28 | Sem:19 | Fin:47', comment: 'Superb thesis' },
        { id: 'H-02', name: 'Beatrice Webb', scores: 'Draft:25 | Sem:17 | Fin:42', comment: 'Good citations' },
        { id: 'H-03', name: 'Colin Farrell', scores: 'Draft:22 | Sem:15 | Fin:38', comment: 'Needs secondary sources' },
        { id: 'H-04', name: 'Diana Prince', scores: 'Draft:30 | Sem:20 | Fin:50', comment: 'Flawless analysis' },
        { id: 'H-05', name: 'Eliot Ness', scores: 'Draft:26 | Sem:18 | Fin:44', comment: 'Active participant' },
        { id: 'H-06', name: 'Freya Allan', scores: 'Draft:24 | Sem:16 | Fin:40', comment: '' },
        { id: 'H-07', name: 'Gabriel Byrne', scores: 'Draft:18 | Sem:12 | Fin:32', comment: 'Late draft (-5)' },
        { id: 'H-08', name: 'Helena Bonham', scores: 'Draft:27 | Sem:19 | Fin:46', comment: 'Vivid narrative' },
      ]),
    preExtractedData: {
      title: 'AP World History: Industrial Revolution Paper',
      subject: 'World History',
      date: '2026-10-15',
      classSection: 'AP History Block 2',
      columns: [
        { key: 'draft', label: 'Research Draft', maxPoints: 30 },
        { key: 'seminar', label: 'Peer Seminar', maxPoints: 20 },
        { key: 'final_essay', label: 'Final Essay', maxPoints: 50 },
      ],
      students: [
        { id: 'H-01', name: 'Aaron Paul', scores: { draft: 28, seminar: 19, final_essay: 47 }, notes: 'Superb thesis' },
        { id: 'H-02', name: 'Beatrice Webb', scores: { draft: 25, seminar: 17, final_essay: 42 }, notes: 'Good citations' },
        { id: 'H-03', name: 'Colin Farrell', scores: { draft: 22, seminar: 15, final_essay: 38 }, notes: 'Needs secondary sources' },
        { id: 'H-04', name: 'Diana Prince', scores: { draft: 30, seminar: 20, final_essay: 50 }, notes: 'Flawless analysis' },
        { id: 'H-05', name: 'Eliot Ness', scores: { draft: 26, seminar: 18, final_essay: 44 }, notes: 'Active participant' },
        { id: 'H-06', name: 'Freya Allan', scores: { draft: 24, seminar: 16, final_essay: 40 }, notes: '' },
        { id: 'H-07', name: 'Gabriel Byrne', scores: { draft: 18, seminar: 12, final_essay: 32 }, notes: 'Late draft penalty included' },
        { id: 'H-08', name: 'Helena Bonham', scores: { draft: 27, seminar: 19, final_essay: 46 }, notes: 'Vivid narrative style' },
      ],
      rawNotes: '100 points total. Rubric includes primary source quotation depth.',
      summaryAnalysis: 'Extracted 8 essays with draft, seminar, and final scores.',
    },
  },
];
