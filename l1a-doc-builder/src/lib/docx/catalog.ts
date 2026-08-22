import type { Block, CaseData, DocumentSpec, OverridesFile, Seg } from '../types';
import { buildGroupA } from './templates/groupA';
import { buildGroupB } from './templates/groupB';
import { buildGroupC } from './templates/groupC';
import { resetBlockIds, segsHaveMissing } from './blocks';
import { fieldValue } from '../fields';

/** Construye los documentos desde los datos del caso. Determinista: mismos datos, mismos blockId. */
export function buildDocuments(c: CaseData): DocumentSpec[] {
  resetBlockIds();
  const a = buildGroupA(c);
  const b = buildGroupB(c);
  const ab = [...a, ...b];
  const cc = buildGroupC(c, ab);
  return [...ab, ...cc];
}

/**
 * Vuelve a resolver los [FALTA DATO] que quedaron congelados dentro de un bloque
 * editado a mano. Un dato capturado una vez desaparece de todos los documentos a la
 * vez, también de los que ya se editaron.
 */
function resolveMissing(segs: Seg[], c: CaseData): Seg[] {
  return segs.map((s) => {
    if (!s.missing?.path) return s;
    const v = fieldValue(c, s.missing.path);
    return v === null ? s : { ...s, t: v, missing: undefined };
  });
}

/**
 * Aplica overrides.json sobre los documentos generados.
 * Regenerar NO pisa los bloques editados a mano.
 */
export function applyOverrides(docs: DocumentSpec[], ov: OverridesFile, c: CaseData): DocumentSpec[] {
  return docs.map((d) => {
    const o = ov[d.docId];
    if (!o) return d;
    let blocks: Block[] = d.blocks.map((bl) => {
      const b = o.blocks?.[bl.blockId];
      if (!b) return bl;
      return { ...bl, segs: resolveMissing(b.segs, c) };
    });
    if (o.disabledBlocks?.length) {
      blocks = blocks.map((bl) => (o.disabledBlocks!.includes(bl.blockId) ? { ...bl, disabled: true } : bl));
    }
    if (o.blockOrder?.length) {
      const idx = new Map(o.blockOrder.map((id, i) => [id, i]));
      blocks = [...blocks].sort((x, y) => (idx.get(x.blockId) ?? 1e9) - (idx.get(y.blockId) ?? 1e9));
    }
    return { ...d, blocks };
  });
}

export interface DocStats {
  docId: string;
  missingCount: number;
  editedCount: number;
  ready: boolean;
}

export function docStats(d: DocumentSpec, ov: OverridesFile): DocStats {
  let missingCount = 0;
  for (const bl of d.blocks) {
    if (bl.disabled) continue;
    if (segsHaveMissing(bl.segs)) missingCount += (bl.segs ?? []).filter((s) => s.missing || s.t.includes('[FALTA DATO:')).length;
    for (const row of bl.rows ?? []) {
      for (const cell of row) {
        missingCount += cell.filter((s) => s.missing || s.t.includes('[FALTA DATO:')).length;
      }
    }
  }
  const editedCount = Object.keys(ov[d.docId]?.blocks ?? {}).length;
  return { docId: d.docId, missingCount, editedCount, ready: missingCount === 0 };
}

/** Cuántos documentos dependen de cada ruta de dato. Ordena la cola de preguntas por impacto. */
export function impactByPath(docs: DocumentSpec[]): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  const add = (path: string, docId: string) => {
    (map[path] ??= new Set()).add(docId);
  };
  for (const d of docs) {
    for (const bl of d.blocks) {
      const segs: Seg[] = [...(bl.segs ?? []), ...(bl.rows ?? []).flat().flat()];
      for (const s of segs) if (s.missing) add(s.missing.path, d.docId);
      if (bl.boundField) add(bl.boundField, d.docId);
    }
  }
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) out[k] = [...v];
  return out;
}
