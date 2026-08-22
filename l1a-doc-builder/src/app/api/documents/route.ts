import { NextResponse } from 'next/server';
import { snapshot, topBarStats } from '@/lib/service';
import { docStats } from '@/lib/docx/catalog';
import { runValidation } from '@/lib/validator';

export const dynamic = 'force-dynamic';

/** GENERAR TODO: corre el validador y compone todos los documentos en memoria. No descarga nada. */
export async function GET() {
  const s = snapshot();
  const validation = runValidation(s.caseData, s.generated, s.final, s.overrides, true);
  return NextResponse.json({
    documents: s.final.map((d) => ({ ...d, stats: docStats(d, s.overrides) })),
    generated: s.generated,
    validation,
    stats: topBarStats(s),
    caseData: s.caseData,
  });
}
