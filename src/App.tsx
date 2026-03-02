import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Study from './components/Study';
import Import from './components/Import';
import { motion, AnimatePresence } from 'motion/react';
import backgroundImage from './assets/background.png';

type View = 'dashboard' | 'study' | 'import';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [activeDeckId, setActiveDeckId] = useState<number | undefined>();

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-slate-950/40 backdrop-blur-[2px]" />

      <header className="relative z-10 glass-dark border-b border-white/10 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => setView('dashboard')}
            >
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                ValentinANKI
              </h1>
            </div>
            
            <nav className="hidden sm:flex items-center gap-6">
               <button 
                onClick={() => setView('dashboard')}
                className={`text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
               >
                Mis Mazos
               </button>
               <button 
                onClick={() => setView('import')}
                className={`text-sm font-medium transition-colors ${view === 'import' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
               >
                Importar
               </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Dashboard 
                onStudy={(id) => { setActiveDeckId(id); setView('study'); }} 
                onImport={() => setView('import')} 
              />
            </motion.div>
          )}
          {view === 'study' && activeDeckId && (
            <motion.div
              key="study"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, type: 'spring', damping: 25, stiffness: 120 }}
            >
              <Study deckId={activeDeckId} onBack={() => setView('dashboard')} />
            </motion.div>
          )}
          {view === 'import' && (
            <motion.div
              key="import"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Import onBack={() => setView('dashboard')} defaultDeckId={activeDeckId} />
          </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
