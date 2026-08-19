import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../api/ai.api';
import { Subject, Material, DoubtResponse, DoubtCitation } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  Send,
  BookOpen,
  FileText,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AiDoubtAssistantProps {
  subject: Subject;
  materials: Material[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: DoubtCitation[];
  suggestedFollowUps?: string[];
  groundedInFilesCount?: number;
  timestamp: Date;
}

export const AiDoubtAssistant: React.FC<AiDoubtAssistantProps> = ({ subject, materials }) => {
  const { error } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const defaultStarterPrompts = [
    `Summarize the key core concepts of ${subject.name}`,
    'What are the most frequent exam questions on this subject?',
    'Explain the main algorithms and step-by-step mechanisms',
    'Compare the primary trade-offs covered in Unit 1 and Unit 2',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendQuestion = async (queryText?: string) => {
    const textToSend = (queryText || inputQuestion).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiApi.askDoubt({
        subjectId: subject._id,
        question: textToSend,
        history,
      });

      if (res.success && res.data) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.data.answer,
          citations: res.data.citations,
          suggestedFollowUps: res.data.suggestedFollowUps,
          groundedInFilesCount: res.data.groundedInFilesCount,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      error('Failed to get answer', err.response?.data?.message || 'Could not reach AI Tutor service.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-4">
      {/* Grounding & Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </span>
              <h3 className="text-lg font-bold">Course Knowledge RAG Doubt Assistant</h3>
              <Badge variant="emerald" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Strictly Grounded
              </Badge>
            </div>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              Ask any academic doubt about <strong className="text-white">{subject.name}</strong>. The AI answers
              strictly grounded in the <strong className="text-white">{materials.length} uploaded lecture notes, slides, and syllabus documents</strong> with verified citations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Clear Chat
              </Button>
            )}
            <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-blue-200">
              <BookOpen className="w-3.5 h-3.5 text-blue-300" />
              <span>{materials.length} Notes Indexed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <Card className="p-0 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[520px] max-h-[680px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  What would you like to understand today?
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ask conceptual questions, request derivations, compare algorithms, or review syllabus topics.
                </p>
              </div>

              {/* Starter Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left">
                {defaultStarterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuestion(prompt)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-slate-700/80 bg-gray-50/70 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between group"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-gray-50 dark:bg-slate-800/80 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200/80 dark:border-slate-700/70 shadow-sm'
                  }`}
                >
                  {/* Message Content */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Clickable Citations & References */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <BookOpen className="w-3 h-3 text-blue-500" />
                        <span>Source Citations &amp; Course Materials</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.citations.map((cite, cIdx) => (
                          <div
                            key={cIdx}
                            className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                  {cite.materialTitle}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                  {cite.pageOrSection}
                                </span>
                              </div>
                              {cite.snippet && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 italic line-clamp-2 pl-5">
                                  "{cite.snippet}"
                                </p>
                              )}
                            </div>

                            {cite.fileUrl && cite.fileUrl !== '#' && (
                              <a
                                href={cite.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-[11px] font-semibold shrink-0 transition-colors"
                              >
                                View
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase mr-1">
                        Explore next:
                      </span>
                      {msg.suggestedFollowUps.map((followUp, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSendQuestion(followUp)}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1 text-left"
                        >
                          <span>{followUp}</span>
                          <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                    You
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-gray-50 dark:bg-slate-800/80 rounded-2xl rounded-bl-none p-4 border border-gray-200/80 dark:border-slate-700/70 shadow-sm flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                </div>
                <span>Analyzing course materials &amp; generating citations...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={`Ask any doubt about ${subject.name}...`}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Button
              type="submit"
              disabled={!inputQuestion.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Powered by EduKollab Course RAG
            </span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
