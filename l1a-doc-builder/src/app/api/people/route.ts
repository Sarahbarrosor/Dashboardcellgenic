import { NextRequest, NextResponse } from 'next/server';
import { loadCase, newId, saveCase } from '@/lib/store';
import { snapshot, topBarStats } from '@/lib/service';
import type { Subordinate } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const c = loadCase();
  return NextResponse.json({ foreign: c.subordinatesForeign ?? [], us: c.subordinatesUS ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as
    | { action: 'add'; list: 'foreign' | 'us'; data?: Partial<Subordinate> }
    | { action: 'update'; list: 'foreign' | 'us'; id: string; data: Partial<Subordinate> }
    | { action: 'remove'; list: 'foreign' | 'us'; id: string };
  const c = loadCase();
  const key = body.list === 'foreign' ? 'subordinatesForeign' : 'subordinatesUS';
  c[key] ??= [];

  if (body.action === 'add') {
    const sub: Subordinate = {
      id: newId('sub'),
      name: null, title: null,
      reportsTo: c.beneficiary?.fullName?.value ?? null,
      entityKey: body.list === 'foreign' ? 'foreignEmployer' : 'petitioner',
      salary: null, currency: null, education: null,
      duties: [], cvOnFile: false, degreeOnFile: false, professional: null,
      ...body.data,
    };
    c[key].push(sub);
  }
  if (body.action === 'update') {
    const sub = c[key].find((x) => x.id === body.id);
    if (!sub) return NextResponse.json({ error: 'Persona no encontrada.' }, { status: 404 });
    Object.assign(sub, body.data);
  }
  if (body.action === 'remove') {
    c[key] = c[key].filter((x) => x.id !== body.id);
  }
  saveCase(c);
  const s = snapshot();
  return NextResponse.json({ foreign: c.subordinatesForeign, us: c.subordinatesUS, stats: topBarStats(s) });
}
