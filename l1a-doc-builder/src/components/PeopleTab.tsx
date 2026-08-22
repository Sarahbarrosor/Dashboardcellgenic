'use client';
import { useEffect, useState } from 'react';
import { api, post } from '@/lib/client';
import type { Subordinate } from '@/lib/types';

function SubCard({ sub, list, onChanged }: { sub: Subordinate; list: 'foreign' | 'us'; onChanged: () => void }) {
  const [s, setS] = useState<Subordinate>(sub);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setS(sub), [sub]);

  const total = (s.duties ?? []).reduce((a, d) => a + (d.percentTime ?? 0), 0);
  const save = async () => {
    setErr(null); setBusy(true);
    try { await post('/api/people', { action: 'update', list, id: s.id, data: s }); onChanged(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const remove = async () => { await post('/api/people', { action: 'remove', list, id: s.id }); onChanged(); };

  return (
    <div className="card">
      {err && <div className="banner err">{err}</div>}
      <div className="row">
        <input style={{ flex: 2 }} value={s.name ?? ''} onChange={(e) => setS({ ...s, name: e.target.value })} placeholder="Nombre completo" />
        <input style={{ flex: 2 }} value={s.title ?? ''} onChange={(e) => setS({ ...s, title: e.target.value })} placeholder="Puesto" />
        <input style={{ flex: 2 }} value={s.reportsTo ?? ''} onChange={(e) => setS({ ...s, reportsTo: e.target.value })} placeholder="Reporta a" />
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <input style={{ flex: 2 }} value={s.education ?? ''} onChange={(e) => setS({ ...s, education: e.target.value })} placeholder="Educación / título" />
        <input style={{ flex: 1 }} type="number" value={s.salary ?? ''} onChange={(e) => setS({ ...s, salary: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Salario" />
        <select style={{ flex: '0 0 110px' }} value={s.currency ?? ''} onChange={(e) => setS({ ...s, currency: e.target.value || null })}>
          <option value="">moneda…</option><option value="MXN">MXN</option><option value="USD">USD</option>
        </select>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <label className="row" style={{ gap: 5 }}><input type="checkbox" style={{ width: 'auto' }} checked={s.cvOnFile} onChange={(e) => setS({ ...s, cvOnFile: e.target.checked })} /> CV en archivo</label>
        <label className="row" style={{ gap: 5 }}><input type="checkbox" style={{ width: 'auto' }} checked={s.degreeOnFile} onChange={(e) => setS({ ...s, degreeOnFile: e.target.checked })} /> Título en archivo</label>
        <label className="row" style={{ gap: 5 }}><input type="checkbox" style={{ width: 'auto' }} checked={s.professional === true} onChange={(e) => setS({ ...s, professional: e.target.checked })} /> Puesto profesional</label>
      </div>

      <h3>Funciones y % de tiempo</h3>
      {(s.duties ?? []).map((d, i) => (
        <div className="row" key={i} style={{ marginBottom: 5 }}>
          <input style={{ flex: 3 }} value={d.task ?? ''} onChange={(e) => setS({ ...s, duties: s.duties.map((x, j) => (i === j ? { ...x, task: e.target.value } : x)) })} placeholder="Función" />
          <input style={{ flex: '0 0 120px' }} type="number" value={d.percentTime ?? ''} onChange={(e) => setS({ ...s, duties: s.duties.map((x, j) => (i === j ? { ...x, percentTime: e.target.value === '' ? null : Number(e.target.value) } : x)) })} placeholder="%" />
          <button className="danger" onClick={() => setS({ ...s, duties: s.duties.filter((_, j) => j !== i) })}>×</button>
        </div>
      ))}
      <div className="row">
        <button onClick={() => setS({ ...s, duties: [...(s.duties ?? []), { task: '', percentTime: null }] })}>Agregar función</button>
        {(s.duties ?? []).length > 0 && <span className={`pill ${total === 100 ? 'green' : 'red'}`}>Suma: {total}%</span>}
        <button className="primary" onClick={save} disabled={busy}>Guardar</button>
        <button className="danger" onClick={remove}>Eliminar persona</button>
      </div>
    </div>
  );
}

export function PeopleTab({ onChanged }: { onChanged: () => void }) {
  const [data, setData] = useState<{ foreign: Subordinate[]; us: Subordinate[] } | null>(null);
  const load = async () => setData(await api('/api/people'));
  useEffect(() => { load(); }, []);
  const refresh = async () => { await load(); onChanged(); };
  if (!data) return <div className="card">Cargando…</div>;

  return (
    <>
      <div className="banner info">
        Este es el punto más frágil del expediente. Sin nombres, puestos, CVs, títulos, salarios y descripciones con
        porcentaje de tiempo de la gente que reporta a Sarah en la empleadora extranjera, no hay organigrama, no hay
        tabla de tiempo, y la carta de empleo queda en afirmaciones sin respaldo.
      </div>

      <div className="card">
        <h2>Subordinados directos — empleadora extranjera</h2>
        <p className="muted" style={{ marginTop: 0 }}>Cada persona genera su propia descripción de puesto (.docx) y aparece en el organigrama.</p>
        <button className="primary" onClick={async () => { await post('/api/people', { action: 'add', list: 'foreign' }); refresh(); }}>Agregar persona</button>
      </div>
      {data.foreign.map((s) => <SubCard key={s.id} sub={s} list="foreign" onChanged={refresh} />)}

      <div className="card">
        <h2>Puestos subordinados proyectados — EE.UU.</h2>
        <p className="muted" style={{ marginTop: 0 }}>Los del primer año de la oficina nueva. Alimentan el organigrama proyectado y el Business Plan.</p>
        <button className="primary" onClick={async () => { await post('/api/people', { action: 'add', list: 'us' }); refresh(); }}>Agregar puesto</button>
      </div>
      {data.us.map((s) => <SubCard key={s.id} sub={s} list="us" onChanged={refresh} />)}
    </>
  );
}
