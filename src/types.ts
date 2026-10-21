export interface ColumnDef {
  key: string;
  label: string;
  maxPoints: number;
  weight?: number;
}

export interface StudentRow {
  id: string;
  name: string;
  scores: Record<string, number | null>;
  notes?: string;
  flagged?: boolean;
  flagReason?: string;
}

export interface GradebookData {
  id: string;
  title: string;
  subject?: string;
  date?: string;
  classSection?: string;
  columns: ColumnDef[];
  students: StudentRow[];
  rawNotes?: string;
  summaryAnalysis?: string;
  originalImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradingScale {
  aMin: number; // default 90
  bMin: number; // default 80
  cMin: number; // default 70
  dMin: number; // default 60
}

export const DEFAULT_GRADING_SCALE: GradingScale = {
  aMin: 90,
  bMin: 80,
  cMin: 70,
  dMin: 60,
};

export type ActiveTab = 'scanner' | 'gradebook' | 'analytics' | 'history';
