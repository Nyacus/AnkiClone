import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Play, Upload, Download, BookOpen, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onStudy: (deckId: number) => void;
  onImport: (deckId?: number) => void;
}

export default function Dashboard({ onStudy, onImport }: Props) {
  const decks = useLiveQuery(() => db.decks.toArray());
  const cards = useLiveQuery(() => db.cards.toArray());

  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  if (!decks || !cards) return <div className="p-12 text-center text-slate-400 font-medium">Cargando tu biblioteca...</div>;

  const getStats = (deckId: number) => {
    const deckCards = cards.filter(c => c.deckId === deckId);
    const now = Date.now();
    const newCards = deckCards.filter(c => c.isNew).length;
    const dueCards = deckCards.filter(c => !c.isNew && c.nextReview <= now).length;
    return { new: newCards, due: dueCards, total: deckCards.length };
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeckName.trim()) {
      await db.decks.add({ name: newDeckName.trim(), createdAt: Date.now() });
      setNewDeckName('');
      setIsCreating(false);
    }
  };

  const handleExport = async (deckId: number) => {
    const deckCards = cards.filter(c => c.deckId === deckId);
    const json = JSON.stringify(deckCards, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deck-${deckId}-export.json`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Mis Mazos</h2>
          <p className="text-slate-400 font-medium">Bienvenido de nuevo. Tienes {decks.length} mazos activos.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => onImport()}
            className="flex items-center gap-2 px-5 py-2.5 glass-dark rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all duration-300 active:scale-95"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-[1.02] transition-all duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nuevo Mazo
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            onSubmit={handleCreateDeck}
            className="glass-dark p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Nombre del mazo</label>
                <input
                  autoFocus
                  type="text"
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                  placeholder="Ej. Vocabulario Italiano"
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={!newDeckName.trim()}
                  className="flex-1 sm:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {decks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 glass-dark rounded-3xl border border-white/5 border-dashed"
        >
          <div className="bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Empieza tu viaje de aprendizaje</h3>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">Crea tu primer mazo de tarjetas o importa uno existente para empezar a estudiar.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors inline-flex items-center gap-2 text-lg"
          >
            <Plus className="w-5 h-5" /> Crear mazo ahora
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {decks.map((deck, idx) => {
            const stats = getStats(deck.id!);
            const canStudy = stats.new > 0 || stats.due > 0;
            return (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative flex flex-col glass-dark p-8 rounded-3xl border border-white/10 shadow-lg hover:bg-slate-800/40 hover:border-indigo-500/30 transition-all duration-500"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform duration-500">
                      <Layers className="w-6 h-6" />
                    </div>
                    <button
                      onClick={() => handleExport(deck.id!)}
                      className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-xl transition-colors"
                      title="Exportar Mazo"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-4 truncate">
                    {deck.name}
                  </h3>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                      <div className="text-xl font-bold text-blue-400 leading-none mb-1">{stats.new}</div>
                      <div className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest text-center">Nuevas</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                      <div className="text-xl font-bold text-orange-400 leading-none mb-1">{stats.due}</div>
                      <div className="text-[10px] font-bold text-orange-400/60 uppercase tracking-widest text-center">Tareas</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="text-xl font-bold text-slate-400 leading-none mb-1">{stats.total}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Total</div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => onStudy(deck.id!)}
                    disabled={!canStudy}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 active:scale-[0.98] ${canStudy
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                  >
                    <Play className={`w-5 h-5 ${canStudy ? 'fill-current' : ''}`} />
                    {canStudy ? 'Empezar Sesión' : 'Todo al día'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
