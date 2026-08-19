import React, { useState } from 'react';
import { CodeEditorPanel } from '../../components/code/CodeEditorPanel';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Code2,
  Terminal,
  Cpu,
  Zap,
  Sparkles,
  Layers,
  BookOpen,
  CheckCircle2,
  Play,
  ShieldCheck,
  Flame,
} from 'lucide-react';

const ALGO_PRESETS = [
  {
    name: 'Fibonacci Sequence',
    lang: 'python',
    code: `# Fibonacci Generator in Python 3.10
def fibonacci(n):
    if n <= 0:
        return []
    if n == 1:
        return [0]
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq

terms = 10
result = fibonacci(terms)
print(f"Generated first {terms} Fibonacci numbers:")
print(" -> ".join(map(str, result)))
`,
    testCases: [
      { input: '5', expectedOutput: '25' },
      { input: '12', expectedOutput: '144' },
    ],
  },
  {
    name: 'Fast Prime Sieve',
    lang: 'cpp',
    code: `// Prime Sieve in C++ (GCC 10.2)
#include <iostream>
#include <vector>

void sieve(int n) {
    std::vector<bool> isPrime(n + 1, true);
    isPrime[0] = isPrime[1] = false;
    
    for (int p = 2; p * p <= n; p++) {
        if (isPrime[p]) {
            for (int i = p * p; i <= n; i += p)
                isPrime[i] = false;
        }
    }
    
    std::cout << "Primes up to " << n << ":\\n";
    for (int p = 2; p <= n; p++) {
        if (isPrime[p]) std::cout << p << " ";
    }
    std::cout << "\\n";
}

int main() {
    sieve(50);
    return 0;
}
`,
    testCases: [
      { input: '10', expectedOutput: '2 3 5 7' },
      { input: '20', expectedOutput: '2 3 5 7 11 13 17 19' },
    ],
  },
  {
    name: 'Palindrome Checker',
    lang: 'javascript',
    code: `// String Palindrome Validator (Node.js 18)
function isPalindrome(str) {
    const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const reversed = clean.split('').reverse().join('');
    return clean === reversed;
}

const testStrings = ["racecar", "hello world", "A man, a plan, a canal: Panama"];

testStrings.forEach(s => {
    console.log(\`"\${s}" -> \${isPalindrome(s) ? '✅ PALINDROME' : '❌ NOT PALINDROME'}\`);
});
`,
    testCases: [
      { input: 'racecar', expectedOutput: 'true' },
      { input: 'hello', expectedOutput: 'false' },
    ],
  },
  {
    name: 'Binary Search Tree',
    lang: 'java',
    code: `// Binary Search in Java 15 (OpenJDK)
import java.util.Arrays;

public class Solution {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] numbers = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int index = binarySearch(numbers, target);
        
        System.out.println("Array: " + Arrays.toString(numbers));
        System.out.println("Target " + target + " found at index: " + index);
    }
}
`,
    testCases: [
      { input: '23', expectedOutput: '5' },
      { input: '99', expectedOutput: '-1' },
    ],
  },
];

export const CodePlaygroundPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(ALGO_PRESETS[0]);
  const [editorKey, setEditorKey] = useState(0);

  const handleSelectPreset = (preset: typeof ALGO_PRESETS[0]) => {
    setSelectedPreset(preset);
    setEditorKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* High-Contrast Crisp Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl text-white">
        {/* Subtle Ambient Accents */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-lg flex items-center justify-center">
                  <Terminal className="w-6 h-6" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Interactive Code Playground
                </h1>
                <span className="px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-bold shadow-sm">
                  Multi-Language Sandbox
                </span>
              </div>
              <p className="text-sm font-medium text-slate-300 max-w-3xl leading-relaxed">
                Compile, execute, and stress-test programs in <strong>Python</strong>, <strong>C++</strong>, <strong>Java</strong>, <strong>JavaScript</strong>, and <strong>C</strong> in isolated zero-latency sandboxes with automated test case validation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Zero-Latency Execution</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Isolated Sandbox</span>
              </div>
            </div>
          </div>

          {/* Quick Starter Presets Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Quick Starter Algorithms:
            </span>
            {ALGO_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedPreset.name === preset.name
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-2 ring-purple-400/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main IDE Workspace */}
      <CodeEditorPanel
        key={editorKey}
        initialLanguage={selectedPreset.lang}
        initialCode={selectedPreset.code}
        initialTestCases={selectedPreset.testCases}
      />
    </div>
  );
};
