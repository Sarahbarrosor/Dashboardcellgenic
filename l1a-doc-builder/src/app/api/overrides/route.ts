import { NextRequest, NextResponse } from 'next/server';
import { loadOverrides, saveOverrides } from '@/lib/store';
import { snapshot, topBarStats } from '@/lib/service';
import { segsToText } from '@/lib/docx/blocks';
import type { Seg } from '@/lib/types';

export const dynamic = 'force-dynamic';

const MISSING_RE = /\[FALTA DATO:\s*([^\]]*)\]/g;

/** Reconstruye segmentos desde el texto plano editado, conservando los [FALTA DATO]. */
function parseSegs(text: string, original: Seg[]): Seg[] {
  const byLabel = new Map<string, { path: string; label: string }>();
  for (const s of original) if (s.missing) byLabel.set(s.missing.label, s.missing);

  const out: Seg[] = [];
  let last = 0;
  for (const m of text.matchAll(MISSING_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ t: text.slice(last, idx) });
    const label = m[1].trim();
    out.push({ t: m[0], missing: byLabel.get(label) ?? { path: '', label } });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out.length ? out : [{ t: '' }];
}

export async function GET() {
  return NextResponse.json(loadOverrides());
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    action: 'edit' | 'restore' | 'toggleBlock' | 'reorder' | 'replaceAll' | 'undo';
    docId?: string;
    blockId?: string;
    text?: string;
    deliberateDivergence?: boolean;
    order?: string[];
    find?: string;
    replace?: string;
  };
  const ov = loadOverrides();
  const s = snapshot();

  const gen = (docId: string, blockId: string) =>
    s.generated.find((d) => d.docId === docId)?.blocks.find((b) => b.blockId === blockId);

  if (body.action === 'edit') {
    const { docId, blockId, text } = body;
    if (!docId || !blockId || text === undefined) return NextResponse.json({ error: 'Faltan datos de la edición.' }, { status: 400 });
    const original = gen(docId, blockId);
    if (!original) return NextResponse.json({ error: 'Bloque no encontrado.' }, { status: 404 });

    // No se puede borrar un [FALTA DATO] sin llenarlo: se llena o se queda visible.
    const originalMissing = [...segsToText(original.segs).matchAll(MISSING_RE)].map((m) => m[1].trim());
    const newMissing = [...text.matchAll(MISSING_RE)].map((m) => m[1].trim());
    const deleted = originalMissing.filter((l) => !newMissing.includes(l));
    if (deleted.length) {
      return NextResponse.json({
        error: `No puedes borrar un [FALTA DATO] sin llenarlo. Falta: ${deleted.join('; ')}. Un hueco borrado sin llenar convierte una laguna visible en una afirmación silenciosa. Llénalo desde el propio hueco amarillo y el dato se guarda en el caso.`,
      }, { status: 400 });
    }
    // Nada que parezca una imagen de firma.
    if (/<img|data:image\/|!\[.*\]\(/i.test(text)) {
      return NextResponse.json({ error: 'La app no inserta imágenes de firma ni imágenes incrustadas en documentos destinados a una presentación federal.' }, { status: 400 });
    }

    ov[docId] ??= { blocks: {} };
    ov[docId].history = [...(ov[docId].history ?? []).slice(-19), { at: new Date().toISOString(), blocks: JSON.parse(JSON.stringify(ov[docId].blocks)) }];
    ov[docId].blocks[blockId] = {
      segs: parseSegs(text, original.segs ?? []),
      editedAt: new Date().toISOString(),
      deliberateDivergence: body.deliberateDivergence ?? false,
      originalSegs: original.segs,
    };
    saveOverrides(ov);
  }

  if (body.action === 'restore') {
    const { docId, blockId } = body;
    if (!docId) return NextResponse.json({ error: 'Falta el documento.' }, { status: 400 });
    if (blockId) delete ov[docId]?.blocks?.[blockId];
    else delete ov[docId];
    saveOverrides(ov);
  }

  if (body.action === 'undo') {
    const { docId } = body;
    if (!docId || !ov[docId]?.history?.length) return NextResponse.json({ error: 'No hay nada que deshacer en este documento.' }, { status: 400 });
    const prev = ov[docId].history!.pop()!;
    ov[docId].blocks = prev.blocks;
    saveOverrides(ov);
  }

  if (body.action === 'toggleBlock') {
    const { docId, blockId } = body;
    if (!docId || !blockId) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    ov[docId] ??= { blocks: {} };
    const list = new Set(ov[docId].disabledBlocks ?? []);
    const block = gen(docId, blockId);
    if (block && !block.optional && !list.has(blockId)) {
      return NextResponse.json({ error: 'Solo se pueden desactivar los bloques marcados como opcionales.' }, { status: 400 });
    }
    if (list.has(blockId)) list.delete(blockId); else list.add(blockId);
    ov[docId].disabledBlocks = [...list];
    saveOverrides(ov);
  }

  if (body.action === 'reorder') {
    const { docId, order } = body;
    if (!docId || !order) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    ov[docId] ??= { blocks: {} };
    ov[docId].blockOrder = order;
    saveOverrides(ov);
  }

  // Buscar y reemplazar en todos los documentos a la vez.
  if (body.action === 'replaceAll') {
    const { find, replace } = body;
    if (!find) return NextResponse.json({ error: 'Falta el texto a buscar.' }, { status: 400 });
    if (/FALTA DATO/i.test(find)) {
      return NextResponse.json({ error: 'Los [FALTA DATO] no se quitan con buscar y reemplazar. Se llenan desde el propio hueco amarillo.' }, { status: 400 });
    }
    let count = 0;
    for (const d of s.final) {
      for (const b of d.blocks) {
        const text = segsToText(b.segs);
        if (!b.segs?.length || !text.includes(find)) continue;
        const next = text.split(find).join(replace ?? '');
        const original = gen(d.docId, b.blockId);
        if (!original) continue;
        ov[d.docId] ??= { blocks: {} };
        ov[d.docId].blocks[b.blockId] = {
          segs: parseSegs(next, original.segs ?? []),
          editedAt: new Date().toISOString(),
          originalSegs: original.segs,
        };
        count += 1;
      }
    }
    saveOverrides(ov);
    const after = snapshot();
    return NextResponse.json({ ok: true, replacedBlocks: count, stats: topBarStats(after) });
  }

  const after = snapshot();
  return NextResponse.json({ ok: true, stats: topBarStats(after) });
}
