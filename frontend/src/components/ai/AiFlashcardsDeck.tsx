import React, { useState, useEffect } from 'react';
import { aiApi } from '../../api/ai.api';
import { Subject, GeneratedFlashcard } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AiFlashcardsDeckProps {
  subject: Subject;
}

export const AiFlashcardsDeck: React.FC<AiFlashcardsDeckProps> = ({ subject }) => {
  const { success, error } = useToast();
  const [flashcards, setFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  const loadFlashcards = async (isRegenerate = false) => {
    setLoading(true);
    try {
      const seed = isRegenerate ? Date.now() : undefined;
      const res = await aiApi.getFlashcards(subject._id, {
        refresh: isRegenerate,
        seed,
      });
      if (res.success && res.data && res.data.length > 0) {
        setFlashcards(res.data);
        setCurrentIndex(0);
        setIsFlipped(false);
        setMasteredCards(new Set());
        if (isRegenerate) {
          success('Flashcards Regenerated ✨', 'Loaded a brand-new set of revision cards.');
        }
      }
    } catch (err: any) {
      error('Failed to load flashcards', err.response?.data?.message || 'Could not fetch flashcards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, [subject._id]);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    success('Deck Shuffled', 'Cards randomized for fresh practice.');
  };

  const toggleMastered = () => {
    const next = new Set(masteredCards);
    if (next.has(currentIndex)) {
      next.delete(currentIndex);
    } else {
      next.add(currentIndex);
      success('Card Mastered! 🎉', 'Marked as understood in your study session.');
    }
    setMasteredCards(next);
  };

  if (loading) {
    return (
      <Card className="p-12 text-center border border-gray-200 dark:border-slate-800 space-y-4">
        <Sparkles className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Generating Course Revision Flashcards...
        </p>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card className="p-12 text-center border border-gray-200 dark:border-slate-800 space-y-4">
        <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
        <p className="text-sm text-gray-500">No flashcards available yet for this subject.</p>
        <Button size="sm" onClick={() => loadFlashcards(true)}>
          Generate Flashcards
        </Button>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];
  const isMastered = masteredCards.has(currentIndex);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Controls & Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            Card {currentIndex + 1} of {flashcards.length}
          </Badge>
          <Badge variant="emerald" className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {masteredCards.size} Mastered
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle} className="text-xs">
            <Shuffle className="w-3.5 h-3.5 mr-1" />
            Shuffle Deck
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadFlashcards(true)} className="text-xs">
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer min-h-[300px] sm:min-h-[340px] rounded-3xl p-8 sm:p-10 border-2 transition-all duration-500 relative flex flex-col justify-between shadow-lg select-none bg-gradient-to-br from-white via-gray-50 to-purple-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-purple-950/20 border-purple-200 dark:border-purple-900/60 hover:border-purple-400 dark:hover:border-purple-600"
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {isFlipped ? '💡 Solution & Key Takeaway' : '❓ Question / Concept'}
          </span>

          <span className="text-[10px] text-gray-400 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">
            Click card to flip ⟳
          </span>
        </div>

        {/* Card Main Body */}
        <div className="my-auto py-6 text-center space-y-4">
          {!isFlipped ? (
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
              {currentCard.front}
            </h3>
          ) : (
            <div className="space-y-4 text-left sm:text-center">
              <p className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                {currentCard.back}
              </p>
              {currentCard.keyTakeaway && (
                <div className="inline-flex items-center gap-1.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Key Takeaway: {currentCard.keyTakeaway}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Footer Status */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMastered();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isMastered
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isMastered ? 'Mastered' : 'Mark Mastered'}
          </button>

          <span className="text-xs text-gray-400">
            {isFlipped ? 'Answer Revealed' : 'Tap to Reveal'}
          </span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={flashcards.length <= 1}
          className="rounded-2xl px-5"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous Card
        </Button>

        <span className="text-xs text-gray-500 font-medium">
          {currentIndex + 1} / {flashcards.length}
        </span>

        <Button
          onClick={handleNext}
          disabled={flashcards.length <= 1}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-5"
        >
          Next Card
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
