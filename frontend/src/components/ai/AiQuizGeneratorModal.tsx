import React, { useState } from 'react';
import { aiApi } from '../../api/ai.api';
import { quizApi } from '../../api/quiz.api';
import { Subject, Material, GeneratedQuizResult, GeneratedQuizQuestion } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Trash2,
  Plus,
  Zap,
  HelpCircle,
  Clock,
  Award,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AiQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  materials: Material[];
  onQuizPublished?: () => void;
}

export const AiQuizGeneratorModal: React.FC<AiQuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  subject,
  materials,
  onQuizPublished,
}) => {
  const { success, error } = useToast();

  // Generator Config
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [generating, setGenerating] = useState(false);

  // Generated Result State
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuizResult | null>(null);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [rewardPoints, setRewardPoints] = useState<number>(30);
  const [publishing, setPublishing] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await aiApi.generateQuiz({
        subjectId: subject._id,
        materialId: selectedMaterialId || undefined,
        topic: customTopic || undefined,
        count: questionCount,
        difficulty,
      });

      if (res.success && res.data) {
        setGeneratedQuiz(res.data);
        success('Quiz Generated! ⚡', 'Review and tweak questions below before publishing.');
      }
    } catch (err: any) {
      error('Generation Failed', err.response?.data?.message || 'Could not generate quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleQuestionTextChange = (qIdx: number, text: string) => {
    if (!generatedQuiz) return;
    const updated = [...generatedQuiz.questions];
    updated[qIdx].questionText = text;
    setGeneratedQuiz({ ...generatedQuiz, questions: updated });
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, text: string) => {
    if (!generatedQuiz) return;
    const updated = [...generatedQuiz.questions];
    updated[qIdx].options[oIdx].text = text;
    setGeneratedQuiz({ ...generatedQuiz, questions: updated });
  };

  const handleSetCorrectOption = (qIdx: number, oIdx: number) => {
    if (!generatedQuiz) return;
    const updated = [...generatedQuiz.questions];
    updated[qIdx].options = updated[qIdx].options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === oIdx,
    }));
    setGeneratedQuiz({ ...generatedQuiz, questions: updated });
  };

  const handleDeleteQuestion = (qIdx: number) => {
    if (!generatedQuiz) return;
    const updated = generatedQuiz.questions.filter((_, idx) => idx !== qIdx);
    setGeneratedQuiz({ ...generatedQuiz, questions: updated });
  };

  const handlePublishQuiz = async () => {
    if (!generatedQuiz || generatedQuiz.questions.length === 0) return;
    setPublishing(true);

    try {
      const payload = {
        classId: typeof subject.classId === 'string' ? subject.classId : subject.classId._id,
        subjectId: subject._id,
        title: generatedQuiz.title,
        description: generatedQuiz.description,
        type: 'NATIVE_MCQ',
        timeLimitMinutes,
        attemptLimit: 1,
        rewardPoints,
        isPublished: true,
        questions: generatedQuiz.questions.map((q) => ({
          questionText: q.questionText,
          type: 'MCQ',
          options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
          explanation: q.explanation,
          marks: q.marks || 1,
        })),
      };

      const res = await quizApi.createQuiz(payload);
      if (res.success) {
        success('Quiz Published! 🎉', 'Students can now attempt the auto-graded AI quiz.');
        if (onQuizPublished) onQuizPublished();
        onClose();
        setGeneratedQuiz(null);
      }
    } catch (err: any) {
      error('Publish Failed', err.response?.data?.message || 'Could not publish quiz.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="1-Click AI Quiz & Flashcard Generator"
      description="Automatically generate auto-graded MCQs with detailed explanations from course lecture notes."
      maxWidth="2xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Configuration Form */}
        <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Source Study Material
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- All Subject Notes &amp; Syllabus --</option>
                {materials.map((m) => (
                  <option key={m._id} value={m._id}>
                    📄 {m.title} ({m.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Or Focus on Specific Topic
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Process Scheduling & Round Robin"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Questions Count: <span className="font-bold text-purple-600">{questionCount}</span>
              </label>
              <input
                type="range"
                min="3"
                max="10"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Difficulty Level
              </label>
              <div className="flex gap-2">
                {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      difficulty === lvl
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl py-2.5 shadow-md flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'AI Analyzing Lecture Notes & Generating MCQs...' : '⚡ Generate Quiz in 5 Seconds'}
          </Button>
        </div>

        {/* Generated Questions Review & Publish Area */}
        {generatedQuiz && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span>Generated Assessment</span>
                  <Badge variant="purple" className="text-[10px]">
                    {generatedQuiz.questions.length} Questions
                  </Badge>
                </h4>
                <p className="text-xs text-gray-500">Edit any question or correct option before publishing.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <input
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-12 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 text-center text-xs"
                  />
                  <span>min</span>
                </div>
              </div>
            </div>

            {/* Quiz Title & Description Edit */}
            <div className="grid grid-cols-1 gap-3">
              <Input
                label="Quiz Title"
                value={generatedQuiz.title}
                onChange={(e) => setGeneratedQuiz({ ...generatedQuiz, title: e.target.value })}
              />
              <Input
                label="Overview / Description"
                value={generatedQuiz.description}
                onChange={(e) => setGeneratedQuiz({ ...generatedQuiz, description: e.target.value })}
              />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {generatedQuiz.questions.map((q, qIdx) => (
                <Card key={qIdx} className="p-4 space-y-3 border border-gray-200 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {qIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        onClick={() => handleSetCorrectOption(qIdx, oIdx)}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                          opt.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${qIdx}-correct`}
                          checked={opt.isCorrect}
                          onChange={() => handleSetCorrectOption(qIdx, oIdx)}
                          className="accent-emerald-600"
                        />
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleOptionTextChange(qIdx, oIdx, e.target.value);
                          }}
                          className="flex-1 bg-transparent text-xs focus:outline-none"
                        />
                        {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-slate-850 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setGeneratedQuiz(null)}>
                Discard
              </Button>
              <Button
                onClick={handlePublishQuiz}
                disabled={publishing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 flex items-center gap-2 font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                {publishing ? 'Publishing...' : '1-Click Publish to Subject'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
