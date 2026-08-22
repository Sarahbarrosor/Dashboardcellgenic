import type { CaseData, Field, FieldStatus } from './types';

/** Lee cualquier ruta con notación de puntos e índices: "subordinatesForeign.0.name". */
export function getByPath(obj: any, dotted: string): any {
  return dotted.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setByPath(obj: any, dotted: string, value: any): void {
  const parts = dotted.split('.');
  const last = parts.pop() as string;
  let cur = obj;
  for (const p of parts) {
    if (cur[p] == null) cur[p] = /^\d+$/.test(p) ? [] : {};
    cur = cur[p];
  }
  cur[last] = value;
}

export function isField(x: any): x is Field<any> {
  return x != null && typeof x === 'object' && 'value' in x && 'status' in x;
}

/** Valor imprimible de un campo, o null si falta. Nunca inventa ni rellena. */
export function fieldValue(caseData: CaseData, path: string): string | null {
  const f = getByPath(caseData, path);
  if (isField(f)) {
    if (f.value === null || f.value === undefined || f.value === '') return null;
    if (f.status === 'missing') return null;
    if (typeof f.value === 'boolean') return f.value ? 'Sí' : 'No';
    if (typeof f.value === 'number' && f.currency) return `${formatNumber(f.value)} ${f.currency}`;
    return String(f.value);
  }
  if (f === null || f === undefined || f === '') return null;
  return String(f);
}

export function fieldStatus(caseData: CaseData, path: string): FieldStatus {
  const f = getByPath(caseData, path);
  if (isField(f)) return f.status;
  return f === null || f === undefined || f === '' ? 'missing' : 'declared';
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Fecha en formato de carta en inglés: "March 4, 2026". Nunca inventa fechas. */
export function formatDateEN(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

export function formatDateES(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${Number(m[3])} de ${meses[Number(m[2]) - 1]} de ${m[1]}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Recorre case-data y devuelve todas las rutas de Field con status missing. */
export function collectMissingPaths(caseData: CaseData): string[] {
  const out: string[] = [];
  const walk = (node: any, prefix: string) => {
    if (node == null || typeof node !== 'object') return;
    if (isField(node)) {
      if (node.status === 'missing' || node.value === null || node.value === '') out.push(prefix);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      walk(v, prefix ? `${prefix}.${k}` : k);
    }
  };
  walk(caseData, '');
  return out;
}
