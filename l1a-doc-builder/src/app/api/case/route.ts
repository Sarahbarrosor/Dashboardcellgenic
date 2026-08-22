import { NextRequest, NextResponse } from 'next/server';
import { loadCase, saveCase } from '@/lib/store';
import { snapshot, topBarStats } from '@/lib/service';
import type { CaseData, Duty } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = snapshot();
  return NextResponse.json({ caseData: s.caseData, stats: topBarStats(s) });
}

/** Rechaza guardar una función sin `howSheDoesIt` o sin `whoExecutes`. */
function checkDuties(list: Duty[] | undefined, label: string): string | null {
  for (const d of list ?? []) {
    if (!d.task) continue;
    if (!d.howSheDoesIt?.trim()) {
      return `${label}: la función "${d.task}" no dice CÓMO se ejerce (qué aprueba, qué firma, qué presupuesto controla, con qué frecuencia). Una viñeta vaga provoca un RFE.`;
    }
    if (!d.whoExecutes?.trim()) {
      return `${label}: la función "${d.task}" no dice QUIÉN ejecuta el trabajo subyacente. Esa es la distinción que decide un L-1A: quien ejecuta el trabajo técnico no es ejecutivo.`;
    }
  }
  return null;
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as CaseData;
  const err = checkDuties(body.sarahDuties, 'Funciones de la beneficiaria')
    ?? checkDuties(body.proposedUSDuties, 'Funciones del puesto propuesto en EE.UU.');
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  // La empleadora extranjera está bloqueada: se escribe en un solo lugar y no se teclea a mano.
  const current = loadCase();
  if (current.entities?.foreignEmployer?.locked) {
    body.entities.foreignEmployer.legalName = current.entities.foreignEmployer.legalName;
    body.entities.foreignEmployer.locked = true;
  }
  saveCase(body);
  const s = snapshot();
  return NextResponse.json({ caseData: s.caseData, stats: topBarStats(s) });
}
