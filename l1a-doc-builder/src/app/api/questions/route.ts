import { NextRequest, NextResponse } from 'next/server';
import { loadQuestions, newId, saveQuestions } from '@/lib/store';
import { extractAnswer, questionImpact, snapshot, topBarStats, writeFact } from '@/lib/service';
import type { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = snapshot();
  const qf = loadQuestions();
  const impact = questionImpact(s, qf.questions);
  // Priorizadas por impacto: primero lo que bloquea más documentos.
  const open = qf.questions
    .filter((q) => q.status === 'open')
    .sort((a, b) => (impact[b.id] ?? 0) - (impact[a.id] ?? 0) || a.order - b.order);
  // Empates: se respeta el orden del levantamiento del caso.
  return NextResponse.json({
    questions: qf.questions,
    open,
    current: open[0] ?? null,
    impact,
    stats: topBarStats(s),
  });
}

/** Paso 1: proponer la normalización para que Sarah confirme antes de guardar. */
export async function PUT(req: NextRequest) {
  const { questionId, rawAnswer } = await req.json() as { questionId: string; rawAnswer: string };
  const q = loadQuestions().questions.find((x) => x.id === questionId);
  if (!q) return NextResponse.json({ error: 'Pregunta no encontrada.' }, { status: 404 });
  const parsed = extractAnswer(q.kind, rawAnswer ?? '');
  if (!parsed) {
    return NextResponse.json({
      understood: null,
      message: 'No logré extraer el dato de esa respuesta, y no lo voy a adivinar. ¿Me lo puedes decir de otra forma?',
    });
  }
  return NextResponse.json({ understood: parsed.display, value: parsed.value, currency: parsed.currency ?? null });
}

/** Paso 2: guardar la respuesta ya confirmada, clasificada como confirmada o declarada. */
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    questionId: string;
    rawAnswer: string;
    value: unknown;
    currency?: string | null;
    classification: 'confirmado' | 'declarado';
    source?: string | null;
    /** Si es declarado: qué papel podría probarlo. Va al registro de evidencia faltante. */
    proofIdea?: string | null;
    action?: 'answer' | 'dismiss';
  };
  const qf = loadQuestions();
  const q = qf.questions.find((x) => x.id === body.questionId);
  if (!q) return NextResponse.json({ error: 'Pregunta no encontrada.' }, { status: 404 });

  if (body.action === 'dismiss') {
    q.status = 'dismissed';
    saveQuestions(qf);
    return NextResponse.json({ ok: true });
  }

  if (q.targetPath && body.value !== null && body.value !== undefined && body.value !== '') {
    writeFact({
      path: q.targetPath,
      value: body.value,
      status: body.classification === 'confirmado' ? 'confirmed' : 'declared',
      source: body.classification === 'confirmado' ? (body.source ?? null) : null,
      rawAnswer: body.rawAnswer,
      currency: body.currency ?? undefined,
    });
  }

  // Un hecho declarado sin papel que lo pruebe entra al registro de evidencia faltante.
  if (body.classification === 'declarado' && body.proofIdea) {
    const { loadCase, saveCase } = await import('@/lib/store');
    const c = loadCase();
    c.missingEvidence = [
      {
        id: newId('miss'),
        need: body.proofIdea,
        why: q.whyItMatters,
        whereToLook: q.searchHint ?? 'Por definir con Sarah.',
        alternative: 'Por definir. Si no existe el documento, hay que decidir con qué se compensa — no se esconde.',
        createdAt: new Date().toISOString(),
      },
      ...(c.missingEvidence ?? []),
    ];
    saveCase(c);
  }

  q.status = 'answered';
  q.answeredAt = new Date().toISOString();
  q.rawAnswer = body.rawAnswer;
  saveQuestions(qf);

  const s = snapshot();
  return NextResponse.json({ ok: true, stats: topBarStats(s) });
}

/** Alta de una pregunta nueva (por ejemplo, generada por el validador). */
export async function PATCH(req: NextRequest) {
  const body = await req.json() as Partial<Question> & { prompt: string };
  const qf = loadQuestions();
  const q: Question = {
    id: newId('q'),
    order: qf.questions.length + 1,
    prompt: body.prompt,
    weHad: body.weHad ?? '—',
    whatAppearsNow: body.whatAppearsNow ?? '—',
    whyItMatters: body.whyItMatters ?? '—',
    clarifyingDocument: body.clarifyingDocument ?? '—',
    searchHint: body.searchHint,
    targetPath: body.targetPath ?? null,
    kind: body.kind ?? 'text',
    blocksLabel: body.blocksLabel ?? '—',
    status: 'open',
    generatedBy: 'validator',
  };
  qf.questions.push(q);
  saveQuestions(qf);
  return NextResponse.json({ ok: true, question: q });
}
