'use client';
import { useEffect, useState } from 'react';
import { api, post } from '@/lib/client';
import type { DocumentSpec, ValidationResult } from '@/lib/types';
import { IssueList } from './IssueList';

type Doc = DocumentSpec & { stats: { missingCount: number; editedCount: number; ready: boolean } };

export function DocumentsTab({ onChanged, goToEditor }: { onChanged: () => void; goToEditor: (docId: string) => void }) {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await api<{ documents: Doc[]; validation: ValidationResult }>('/api/documents');
    setDocs(r.documents); setValidation(r.validation);
  };
  useEffect(() => { load(); }, []);

  const generateAll = async () => {
    setBusy(true); setMsg(null);
    try {
      await load(); onChanged();
      setMsg('Documentos compuestos en memoria. Abre el Editor para revisarlos, llenar los huecos amarillos y exportar.');
    } finally { setBusy(false); }
  };

  const exportOne = async (docId: string) => {
    setBusy(true); setMsg(null);
    try {
      const r = await post<{ written: { file: string }[] }>('/api/export', { docId });
      setMsg(`Exportado: ${r.written[0].file}`);
      window.location.href = `/api/download?file=${encodeURIComponent(r.written[0].file)}`;
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };

  if (!docs) return <div className="card">Cargando…</div>;
  const blocking = validation?.issues.filter((i) => i.severity === 'block') ?? [];
  const ready = docs.filter((d) => d.stats.ready).length;

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>Catálogo de documentos</h2>
            <p className="muted" style={{ margin: 0 }}>{ready} de {docs.length} sin huecos · {docs.reduce((n, d) => n + d.stats.missingCount, 0)} [FALTA DATO] en total</p>
          </div>
          <button className="primary big" onClick={generateAll} disabled={busy}>GENERAR TODO</button>
        </div>
      </div>

      {msg && <div className="banner ok">{msg}</div>}

      {blocking.length > 0 && (
        <div className="card">
          <h2>El validador bloquea la exportación</h2>
          <IssueList issues={validation!.issues} />
        </div>
      )}

      {(['A', 'B', 'C'] as const).map((g) => (
        <div className="card" key={g}>
          <h2>Grupo {g} — {g === 'A' ? 'Entidad extranjera' : g === 'B' ? 'Entidad estadounidense' : 'Petición'}</h2>
          <div className="grid2">
            {docs.filter((d) => d.group === g).map((d) => (
              <div key={d.docId} style={{ border: '1px solid var(--line)', borderRadius: 6, padding: 12 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <b>{d.code}</b>
                  {d.stats.ready
                    ? <span className="pill green">sin huecos</span>
                    : <span className="pill red">{d.stats.missingCount} [FALTA DATO]</span>}
                </div>
                <p style={{ margin: '4px 0 6px', fontWeight: 600 }}>{d.title}</p>
                <p className="muted" style={{ margin: 0 }}>Se entrega a: {d.deliverTo}</p>
                <p className="muted" style={{ margin: 0 }}>Firma: {d.signedBy}</p>
                <p className="muted" style={{ margin: 0 }}>{d.tab}</p>
                <p className="muted" style={{ margin: '6px 0 0', fontStyle: 'italic' }}>{d.proves}</p>
                <div className="row" style={{ marginTop: 8 }}>
                  {d.stats.editedCount > 0 && <span className="pill amber">{d.stats.editedCount} bloque(s) editado(s) a mano</span>}
                  <button onClick={() => goToEditor(d.docId)}>Abrir en el editor</button>
                  <button onClick={() => exportOne(d.docId)} disabled={busy || blocking.length > 0}>Exportar .docx</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="footnote">
        Todo lo que sale de aquí es un borrador para revisión de la abogada de récord antes de firmarse o presentarse.
        La app organiza y da formato a hechos reales; no acredita hechos ni sustituye asesoría legal.
      </p>
    </>
  );
}
