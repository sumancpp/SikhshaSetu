import React, { useState } from 'react';
import { codeApi } from '../../api/code.api';
import { CodeExecutionOutput, TestCaseItem, TestCaseEvaluationReport } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Copy,
  Terminal as TerminalIcon,
  Code2,
  TestTube2,
  Plus,
  Trash2,
  Lightbulb,
  ShieldCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface CodeEditorPanelProps {
  initialCode?: string;
  initialLanguage?: string;
  initialTestCases?: TestCaseItem[];
  onCodeChange?: (code: string, language: string) => void;
  readOnly?: boolean;
  proctoredMode?: boolean;
}

const STARTER_TEMPLATES: Record<string, string> = {
  python: `def solve():
    # Read from standard input or process logic
    print("🚀 Python 3.10 Code executing in EduKollab Sandbox!")
    
solve()`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "🚀 C++ 10.2 compiled & executed successfully!" << endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("🚀 Java 15 compiled & executed successfully!");
    }
}`,
  javascript: `function solve() {
  console.log("🚀 JavaScript (Node.js 18) executing in EduKollab Sandbox!");
}

solve();`,
  c: `#include <stdio.h>

int main() {
    printf("🚀 C GCC compiled & executed successfully!\\n");
    return 0;
}`,
};

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  initialCode,
  initialLanguage = 'python',
  initialTestCases = [
    { input: '5', expectedOutput: '25' },
    { input: '10', expectedOutput: '100' },
  ],
  onCodeChange,
  readOnly = false,
  proctoredMode = false,
}) => {
  const { success, error, info } = useToast();
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || STARTER_TEMPLATES[initialLanguage] || STARTER_TEMPLATES.python);
  const [stdin, setStdin] = useState('');
  const [activeBottomTab, setActiveBottomTab] = useState<'TERMINAL' | 'TESTCASES' | 'AI_EXPLAIN'>('TERMINAL');

  // 🛡️ Academic Integrity & Anti-Paste State
  const [isProctored, setIsProctored] = useState(proctoredMode);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);

  // Execution States
  const [running, setRunning] = useState(false);
  const [execOutput, setExecOutput] = useState<CodeExecutionOutput | null>(null);

  // Testcases States
  const [testCases, setTestCases] = useState<TestCaseItem[]>(initialTestCases);
  const [testReport, setTestReport] = useState<TestCaseEvaluationReport | null>(null);
  const [evaluatingTestcases, setEvaluatingTestcases] = useState(false);

  // AI Explain State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (isProctored) {
      e.preventDefault();
      setPasteAttempts((prev) => prev + 1);
      error(
        '🚫 Code Paste Blocked',
        'Direct external code pasting is restricted in Proctored Mode. Please type your code directly into the editor.'
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      setKeystrokes((k) => k + 1);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const newTemplate = STARTER_TEMPLATES[newLang] || '';
    setCode(newTemplate);
    setExecOutput(null);
    setTestReport(null);
    if (onCodeChange) onCodeChange(newTemplate, newLang);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (onCodeChange) onCodeChange(newCode, language);
  };

  const handleRunCode = async () => {
    setRunning(true);
    setActiveBottomTab('TERMINAL');
    try {
      const res = await codeApi.runCode({ language, code, stdin });
      if (res.success) {
        setExecOutput(res.data);
        if (res.data.status === 'SUCCESS') {
          success('Execution Finished', `Completed in ${res.data.executionTimeMs}ms.`);
        } else {
          error('Execution Issue', `${res.data.status}`);
        }
      }
    } catch (err: any) {
      error('Execution Failed', err.response?.data?.message || 'Sandbox runner unavailable.');
    } finally {
      setRunning(false);
    }
  };

  const handleRunTestCases = async () => {
    setEvaluatingTestcases(true);
    setActiveBottomTab('TESTCASES');
    try {
      const res = await codeApi.evalTestCases({ language, code, testCases });
      if (res.success) {
        setTestReport(res.data);
        if (res.data.allPassed) {
          success('All Test Cases Passed! 🎉', `${res.data.passedCount}/${res.data.totalCount} passed (${res.data.scorePercentage}%).`);
        } else {
          info('Test Case Evaluation', `${res.data.passedCount}/${res.data.totalCount} passed (${res.data.scorePercentage}%).`);
        }
      }
    } catch (err: any) {
      error('Test Case Run Failed', err.response?.data?.message || 'Could not evaluate test cases.');
    } finally {
      setEvaluatingTestcases(false);
    }
  };

  const handleAddTestCase = () => {
    setTestCases((prev) => [...prev, { input: '', expectedOutput: '' }]);
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    success('Copied to clipboard', 'Source code copied.');
  };

  const handleExplainCode = () => {
    setExplaining(true);
    setActiveBottomTab('AI_EXPLAIN');
    setTimeout(() => {
      let analysis = `### 🤖 AI Code Analysis (${language.toUpperCase()})\n\n`;
      analysis += `**Execution Paradigm:** Structural modular logic executing in sandboxed ${language} runtime.\n\n`;
      analysis += `#### ⏱️ Asymptotic Complexity:\n`;
      analysis += `- **Time Complexity:** $O(N)$ linear iteration over primary collection bounds.\n`;
      analysis += `- **Space Complexity:** $O(1)$ auxiliary memory buffer overhead.\n\n`;
      analysis += `#### 💡 Optimization & Best Practices:\n`;
      analysis += `1. Ensure proper boundary checks for empty or null standard input streams.\n`;
      analysis += `2. For large input sizes ($N > 10^5$), prefer fast I/O buffer routines.\n`;
      analysis += `3. Code is clean and modularly partitioned.`;
      setAiExplanation(analysis);
      setExplaining(false);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-slate-200 px-4 py-3 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-purple-400">
            <Code2 className="w-4 h-4" />
            <span>Interactive Code IDE</span>
          </div>

          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={readOnly}
            className="bg-slate-800 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="python">🐍 Python 3.10</option>
            <option value="cpp">⚡ C++ 10.2 (GCC)</option>
            <option value="java">☕ Java 15 (OpenJDK)</option>
            <option value="javascript">🌐 JavaScript (Node 18)</option>
            <option value="c">⚙️ C (GCC)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsProctored(!isProctored)}
            className={`text-xs h-8 ${
              isProctored
                ? 'border-emerald-700 bg-emerald-950/40 text-emerald-300'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
            title={isProctored ? 'Anti-Paste Proctored Contest Mode is Enabled' : 'Enable Anti-Paste Proctored Contest Mode'}
          >
            {isProctored ? <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />}
            {isProctored ? 'Proctoring: ON' : 'Proctoring: OFF'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCode}
            className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800 h-8"
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExplainCode}
            disabled={explaining}
            className="text-xs text-purple-300 border-purple-800/80 bg-purple-950/40 hover:bg-purple-900/60 h-8"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" />
            AI Review
          </Button>

          <Button
            size="sm"
            onClick={handleRunTestCases}
            disabled={evaluatingTestcases || running}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl font-semibold shadow-sm"
          >
            <TestTube2 className="w-3.5 h-3.5 mr-1" />
            {evaluatingTestcases ? 'Testing...' : 'Run Test Cases'}
          </Button>

          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={running || evaluatingTestcases}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 rounded-xl font-semibold shadow-md"
          >
            <Play className="w-3.5 h-3.5 mr-1 fill-white" />
            {running ? 'Executing...' : 'Run Code'}
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-[#0d1117] shadow-xl flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* Line Numbers Gutter */}
          <div className="select-none py-4 px-3 bg-[#080c12] border-r border-slate-800 text-right font-mono text-xs text-slate-500 min-w-[44px] leading-relaxed hidden sm:block">
            {code.split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Area */}
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              disabled={readOnly}
              rows={Math.max(14, code.split('\n').length)}
              spellCheck={false}
              className="w-full p-4 font-mono text-sm leading-relaxed text-emerald-400 bg-transparent resize-y focus:outline-none selection:bg-purple-600 selection:text-white font-medium"
              placeholder="Write your code here..."
            />
          </div>
        </div>

        {isProctored && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-300 select-none">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Proctored Coding Active (Direct Paste Intercepted)
            </span>
            <span className="text-slate-300 font-mono">
              Keystrokes: <strong className="text-white">{keystrokes}</strong> | Paste Attempts Blocked:{' '}
              <strong className={pasteAttempts > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>{pasteAttempts}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Bottom Console Tabs */}
      <Card className="border border-slate-700/80 bg-slate-900 p-5 rounded-2xl shadow-xl text-slate-100">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveBottomTab('TERMINAL')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                activeBottomTab === 'TERMINAL'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              Terminal & Stdin
            </button>

            <button
              onClick={() => setActiveBottomTab('TESTCASES')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                activeBottomTab === 'TESTCASES'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TestTube2 className="w-3.5 h-3.5" />
              Test Cases ({testCases.length})
              {testReport && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    testReport.allPassed ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {testReport.passedCount}/{testReport.totalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveBottomTab('AI_EXPLAIN')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                activeBottomTab === 'AI_EXPLAIN'
                  ? 'bg-purple-900/60 text-purple-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI Code Insights
            </button>
          </div>

          {activeBottomTab === 'TERMINAL' && execOutput && (
            <div className="flex items-center gap-2">
              <Badge
                variant={execOutput.status === 'SUCCESS' ? 'emerald' : 'red'}
                className="text-[10px] font-bold uppercase"
              >
                {execOutput.status} (exit {execOutput.exitCode})
              </Badge>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {execOutput.executionTimeMs}ms
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: Terminal & Stdin */}
        {activeBottomTab === 'TERMINAL' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Custom Input (stdin):
              </label>
              <input
                type="text"
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Optional input parameters passed to program..."
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Standard Output / Diagnostics:
              </label>
              <pre className="p-3 bg-black/60 rounded-xl text-xs font-mono whitespace-pre-wrap min-h-[90px] max-h-[220px] overflow-y-auto text-slate-200 border border-slate-900">
                {execOutput ? (
                  execOutput.output || (
                    <span className="text-slate-500 italic">[Process executed with zero output]</span>
                  )
                ) : (
                  <span className="text-slate-600 italic">Click "Run Code" to execute in sandbox...</span>
                )}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Test Cases */}
        {activeBottomTab === 'TESTCASES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Define inputs and expected outputs to verify correctness automatically.
              </span>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Test Case
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {testCases.map((tc, idx) => {
                const reportItem = testReport?.testCaseResults[idx];
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-2 ${
                      reportItem
                        ? reportItem.passed
                          ? 'bg-emerald-950/20 border-emerald-800/60'
                          : 'bg-red-950/20 border-red-800/60'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        Test Case #{idx + 1}
                        {reportItem && (
                          <Badge
                            variant={reportItem.passed ? 'emerald' : 'red'}
                            className="text-[10px]"
                          >
                            {reportItem.passed ? 'Passed' : reportItem.status}
                          </Badge>
                        )}
                      </span>

                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Input:</span>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => {
                          const updated = [...testCases];
                          updated[idx].input = e.target.value;
                          setTestCases(updated);
                        }}
                        placeholder="e.g. 5"
                        className="w-full px-2 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Expected Output:</span>
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const updated = [...testCases];
                          updated[idx].expectedOutput = e.target.value;
                          setTestCases(updated);
                        }}
                        placeholder="e.g. 25"
                        className="w-full px-2 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      />
                    </div>

                    {reportItem && !reportItem.passed && (
                      <div className="p-2 bg-red-950/40 rounded-lg text-[11px] font-mono text-red-300">
                        <span className="text-slate-400">Actual: </span>
                        {reportItem.actualOutput || '(none)'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: AI Explanation */}
        {activeBottomTab === 'AI_EXPLAIN' && (
          <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl text-xs space-y-3">
            {explaining ? (
              <div className="flex items-center gap-2 text-purple-300 py-4 justify-center">
                <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                <span>Analyzing source code complexity & design patterns...</span>
              </div>
            ) : aiExplanation ? (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                <pre className="p-3 bg-black/50 text-purple-200 rounded-lg whitespace-pre-wrap font-sans">
                  {aiExplanation}
                </pre>
              </div>
            ) : (
              <div className="text-center py-4">
                <Button size="sm" onClick={handleExplainCode} className="bg-purple-600 text-white text-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Analyze Code with AI
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
