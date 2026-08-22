'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { TopBar, type TabId } from '@/components/TopBar';
import { QuestionsTab } from '@/components/QuestionsTab';
import { FactsTab } from '@/components/FactsTab';
import { PeopleTab } from '@/components/PeopleTab';
import { DocumentsTab } from '@/components/DocumentsTab';
import { EditorTab } from '@/components/EditorTab';
import { EvidenceTab } from '@/components/EvidenceTab';
import type { TopBarStats } from '@/lib/service';

export default function Page() {
  const [tab, setTab] = useState<TabId>('preguntas');
  const [stats, setStats] = useState<TopBarStats | null>(null);
  const [editorDoc, setEditorDoc] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refreshStats = useCallback(async () => {
    try { setStats((await api<{ stats: TopBarStats }>('/api/case')).stats); } catch { /* la barra puede esperar */ }
  }, []);
  useEffect(() => { refreshStats(); }, [refreshStats]);

  const changed = useCallback(() => { refreshStats(); setNonce((n) => n + 1); }, [refreshStats]);

  return (
    <div className="app">
      <TopBar stats={stats} tab={tab} onTab={setTab} />
      <main className="main">
        {tab === 'preguntas' && <QuestionsTab key={`q${nonce}`} onChanged={changed} goToPeople={() => setTab('personas')} />}
        {tab === 'hechos' && <FactsTab key={`h${nonce}`} onChanged={changed} />}
        {tab === 'personas' && <PeopleTab key={`p${nonce}`} onChanged={changed} />}
        {tab === 'documentos' && <DocumentsTab key={`d${nonce}`} onChanged={changed} goToEditor={(id) => { setEditorDoc(id); setTab('editor'); }} />}
        {tab === 'editor' && <EditorTab initialDoc={editorDoc} onChanged={changed} />}
        {tab === 'evidencia' && <EvidenceTab key={`e${nonce}`} onChanged={changed} />}
      </main>
    </div>
  );
}
