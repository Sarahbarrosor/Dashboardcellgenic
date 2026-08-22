import { NextRequest, NextResponse } from 'next/server';
import { loadCase, newId, saveCase } from '@/lib/store';
import { EVIDENCE_CHECKLIST, TABS, defaultInventory } from '@/lib/evidence';
import type { EvidenceItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const c = loadCase();
  if (!c.evidenceInventory?.length) {
    c.evidenceInventory = defaultInventory();
    saveCase(c);
  }
  return NextResponse.json({
    checklist: EVIDENCE_CHECKLIST,
    tabs: TABS,
    inventory: c.evidenceInventory,
    missingEvidence: c.missingEvidence ?? [],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as
    | { action: 'setStatus'; id: string; status: EvidenceItem['status']; owner?: string | null; notes?: string | null }
    | { action: 'addMissing'; need: string; why: string; whereToLook: string; alternative: string }
    | { action: 'removeMissing'; id: string };
  const c = loadCase();
  c.evidenceInventory ??= defaultInventory();

  if (body.action === 'setStatus') {
    const item = c.evidenceInventory.find((x) => x.id === body.id);
    if (!item) return NextResponse.json({ error: 'Elemento no encontrado.' }, { status: 404 });
    item.status = body.status;
    if (body.owner !== undefined) item.owner = body.owner;
    if (body.notes !== undefined) item.notes = body.notes;
  }
  if (body.action === 'addMissing') {
    c.missingEvidence = [{ id: newId('miss'), need: body.need, why: body.why, whereToLook: body.whereToLook, alternative: body.alternative, createdAt: new Date().toISOString() }, ...(c.missingEvidence ?? [])];
  }
  if (body.action === 'removeMissing') {
    c.missingEvidence = (c.missingEvidence ?? []).filter((x) => x.id !== body.id);
  }
  saveCase(c);
  return NextResponse.json({ inventory: c.evidenceInventory, missingEvidence: c.missingEvidence ?? [] });
}
