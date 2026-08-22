'use client';
import { useEffect, useState } from 'react';
import { api, post } from '@/lib/client';
import type { EvidenceItem, MissingEvidenceItem } from '@/lib/types';
import type { ChecklistEntry } from '@/lib/evidence';

export function EvidenceTab({ onChanged }: { onChanged: () => void }) {
  const [data, setData] = useState<{ checklist: ChecklistEntry[]; inventory: EvidenceItem[]; missingEvidence: MissingEvidenceItem[]; tabs: { id: string; name: string }[] } | null>(null);
  const [nw, setNw] = useState({ need: '', why: '', whereToLook: '', alternative: '' });

  const load = async () => setData(await api('/api/evidence'));
  useEffect(() => { load(); }, []);
  const refresh = async () => { await load(); onChanged(); };
  if (!data) return <div className="card">Cargando…</div>;

  const byId = new Map(data.inventory.map((i) => [i.id, i]));

  return (
    <>
      <div className="card">
        <h2>Grupo D — recolección</h2>
        <p className="muted" style={{ marginTop: 0 }}>La app no genera estos documentos; los rastrea. Estado y responsable por cada uno.</p>
        <table>
          <thead><tr><th>Documento</th><th>Pestaña</th><th>Qué prueba</th><th>Estado</th><th>Responsable</th></tr></thead>
          <tbody>
            {data.checklist.map((e) => {
              const item = byId.get(e.id);
              const st = item?.status ?? 'Falta';
              return (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.tab}</td>
                  <td className="muted">{e.proves}</td>
                  <td>
                    <select value={st} onChange={async (ev) => { await post('/api/evidence', { action: 'setStatus', id: e.id, status: ev.target.value }); refresh(); }}>
                      <option>Tengo</option><option>Solicitado</option><option>Falta</option>
                    </select>
                  </td>
                  <td>
                    <input defaultValue={item?.owner ?? ''} placeholder="quién lo consigue"
                      onBlur={async (ev) => { await post('/api/evidence', { action: 'setStatus', id: e.id, status: st, owner: ev.target.value || null }); refresh(); }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Registro de evidencia faltante</h2>
        <p className="muted" style={{ marginTop: 0 }}>Cuatro columnas: qué necesitamos, por qué importa, dónde buscarlo, y qué hacemos si no existe. Si un hecho debilita el caso, se registra tal cual y se busca cómo documentarlo o cómo compensarlo, nunca cómo esconderlo.</p>
        <table>
          <thead><tr><th>Qué necesitamos</th><th>Por qué importa</th><th>Dónde buscarlo</th><th>Alternativa si no existe</th><th></th></tr></thead>
          <tbody>
            {data.checklist.filter((e) => (byId.get(e.id)?.status ?? 'Falta') !== 'Tengo').map((e) => (
              <tr key={e.id}><td>{e.name}</td><td>{e.proves}</td><td>{e.whereToLook}</td><td>{e.alternative}</td><td className="muted">checklist</td></tr>
            ))}
            {data.missingEvidence.map((m) => (
              <tr key={m.id}>
                <td>{m.need}</td><td>{m.why}</td><td>{m.whereToLook}</td><td>{m.alternative}</td>
                <td><button className="danger" onClick={async () => { await post('/api/evidence', { action: 'removeMissing', id: m.id }); refresh(); }}>Quitar</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Agregar algo que falta</h3>
        <div className="grid3">
          <input value={nw.need} onChange={(e) => setNw({ ...nw, need: e.target.value })} placeholder="Qué necesitamos" />
          <input value={nw.why} onChange={(e) => setNw({ ...nw, why: e.target.value })} placeholder="Por qué importa" />
          <input value={nw.whereToLook} onChange={(e) => setNw({ ...nw, whereToLook: e.target.value })} placeholder="Dónde buscarlo" />
          <input value={nw.alternative} onChange={(e) => setNw({ ...nw, alternative: e.target.value })} placeholder="Alternativa si no existe" />
        </div>
        <button className="primary" style={{ marginTop: 8 }} disabled={!nw.need.trim()} onClick={async () => {
          await post('/api/evidence', { action: 'addMissing', ...nw }); setNw({ need: '', why: '', whereToLook: '', alternative: '' }); refresh();
        }}>Agregar</button>
      </div>

      <div className="card">
        <h2>Estructura de pestañas del fólder</h2>
        <table>
          <thead><tr><th>Pestaña</th><th>Qué va adentro</th></tr></thead>
          <tbody>{data.tabs.map((t) => <tr key={t.id}><td><b>{t.id}</b></td><td>{t.name}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
