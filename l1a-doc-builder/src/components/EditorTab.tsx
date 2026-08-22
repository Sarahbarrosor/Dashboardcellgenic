'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, patch, post } from '@/lib/client';
import type { CaseData, DocumentSpec, OverridesFile, ValidationResult } from '@/lib/types';
import { BlockBody, Letterhead } from './BlockView';
import { IssueList } from './IssueList';

type Doc = DocumentSpec & { stats: { missingCount: number; editedCount: number; ready: boolean } };
const text = (segs: any[] | undefined) => (segs ?? []).map((s) => s.t).join('');

export function EditorTab({ initialDoc, onChanged }: { initialDoc: string | null; onChanged: () => void }) {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [generated, setGenerated] = useState<DocumentSpec[]>([]);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [overrides, setOverrides] = useState<OverridesFile>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [sel, setSel] = useState<string | null>(initialDoc);
  const [editing, setEditing] = useState<{ blockId: string; value: string } | null>(null);
  const [fill, setFill] = useState<{ path: string; label: string } | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [fillSource, setFillSource] = useState('');
  const [propagate, setPropagate] = useState<{ blockId: string; boundField: string; textValue: string } | null>(null);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [compare, setCompare] = useState(false);
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await api<{ documents: Doc[]; generated: DocumentSpec[]; validation: ValidationResult; caseData: CaseData }>('/api/documents');
    setDocs(r.documents); setGenerated(r.generated); setValidation(r.validation); setCaseData(r.caseData);
    setOverrides(await api<OverridesFile>('/api/overrides'));
    if (!sel && r.documents.length) setSel(initialDoc ?? r.documents[0].docId);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (initialDoc) setSel(initialDoc); }, [initialDoc]);

  const doc = useMemo(() => docs?.find((d) => d.docId === sel) ?? null, [docs, sel]);
  const genDoc = useMemo(() => generated.find((d) => d.docId === sel) ?? null, [generated, sel]);

  const refresh = async () => { await load(); onChanged(); };

  const saveEdit = async (askPropagate = true) => {
    if (!editing || !doc) return;
    const block = doc.blocks.find((b) => b.blockId === editing.blockId);
    if (block?.boundField && askPropagate) {
      setPropagate({ blockId: editing.blockId, boundField: block.boundField, textValue: editing.value });
      return;
    }
    setBusy(true); setBanner(null);
    try {
      await post('/api/overrides', { action: 'edit', docId: doc.docId, blockId: editing.blockId, text: editing.value });
      setEditing(null); await refresh();
      setBanner({ kind: 'ok', text: 'Bloque guardado como edición manual. Regenerar no lo va a pisar.' });
    } catch (e: any) { setBanner({ kind: 'err', text: e.message }); } finally { setBusy(false); }
  };

  const doFill = async () => {
    if (!fill) return;
    setBusy(true); setBanner(null);
    try {
      await patch('/api/case/fact', { path: fill.path, value: fillValue, source: fillSource || null, status: fillSource ? 'confirmed' : 'declared' });
      setFill(null); setFillValue(''); setFillSource(''); await refresh();
      setBanner({ kind: 'ok', text: 'Dato guardado en el caso. Desaparece de todos los documentos a la vez, no solo de este.' });
    } catch (e: any) { setBanner({ kind: 'err', text: e.message }); } finally { setBusy(false); }
  };

  const exportAll = async () => {
    setBusy(true); setBanner(null);
    try {
      const r = await post<{ written: any[]; zip: string; outputDir: string }>('/api/export', {});
      setBanner({ kind: 'ok', text: `Exportados ${r.written.length} documentos a ${r.outputDir}. El .zip está listo.` });
      await refresh();
      window.location.href = `/api/download?file=${encodeURIComponent(r.zip)}`;
    } catch (e: any) {
      setBanner({ kind: 'err', text: e.message });
      await refresh();
    } finally { setBusy(false); }
  };

  if (!docs || !caseData) return <div className="card">Cargando…</div>;
  const blocking = validation?.issues.filter((i) => i.severity === 'block') ?? [];

  return (
    <>
      {banner && <div className={`banner ${banner.kind}`}>{banner.text}</div>}

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <input style={{ width: 200 }} value={find} onChange={(e) => setFind(e.target.value)} placeholder="Buscar en todos los documentos" />
            <input style={{ width: 200 }} value={replace} onChange={(e) => setReplace(e.target.value)} placeholder="Reemplazar por" />
            <button disabled={busy || !find} onClick={async () => {
              setBusy(true);
              try {
                const r = await post<{ replacedBlocks: number }>('/api/overrides', { action: 'replaceAll', find, replace });
                setBanner({ kind: 'ok', text: `Reemplazado en ${r.replacedBlocks} bloque(s).` }); await refresh();
              } catch (e: any) { setBanner({ kind: 'err', text: e.message }); } finally { setBusy(false); }
            }}>Reemplazar en todos</button>
            <button onClick={() => setCompare(!compare)}>{compare ? 'Ver solo la versión editada' : 'Comparar generado vs editado'}</button>
          </div>
          <button className="primary big" onClick={exportAll} disabled={busy}>EXPORTAR TODO</button>
        </div>
        {blocking.length > 0 && <p className="muted" style={{ margin: '8px 0 0', color: 'var(--red)' }}>La exportación está bloqueada: {blocking.length} inconsistencia(s). Abajo dice cuál documento y cuál bloque.</p>}
      </div>

      {blocking.length > 0 && (
        <div className="card"><h2>Inconsistencias</h2><IssueList issues={validation!.issues} /></div>
      )}

      <div className="editor">
        <div className="doclist">
          {docs.map((d) => (
            <button key={d.docId} className={sel === d.docId ? 'active' : ''} onClick={() => { setSel(d.docId); setEditing(null); }}>
              <div><b>{d.code}</b> {d.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {d.stats.missingCount > 0 ? `${d.stats.missingCount} [FALTA DATO]` : 'sin huecos'}
                {d.stats.editedCount > 0 ? ` · ${d.stats.editedCount} editado(s)` : ''}
              </div>
            </button>
          ))}
        </div>

        <div>
          {doc && (
            <>
              <div className="card" style={{ marginBottom: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <b>{doc.code} — {doc.title}</b>
                    <div className="muted">{doc.tab} · firma: {doc.signedBy}</div>
                  </div>
                  <div className="row">
                    <button onClick={async () => { await post('/api/overrides', { action: 'undo', docId: doc.docId }).catch((e) => setBanner({ kind: 'err', text: e.message })); refresh(); }}>Deshacer</button>
                    <button onClick={async () => { await post('/api/overrides', { action: 'restore', docId: doc.docId }); refresh(); }}>Restaurar todo desde los datos</button>
                    <button disabled={busy || blocking.length > 0} onClick={async () => {
                      setBusy(true);
                      try {
                        const r = await post<{ written: { file: string }[] }>('/api/export', { docId: doc.docId });
                        window.location.href = `/api/download?file=${encodeURIComponent(r.written[0].file)}`;
                      } catch (e: any) { setBanner({ kind: 'err', text: e.message }); } finally { setBusy(false); }
                    }}>Exportar este .docx</button>
                  </div>
                </div>
              </div>

              <div className="page">
                <Letterhead caseData={caseData} entityKey={doc.blocks.find((b) => b.type === 'letterhead')?.entityKey ?? doc.entityKey} />
                {doc.blocks.filter((b) => b.type !== 'letterhead').map((b) => {
                  const edited = !!overrides[doc.docId]?.blocks?.[b.blockId];
                  const genBlock = genDoc?.blocks.find((g) => g.blockId === b.blockId);
                  const isEditing = editing?.blockId === b.blockId;
                  return (
                    <div key={b.blockId} className={`blk ${edited ? 'edited' : ''} ${b.disabled ? 'muted' : ''}`}>
                      <div className="blk-tools">
                        {edited && <span className="tag-edited">editado a mano</span>}
                        {b.type !== 'table' && b.type !== 'signature' && b.type !== 'pagebreak' && !isEditing && (
                          <button onClick={() => setEditing({ blockId: b.blockId, value: text(b.segs) })}>editar</button>
                        )}
                        {edited && <button onClick={async () => { await post('/api/overrides', { action: 'restore', docId: doc.docId, blockId: b.blockId }); refresh(); }}>restaurar desde los datos</button>}
                        {b.optional && <button onClick={async () => { await post('/api/overrides', { action: 'toggleBlock', docId: doc.docId, blockId: b.blockId }); refresh(); }}>{b.disabled ? 'activar' : 'desactivar'}</button>}
                      </div>

                      {isEditing ? (
                        <div style={{ fontFamily: 'system-ui' }}>
                          <textarea rows={Math.max(3, Math.ceil(editing!.value.length / 90))} value={editing!.value} onChange={(e) => setEditing({ ...editing!, value: e.target.value })} />
                          <div className="row" style={{ marginTop: 6 }}>
                            <button className="primary" onClick={() => saveEdit(true)} disabled={busy}>Guardar bloque</button>
                            <button onClick={() => setEditing(null)}>Cancelar</button>
                            <span className="muted">Los [FALTA DATO] no se pueden borrar aquí: se llenan haciendo click en el hueco amarillo.</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <BlockBody block={b} caseData={caseData} onFill={(m) => { setFill(m); setFillValue(''); setFillSource(''); }} />
                          {compare && edited && genBlock && (
                            <div className="muted" style={{ fontFamily: 'system-ui', background: '#f7f7f5', borderLeft: '3px solid #bbb', padding: '6px 10px', margin: '4px 0 10px' }}>
                              <b>versión generada:</b> {text(genBlock.segs)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {fill && (
        <div className="modal-back" onClick={() => setFill(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Llenar un dato del caso</h2>
            <p className="muted">Falta: <b>{fill.label}</b></p>
            <p className="muted">Se guarda en <code>{fill.path}</code>, no en este documento. Capturado una vez, desaparece de todos los documentos a la vez.</p>
            <label className="muted">El dato</label>
            <input autoFocus value={fillValue} onChange={(e) => setFillValue(e.target.value)} />
            <label className="muted" style={{ marginTop: 8, display: 'block' }}>¿Qué documento lo prueba? (si no hay, queda como declarado)</label>
            <input value={fillSource} onChange={(e) => setFillSource(e.target.value)} />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="primary" onClick={doFill} disabled={busy || !fillValue.trim()}>Guardar en el caso</button>
              <button onClick={() => setFill(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {propagate && (
        <div className="modal-back" onClick={() => setPropagate(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>¿Corregir también el dato del caso?</h2>
            <p className="muted">Este bloque está vinculado a <code>{propagate.boundField}</code>.</p>
            <p>Si dices que sí, se actualiza <code>case-data.json</code> y el cambio se propaga a los demás documentos.
              Si dices que no, el cambio queda solo en este documento y se registra como divergencia deliberada.</p>
            <label className="muted">Valor del dato (déjalo tal cual si el bloque es más largo que el dato)</label>
            <input value={fillValue || ''} onChange={(e) => setFillValue(e.target.value)} placeholder="Nuevo valor del dato" />
            <div className="row" style={{ marginTop: 12 }}>
              <button className="primary" disabled={busy || !fillValue.trim()} onClick={async () => {
                setBusy(true);
                try {
                  await patch('/api/case/fact', { path: propagate.boundField, value: fillValue, status: 'declared', source: null });
                  await post('/api/overrides', { action: 'edit', docId: doc!.docId, blockId: propagate.blockId, text: propagate.textValue });
                  setPropagate(null); setEditing(null); setFillValue(''); await refresh();
                  setBanner({ kind: 'ok', text: 'Dato corregido y propagado al resto de los documentos.' });
                } catch (e: any) { setBanner({ kind: 'err', text: e.message }); } finally { setBusy(false); }
              }}>Sí, corrige el dato del caso</button>
              <button disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                  await post('/api/overrides', { action: 'edit', docId: doc!.docId, blockId: propagate.blockId, text: propagate.textValue, deliberateDivergence: true });
                  setPropagate(null); setEditing(null); await refresh();
                  setBanner({ kind: 'info', text: 'Cambio guardado solo en este documento, registrado como divergencia deliberada.' });
                } catch (e: any) { setBanner({ kind: 'err', text: e.message }); } finally { setBusy(false); }
              }}>No, solo en este documento</button>
              <button onClick={() => setPropagate(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
