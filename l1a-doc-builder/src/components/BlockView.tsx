'use client';
import type { Block, CaseData, Seg } from '@/lib/types';

const MISSING_RE = /(\[FALTA DATO:[^\]]*\])/g;

/** Pinta los segmentos; cada [FALTA DATO] es un campo amarillo clickeable. */
export function Segs({ segs, onFill }: { segs: Seg[] | undefined; onFill?: (m: { path: string; label: string }) => void }) {
  return (
    <>
      {(segs ?? []).map((s, i) => {
        if (s.missing || s.t.includes('[FALTA DATO:')) {
          const label = s.missing?.label ?? s.t.replace(/^\[FALTA DATO:\s*/, '').replace(/\]$/, '');
          const path = s.missing?.path ?? '';
          return (
            <mark
              key={i}
              className="miss"
              title={path ? `Llenar ${path}` : 'Dato faltante'}
              onClick={() => path && onFill?.({ path, label })}
            >{s.t}</mark>
          );
        }
        const style = { fontWeight: s.b ? 700 : undefined, fontStyle: s.i ? 'italic' as const : undefined, textDecoration: s.u ? 'underline' : undefined };
        return <span key={i} style={style}>{s.t}</span>;
      })}
    </>
  );
}

export function Letterhead({ caseData, entityKey }: { caseData: CaseData; entityKey?: string | null }) {
  if (!entityKey || entityKey === 'none') return null;
  if (entityKey === 'bank') {
    return <div className="lh"><mark className="miss">[MEMBRETE DEL BANCO — este borrador lo emite el banco en su propio papel]</mark></div>;
  }
  const e: any = (caseData.entities as any)?.[entityKey];
  const g = (k: string) => e?.[k]?.value ?? null;
  return (
    <div className="lh">
      <div className="name">{g('legalName') ?? <mark className="miss">[FALTA DATO: razón social]</mark>}</div>
      <div className="sub">{g('address') ?? <mark className="miss">[FALTA DATO: domicilio de la entidad para el membrete]</mark>}</div>
      <div className="sub">{g('phone') ? `Tel. ${g('phone')}` : <mark className="miss">[FALTA DATO: teléfono de la entidad para el membrete]</mark>}</div>
    </div>
  );
}

export function BlockBody({ block, caseData, onFill }: { block: Block; caseData: CaseData; onFill?: (m: { path: string; label: string }) => void }) {
  const S = <Segs segs={block.segs} onFill={onFill} />;
  switch (block.type) {
    case 'letterhead': return <Letterhead caseData={caseData} entityKey={block.entityKey} />;
    case 'title': return <div className="b-title">{S}</div>;
    case 'subtitle': return <div className="b-subtitle">{S}</div>;
    case 'heading': return <div className="b-heading">{S}</div>;
    case 'note': return <p className="b-note">{S}</p>;
    case 'bullet': return <p style={{ paddingLeft: 22 }}>• {S}</p>;
    case 'numbered': return <p style={{ paddingLeft: 22 }}>{S}</p>;
    case 'pagebreak': return <hr style={{ border: 0, borderTop: '1px dashed #bbb', margin: '18px 0' }} />;
    case 'table':
      return (
        <table>
          <tbody>
            {(block.rows ?? []).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => ri === 0 && block.header !== false
                  ? <th key={ci}><Segs segs={cell} onFill={onFill} /></th>
                  : <td key={ci}><Segs segs={cell} onFill={onFill} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'signature': {
      const entity: any = block.entityKey && block.entityKey !== 'none' && block.entityKey !== 'bank'
        ? (caseData.entities as any)?.[block.entityKey] : null;
      return (
        <div className="b-sig">
          {'\n'}_______________________________________{'\n'}
          <b>{block.signerName ?? <mark className="miss">[FALTA DATO: nombre de quien firma]</mark>}</b>{'\n'}
          {block.signerTitle ?? (block.signerTitle === null ? '' : <mark className="miss">[FALTA DATO: cargo de quien firma]</mark>)}{'\n'}
          {entity?.legalName?.value ?? ''}{'\n'}
          Date: _______________________
        </div>
      );
    }
    default: return <p>{S}</p>;
  }
}
