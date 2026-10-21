import http from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Support large image payloads from camera / scans
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Extract gradebook from scanned image / photo
  app.post('/api/extract-gradebook', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', userPromptHints = '', defaultMaxScore } = req.body;

      if (!imageBase64) {
        res.status(400).json({ error: 'Image data is required (imageBase64).' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please check your environment variables.',
        });
        return;
      }

      // Strip potential data URL prefix if present
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

      const promptInstructions = `You are an expert OCR and education assistant specializing in accurately digitizing teachers' rough score sheets, handwritten test marks, pop-quiz lists, attendance/grading rubrics, and exam tallies.

TASK:
Analyze the attached image of a teacher's rough score sheet. Extract all student entries, identification/roll numbers, student names, and individual assessment score columns into a clear structured digital gradebook.

ADDITIONAL TEACHER INSTRUCTIONS:
${userPromptHints || 'Transcribe all rows and columns with utmost fidelity.'}
${defaultMaxScore ? `Default max score expected: ${defaultMaxScore}` : ''}

CRITICAL OCR RULES:
1. Handwriting Nuance: Disambiguate common handwriting confusions (1 vs 7, 0 vs 6 vs 8, 4 vs 9, 3 vs 5). Use the context of max points and neighboring student scores.
2. Fractions & Ratios: If written as "18/20" or "45/50", the score value is 18 and maxPoints is 20.
3. Corrections & Strikethroughs: If a teacher crossed out a number and rewrote another (e.g., ~12~ 15), record the corrected score (15) and record what happened in 'notes'.
4. Ambiguities & Smudges: If any digit or name cannot be read with 100% confidence, set "flagged": true and specify the issue in "flagReason" (e.g., "Score digit could be 14 or 19; please verify with paper sheet").
5. Absences & Incompletes: If marked "Ab", "A", "ABS", "-", or blank, set score value to null (or omit value) and set notes to "Absent" or "Missing".
6. Columns: Identify separate columns (e.g. Q1, Q2, Quiz, Midterm, HW, Project, Total). If columns have no labels, name them "Assessment 1", "Assessment 2", etc.
7. Clean Student Names: Normalize student names (capitalize correctly, preserve provided order).
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: promptInstructions,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Subject or assessment title detected or inferred' },
              subject: { type: Type.STRING, description: 'Academic subject or course name' },
              date: { type: Type.STRING, description: 'Assessment date if noted on sheet' },
              classSection: { type: Type.STRING, description: 'Grade, period, or section if indicated' },
              columns: {
                type: Type.ARRAY,
                description: 'List of score columns detected in the sheet',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING, description: 'Identifier key e.g. quiz_1, midterm' },
                    label: { type: Type.STRING, description: 'Friendly header name e.g. Quiz 1, Midterm Exam' },
                    maxPoints: { type: Type.NUMBER, description: 'Maximum score possible for this column' },
                  },
                  required: ['key', 'label', 'maxPoints'],
                },
              },
              students: {
                type: Type.ARRAY,
                description: 'List of student rows extracted',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'Student Roll No, Index, or ID number' },
                    name: { type: Type.STRING, description: 'Full student name' },
                    scores: {
                      type: Type.ARRAY,
                      description: 'Scores for each column',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          columnKey: { type: Type.STRING, description: 'Column key reference' },
                          value: { type: Type.NUMBER, description: 'Numerical mark achieved' },
                          rawText: { type: Type.STRING, description: 'Original handwritten text if notable' },
                        },
                        required: ['columnKey'],
                      },
                    },
                    notes: { type: Type.STRING, description: 'Remarks, absence reason, or bonus details' },
                    flagged: { type: Type.BOOLEAN, description: 'True if ambiguous handwriting requires review' },
                    flagReason: { type: Type.STRING, description: 'Explanation of ambiguity for teacher' },
                  },
                  required: ['id', 'name', 'scores'],
                },
              },
              rawNotes: { type: Type.STRING, description: 'Any teacher notes, margin scribbles or reminders' },
              summaryAnalysis: { type: Type.STRING, description: 'Brief summary of what was detected in the sheet' },
            },
            required: ['title', 'columns', 'students'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: unknown) {
      console.error('Error during gradebook extraction:', err);
      const message = err instanceof Error ? err.message : 'Unknown server error during OCR extraction';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  });

  // Vite middleware in dev or static files in production
  const server = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`GradeSnap AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

