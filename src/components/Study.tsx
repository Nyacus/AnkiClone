import { useState, useEffect, useMemo } from 'react';
import { db, Card } from '../db';
import { calculateNextReview, Grade } from '../srs';
import { selectNextCard } from '../core/selector';
import { ArrowLeft, Brain, CheckCircle2, ChevronRight, Clock, Info, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  deckId: number;
  onBack: () => void;
}

export default function Study({ deckId, onBack }: Props) {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [seenInSession, setSeenInSession] = useState<Set<number>>(new Set());
  const [recentlySeen, setRecentlySeen] = useState<number[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [showDiscardedOnly, setShowDiscardedOnly] = useState(false);

  useEffect(() => {
    loadCards();
  }, [deckId, showDiscardedOnly]);

  const loadCards = async () => {
    setLoading(true);
    const deckCards = await db.cards.where('deckId').equals(deckId).toArray();

    const filtered = showDiscardedOnly
      ? deckCards.filter(c => c.discarded)
      : deckCards.filter(c => !c.discarded);

    setAllCards(filtered);

    // Choose the first card for the session
    const next = selectNextCard(filtered, new Set(), []);
    setCurrentCard(next);

    setSeenInSession(new Set());
    setIsFinished(false);
    setLoading(false);
  };

  const handleNext = () => {
    if (!currentCard) return;

    // Add to session set
    const newSeen = new Set(seenInSession);
    newSeen.add(currentCard.id!);

    // Add to recently seen (buffer of 10)
    const newRecent = [currentCard.id!, ...recentlySeen].slice(0, 10);

    setSeenInSession(newSeen);
    setRecentlySeen(newRecent);

    const next = selectNextCard(allCards, newSeen, newRecent);

    if (next) {
      setCurrentCard(next);
      setShowAnswer(false);
    } else {
      setIsFinished(true);
      setCurrentCard(null);
    }
  };

  const handleGrade = async (grade: Grade) => {
    if (!currentCard) return;
    const updatedCard = calculateNextReview(currentCard, grade);
    await db.cards.put(updatedCard);

    // Update local list (optional, but good for weights)
    setAllCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));

    handleNext();
  };

  const handleDiscard = async () => {
    if (!currentCard) return;
    const updated = { ...currentCard, discarded: !currentCard.discarded };
    await db.cards.put(updated);

    // Remove from "allCards" if in normal mode, or update in discarded mode
    if (!showDiscardedOnly) {
      setAllCards(prev => prev.filter(c => c.id !== currentCard.id));
      // We consider it "skipped" in session
      const next = selectNextCard(allCards.filter(c => c.id !== currentCard.id), seenInSession, recentlySeen);
      if (next) {
        setCurrentCard(next);
        setShowAnswer(false);
      } else {
        setIsFinished(true);
        setCurrentCard(null);
      }
    } else {
      // Just move to next
      handleNext();
    }
  };

  const handleRestart = () => {
    setSeenInSession(new Set());
    setIsFinished(false);
    const first = selectNextCard(allCards, new Set(), recentlySeen);
    setCurrentCard(first);
    setShowAnswer(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (!currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setShowAnswer(true);
      }

      if (e.key.toLowerCase() === 'd') {
        handleDiscard();
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
  }, [showAnswer, currentCard, isFinished]);

  if (loading) return <div className="p-12 text-center text-slate-400 font-medium">Iniciando ciclo dinámico...</div>;

  if (isFinished || allCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark p-16 rounded-[2.5rem] border border-white/10 shadow-2xl mt-12"
        >
          <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            {allCards.length === 0 ? 'Sin tarjetas' : '¡Ciclo Completado!'}
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            {allCards.length === 0
              ? (showDiscardedOnly ? 'No tienes tarjetas descartadas.' : 'No hay tarjetas activas en este mazo.')
              : 'Has visto todas las tarjetas de este mazo en esta sesión.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {allCards.length > 0 && (
              <button
                onClick={handleRestart}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-500 shadow-xl transition-all active:scale-95 flex items-center gap-2 justify-center"
              >
                <RotateCcw className="w-5 h-5" /> Otra vuelta
              </button>
            )}
            <button
              onClick={onBack}
              className="px-10 py-4 bg-slate-800 text-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all active:scale-95"
            >
              Volver al Inicio
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = (seenInSession.size / allCards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[85vh]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-2.5 text-slate-400 hover:text-white font-semibold transition-colors"
          >
            <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Salir
          </button>

          <button
            onClick={() => setShowDiscardedOnly(!showDiscardedOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showDiscardedOnly ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800/50 text-slate-400 border border-white/5'
              }`}
          >
            {showDiscardedOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showDiscardedOnly ? 'Ver Activas' : 'Ver Descartadas'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Vistas</div>
            <div className="text-lg font-bold text-white leading-none">{seenInSession.size} / {allCards.length}</div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 flex items-center justify-center p-1">
            <div className="w-full h-full rounded-full border-2 border-indigo-500 border-t-transparent animate-spin-slow" />
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-800/50 rounded-full mb-12 overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center perspective-1000">
        <motion.div
          onClick={() => !showAnswer && setShowAnswer(true)}
          animate={{ rotateY: showAnswer ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', damping: 20, stiffness: 100 }}
          className={`relative w-full cursor-pointer preserve-3d min-h-[400px] group`}
        >
          {/* Card Front */}
          <div className="absolute inset-0 backface-hidden glass p-12 sm:p-20 rounded-[3rem] border border-white/20 shadow-2xl flex flex-col items-center justify-center transition-all group-hover:bg-white/25">
            <span className="absolute top-10 left-10 text-xs font-black tracking-[0.2em] text-indigo-400/60 uppercase bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              NIVEL {currentCard?.masteryLevel} • {currentCard?.direction}
            </span>
            <div className="bg-indigo-500/10 p-5 rounded-3xl mb-10">
              <Brain className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold text-center text-slate-100 tracking-tight leading-tight">
              {currentCard?.front}
            </h2>
            <div className="mt-12 flex items-center gap-2 text-slate-400 font-medium animate-pulse">
              <Info className="w-4 h-4" /> Espacio para revelar
            </div>
          </div>

          {/* Card Back */}
          <div
            className="absolute inset-0 backface-hidden glass-dark p-12 sm:p-20 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="absolute top-10 left-10 right-10 flex justify-between items-center">
              <span className="text-xs font-black tracking-[0.2em] text-emerald-400/60 uppercase bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                RESPUESTA
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDiscard(); }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-white/5 active:scale-95 group/btn"
              >
                <Trash2 className="w-4 h-4 group-hover/btn:text-red-400" />
                <span className="text-xs font-bold uppercase tracking-widest">{currentCard?.discarded ? 'Reactivar' : 'Descartar (D)'}</span>
              </button>
            </div>
            <div className="bg-emerald-500/10 p-5 rounded-3xl mb-10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold text-center text-white tracking-tight leading-tight">
              {currentCard?.back}
            </h2>
          </div>
        </motion.div>

        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12"
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleGrade('again'); }}
                className="flex flex-col items-center justify-center p-6 glass-dark rounded-3xl border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all group lg:scale-100 scale-95"
              >
                <div className="w-3 h-3 rounded-full bg-red-500 mb-3 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-red-400 font-black text-xs uppercase tracking-widest mb-1">Nivel -1 (1)</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">"No tenía ni idea"</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleGrade('hard'); }}
                className="flex flex-col items-center justify-center p-6 glass-dark rounded-3xl border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/40 transition-all group lg:scale-100 scale-95"
              >
                <div className="w-3 h-3 rounded-full bg-orange-500 mb-3 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                <span className="text-orange-400 font-black text-xs uppercase tracking-widest mb-1">Nivel -1 (2)</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">"Dudé bastante"</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleGrade('good'); }}
                className="flex flex-col items-center justify-center p-6 glass-dark rounded-3xl border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all group lg:scale-100 scale-95"
              >
                <div className="w-3 h-3 rounded-full bg-indigo-500 mb-3 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <span className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-1">Nivel +1 (3)</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">"La sabía"</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleGrade('easy'); }}
                className="flex flex-col items-center justify-center p-6 glass-dark rounded-3xl border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all group lg:scale-100 scale-95"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500 mb-3 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">Nivel +2 (4)</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">"Fácil / Flash"</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
