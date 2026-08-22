import { NextRequest, NextResponse } from 'next/server';
import { snapshot, topBarStats, writeFact } from '@/lib/service';
import { loadCase } from '@/lib/store';
import { getByPath, isField } from '@/lib/fields';
import type { FieldStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Escribe un hecho puntual (llenado inline de un [FALTA DATO], o respuesta a una pregunta).
 * El dato se guarda en case-data.json, no en el documento: capturado una vez, desaparece
 * de todos los documentos a la vez.
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json() as {
    path: string; value: unknown; status?: FieldStatus; source?: string | null;
    rawAnswer?: string | null; currency?: string | null;
  };
  if (!body.path) return NextResponse.json({ error: 'Falta la ruta del dato.' }, { status: 400 });
  if (body.value === null || body.value === '' || body.value === undefined) {
    return NextResponse.json({ error: 'Un dato no se guarda vacío. Si no lo tienes, déjalo como [FALTA DATO].' }, { status: 400 });
  }

  const c = loadCase();
  if (body.path === 'entities.foreignEmployer.legalName' && c.entities?.foreignEmployer?.locked) {
    return NextResponse.json({
      error: 'La empleadora extranjera está bloqueada. Se escribe en un solo lugar y se propaga a todos los documentos; ningún documento permite teclear su nombre a mano.',
    }, { status: 400 });
  }

  const status: FieldStatus = body.status ?? (body.source ? 'confirmed' : 'declared');
  writeFact({
    path: body.path,
    value: body.value,
    status,
    source: body.source ?? null,
    rawAnswer: body.rawAnswer ?? null,
    currency: body.currency ?? undefined,
  });

  const s = snapshot();
  return NextResponse.json({ caseData: s.caseData, stats: topBarStats(s) });
}

/** Historial de versiones de un hecho. Nunca se sobreescribe en silencio. */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Falta la ruta del dato.' }, { status: 400 });
  const f = getByPath(loadCase(), path);
  return NextResponse.json({ path, history: isField(f) ? f.history ?? [] : [], current: f ?? null });
}
