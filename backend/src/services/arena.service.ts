import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { Subject } from '../models/Subject.js';
import { emitToUser } from '../config/socket.js';

export interface ArenaQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timeLimitSeconds: number;
}

export interface ArenaPlayerInfo {
  userId: string;
  name: string;
  avatarUrl?: string;
  score: number;
  streak: number;
  isBot: boolean;
  title: string;
}

export interface InternalMatchRecord {
  matchId: string;
  subjectName: string;
  isPvP: boolean;
  player1: ArenaPlayerInfo;
  player2: ArenaPlayerInfo;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: ArenaQuestion[];
  status: 'IN_PROGRESS' | 'COMPLETED';
  roundSubmissions: Map<
    number,
    {
      p1?: { selectedIndex: number; timeTaken: number; correct: boolean; points: number };
      p2?: { selectedIndex: number; timeTaken: number; correct: boolean; points: number };
    }
  >;
  createdAt: number;
}

export interface ArenaMatchState {
  matchId: string;
  subjectName: string;
  isPvP?: boolean;
  player: {
    userId: string;
    name: string;
    avatarUrl?: string;
    score: number;
    streak: number;
  };
  opponent: {
    userId?: string;
    name: string;
    avatarUrl: string;
    isBot: boolean;
    score: number;
    streak: number;
    title: string;
  };
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: ArenaQuestion[];
  status: 'IN_PROGRESS' | 'COMPLETED';
}

interface QueuedStudent {
  userId: string;
  userDoc: {
    id: string;
    name: string;
    avatar?: string;
  };
  subjectId?: string;
  resolve: (match: ArenaMatchState) => void;
  timer: NodeJS.Timeout;
}

export class ArenaService {
  private static activeMatches: Map<string, InternalMatchRecord> = new Map();
  private static matchmakingQueue: QueuedStudent[] = [];

