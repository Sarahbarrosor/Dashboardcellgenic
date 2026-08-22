'use client';
import { useEffect, useState } from 'react';
import { api, put } from '@/lib/client';
import { FieldRow } from './FieldRow';
import type { CaseData, Duty, Field } from '@/lib/types';

const isField = (x: any): x is Field<any> => x != null && typeof x === 'object' && 'value' in x && 'status' in x;

const LABELS: Record<string, string> = {
  fullName: 'Nombre completo', dob: 'Fecha de nacimiento (AAAA-MM-DD)', nationality: 'Nacionalidad',
  mexicanStatus: 'Estatus en México', employmentStartDate: 'Fecha de inicio de empleo (AAAA-MM-DD)',
  currentTitle: 'Puesto actual', currentSalary: 'Salario actual', workLocation: 'Ubicación física de trabajo',
  proposedTitle: 'Puesto propuesto en EE.UU.', proposedSalary: 'Salario propuesto en EE.UU.',
  education: 'Educación', imssRegistered: 'Alta en el IMSS', mexicanPassport: 'Pasaporte mexicano',
  legalName: 'Razón social', state: 'Estado de constitución', incDate: 'Fecha de constitución (AAAA-MM-DD)',
  ein: 'EIN', rfc: 'RFC', actaConstitutiva: 'Acta constitutiva', notario: 'Notario', cofepris: 'Licencia COFEPRIS',
  address: 'Domicilio (membrete)', phone: 'Teléfono (membrete)', city: 'Ciudad',
  employeeCount: 'Número de empleados', annualRevenue: 'Ingresos anuales',
  operatingAgreementEffectiveDate: 'Vigencia del Operating Agreement (AAAA-MM-DD)',
  leaseSigned: 'Arrendamiento firmado', leaseHolder: 'Titular del arrendamiento',
  squareFeet: 'Superficie (pies cuadrados)', monthlyRent: 'Renta mensual',
  filingDate: 'Fecha de presentación prevista (AAAA-MM-DD)', startupCapital: 'Capital comprometido',
  name: 'Nombre', title: 'Cargo',
};
const lbl = (k: string) => LABELS[k] ?? k;

function Section({ title, obj, prefix, locked, onSaved, note }: {
  title: string; obj: Record<string, any>; prefix: string; locked?: (k: string) => boolean; onSaved: () => void; note?: string;
}) {
  const entries = Object.entries(obj).filter(([, v]) => isField(v));
  if (!entries.length) return null;
  return (
    <div className="card">
      <h2>{title}</h2>
      {note && <p className="muted" style={{ marginTop: 0 }}>{note}</p>}
      {entries.map(([k, v]) => (
        <FieldRow key={k} label={lbl(k)} path={`${prefix}.${k}`} field={v as Field<any>} locked={locked?.(k)} onSaved={onSaved} />
      ))}
    </div>
  );
}

function DutiesEditor({ title, list, listKey, caseData, onSaved, subject }: {
  title: string; list: Duty[]; listKey: 'sarahDuties' | 'proposedUSDuties'; caseData: CaseData; onSaved: () => void; subject: string;
}) {
  const [rows, setRows] = useState<Duty[]>(list);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setRows(list), [list]);

  const total = rows.reduce((s, d) => s + (d.percentTime ?? 0), 0);
  const upd = (i: number, patchObj: Partial<Duty>) => setRows(rows.map((r, j) => (i === j ? { ...r, ...patchObj } : r)));
  const add = () => setRows([...rows, { id: `duty-${Date.now()}-${rows.length}`, task: '', percentTime: null, howSheDoesIt: '', whoExecutes: '', evidence: '' }]);

  const save = async () => {
    setErr(null); setBusy(true);
    try {
      await put('/api/case', { ...caseData, [listKey]: rows });
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Cada función exige cuatro campos. La app rechaza guardar si falta <b>cómo</b> o <b>quién ejecuta</b>:
        quien ejecuta el trabajo técnico no es ejecutivo; quien decide, aprueba, presupuesta, contrata y responde por el resultado, sí.
      </p>
      {err && <div className="banner err">{err}</div>}
      {rows.map((d, i) => (
        <div key={d.id} style={{ border: '1px solid var(--line)', borderRadius: 6, padding: 10, marginBottom: 10 }}>
          <div className="row">
            <input style={{ flex: 3 }} value={d.task ?? ''} onChange={(e) => upd(i, { task: e.target.value })} placeholder="Función — qué hace" />
            <input style={{ flex: '0 0 130px' }} type="number" value={d.percentTime ?? ''} onChange={(e) => upd(i, { percentTime: e.target.value === '' ? null : Number(e.target.value) })} placeholder="% de tiempo" />
            <button className="danger" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Quitar</button>
          </div>
          <textarea rows={2} style={{ marginTop: 6 }} value={d.howSheDoesIt ?? ''} onChange={(e) => upd(i, { howSheDoesIt: e.target.value })}
            placeholder={`Cómo ${subject} ejerce esta función en concreto: qué aprueba, qué firma, qué presupuesto controla, con qué frecuencia, sobre qué monto, en qué junta`} />
          <textarea rows={2} style={{ marginTop: 6 }} value={d.whoExecutes ?? ''} onChange={(e) => upd(i, { whoExecutes: e.target.value })}
            placeholder="Quién ejecuta el trabajo subyacente — nombre y puesto de quien hace el trabajo técnico" />
          <input style={{ marginTop: 6 }} value={d.evidence ?? ''} onChange={(e) => upd(i, { evidence: e.target.value })} placeholder="Evidencia que lo respalda (correo, minuta, orden de compra…)" />
        </div>
      ))}
      <div className="row">
        <button onClick={add}>Agregar función</button>
        <span className={`pill ${total === 100 ? 'green' : 'red'}`}>Suma: {total}% {total === 100 ? '' : '— debe dar 100 exacto'}</span>
        <button className="primary" onClick={save} disabled={busy}>Guardar funciones</button>
      </div>
    </div>
  );
}

