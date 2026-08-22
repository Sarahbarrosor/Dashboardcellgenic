import type { Block, BlockType, CaseData, Seg } from '../types';
import { fieldValue, formatDateEN, formatDateES, formatNumber, getByPath, isField } from '../fields';

export const MISSING_PREFIX = '[FALTA DATO:';
export const MISSING_RE = /\[FALTA DATO:\s*([^\]]*)\]/g;

export function missingText(label: string): string {
  return `${MISSING_PREFIX} ${label}]`;
}

/** Segmento de texto normal. */
export function S(t: string, opts: Omit<Seg, 't'> = {}): Seg {
  return { t, ...opts };
}

/** ¿Hay algún [FALTA DATO] en estos segmentos? */
export function segsHaveMissing(segs: Seg[] | undefined): boolean {
  if (!segs) return false;
  return segs.some((s) => s.missing || s.t.includes(MISSING_PREFIX));
}

export function segsToText(segs: Seg[] | undefined): string {
  return (segs ?? []).map((s) => s.t).join('');
}

/** Contexto de construcción: da acceso a los datos del caso sin permitir inventarlos. */
export class Ctx {
  constructor(public c: CaseData) {}

  /** Campo: imprime el valor o [FALTA DATO: label] resaltado. NUNCA rellena con supuestos. */
  F(path: string, label: string, opts: Omit<Seg, 't' | 'missing'> = {}): Seg {
    const v = fieldValue(this.c, path);
    if (v === null) return { t: missingText(label), missing: { path, label }, ...opts };
    return { t: v, ...opts };
  }

  /** Campo de fecha, formateado en inglés (documentos de USCIS). */
  FDate(path: string, label: string, opts: Omit<Seg, 't' | 'missing'> = {}): Seg {
    const v = fieldValue(this.c, path);
    if (v === null) return { t: missingText(label), missing: { path, label }, ...opts };
    return { t: formatDateEN(v) ?? v, ...opts };
  }

  FDateES(path: string, label: string, opts: Omit<Seg, 't' | 'missing'> = {}): Seg {
    const v = fieldValue(this.c, path);
    if (v === null) return { t: missingText(label), missing: { path, label }, ...opts };
    return { t: formatDateES(v) ?? v, ...opts };
  }

  /** Campo monetario: importe + moneda. Si falta la moneda, también se marca. */
  FMoney(path: string, label: string): Seg {
    const f = getByPath(this.c, path);
    if (isField(f) && f.value !== null && f.value !== '' && f.status !== 'missing') {
      const amount = typeof f.value === 'number' ? formatNumber(f.value) : String(f.value);
      const cur = f.currency ? ` ${f.currency}` : ` ${missingText('moneda (MXN o USD)')}`;
      return { t: `${amount}${cur}` };
    }
    return { t: missingText(label), missing: { path, label } };
  }

  /** Texto plano de un campo, o null. Para lógica, no para imprimir. */
  raw(path: string): string | null {
    return fieldValue(this.c, path);
  }

  /** Nombre legal de una entidad. Nunca se teclea a mano en una plantilla. */
  entityName(key: string, opts: Omit<Seg, 't' | 'missing'> = {}): Seg {
    return this.F(`entities.${key}.legalName`, `nombre legal de la entidad "${key}"`, opts);
  }
}

let counter = 0;
export function resetBlockIds() {
  counter = 0;
}

function mk(type: BlockType, docId: string, segs: Seg[], extra: Partial<Block> = {}): Block {
  counter += 1;
  return { blockId: `${docId}-b${String(counter).padStart(3, '0')}`, type, segs, ...extra };
}

/** Fábrica de bloques atada a un documento. */
export function blockFactory(docId: string) {
  return {
    letterhead: (entityKey: string) => mk('letterhead', docId, [], { entityKey }),
    title: (...segs: Seg[]) => mk('title', docId, segs),
    subtitle: (...segs: Seg[]) => mk('subtitle', docId, segs),
    date: (...segs: Seg[]) => mk('date', docId, segs),
    heading: (...segs: Seg[]) => mk('heading', docId, segs),
    p: (...segs: Seg[]) => mk('paragraph', docId, segs),
    pb: (boundField: string | null, ...segs: Seg[]) => mk('paragraph', docId, segs, { boundField }),
    bullet: (...segs: Seg[]) => mk('bullet', docId, segs),
    numbered: (...segs: Seg[]) => mk('numbered', docId, segs),
    note: (...segs: Seg[]) => mk('note', docId, segs),
    pagebreak: () => mk('pagebreak', docId, []),
    table: (rows: Seg[][][], header = true) => mk('table', docId, [], { rows, header }),
    signature: (entityKey: string, signerName: string | null, signerTitle: string | null) =>
      mk('signature', docId, [], { entityKey, signerName, signerTitle }),
    optional: (b: Block) => ({ ...b, optional: true }),
  };
}
