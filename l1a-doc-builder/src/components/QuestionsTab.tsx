'use client';
import { useEffect, useState } from 'react';
import { api, post, put } from '@/lib/client';
import type { Question } from '@/lib/types';

interface QData { open: Question[]; current: Question | null; impact: Record<string, number>; questions: Question[] }

export function QuestionsTab({ onChanged, goToPeople }: { onChanged: () => void; goToPeople: () => void }) {
  const [data, setData] = useState<QData | null>(null);
  const [raw, setRaw] = useState('');
  const [understood, setUnderstood] = useState<{ display: string; value: unknown; currency: string | null } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [classification, setClassification] = useState<'confirmado' | 'declarado'>('declarado');
  const [source, setSource] = useState('');
  const [proofIdea, setProofIdea] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const d = await api<QData>('/api/questions');
    setData(d);
  };
  useEffect(() => { load().catch((e) => setErr(e.message)); }, []);

  const q = data?.current ?? null;

  const reset = () => {
    setRaw(''); setUnderstood(null); setMessage(null);
    setClassification('declarado'); setSource(''); setProofIdea('');
  };

  const interpret = async () => {
    if (!q) return;
    setErr(null); setBusy(true);
    try {
      const r = await put<{ understood: string | null; value: unknown; currency: string | null; message?: string }>('/api/questions', { questionId: q.id, rawAnswer: raw });
      if (!r.understood) { setUnderstood(null); setMessage(r.message ?? 'No pude extraer el dato.'); }
      else { setUnderstood({ display: r.understood, value: r.value, currency: r.currency }); setMessage(null); }
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const save = async () => {
    if (!q || !understood) return;
    if (classification === 'confirmado' && !source.trim()) {
      setErr('Si el hecho está confirmado, hay que decir qué documento lo prueba.');
      return;
    }
    if (classification === 'declarado' && !proofIdea.trim()) {
      setErr('Es un hecho declarado. ¿Qué papel podría probarlo? Se guarda en el registro de evidencia faltante.');
      return;
    }
    setErr(null); setBusy(true);
    try {
      await post('/api/questions', {
        questionId: q.id, rawAnswer: raw, value: understood.value, currency: understood.currency,
        classification, source: source || null, proofIdea: proofIdea || null,
      });
      reset(); await load(); onChanged();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const skip = async () => {
    if (!q) return;
    setBusy(true);
    try { await post('/api/questions', { questionId: q.id, action: 'dismiss', rawAnswer: '', value: null, classification: 'declarado' }); reset(); await load(); onChanged(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  if (!data) return <div className="card">Cargando…</div>;

  if (!q) {
    return (
      <div className="card question-card">
        <h2>No hay preguntas abiertas</h2>
        <p className="muted">Cuando el validador detecte algo que no cuadre, o cuando falte un dato para un documento, aparecerá aquí una pregunta nueva.</p>
      </div>
    );
  }

  const impact = data.impact[q.id] ?? 0;

  return (
    <div className="question-card">
      {err && <div className="banner err">{err}</div>}
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="pill blue">Bloquea: {q.blocksLabel}</span>
          <span className="muted">{impact > 0 ? `Desbloquea ${impact} documento${impact === 1 ? '' : 's'}` : 'Sin documentos vinculados todavía'} · quedan {data.open.length} preguntas</span>
        </div>
        <p className="q-prompt">{q.prompt}</p>

        <dl className="qgrid">
          <dt>Lo que teníamos</dt><dd>{q.weHad}</dd>
          <dt>Lo que aparece ahora</dt><dd>{q.whatAppearsNow}</dd>
          <dt>Por qué importa</dt><dd>{q.whyItMatters}</dd>
          <dt>Qué documento lo aclararía</dt><dd>{q.clarifyingDocument}</dd>
        </dl>

        {q.searchHint && <div className="hint"><b>Dónde buscarlo:</b> {q.searchHint}</div>}

        {q.kind === 'people' ? (
          <div className="banner info">
            Esta se contesta capturando a las personas, no escribiendo un párrafo. Cada persona genera su propia
            descripción de puesto y entra al organigrama.
            <div className="row" style={{ marginTop: 8 }}>
              <button className="primary" onClick={goToPeople}>Ir a Personas y capturarlas</button>
              <button onClick={skip} disabled={busy}>Ahora no</button>
            </div>
          </div>
        ) : (
        <>
        <label className="muted" htmlFor="answer">Tu respuesta — contesta como hables, yo extraigo el dato</label>
        <textarea id="answer" rows={3} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Escribe aquí…" />

        <div className="row" style={{ marginTop: 10 }}>
          <button className="primary" onClick={interpret} disabled={busy || !raw.trim()}>Entendí esto…</button>
          <button onClick={skip} disabled={busy}>Ahora no</button>
        </div>

        </>
        )}

        {message && <div className="banner info" style={{ marginTop: 12 }}>{message}</div>}

        {understood && (
          <div className="understood">
            <p style={{ marginTop: 0 }}><b>Entendí esto:</b> {understood.display}. ¿Correcto?</p>
            {q.targetPath && <p className="muted" style={{ marginTop: -6 }}>Se guardará en <code>{q.targetPath}</code>.</p>}

            <div className="row" style={{ marginBottom: 8 }}>
              <label className="row" style={{ gap: 6 }}>
                <input type="radio" style={{ width: 'auto' }} checked={classification === 'confirmado'} onChange={() => setClassification('confirmado')} />
                Confirmado — hay un documento que lo prueba
              </label>
              <label className="row" style={{ gap: 6 }}>
                <input type="radio" style={{ width: 'auto' }} checked={classification === 'declarado'} onChange={() => setClassification('declarado')} />
                Declarado — por ahora solo lo digo yo
              </label>
            </div>

            {classification === 'confirmado' ? (
              <>
                <label className="muted">¿Qué documento lo prueba?</label>
                <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ej.: recibo CFDI del 15/03/2025, emisor CHI" />
              </>
            ) : (
              <>
                <label className="muted">¿Qué papel podría probar esto? Va al registro de evidencia faltante.</label>
                <input value={proofIdea} onChange={(e) => setProofIdea(e.target.value)} placeholder="Ej.: contrato laboral firmado con CHI" />
              </>
            )}

            <div className="row" style={{ marginTop: 10 }}>
              <button className="primary" onClick={save} disabled={busy}>Sí, guárdalo</button>
              <button onClick={() => setUnderstood(null)} disabled={busy}>No, lo escribo de nuevo</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Cola de preguntas — priorizadas por cuántos documentos desbloquean</h3>
        <table>
          <thead><tr><th>#</th><th>Pregunta</th><th>Bloquea</th><th>Documentos</th></tr></thead>
          <tbody>
            {data.open.map((x, i) => (
              <tr key={x.id} style={i === 0 ? { background: '#f7fafd' } : undefined}>
                <td>{i + 1}</td><td>{x.prompt}</td><td>{x.blocksLabel}</td><td>{data.impact[x.id] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footnote">Una pregunta a la vez. Se responde, se guarda, aparece la siguiente. Ningún dato se rellena con una suposición plausible.</p>
      </div>
    </div>
  );
}
