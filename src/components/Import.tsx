import { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, CheckCircle2, AlertCircle, FileText, Plus, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onBack: () => void;
  defaultDeckId?: number;
}

export default function Import({ onBack, defaultDeckId }: Props) {
  const decks = useLiveQuery(() => db.decks.toArray());
  const [selectedDeckId, setSelectedDeckId] = useState<number | ''>(defaultDeckId || '');
  const [tsvData, setTsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleImport = async () => {
    if (!selectedDeckId || !tsvData.trim()) return;
    setIsImporting(true);
    setMessage(null);

    const lines = tsvData.trim().split('\n');
    const newCards = [];

    for (const line of lines) {
      const cols = line.split('\t').map(c => c.trim());
      if (cols.length < 2) continue;

      const baseCard = {
        deckId: Number(selectedDeckId),
        isNew: true,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapseCount: 0,
        lastReview: 0,
        nextReview: Date.now(),
        tags: []
      };

      if (cols.length === 2) {
        newCards.push({
          ...baseCard,
          front: cols[0],
          back: cols[1],
          direction: 'EN->ES'
        });
        newCards.push({
          ...baseCard,
          front: cols[1],
          back: cols[0],
          direction: 'ES->EN'
        });
      } else if (cols.length >= 4) {
        newCards.push({
          ...baseCard,
          front: cols[0],
          back: cols[1],
          direction: cols[2],
          tags: cols[3] ? [cols[3]] : []
        });
      }
    }

    if (newCards.length > 0) {
      await db.cards.bulkAdd(newCards);
      setMessage({ type: 'success', text: `¡Se han importado ${newCards.length} tarjetas correctamente!` });
      setTsvData('');
      setTimeout(() => onBack(), 2000);
    } else {
      setMessage({ type: 'error', text: 'No se detectaron datos válidos. El formato debe ser texto separado por tabuladores.' });
    }
    setIsImporting(false);
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeckName.trim()) {
      const id = await db.decks.add({ name: newDeckName.trim(), createdAt: Date.now() });
      setSelectedDeckId(id);
      setNewDeckName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <button
        onClick={onBack}
        className="group flex items-center gap-2.5 text-slate-400 hover:text-white font-semibold transition-colors"
      >
        <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Volver a mis mazos
      </button>

      <div className="glass-dark p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Importar Vocabulario</h2>
            <p className="text-slate-400 font-medium tracking-tight">Carga masiva de tarjetas mediante formato TSV.</p>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className={`p-5 rounded-2xl mb-8 flex items-center gap-4 border overflow-hidden ${message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 border-red-500/20'
                }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <p className="font-bold tracking-tight">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">Mazo de destino</label>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Crear nuevo
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isCreating ? (
                <motion.form
                  key="create-deck"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleCreateDeck}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    autoFocus
                    type="text"
                    value={newDeckName}
                    onChange={e => setNewDeckName(e.target.value)}
                    className="flex-1 p-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="Nombre del nuevo mazo..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newDeckName.trim()}
                      className="flex-1 sm:flex-none px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-4 bg-slate-800 text-slate-400 rounded-2xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.select
                  key="select-deck"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  value={selectedDeckId}
                  onChange={e => setSelectedDeckId(Number(e.target.value))}
                  className="w-full p-5 bg-slate-900/50 border border-white/10 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="" disabled className="bg-slate-900">-- Selecciona un mazo --</option>
                  {decks?.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                </motion.select>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Contenido TSV</label>
              <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 mb-4">
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  <span className="text-white font-bold block mb-1">Formatos sugeridos:</span>
                  1. <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">Front [TAB] Back</code> (Crea tarjetas en ambos sentidos)<br />
                  2. <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">Front [TAB] Back [TAB] Dirección [TAB] Etiqueta</code>
                </p>
              </div>
              <textarea
                rows={8}
                value={tsvData}
                onChange={e => setTsvData(e.target.value)}
                className="w-full p-6 font-mono text-sm bg-slate-900/60 border border-white/10 rounded-[2rem] text-indigo-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all"
                placeholder="palabra&#9;definición&#10;hello&#9;hola"
              />
            </div>

            <button
              onClick={handleImport}
              disabled={!selectedDeckId || !tsvData.trim() || isImporting}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[2rem] font-bold text-xl shadow-2xl shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-600 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isImporting ? 'Procesando datos...' : !selectedDeckId ? 'Falta elegir mazo' : !tsvData.trim() ? 'Pega el texto TSV' : 'Confirmar Importación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
