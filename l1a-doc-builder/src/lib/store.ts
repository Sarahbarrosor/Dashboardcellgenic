import fs from 'fs';
import path from 'path';
import type { CaseData, OverridesFile, QuestionsFile } from './types';
import { SEED_QUESTIONS } from './questions';

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, 'data');
export const OUTPUT_DIR = path.join(ROOT, 'output');
export const LETTERHEAD_DIR = path.join(ROOT, 'assets', 'letterhead');

const CASE_FILE = path.join(DATA_DIR, 'case-data.json');
const OVERRIDES_FILE = path.join(DATA_DIR, 'overrides.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/** Escritura atómica: se escribe a .tmp y se renombra, para no dejar el JSON a medias. */
function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

export function loadCase(): CaseData {
  return readJson<CaseData>(CASE_FILE, {} as CaseData);
}

export function saveCase(data: CaseData) {
  writeJson(CASE_FILE, data);
}

export function loadOverrides(): OverridesFile {
  return readJson<OverridesFile>(OVERRIDES_FILE, {});
}

export function saveOverrides(data: OverridesFile) {
  writeJson(OVERRIDES_FILE, data);
}

export function loadQuestions(): QuestionsFile {
  if (!fs.existsSync(QUESTIONS_FILE)) {
    const seeded: QuestionsFile = { questions: SEED_QUESTIONS.map((q) => ({ ...q })) };
    writeJson(QUESTIONS_FILE, seeded);
    return seeded;
  }
  return readJson<QuestionsFile>(QUESTIONS_FILE, { questions: [] });
}

export function saveQuestions(data: QuestionsFile) {
  writeJson(QUESTIONS_FILE, data);
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