export function FactsTab({ onChanged }: { onChanged: () => void }) {
  const [c, setC] = useState<CaseData | null>(null);
  const load = async () => setC((await api<{ caseData: CaseData }>('/api/case')).caseData);
  useEffect(() => { load(); }, []);
  const refresh = async () => { await load(); onChanged(); };
  if (!c) return <div className="card">Cargando…</div>;

  return (
    <>
      <div className="banner info">
        Semáforo por campo: <span className="pill green">confirmado</span> hay documento que lo prueba ·
        <span className="pill amber" style={{ marginLeft: 6 }}>declarado</span> solo lo dice Sarah ·
        <span className="pill red" style={{ marginLeft: 6 }}>falta</span> sale como [FALTA DATO] en amarillo en todos los documentos.
        Nada se sobreescribe en silencio: cada cambio se versiona y queda el historial.
      </div>

      <Section title="Caso" obj={c.meta as any} prefix="meta" onSaved={refresh} />
      <Section title="Beneficiaria" obj={c.beneficiary} prefix="beneficiary" onSaved={refresh} />

      {Object.entries(c.entities ?? {}).map(([key, e]) => (
        <Section
          key={key}
          title={`${(e.legalName as any)?.value ?? key} — ${e.role}`}
          obj={e as any}
          prefix={`entities.${key}`}
          locked={e.locked ? (k) => k === 'legalName' : undefined}
          onSaved={refresh}
          note={key === 'foreignEmployer' ? 'La empleadora extranjera está fijada. Se escribe aquí y se propaga a todos los documentos; ningún documento permite teclearla a mano.' : undefined}
        />
      ))}

      {Object.entries(c.people ?? {}).map(([key, p]) => (
        <Section key={key} title={`Firmante — ${key === 'signerUS' ? 'peticionaria (EE.UU.)' : 'empleadora extranjera'}`} obj={p as any} prefix={`people.${key}`} onSaved={refresh} />
      ))}

      <Section title="Oficina nueva (EE.UU.)" obj={c.usOffice} prefix="usOffice" onSaved={refresh} />
      <Section title="Business Plan" obj={c.businessPlan as any} prefix="businessPlan" onSaved={refresh} />

      <div className="card">
        <h2>Cadena de propiedad</h2>
        <table>
          <thead><tr><th>Propietaria</th><th>Participada</th><th>%</th><th>Prueba</th><th>Estado</th></tr></thead>
          <tbody>
            {(c.ownershipChain ?? []).map((o, i) => (
              <tr key={o.id}>
                <td>{o.owner}</td><td>{o.owned}</td>
                <td>
                  <input type="number" defaultValue={o.percent ?? ''} placeholder="[FALTA DATO]"
                    onBlur={async (e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value);
                      const next = { ...c, ownershipChain: c.ownershipChain.map((x, j) => (i === j ? { ...x, percent: v, status: v == null ? 'missing' as const : 'declared' as const } : x)) };
                      await put('/api/case', next); refresh();
                    }} />
                </td>
                <td>{o.proof ?? '—'}</td>
                <td><span className={`pill ${o.status === 'confirmed' ? 'green' : o.status === 'declared' ? 'amber' : 'red'}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footnote">No declarar 100% de participación sobre la empleadora extranjera sin haber visto el libro de accionistas. Bajo ley mexicana una S.A. de C.V. típicamente requiere dos o más accionistas; si hay un segundo, hay que identificarlo y explicar cómo se conserva el control.</p>
      </div>

      <DutiesEditor title="Funciones de la beneficiaria en el extranjero" list={c.sarahDuties ?? []} listKey="sarahDuties" caseData={c} onSaved={refresh} subject="ella" />
      <DutiesEditor title="Funciones del puesto propuesto en EE.UU." list={c.proposedUSDuties ?? []} listKey="proposedUSDuties" caseData={c} onSaved={refresh} subject="ella" />

      <div className="card">
        <h2>Teorías en juego</h2>
        <table>
          <thead><tr><th>Teoría</th><th>Estado</th><th>Hechos que la apoyan</th><th>Hechos que la debilitan</th><th>Evidencia faltante</th></tr></thead>
          <tbody>
            {(c.theories ?? []).map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td><td>{t.state}</td>
                <td>{t.supportingFacts.join('; ') || '—'}</td>
                <td>{t.weakeningFacts.join('; ') || '—'}</td>
                <td>{t.missingEvidence.join('; ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Registro de decisiones</h2>
        <p className="muted" style={{ marginTop: 0 }}>Cada respuesta queda con fecha, texto original, hecho extraído y fuente documental.</p>
        <table>
          <thead><tr><th>Fecha</th><th>Dato</th><th>Antes</th><th>Ahora</th><th>Estado</th><th>Fuente</th><th>Texto original</th></tr></thead>
          <tbody>
            {(c.decisionLog ?? []).slice(0, 40).map((d) => (
              <tr key={d.id}>
                <td>{new Date(d.at).toLocaleString('es-MX')}</td>
                <td><code>{d.path}</code></td>
                <td>{String(d.previous ?? '—')}</td>
                <td>{String(d.extracted ?? '—')}</td>
                <td>{d.status}</td>
                <td>{d.source ?? '—'}</td>
                <td>{d.rawAnswer ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
