'use client';
import { useState } from 'react';
import { api, patch } from '@/lib/client';
import type { Field, FieldVersion } from '@/lib/types';

const LIGHT = { confirmed: 'green', declared: 'amber', missing: 'red' } as const;
const LABEL = { confirmed: 'confirmado', declared: 'declarado', missing: 'falta' } as const;

export function FieldRow({ label, path, field, locked, onSaved }: {
  label: string; path: string; field: Field<any>; locked?: boolean; onSaved: () => void;
}) {
  const [value, setValue] = useState(field.value == null ? '' : String(field.value));
  const [currency, setCurrency] = useState(field.currency ?? '');
  const [source, setSource] = useState(field.source ?? '');
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<FieldVersion[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isMoney = field.currency !== undefined;
  const dirty = String(field.value ?? '') !== value || (field.source ?? '') !== source || (field.currency ?? '') !== currency;

  const save = async () => {
    setErr(null); setBusy(true);
    try {
      const num = isMoney && value.trim() !== '' && Number.isFinite(Number(value.replace(/,/g, ''))) ? Number(value.replace(/,/g, '')) : value;
      await patch('/api/case/fact', {
        path, value: num,
        status: source.trim() ? 'confirmed' : 'declared',
        source: source.trim() || null,
        currency: isMoney ? (currency || null) : undefined,
      });
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const showHistory = async () => {
    setOpen(!open);
    if (!history) {
      const r = await api<{ history: FieldVersion[] }>(`/api/case/fact?path=${encodeURIComponent(path)}`);
      setHistory(r.history);
    }
  };

  return (
    <div style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</label>
        <span className="row" style={{ gap: 6 }}>
          <span className={`pill ${LIGHT[field.status]}`}>{LABEL[field.status]}</span>
          <button className="ghost" onClick={showHistory}>historial ({field.history?.length ?? 0})</button>
        </span>
      </div>
      <div className="row">
        <input
          value={value}
          disabled={locked}
          onChange={(e) => setValue(e.target.value)}
          placeholder={field.value == null ? '[FALTA DATO] — se queda visible hasta que se llene' : ''}
          style={{ flex: 3, minWidth: 180, background: locked ? '#f4f3f0' : undefined }}
        />
        {isMoney && (
          <select value={currency} disabled={locked} onChange={(e) => setCurrency(e.target.value)} style={{ flex: '0 0 110px' }}>
            <option value="">moneda…</option><option value="MXN">MXN</option><option value="USD">USD</option>
          </select>
        )}
        <input value={source} disabled={locked} onChange={(e) => setSource(e.target.value)} placeholder="documento que lo prueba (si lo hay)" style={{ flex: 2, minWidth: 180 }} />
        <button className="primary" onClick={save} disabled={locked || busy || !dirty || !value.trim()}>Guardar</button>
      </div>
      {locked && <p className="muted" style={{ margin: '4px 0 0' }}>Bloqueado: se escribe en un solo lugar y se propaga a todos los documentos.</p>}
      {err && <p className="muted" style={{ color: 'var(--red)', margin: '4px 0 0' }}>{err}</p>}
      {open && (
        <div className="muted" style={{ marginTop: 6, paddingLeft: 10, borderLeft: '2px solid var(--line)' }}>
          {(history ?? []).length === 0 ? <p style={{ margin: 0 }}>Sin versiones anteriores.</p> : (history ?? []).map((h, i) => (
            <p key={i} style={{ margin: '2px 0' }}>{new Date(h.at).toLocaleString('es-MX')} — “{String(h.value ?? '(vacío)')}” · {h.status}{h.source ? ` · fuente: ${h.source}` : ''}</p>
          ))}
        </div>
      )}
    </div>
  );
}
