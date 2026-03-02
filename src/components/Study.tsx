import { useState, useEffect } from 'react';
import { db, Card } from '../db';
import { calculateNextReview, Grade } from '../srs';
import { ArrowLeft } from 'lucide-react';

interface Props {
  deckId: number;
  onBack: () => void;
}

export default function Study({ deckId, onBack }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      const now = Date.now();
      const deckCards = await db.cards.where('deckId').equals(deckId).toArray();
      
      // Filter new and due cards
      const due = deckCards.filter(c => c.isNew || c.nextReview <= now);
      
      // Shuffle them (simple shuffle)
      const shuffled = due.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setLoading(false);
    };
    loadCards();
  }, [deckId]);

  const currentCard = cards[currentIndex];

  const handleGrade = async (grade: Grade) => {
    if (!currentCard) return;
    
    const updatedCard = calculateNextReview(currentCard, grade);
    await db.cards.put(updatedCard);

    setShowAnswer(false);
    setCurrentIndex(prev => prev + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setShowAnswer(true);
      }

      if (showAnswer) {
        if (e.code === 'Digit1') handleGrade('again');
        if (e.code === 'Digit2') handleGrade('hard');
        if (e.code === 'Digit3') handleGrade('good');
        if (e.code === 'Digit4') handleGrade('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, currentCard]);

  if (loading) return <div className="p-8 text-center text-stone-500">Cargando tarjetas...</div>;

  if (!currentCard) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-stone-200 mt-12">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">¡Has terminado por hoy!</h2>
          <p className="text-stone-500 mb-8">No hay más tarjetas pendientes en este mazo.</p>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col min-h-[80vh]">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-500 hover:text-stone-900">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="text-sm font-medium text-stone-400">
          Pendientes: {cards.length - currentIndex}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full bg-white rounded-3xl shadow-sm border border-stone-200 p-12 min-h-[300px] flex flex-col items-center justify-center relative">
          <span className="absolute top-6 left-6 text-xs font-bold tracking-wider text-stone-400 uppercase">
            {currentCard.direction}
          </span>
          
          <h2 className="text-4xl sm:text-5xl font-semibold text-center text-stone-800 mb-8">
            {currentCard.front}
          </h2>

          {showAnswer ? (
            <>
              <div className="w-full h-px bg-stone-100 my-8" />
              <h2 className="text-3xl sm:text-4xl font-medium text-center text-indigo-600">
                {currentCard.back}
              </h2>
            </>
          ) : (
            <button 
              onClick={() => setShowAnswer(true)}
              className="mt-8 px-8 py-3 bg-stone-100 text-stone-600 rounded-full font-medium hover:bg-stone-200 transition-colors"
            >
              Mostrar Respuesta (Espacio)
            </button>
          )}
        </div>

        {showAnswer && (
          <div className="w-full grid grid-cols-4 gap-4 mt-8">
            <button onClick={() => handleGrade('again')} className="flex flex-col items-center p-4 bg-white border border-stone-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors group">
              <span className="text-red-600 font-bold mb-1 group-hover:scale-110 transition-transform">Again</span>
              <span className="text-xs text-stone-400">&lt; 10m (1)</span>
            </button>
            <button onClick={() => handleGrade('hard')} className="flex flex-col items-center p-4 bg-white border border-stone-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-colors group">
              <span className="text-orange-600 font-bold mb-1 group-hover:scale-110 transition-transform">Hard</span>
              <span className="text-xs text-stone-400">{(currentCard.interval * 1.2).toFixed(1)}d (2)</span>
            </button>
            <button onClick={() => handleGrade('good')} className="flex flex-col items-center p-4 bg-white border border-stone-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-colors group">
              <span className="text-green-600 font-bold mb-1 group-hover:scale-110 transition-transform">Good</span>
              <span className="text-xs text-stone-400">{currentCard.repetitions === 0 ? '1d' : `${Math.round(currentCard.interval * currentCard.easeFactor)}d`} (3)</span>
            </button>
            <button onClick={() => handleGrade('easy')} className="flex flex-col items-center p-4 bg-white border border-stone-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors group">
              <span className="text-blue-600 font-bold mb-1 group-hover:scale-110 transition-transform">Easy</span>
              <span className="text-xs text-stone-400">{currentCard.repetitions === 0 ? '4d' : `${Math.round(currentCard.interval * currentCard.easeFactor * 1.3)}d`} (4)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