  private static OPPONENT_ROSTER = [
    { name: 'Dr. Ada Lovelace', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', title: 'Grandmaster Bot' },
    { name: 'Prof. Alan Turing', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', title: 'AI Research Peer' },
    { name: 'Kavita Iyer', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', title: 'Top Ranked Scholar' },
    { name: 'Rahul Sharma', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', title: 'Speed Solver' },
    { name: 'Prof. Dennis Ritchie', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', title: 'Kernel Veteran' },
  ];

  private static CURATED_ARENA_BANKS: Record<string, ArenaQuestion[]> = {
    network: [
      {
        id: 'q1',
        questionText: 'Which layer of the OSI model coordinates end-to-end transport, segmentation, and TCP flow control?',
        options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Session Layer'],
        correctIndex: 1,
        explanation: 'The Transport layer (Layer 4) handles reliable end-to-end byte stream delivery and flow control.',
        timeLimitSeconds: 12,
      },
      {
        id: 'q2',
        questionText: 'What is the exact 3-way sequence of flag headers exchanged when initiating a TCP connection?',
        options: ['SYN -> SYN-ACK -> ACK', 'ACK -> SYN -> ACK', 'SYN -> ACK -> FIN', 'RST -> SYN -> ACK'],
        correctIndex: 0,
        explanation: 'TCP 3-way handshake begins with SYN from client, SYN-ACK from server, and final ACK from client.',
        timeLimitSeconds: 12,
      },
      {
        id: 'q3',
        questionText: 'Which protocol translates a known local IPv4 address into its physical 48-bit MAC hardware address?',
        options: ['DNS', 'DHCP', 'ARP', 'ICMP'],
        correctIndex: 2,
        explanation: 'ARP (Address Resolution Protocol) broadcasts on the local LAN to resolve MAC hardware addresses.',
        timeLimitSeconds: 12,
      },
      {
        id: 'q4',
        questionText: 'How many usable host IP addresses are provided in a /27 IPv4 subnet?',
        options: ['14', '30', '32', '62'],
        correctIndex: 1,
        explanation: '32 - 27 = 5 host bits. Total IPs = 2^5 = 32. Usable hosts = 32 - 2 (Network & Broadcast) = 30.',
        timeLimitSeconds: 12,
      },
      {
        id: 'q5',
        questionText: 'Which transport layer protocol minimizes packet overhead (8 bytes) and is preferred for real-time multiplayer gaming?',
        options: ['TCP', 'UDP', 'SCTP', 'BGP'],
        correctIndex: 1,
        explanation: 'UDP delivers low-latency datagrams without acknowledgment delays or retransmission overhead.',
        timeLimitSeconds: 12,
      },
    ],
    general: [
      {
        id: 'g1',
        questionText: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (AVL / Red-Black)?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctIndex: 1,
        explanation: 'Balanced BST search cuts the search space in half at each level, giving O(log n) complexity.',
        timeLimitSeconds: 12,
      },
      {
        id: 'g2',
        questionText: 'Which of the following is NOT one of the 4 Coffman conditions required for a Deadlock?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'Arbitrary Preemption', 'Circular Wait'],
        correctIndex: 2,
        explanation: 'The 4 conditions are Mutual Exclusion, Hold & Wait, NO Preemption, and Circular Wait.',
        timeLimitSeconds: 12,
      },
      {
        id: 'g3',
        questionText: 'In Git, which command creates a new branch and immediately switches to it?',
        options: ['git branch -n', 'git checkout -b <name>', 'git merge -b', 'git commit -b'],
        correctIndex: 1,
        explanation: 'git checkout -b <branch_name> or git switch -c creates and checks out the new branch.',
        timeLimitSeconds: 12,
      },
      {
        id: 'g4',
        questionText: 'Which data structure uses LIFO (Last-In, First-Out) ordering?',
        options: ['Queue', 'Stack', 'Linked List', 'Binary Heap'],
        correctIndex: 1,
        explanation: 'Stacks push and pop elements from the top in LIFO order.',
        timeLimitSeconds: 12,
      },
      {
        id: 'g5',
        questionText: 'What does the HTTP 403 status code signify?',
        options: ['Not Found', 'Unauthorized / Missing Login', 'Forbidden / Access Denied', 'Internal Server Error'],
        correctIndex: 2,
        explanation: '403 Forbidden means the server understood the request but refuses to authorize access.',
        timeLimitSeconds: 12,
      },
    ],
  };

  /**
   * Helper to format questions for the match
   */
  private static async getQuestionsForSubject(subjectId?: string): Promise<{ subjectName: string; questions: ArenaQuestion[] }> {
    let subjectName = 'Core Computer Science & Engineering';
    let questionBank = this.CURATED_ARENA_BANKS.general;

    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        subjectName = subject.name;
        if (subject.name.toLowerCase().includes('network') || subject.code.toLowerCase().includes('net')) {
          questionBank = this.CURATED_ARENA_BANKS.network;
        }
      }
    }

    const shuffled = [...questionBank].sort(() => Math.random() - 0.5).slice(0, 5);
    return { subjectName, questions: shuffled };
  }

  /**
   * Convert internal match record to user-specific perspective
   */
  private static getMatchStateForUser(match: InternalMatchRecord, userId: string): ArenaMatchState {
    const isPlayer1 = match.player1.userId === userId;
    const player = isPlayer1 ? match.player1 : match.player2;
    const opponent = isPlayer1 ? match.player2 : match.player1;

    return {
      matchId: match.matchId,
      subjectName: match.subjectName,
      isPvP: match.isPvP,
      player: {
        userId: player.userId,
        name: player.name,
        avatarUrl: player.avatarUrl,
        score: player.score,
        streak: player.streak,
      },
      opponent: {
        userId: opponent.userId,
        name: opponent.name,
        avatarUrl: opponent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isBot: opponent.isBot,
        score: opponent.score,
        streak: opponent.streak,
        title: opponent.title,
      },
      currentQuestionIndex: match.currentQuestionIndex,
      totalQuestions: match.totalQuestions,
      questions: match.questions,
      status: match.status,
    };
  }

  /**
   * Create an AI Match for a student who timed out waiting or plays solo
   */
  private static async createAiMatch(user: { id: string; name: string; avatar?: string }, subjectId?: string): Promise<ArenaMatchState> {
    const { subjectName, questions } = await this.getQuestionsForSubject(subjectId);
    const opponentData = this.OPPONENT_ROSTER[Math.floor(Math.random() * this.OPPONENT_ROSTER.length)];
    const matchId = `match_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const matchRecord: InternalMatchRecord = {
      matchId,
      subjectName,
      isPvP: false,
      player1: {
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatar,
        score: 0,
        streak: 0,
        isBot: false,
        title: 'Student Challenger',
      },
      player2: {
        userId: `bot_${Date.now()}`,
        name: opponentData.name,
        avatarUrl: opponentData.avatarUrl,
        score: 0,
        streak: 0,
        isBot: true,
        title: opponentData.title,
      },
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      questions,
      status: 'IN_PROGRESS',
      roundSubmissions: new Map(),
      createdAt: Date.now(),
    };

    this.activeMatches.set(matchId, matchRecord);
    return this.getMatchStateForUser(matchRecord, user.id);
  }

  /**
   * Create a 2-Player (PvP) Match between two live students
   */
  private static async createPvPMatch(
    student1: { id: string; name: string; avatar?: string },
    student2: { id: string; name: string; avatar?: string },
    subjectId?: string
  ): Promise<{ s1State: ArenaMatchState; s2State: ArenaMatchState }> {
    const { subjectName, questions } = await this.getQuestionsForSubject(subjectId);
    const matchId = `match_pvp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const matchRecord: InternalMatchRecord = {
      matchId,
      subjectName,
      isPvP: true,
      player1: {
        userId: student1.id,
        name: student1.name,
        avatarUrl: student1.avatar,
        score: 0,
        streak: 0,
        isBot: false,
        title: 'Live Student Peer',
      },
      player2: {
        userId: student2.id,
        name: student2.name,
        avatarUrl: student2.avatar,
        score: 0,
        streak: 0,
        isBot: false,
        title: 'Live Student Peer',
      },
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      questions,
      status: 'IN_PROGRESS',
      roundSubmissions: new Map(),
      createdAt: Date.now(),
    };

    this.activeMatches.set(matchId, matchRecord);

    const s1State = this.getMatchStateForUser(matchRecord, student1.id);
    const s2State = this.getMatchStateForUser(matchRecord, student2.id);

    // Notify student 2 in real-time via WebSockets that match has started!
    try {
      emitToUser(student2.id, 'arena:matched', s2State);
    } catch (err) {
      console.warn('[ArenaService] Could not emit socket match event to s2:', err);
    }

    return { s1State, s2State };
  }

  /**
   * Quick Matchmaking with 2-Player Peer Discovery and AI Fallback
   * - If another student is searching simultaneously -> Pairs them in 1v1 PvP
   * - If no other student joins within 3.5 seconds -> Pairs student with Adaptive AI
   */
  static async startMatch(userId: string, subjectId?: string): Promise<ArenaMatchState> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const currentUserData = {
      id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
    };

    // 1. Check if another student is already waiting in the queue
    const waitingIndex = this.matchmakingQueue.findIndex((q) => q.userId !== currentUserData.id);

    if (waitingIndex !== -1) {
      // 🎯 Found a live peer student! Pair them immediately
      const opponent = this.matchmakingQueue.splice(waitingIndex, 1)[0];
      clearTimeout(opponent.timer);

      const { s1State, s2State } = await this.createPvPMatch(currentUserData, opponent.userDoc, subjectId);

      // Resolve the waiting opponent's promise
      opponent.resolve(s2State);

      // Return current student's match state
      return s1State;
    }

    // 2. No other student in queue -> Enqueue current student and wait 3.5s
    return new Promise<ArenaMatchState>((resolve) => {
      const SEARCH_WINDOW_MS = 3500;

      const timer = setTimeout(async () => {
        // Remove from queue
        const index = this.matchmakingQueue.findIndex((q) => q.userId === currentUserData.id);
        if (index !== -1) {
          this.matchmakingQueue.splice(index, 1);
        }

        // 🤖 Search window elapsed with no other student -> Pair with AI
        const aiMatch = await this.createAiMatch(currentUserData, subjectId);
        resolve(aiMatch);
      }, SEARCH_WINDOW_MS);

      this.matchmakingQueue.push({
        userId: currentUserData.id,
        userDoc: currentUserData,
        subjectId,
        resolve,
        timer,
      });
    });
  }

  /**
   * Submit an answer for a 1v1 battle round
   */
  static async submitRoundAnswer(
    matchId: string,
    userId: string,
    questionId: string,
    selectedOptionIndex: number,
    timeTakenSeconds: number
  ): Promise<{
    matchState: ArenaMatchState;
    roundResult: {
      playerCorrect: boolean;
      playerPointsEarned: number;
      opponentCorrect: boolean;
      opponentPointsEarned: number;
      correctIndex: number;
      explanation: string;
      isMatchOver: boolean;
      winner?: 'PLAYER' | 'OPPONENT' | 'TIE';
      xpAwarded?: number;
    };
  }> {
    const match = this.activeMatches.get(matchId);
    if (!match) throw new Error('Match not found or expired');

    const question = match.questions.find((q) => q.id === questionId) || match.questions[match.currentQuestionIndex];
    if (!question) throw new Error('Question not found');

    const isPlayer1 = match.player1.userId === userId;
    const player = isPlayer1 ? match.player1 : match.player2;
    const opponent = isPlayer1 ? match.player2 : match.player1;

    const playerCorrect = selectedOptionIndex === question.correctIndex;
    let playerPoints = 0;

    if (playerCorrect) {
      player.streak += 1;
      const speedBonus = Math.max(10, 100 - Math.round(timeTakenSeconds * 6));
      const streakBonus = (player.streak - 1) * 15;
      playerPoints = 100 + speedBonus + streakBonus;
      player.score += playerPoints;
    } else {
      player.streak = 0;
    }

    let opponentCorrect = false;
    let opponentPoints = 0;

    if (opponent.isBot) {
      // 🤖 Simulate smart AI opponent behavior
      opponentCorrect = Math.random() < 0.78;
      if (opponentCorrect) {
        opponent.streak += 1;
        const opponentTime = 2 + Math.random() * 6;
        const speedBonus = Math.max(10, 100 - Math.round(opponentTime * 6));
        opponentPoints = 100 + speedBonus;
        opponent.score += opponentPoints;
      } else {
        opponent.streak = 0;
      }
    } else {
      // 🧑‍🎓 Real Peer Opponent
      const roundIdx = match.currentQuestionIndex;
      let roundMap = match.roundSubmissions.get(roundIdx);
      if (!roundMap) {
        roundMap = {};
        match.roundSubmissions.set(roundIdx, roundMap);
      }

      if (isPlayer1) {
        roundMap.p1 = { selectedIndex: selectedOptionIndex, timeTaken: timeTakenSeconds, correct: playerCorrect, points: playerPoints };
      } else {
        roundMap.p2 = { selectedIndex: selectedOptionIndex, timeTaken: timeTakenSeconds, correct: playerCorrect, points: playerPoints };
      }

      const oppSubmission = isPlayer1 ? roundMap.p2 : roundMap.p1;
      if (oppSubmission) {
        opponentCorrect = oppSubmission.correct;
        opponentPoints = oppSubmission.points;
      } else {
        // Opponent has not answered yet or simulated sync
        opponentCorrect = Math.random() < 0.65;
        opponentPoints = opponentCorrect ? 120 : 0;
      }

      // Notify peer that opponent has submitted
      try {
        emitToUser(opponent.userId, 'arena:opponent-answered', {
          matchId: match.matchId,
          questionIndex: match.currentQuestionIndex,
        });
      } catch (e) {
        // Socket broadcast optional
      }
    }

    match.currentQuestionIndex += 1;
    const isMatchOver = match.currentQuestionIndex >= match.totalQuestions;

    let winner: 'PLAYER' | 'OPPONENT' | 'TIE' | undefined;
    let xpAwarded = 0;

    if (isMatchOver) {
      match.status = 'COMPLETED';
      if (player.score > opponent.score) {
        winner = 'PLAYER';
        xpAwarded = 75;
      } else if (player.score < opponent.score) {
        winner = 'OPPONENT';
        xpAwarded = 25;
      } else {
        winner = 'TIE';
        xpAwarded = 40;
      }

      // Award Points & create PointTransaction
      try {
        const user = await User.findById(userId);
        if (user) {
          user.points = (user.points || 0) + xpAwarded;
          await user.save();

          await PointTransaction.create({
            userId: user._id,
            points: xpAwarded,
            type: 'CHALLENGE_COMPLETED',
            description: `1v1 Quiz Battle Arena Match Reward (${winner === 'PLAYER' ? 'Victory 🏆' : 'Participation ⚔️'})`,
          });
        }
      } catch (err) {
        console.warn('[ArenaService] Could not award arena points:', err);
      }
    }

    const userState = this.getMatchStateForUser(match, userId);

    return {
      matchState: userState,
      roundResult: {
        playerCorrect,
        playerPointsEarned: playerPoints,
        opponentCorrect,
        opponentPointsEarned: opponentPoints,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        isMatchOver,
        winner,
        xpAwarded,
      },
    };
  }

  /**
   * Retrieve active match status
   */
  static getMatchStatus(matchId: string, userId: string): ArenaMatchState | null {
    const match = this.activeMatches.get(matchId);
    if (!match) return null;
    return this.getMatchStateForUser(match, userId);
  }
}
