import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export interface ExecutionOutput {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  executionTimeMs: number;
  status: 'SUCCESS' | 'RUNTIME_ERROR' | 'COMPILE_ERROR' | 'TIME_LIMIT_EXCEEDED';
  securityViolation?: boolean;
}

export interface TestCaseItem {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface TestCaseResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden?: boolean;
  executionTimeMs: number;
  status: 'PASSED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  errorDetails?: string;
}

export interface TestCaseEvaluationReport {
  language: string;
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  scorePercentage: number;
  totalExecutionTimeMs: number;
  testCaseResults: TestCaseResult[];
}

export class CodeExecutionService {
  /**
   * Static security scan against dangerous system/network calls before running code
   */
  private static inspectCodeSafety(lang: string, code: string): { safe: boolean; reason?: string } {
    const l = lang.toLowerCase();

    // Dangerous system calls blacklist
    const DANGEROUS_PATTERNS: { lang: string; pattern: RegExp; desc: string }[] = [
      // Python security blocks
      { lang: 'python', pattern: /(__import__|import)\s*(\('os'|os|\('subprocess'|subprocess|\('sys'|sys)/i, desc: 'Unrestricted system command execution / process spawning' },
      { lang: 'python', pattern: /(__import__|import)\s*(\('socket'|socket|\('http'|http|\('urllib'|urllib|\('requests'|requests)/i, desc: 'Outbound network connections' },
      { lang: 'python', pattern: /(__import__|import)\s*(\('shutil'|shutil|\('pathlib'|pathlib)/i, desc: 'File system destruction / modification' },
      { lang: 'python', pattern: /(open\s*\(|os\.remove|os\.rmdir|os\.unlink)/i, desc: 'Direct host file system access' },

      // C & C++ security blocks
      { lang: 'cpp', pattern: /#include\s*<(sys\/socket\.h|netinet\/in\.h|arpa\/inet\.h|unistd\.h)>/i, desc: 'Network / low-level POSIX sockets' },
      { lang: 'cpp', pattern: /\b(system|fork|execve|execv|popen|remove|kill)\s*\(/i, desc: 'System shell or fork invocation' },
      { lang: 'c', pattern: /#include\s*<(sys\/socket\.h|netinet\/in\.h|arpa\/inet\.h|unistd\.h)>/i, desc: 'Network / low-level POSIX sockets' },
      { lang: 'c', pattern: /\b(system|fork|execve|execv|popen|remove|kill)\s*\(/i, desc: 'System shell or fork invocation' },

      // JavaScript / Node security blocks
      { lang: 'javascript', pattern: /require\s*\(\s*['"](child_process|fs|net|http|https|dgram|cluster)['"]\s*\)/i, desc: 'Node.js host filesystem/network/process module' },
      { lang: 'javascript', pattern: /\b(process\.exit|process\.kill|process\.env)\b/i, desc: 'Host process termination / environment inspection' },

      // Java security blocks
      { lang: 'java', pattern: /(Runtime\.getRuntime|ProcessBuilder|java\.net\.|java\.nio\.file)/i, desc: 'Java Process execution / network socket' },
    ];

    for (const rule of DANGEROUS_PATTERNS) {
      if ((l.includes(rule.lang) || rule.lang === l) && rule.pattern.test(code)) {
        return {
          safe: false,
          reason: `Security Policy Violation: ${rule.desc} is prohibited in EduKollab sandboxes.`,
        };
      }
    }

    return { safe: true };
  }

  /**
   * Secure local sandboxed execution with timeout, memory buffer, and environment sanitization
   */
  static async executeCode(
    rawLanguage: string,
    code: string,
    stdin: string = ''
  ): Promise<ExecutionOutput> {
    const lang = rawLanguage.toLowerCase().trim();

    // 1. Static Security Pre-Check
    const safetyCheck = this.inspectCodeSafety(lang, code);
    if (!safetyCheck.safe) {
      return {
        stdout: '',
        stderr: `🛡️ ${safetyCheck.reason}`,
        output: `🛡️ ${safetyCheck.reason}`,
        exitCode: 1,
        executionTimeMs: 0,
        status: 'RUNTIME_ERROR',
        securityViolation: true,
      };
    }

    const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edukollab_run_'));
    const startTime = Date.now();

    try {
      if (lang === 'python' || lang === 'py') {
        const filePath = path.join(sandboxDir, 'main.py');
        fs.writeFileSync(filePath, code, 'utf-8');
        return await this.spawnRunner('python3', ['main.py'], sandboxDir, stdin, startTime);
      }

      if (lang === 'javascript' || lang === 'js') {
        const filePath = path.join(sandboxDir, 'index.js');
        fs.writeFileSync(filePath, code, 'utf-8');
        return await this.spawnRunner('node', ['index.js'], sandboxDir, stdin, startTime);
      }

      if (lang === 'typescript' || lang === 'ts') {
        const filePath = path.join(sandboxDir, 'index.ts');
        fs.writeFileSync(filePath, code, 'utf-8');
        return await this.spawnRunner('npx', ['tsx', 'index.ts'], sandboxDir, stdin, startTime);
      }

      if (lang === 'cpp' || lang === 'c++') {
        const srcFile = path.join(sandboxDir, 'main.cpp');
        fs.writeFileSync(srcFile, code, 'utf-8');

        // Compile
        const compileRes = await this.spawnRunner('g++', ['-O2', 'main.cpp', '-o', 'main.out'], sandboxDir, '', startTime, 10000);
        if (compileRes.exitCode !== 0) {
          return {
            ...compileRes,
            status: 'COMPILE_ERROR',
          };
        }

        return await this.spawnRunner('./main.out', [], sandboxDir, stdin, startTime);
      }

      if (lang === 'c') {
        const srcFile = path.join(sandboxDir, 'main.c');
        fs.writeFileSync(srcFile, code, 'utf-8');

        // Compile
        const compileRes = await this.spawnRunner('gcc', ['-O2', 'main.c', '-o', 'main.out'], sandboxDir, '', startTime, 10000);
        if (compileRes.exitCode !== 0) {
          return {
            ...compileRes,
            status: 'COMPILE_ERROR',
          };
        }

        return await this.spawnRunner('./main.out', [], sandboxDir, stdin, startTime);
      }

      if (lang === 'java') {
        const srcFile = path.join(sandboxDir, 'Main.java');
        fs.writeFileSync(srcFile, code, 'utf-8');

        // Compile
        const compileRes = await this.spawnRunner('javac', ['Main.java'], sandboxDir, '', startTime, 10000);
        if (compileRes.exitCode !== 0) {
          return {
            ...compileRes,
            status: 'COMPILE_ERROR',
          };
        }

        return await this.spawnRunner('java', ['Main'], sandboxDir, stdin, startTime);
      }

      // Default fallback: Try running as node script
      const filePath = path.join(sandboxDir, 'script.js');
      fs.writeFileSync(filePath, code, 'utf-8');
      return await this.spawnRunner('node', ['script.js'], sandboxDir, stdin, startTime);
    } catch (err: any) {
      const execTime = Date.now() - startTime;
      return {
        stdout: '',
        stderr: err?.message || 'Execution failed in sandbox',
        output: err?.message || 'Execution failed in sandbox',
        exitCode: 1,
        executionTimeMs: execTime,
        status: 'RUNTIME_ERROR',
      };
    } finally {
      try {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      } catch {}
    }
  }

  /**
   * Helper to spawn command with isolated sanitized environment, timeout & stdin
   */
  private static spawnRunner(
    cmd: string,
    args: string[],
    cwd: string,
    stdin: string,
    startTime: number,
    timeoutMs: number = 5000
  ): Promise<ExecutionOutput> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      // 🛡️ SANITIZED ENVIRONMENT: Strip all sensitive server variables (JWT_SECRET, MONGO_URI, etc.)
      const isolatedEnv: NodeJS.ProcessEnv = {
        PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        PYTHONUNBUFFERED: '1',
        LANG: 'en_US.UTF-8',
        NODE_ENV: 'production',
        TMPDIR: cwd,
        HOME: cwd,
      };

      const child = spawn(cmd, args, {
        cwd,
        env: isolatedEnv,
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      if (stdin) {
        child.stdin.write(stdin);
      }
      child.stdin.end();

      child.stdout.on('data', (chunk) => {
        if (stdout.length < 500000) stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        if (stderr.length < 500000) stderr += chunk.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        const execTime = Date.now() - startTime;
        resolve({
          stdout: '',
          stderr: err.message,
          output: err.message,
          exitCode: 1,
          executionTimeMs: execTime,
          status: 'RUNTIME_ERROR',
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const execTime = Date.now() - startTime;

        if (isTimedOut) {
          resolve({
            stdout,
            stderr: '⏱️ Time Limit Exceeded (Execution exceeded 5.0s safety limit)',
            output: '⏱️ Time Limit Exceeded (Execution exceeded 5.0s safety limit)',
            exitCode: 124,
            executionTimeMs: execTime,
            status: 'TIME_LIMIT_EXCEEDED',
          });
          return;
        }

        const exitCode = code === null ? 1 : code;
        const output = stdout || stderr || (exitCode === 0 ? '[Execution completed with 0 output]' : `Process exited with code ${exitCode}`);
        const status: ExecutionOutput['status'] = exitCode === 0 ? 'SUCCESS' : 'RUNTIME_ERROR';

        resolve({
          stdout,
          stderr,
          output,
          exitCode,
          executionTimeMs: execTime,
          status,
        });
      });
    });
  }

  /**
   * Evaluates user code against multiple test cases and calculates automated grading score
   */
  static async evaluateTestCases(
    language: string,
    code: string,
    testCases: TestCaseItem[]
  ): Promise<TestCaseEvaluationReport> {
    if (!testCases || testCases.length === 0) {
      const singleRun = await this.executeCode(language, code, '');
      return {
        language,
        passedCount: singleRun.status === 'SUCCESS' ? 1 : 0,
        totalCount: 1,
        allPassed: singleRun.status === 'SUCCESS',
        scorePercentage: singleRun.status === 'SUCCESS' ? 100 : 0,
        totalExecutionTimeMs: singleRun.executionTimeMs,
        testCaseResults: [
          {
            testCaseIndex: 1,
            input: '(none)',
            expectedOutput: '',
            actualOutput: singleRun.output,
            passed: singleRun.status === 'SUCCESS',
            executionTimeMs: singleRun.executionTimeMs,
            status: singleRun.status === 'SUCCESS' ? 'PASSED' : 'RUNTIME_ERROR',
            errorDetails: singleRun.stderr,
          },
        ],
      };
    }

    const testCaseResults: TestCaseResult[] = [];
    let passedCount = 0;
    let totalTime = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = await this.executeCode(language, code, tc.input);
      totalTime += result.executionTimeMs;

      const normalizedExpected = (tc.expectedOutput || '').trim().replace(/\r\n/g, '\n');
      const normalizedActual = (result.stdout || '').trim().replace(/\r\n/g, '\n');

      let status: TestCaseResult['status'] = 'WRONG_ANSWER';
      let passed = false;

      if (result.status === 'COMPILE_ERROR') {
        status = 'RUNTIME_ERROR';
      } else if (result.status === 'TIME_LIMIT_EXCEEDED') {
        status = 'TIME_LIMIT_EXCEEDED';
      } else if (result.exitCode === 0 && normalizedActual === normalizedExpected) {
        status = 'PASSED';
        passed = true;
        passedCount++;
      } else if (result.exitCode !== 0) {
        status = 'RUNTIME_ERROR';
      }

      testCaseResults.push({
        testCaseIndex: i + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.stdout || result.output,
        passed,
        isHidden: Boolean(tc.isHidden),
        executionTimeMs: result.executionTimeMs,
        status,
        errorDetails: result.stderr || undefined,
      });
    }

    const scorePercentage = Math.round((passedCount / testCases.length) * 100);

    return {
      language,
      passedCount,
      totalCount: testCases.length,
      allPassed: passedCount === testCases.length,
      scorePercentage,
      totalExecutionTimeMs: totalTime,
      testCaseResults,
    };
  }
}
