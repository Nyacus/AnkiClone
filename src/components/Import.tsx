import { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

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
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

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
        // EN -> ES and ES -> EN
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
        // Front, Back, Direction, Tag
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
      setMessage({ type: 'success', text: `¡Importadas ${newCards.length} tarjetas con éxito!` });
      setTsvData('');
      setTimeout(() => onBack(), 2000);
    } else {
      setMessage({ type: 'error', text: 'No se encontraron pares válidos. Revisa el formato (debe estar separado por tabulaciones).' });
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
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-900 mb-6">Importar Vocabulario</h2>
        
        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-stone-700">Selecciona el mazo destino</label>
              {!isCreating && (
                <button onClick={() => setIsCreating(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  + Crear nuevo mazo
                </button>
              )}
            </div>
            
            {isCreating ? (
              <form onSubmit={handleCreateDeck} className="flex gap-2 mb-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                  className="flex-1 p-3 border border-stone-200 rounded-lg bg-stone-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nombre del mazo..."
                />
                <button type="submit" disabled={!newDeckName.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                  Guardar
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg font-medium hover:bg-stone-200">
                  Cancelar
                </button>
              </form>
            ) : (
              <select 
                value={selectedDeckId} 
                onChange={e => setSelectedDeckId(Number(e.target.value))}
                className="w-full p-3 border border-stone-200 rounded-lg bg-stone-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="" disabled>-- Elige un mazo --</option>
                {decks?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Pega tu TSV aquí</label>
            <p className="text-xs text-stone-500 mb-3">
              Formatos aceptados:<br/>
              1) <code>Inglés &lt;TAB&gt; Español</code> (Genera 2 tarjetas automáticamente)<br/>
              2) <code>Front &lt;TAB&gt; Back &lt;TAB&gt; Direction &lt;TAB&gt; Tag</code>
            </p>
            <textarea
              rows={10}
              value={tsvData}
              onChange={e => setTsvData(e.target.value)}
              className="w-full p-4 font-mono text-sm border border-stone-200 rounded-lg bg-stone-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
              placeholder="apple&#9;manzana&#10;house&#9;casa"
            />
          </div>

          <button 
            onClick={handleImport}
            disabled={!selectedDeckId || !tsvData.trim() || isImporting}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importando...' : !selectedDeckId ? 'Selecciona un mazo primero' : !tsvData.trim() ? 'Pega el texto TSV' : 'Importar Tarjetas'}
          </button>
        </div>
      </div>
    </div>
  );
}
