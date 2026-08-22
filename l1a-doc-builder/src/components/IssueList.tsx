'use client';
import type { ValidationIssue } from '@/lib/types';

export function IssueList({ issues }: { issues: ValidationIssue[] }) {
  if (!issues.length) return <p className="muted">Sin inconsistencias. El validador pasó.</p>;
  return (
    <>
      {issues.map((i) => (
        <div key={i.id} className={`issue ${i.severity === 'warn' ? 'warn' : ''}`}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{i.severity === 'block' ? 'Bloquea la generación' : 'Aviso'}</b>
            <span className="muted">{i.rule}{i.where ? ` · ${i.where}` : ''}</span>
          </div>
          <dl>
            <dt>Hecho previo</dt><dd>{i.previousFact}</dd>
            <dt>Hecho nuevo</dt><dd>{i.newFact}</dd>
            <dt>Por qué importa</dt><dd>{i.whyItMatters}</dd>
            <dt>Qué documento lo aclara</dt><dd>{i.clarifyingDocument}</dd>
          </dl>
        </div>
      ))}
    </>
  );
}
