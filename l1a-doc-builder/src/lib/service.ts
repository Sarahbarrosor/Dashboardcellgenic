import type { CaseData, DecisionLogEntry, DocumentSpec, Field, FieldStatus, OverridesFile, Question } from './types';
import { applyOverrides, buildDocuments, docStats, impactByPath } from './docx/catalog';
import { loadCase, loadOverrides, loadQuestions, newId, saveCase } from './store';
import { collectMissingPaths, getByPath, isField, setByPath } from './fields';
import { runValidation } from './validator';

export interface Snapshot {
  caseData: CaseData;
  generated: DocumentSpec[];
  final: DocumentSpec[];
  overrides: OverridesFile;
}

export function snapshot(): Snapshot {
  const caseData = loadCase();
  const overrides = loadOverrides();
  const generated = buildDocuments(caseData);
  const final = applyOverrides(generated, overrides, caseData);
  return { caseData, generated, final, overrides };
}

export interface TopBarStats {
  openQuestions: number;
  documentsReady: number;
  documentsTotal: number;
  missingData: number;
  inconsistencies: number;
  editedBlocks: number;
}

export function topBarStats(s: Snapshot): TopBarStats {
  const q = loadQuestions().questions.filter((x) => x.status === 'open').length;
  const stats = s.final.map((d) => docStats(d, s.overrides));
  const validation = runValidation(s.caseData, s.generated, s.final, s.overrides, true);
  return {
    openQuestions: q,
    documentsReady: stats.filter((x) => x.ready).length,
    documentsTotal: s.final.length,
    missingData: collectMissingPaths(s.caseData).length,
    inconsistencies: validation.issues.filter((i) => i.severity === 'block').length,
    editedBlocks: Object.values(s.overrides).reduce((n, o) => n + Object.keys(o.blocks ?? {}).length, 0),
  };
}

/** Cuántos de los documentos del paquete dependen de cada dato faltante. */
export function questionImpact(s: Snapshot, questions: Question[]): Record<string, number> {
  const impact = impactByPath(s.generated);
  const out: Record<string, number> = {};
  for (const q of questions) {
    const target = q.impactPath ?? q.targetPath;
    if (!target) { out[q.id] = 0; continue; }
    // Coincidencia por prefijo: "subordinatesForeign" cubre "subordinatesForeign.0.name".
    const docs = new Set<string>();
    for (const [path, ids] of Object.entries(impact)) {
      if (path === target || path.startsWith(`${target}.`) || target.startsWith(`${path}.`)) {
        ids.forEach((id) => docs.add(id));
      }
    }
    out[q.id] = Math.max(docs.size, q.declaredBlocks ?? 0);
  }
  return out;
}

/**
 * Escribe un hecho. Nunca se sobreescribe en silencio: se versiona y queda el historial,
 * con la fecha, el texto original de la respuesta y la fuente documental.
 */
export function writeFact(args: {
  path: string;
  value: unknown;
  status: FieldStatus;
  source: string | null;
  rawAnswer?: string | null;
  currency?: string | null;
}): { caseData: CaseData; previous: unknown } {
  const c = loadCase();
  const existing = getByPath(c, args.path);
  const at = new Date().toISOString();
  let previous: unknown = null;

  if (isField(existing)) {
    previous = existing.value;
    const history = [...(existing.history ?? [])];
    history.push({ at, value: existing.value, status: existing.status, source: existing.source ?? null });
    const next: Field<any> = {
      ...existing,
      value: args.value as any,
      status: args.status,
      source: args.source,
      history,
    };
    if (args.currency !== undefined) next.currency = args.currency;
    setByPath(c, args.path, next);
  } else {
    previous = existing ?? null;
    setByPath(c, args.path, args.value);
  }

  const entry: DecisionLogEntry = {
    id: newId('dec'),
    at,
    path: args.path,
    rawAnswer: args.rawAnswer ?? null,
    extracted: args.value,
    status: args.status,
    source: args.source,
    previous,
  };
  c.decisionLog = [entry, ...(c.decisionLog ?? [])];
  saveCase(c);
  return { caseData: c, previous };
}

/**
 * Normalización de una respuesta en texto libre. Extrae el hecho para que Sarah
 * lo confirme: "Entendí esto: ___. ¿Correcto?". Si no logra extraer nada,
 * devuelve null y la app pregunta de nuevo — nunca adivina.
 */
export function extractAnswer(kind: Question['kind'], raw: string): { value: unknown; currency?: string | null; display: string } | null {
  const text = raw.trim();
  if (!text) return null;

  if (kind === 'date') {
    const iso = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
    if (iso) {
      const v = `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
      return { value: v, display: v };
    }
    const dmy = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/.exec(text);
    if (dmy) {
      const v = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
      return { value: v, display: v };
    }
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const es = new RegExp(`(\\d{1,2})\\s+de\\s+(${meses.join('|')})\\s+de\\s+(\\d{4})`, 'i').exec(text);
    if (es) {
      const mi = meses.indexOf(es[2].toLowerCase()) + 1;
      const v = `${es[3]}-${String(mi).padStart(2, '0')}-${es[1].padStart(2, '0')}`;
      return { value: v, display: v };
    }
    return null;
  }

  if (kind === 'money') {
    const num = /(\d[\d,.\s]*)/.exec(text.replace(/\s/g, ' '));
    if (!num) return null;
    const value = Number(num[1].replace(/[,\s]/g, ''));
    if (!Number.isFinite(value)) return null;
    let currency: string | null = null;
    if (/\b(usd|d[oó]lar|dollars?|us\$)\b/i.test(text)) currency = 'USD';
    else if (/\b(mxn|pesos?|mx\$)\b/i.test(text)) currency = 'MXN';
    return { value, currency, display: `${value.toLocaleString('en-US')}${currency ? ` ${currency}` : ' (moneda sin especificar — hay que decir si son pesos o dólares)'}` };
  }

  if (kind === 'number' || kind === 'percent') {
    const num = /(\d[\d,.]*)/.exec(text);
    if (!num) return null;
    const value = Number(num[1].replace(/,/g, ''));
    if (!Number.isFinite(value)) return null;
    return { value, display: kind === 'percent' ? `${value}%` : String(value) };
  }

  if (kind === 'boolean') {
    if (/\b(s[ií]|yes|correcto|as[ií] es|claro)\b/i.test(text)) return { value: true, display: 'Sí' };
    if (/\b(no|nel|todav[ií]a no|a[uú]n no)\b/i.test(text)) return { value: false, display: 'No' };
    return null;
  }

  return { value: text, display: text };
}
