import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Study from './components/Study';
import Import from './components/Import';

type View = 'dashboard' | 'study' | 'import';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [activeDeckId, setActiveDeckId] = useState<number | undefined>();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-indigo-200">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg cursor-pointer" onClick={() => setView('dashboard')}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold tracking-tight cursor-pointer" onClick={() => setView('dashboard')}>
              ValentinANKI
            </h1>
          </div>
        </div>
      </header>

      <main className="py-8">
        {view === 'dashboard' && (
          <Dashboard 
            onStudy={(id) => { setActiveDeckId(id); setView('study'); }} 
            onImport={() => setView('import')} 
          />
        )}
        {view === 'study' && activeDeckId && (
          <Study deckId={activeDeckId} onBack={() => setView('dashboard')} />
        )}
        {view === 'import' && (
          <Import onBack={() => setView('dashboard')} defaultDeckId={activeDeckId} />
        )}
      </main>
    </div>
  );
}
