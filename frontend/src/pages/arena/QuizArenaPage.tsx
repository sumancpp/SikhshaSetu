import React, { useState, useEffect } from 'react';
import { arenaApi } from '../../api/arena.api';
import { ArenaMatchState, ArenaQuestion, ArenaRoundResult } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Swords,
  Trophy,
  Flame,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useExamIntegrityGuard } from '../../hooks/useExamIntegrityGuard';
import { ExamProctorGuard } from '../../components/common/ExamProctorGuard';

export const QuizArenaPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error, info } = useToast();

  // Match States: 'LOBBY' | 'MATCHMAKING' | 'READY_COUNTDOWN' | 'BATTLE' | 'ROUND_REVIEW' | 'MATCH_OVER'
  const [matchStatePhase, setMatchStatePhase] = useState<
    'LOBBY' | 'MATCHMAKING' | 'READY_COUNTDOWN' | 'BATTLE' | 'ROUND_REVIEW' | 'MATCH_OVER'
  >('LOBBY');

  const [match, setMatch] = useState<ArenaMatchState | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(12);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submittingRound, setSubmittingRound] = useState(false);
  const [roundResult, setRoundResult] = useState<ArenaRoundResult | null>(null);

  // 🛡️ Anti-Cheating & Exam Integrity Guard
  const integrity = useExamIntegrityGuard({
    enabled: matchStatePhase === 'BATTLE' || matchStatePhase === 'ROUND_REVIEW',
    examName: '1v1 Quiz Battle Arena',
    maxViolations: 3,
    onMaxViolationsExceeded: () => {
      handleSubmitAnswer(-1, 12);
    },
  });

  // Real-Time Peer Matchmaking Socket Listener
  useEffect(() => {
    if (socket) {
      const handlePeerMatched = (matchedState: ArenaMatchState) => {
        setMatch(matchedState);
        setMatchStatePhase('READY_COUNTDOWN');
        setCountdown(3);
        info('🎯 Live Peer Found!', `Matched with live student ${matchedState.opponent.name}!`);
      };

      socket.on('arena:matched', handlePeerMatched);

      return () => {
        socket.off('arena:matched', handlePeerMatched);
      };
    }
  }, [socket, info]);

  // Matchmaking action
  const handleFindMatch = async () => {
    setMatchStatePhase('MATCHMAKING');
    try {
      const res = await arenaApi.startMatch();
      if (res.success && res.data) {
        setMatch(res.data);
        setMatchStatePhase('READY_COUNTDOWN');
        setCountdown(3);
        if (res.data.opponent.isBot) {
          info('🤖 AI Peer Selected', `No peer searching in window. Paired with ${res.data.opponent.name}!`);
        } else {
          success('🎯 Live Peer Found!', `Matched with live student ${res.data.opponent.name}!`);
        }
      }
    } catch (err: any) {
      error('Matchmaking Failed', err.response?.data?.message || 'Could not find opponent.');
      setMatchStatePhase('LOBBY');
    }
  };

  // Ready Countdown (3 -> 2 -> 1 -> Battle)
  useEffect(() => {
    if (matchStatePhase === 'READY_COUNTDOWN') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setMatchStatePhase('BATTLE');
        setQuestionTimeRemaining(12);
        setSelectedOption(null);
        setRoundResult(null);
      }
    }
  }, [matchStatePhase, countdown]);

  // Battle Question Timer (12s per round)
  useEffect(() => {
    if (matchStatePhase === 'BATTLE') {
      if (questionTimeRemaining > 0) {
        const timer = setTimeout(() => setQuestionTimeRemaining((t) => t - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Time ran out -> submit with -1 (timeout)
        handleSubmitAnswer(-1, 12);
      }
    }
  }, [matchStatePhase, questionTimeRemaining]);

  const handleSubmitAnswer = async (optionIndex: number, timeSpent: number) => {
    if (!match || submittingRound) return;

    setSelectedOption(optionIndex);
    setSubmittingRound(true);

    const currentQuestion = match.questions[match.currentQuestionIndex];

    try {
      const res = await arenaApi.submitRound({
        matchId: match.matchId,
        questionId: currentQuestion?.id || 'q1',
        selectedOptionIndex: optionIndex,
        timeTakenSeconds: timeSpent,
      });

      if (res.success) {
        setMatch(res.data.matchState);
        setRoundResult(res.data.roundResult);
        setMatchStatePhase('ROUND_REVIEW');

        if (res.data.roundResult.playerCorrect) {
          success('Correct Answer! ⚡', `+${res.data.roundResult.playerPointsEarned} points earned!`);
        }

        // Advance to next round or finish
        setTimeout(() => {
          if (res.data.roundResult.isMatchOver) {
            setMatchStatePhase('MATCH_OVER');
          } else {
            setMatchStatePhase('BATTLE');
            setQuestionTimeRemaining(12);
            setSelectedOption(null);
            setRoundResult(null);
          }
        }, 2200);
      }
    } catch (err: any) {
      error('Round submission failed', err.response?.data?.message || 'Error submitting answer.');
    } finally {
      setSubmittingRound(false);
    }
  };

  const currentQuestion = match?.questions[match.currentQuestionIndex] || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. LOBBY PHASE */}
      {matchStatePhase === 'LOBBY' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-600 via-purple-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                <Swords className="w-4 h-4" /> Live Multiplayer Arena
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                1v1 Quiz Battle Arena
              </h1>
              <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
                Test your academic mastery head-to-head against classmates or adaptive AI champions in rapid-fire 12-second rounds.
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  onClick={handleFindMatch}
                  className="bg-white text-purple-700 hover:bg-purple-50 font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all"
                >
                  <Zap className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
                  Quick Match (Find Opponent)
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <Card className="p-5 border border-purple-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 flex items-center justify-center mx-auto mb-2 font-bold">
                ⚡
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Speed Multipliers</h4>
              <p className="text-xs text-gray-500 mt-1">Faster correct answers earn up to 2x bonus points per round.</p>
            </Card>

            <Card className="p-5 border border-purple-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center mx-auto mb-2 font-bold">
                🔥
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Streak Combos</h4>
              <p className="text-xs text-gray-500 mt-1">Stack consecutive correct answers to multiply battle XP rewards.</p>
            </Card>

            <Card className="p-5 border border-purple-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center mx-auto mb-2 font-bold">
                🏆
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Leaderboard XP</h4>
              <p className="text-xs text-gray-500 mt-1">Win matches to climb your campus competitive leaderboard.</p>
            </Card>
          </div>
        </div>
      )}

      {/* 2. MATCHMAKING PHASE */}
      {matchStatePhase === 'MATCHMAKING' && (
        <Card className="p-8 sm:p-12 text-center border border-purple-200 dark:border-slate-800 space-y-6 bg-slate-900 text-white shadow-xl">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-purple-950/80 flex items-center justify-center text-purple-400">
              <Swords className="w-8 h-8 animate-pulse text-purple-400" />
            </div>
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-black text-white">Searching for Live Peer Opponents...</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              If another student searches at the same moment, you'll be paired in real-time. If no peer joins in 3.5 seconds, an adaptive AI opponent will match automatically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-800 text-[11px] text-purple-300 font-semibold">
              ⚡ Real-time Peer Discovery
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-semibold">
              🤖 Auto AI Fallback
            </span>
          </div>
        </Card>
      )}

      {/* 3. READY COUNTDOWN PHASE */}
      {matchStatePhase === 'READY_COUNTDOWN' && match && (
        <Card className="p-8 sm:p-12 text-center border-2 border-purple-500 dark:border-purple-600 space-y-8 bg-slate-900 text-white shadow-2xl">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-purple-400">
              ⚔️ Match Found! Get Ready!
            </span>
            {match.opponent.isBot ? (
              <Badge variant="purple" className="text-xs font-bold">
                🤖 Adaptive AI Challenger
              </Badge>
            ) : (
              <Badge variant="emerald" className="text-xs font-bold animate-pulse">
                🟢 2-Player Live Peer Battle
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 sm:gap-16">
            {/* Player */}
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-3xl bg-purple-600 text-white flex items-center justify-center text-2xl font-black mx-auto shadow-xl">
                {match.player.avatarUrl ? (
                  <img src={match.player.avatarUrl} alt={match.player.name} className="w-full h-full rounded-3xl object-cover" />
                ) : (
                  match.player.name.charAt(0).toUpperCase()
                )}
              </div>
              <h4 className="text-base font-bold text-white">{match.player.name}</h4>
              <Badge variant="purple">You</Badge>
            </div>

            {/* VS */}
            <div className="text-3xl sm:text-4xl font-black italic text-red-500 animate-bounce">
              VS
            </div>

            {/* Opponent */}
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black mx-auto shadow-xl overflow-hidden">
                <img src={match.opponent.avatarUrl} alt={match.opponent.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-base font-bold text-white">{match.opponent.name}</h4>
              <Badge variant={match.opponent.isBot ? 'amber' : 'emerald'}>{match.opponent.title}</Badge>
            </div>
          </div>

          <div className="text-5xl font-black text-purple-400 animate-ping">
            {countdown}
          </div>
        </Card>
      )}

      {/* 4. BATTLE & ROUND REVIEW PHASES */}
      {(matchStatePhase === 'BATTLE' || matchStatePhase === 'ROUND_REVIEW') && match && currentQuestion && (
        <div className="space-y-6 select-none">
          {/* Proctoring Shield */}
          <ExamProctorGuard
            violationsCount={integrity.violationsCount}
            maxViolations={3}
            isWarningModalOpen={integrity.isWarningModalOpen}
            onDismissWarning={integrity.dismissWarning}
            lastViolationType={integrity.lastViolationType}
            examTitle="1v1 Quiz Battle Arena"
          />

          {/* Head to Head Score Bar */}
          <Card className="p-4 sm:p-6 border border-gray-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4">
              {/* Player Side */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-sm">
                  {match.player.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-purple-300 font-semibold">{match.player.name} (You)</div>
                  <div className="text-xl font-extrabold">{match.player.score} pts</div>
                </div>
                {match.player.streak >= 2 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    {match.player.streak}x
                  </span>
                )}
              </div>

              {/* Round & Timer */}
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Round {match.currentQuestionIndex + 1} of {match.totalQuestions}
                </span>
                <div
                  className={`text-2xl font-black ${
                    questionTimeRemaining <= 3 ? 'text-red-500 animate-ping' : 'text-amber-400'
                  }`}
                >
                  {questionTimeRemaining}s
                </div>
              </div>

              {/* Opponent Side */}
              <div className="flex items-center gap-3 text-right">
                {match.opponent.streak >= 2 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    {match.opponent.streak}x
                  </span>
                )}
                <div>
                  <div className="text-xs text-indigo-300 font-semibold">{match.opponent.name}</div>
                  <div className="text-xl font-extrabold">{match.opponent.score} pts</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm overflow-hidden">
                  <img src={match.opponent.avatarUrl} alt={match.opponent.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Score Comparison Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden flex">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{
                  width: `${
                    match.player.score + match.opponent.score > 0
                      ? (match.player.score / (match.player.score + match.opponent.score)) * 100
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{
                  width: `${
                    match.player.score + match.opponent.score > 0
                      ? (match.opponent.score / (match.player.score + match.opponent.score)) * 100
                      : 50
                  }%`,
                }}
              />
            </div>
          </Card>

          {/* Question Card */}
          <Card className="p-8 border-2 border-purple-200 dark:border-purple-900/60 shadow-lg text-center space-y-6">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
              {currentQuestion.questionText}
            </h3>

            {/* Option Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = roundResult && roundResult.correctIndex === idx;
                const isWrongSelection = roundResult && isSelected && !roundResult.playerCorrect;

                return (
                  <button
                    key={idx}
                    disabled={matchStatePhase === 'ROUND_REVIEW' || submittingRound}
                    onClick={() => handleSubmitAnswer(idx, 12 - questionTimeRemaining)}
                    className={`p-4 rounded-2xl border-2 text-sm sm:text-base font-semibold transition-all flex items-center justify-between ${
                      isCorrect
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-[1.02]'
                        : isWrongSelection
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : isSelected
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600'
                    }`}
                  >
                    <span>{opt}</span>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                    {isWrongSelection && <XCircle className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Round Feedback Summary */}
            {roundResult && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl text-xs sm:text-sm text-left space-y-1 animate-fadeIn">
                <div className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Explanation:</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{roundResult.explanation}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 5. MATCH OVER PHASE */}
      {matchStatePhase === 'MATCH_OVER' && match && (
        <Card className="p-8 sm:p-12 text-center border-2 border-purple-400 dark:border-purple-600 shadow-2xl space-y-8 bg-gradient-to-b from-purple-50/30 via-white to-purple-50/10 dark:from-slate-900 dark:to-purple-950/20">
          <div className="space-y-2">
            <div className="text-5xl sm:text-6xl animate-bounce">
              {match.player.score > match.opponent.score ? '🏆' : match.player.score === match.opponent.score ? '⚔️' : '💔'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">
              {match.player.score > match.opponent.score
                ? 'VICTORY!'
                : match.player.score === match.opponent.score
                ? 'BATTLE TIED!'
                : 'DEFEAT'}
            </h2>
            <p className="text-sm text-gray-500">
              {match.player.score > match.opponent.score
                ? `You outperformed ${match.opponent.name} in academic speed & accuracy!`
                : `Great battle against ${match.opponent.name}. Review high-yield topics to bounce back!`}
            </p>
          </div>

          {/* Final Scoreboard */}
          <div className="flex items-center justify-center gap-8 bg-gray-50 dark:bg-slate-850 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 max-w-lg mx-auto">
            <div>
              <span className="text-xs uppercase font-bold text-gray-400">Your Score</span>
              <div className="text-3xl font-black text-purple-600">{match.player.score}</div>
            </div>
            <div className="text-2xl font-bold text-gray-400">vs</div>
            <div>
              <span className="text-xs uppercase font-bold text-gray-400">{match.opponent.name}</span>
              <div className="text-3xl font-black text-indigo-600">{match.opponent.score}</div>
            </div>
          </div>

          <Badge variant="emerald" className="text-sm font-bold px-4 py-1.5">
            🌟 +{match.player.score > match.opponent.score ? 75 : 25} XP Points Awarded
          </Badge>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" onClick={handleFindMatch} className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-8">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
            <Button size="lg" variant="outline" onClick={() => setMatchStatePhase('LOBBY')} className="rounded-2xl px-6">
              Return to Lobby
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
