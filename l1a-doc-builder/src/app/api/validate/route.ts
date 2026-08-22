import { NextRequest, NextResponse } from 'next/server';
import { snapshot } from '@/lib/service';
import { runValidation } from '@/lib/validator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { includeText } = await req.json().catch(() => ({ includeText: true })) as { includeText?: boolean };
  const s = snapshot();
  return NextResponse.json(runValidation(s.caseData, s.generated, s.final, s.overrides, includeText !== false));
}
