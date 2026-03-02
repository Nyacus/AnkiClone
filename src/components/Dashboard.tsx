import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Play, Upload, Download } from 'lucide-react';

interface Props {
  onStudy: (deckId: number) => void;
  onImport: (deckId?: number) => void;
}

export default function Dashboard({ onStudy, onImport }: Props) {
  const decks = useLiveQuery(() => db.decks.toArray());
  const cards = useLiveQuery(() => db.cards.toArray());
  
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');

  if (!decks || !cards) return <div className="p-8 text-center text-stone-500">Cargando...</div>;

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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Mis Mazos</h1>
        <div className="flex gap-3">
          <button onClick={() => onImport()} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50">
            <Upload className="w-4 h-4" /> Importar
          </button>
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Nuevo Mazo
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateDeck} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-stone-700 mb-2">Nombre del mazo</label>
            <input 
              autoFocus
              type="text" 
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
              className="w-full p-3 border border-stone-200 rounded-lg bg-stone-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej. Inglés B2"
            />
          </div>
          <button type="submit" disabled={!newDeckName.trim()} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            Crear
          </button>
          <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 bg-stone-100 text-stone-600 rounded-lg font-medium hover:bg-stone-200">
            Cancelar
          </button>
        </form>
      )}

      {decks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-stone-500 mb-4">No tienes ningún mazo todavía.</p>
          <button onClick={() => setIsCreating(true)} className="text-indigo-600 font-medium hover:underline">Crear tu primer mazo</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {decks.map(deck => {
            const stats = getStats(deck.id!);
            const canStudy = stats.new > 0 || stats.due > 0;
            return (
              <div key={deck.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">{deck.name}</h2>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-blue-600 font-medium">{stats.new} nuevas</span>
                    <span className="text-orange-600 font-medium">{stats.due} para repasar</span>
                    <span className="text-stone-500">{stats.total} total</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleExport(deck.id!)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full" title="Exportar JSON">
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onStudy(deck.id!)}
                    disabled={!canStudy}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${canStudy ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-stone-100 text-stone-400 cursor-not-allowed'}`}
                  >
                    <Play className="w-4 h-4" /> Estudiar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
