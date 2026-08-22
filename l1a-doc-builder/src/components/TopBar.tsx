'use client';
import type { TopBarStats } from '@/lib/service';

const TABS = [
  { id: 'preguntas', label: 'Preguntas' },
  { id: 'hechos', label: 'Hechos' },
  { id: 'personas', label: 'Personas' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'editor', label: 'Editor' },
  { id: 'evidencia', label: 'Evidencia' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export function TopBar({ stats, tab, onTab }: { stats: TopBarStats | null; tab: TabId; onTab: (t: TabId) => void }) {
  return (
    <>
      <div className="topbar">
        <span className="brand">L1A Doc Builder</span>
        <span className="stat">Preguntas abiertas: <b>{stats?.openQuestions ?? '—'}</b></span>
        <span className="stat">Documentos listos: <b>{stats?.documentsReady ?? '—'} de {stats?.documentsTotal ?? '—'}</b></span>
        <span className={`stat ${stats && stats.missingData > 0 ? 'bad' : 'good'}`}>Datos faltantes: <b>{stats?.missingData ?? '—'}</b></span>
        <span className={`stat ${stats && stats.inconsistencies > 0 ? 'bad' : 'good'}`}>Inconsistencias: <b>{stats?.inconsistencies ?? '—'}</b></span>
        <span className="stat">Bloques editados: <b>{stats?.editedBlocks ?? '—'}</b></span>
      </div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => onTab(t.id)}>{t.label}</button>
        ))}
      </nav>
    </>
  );
}
