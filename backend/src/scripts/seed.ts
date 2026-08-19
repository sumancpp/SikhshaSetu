import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Class } from '../models/Class.js';
import { ClassMember } from '../models/ClassMember.js';
import { Subject } from '../models/Subject.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { Material } from '../models/Material.js';
import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { Challenge } from '../models/Challenge.js';
import { ChallengeAttempt } from '../models/ChallengeAttempt.js';
import { Achievement } from '../models/Achievement.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { ForumPost } from '../models/ForumPost.js';
import { ForumAnswer } from '../models/ForumAnswer.js';
import { Vote } from '../models/Vote.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { SYSTEM_ACHIEVEMENTS } from '../constants/achievements.js';

export const seedDatabase = async () => {
  console.log('🌱 Starting full ShikshaSetu official dataset seeding...');
  await connectDB();

  // Clean collections
  await Promise.all([
    User.deleteMany({}),
    Class.deleteMany({}),
    ClassMember.deleteMany({}),
    Subject.deleteMany({}),
    SubjectMember.deleteMany({}),
    Material.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    Quiz.deleteMany({}),
    QuizAttempt.deleteMany({}),
    Challenge.deleteMany({}),
    ChallengeAttempt.deleteMany({}),
    Achievement.deleteMany({}),
    UserAchievement.deleteMany({}),
    PointTransaction.deleteMany({}),
    ForumPost.deleteMany({}),
    ForumAnswer.deleteMany({}),
    Vote.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('🧹 Existing database wiped cleanly.');

  // 1. Seed System Achievements
  const seededAchievements = await Achievement.insertMany(SYSTEM_ACHIEVEMENTS);
  console.log(`🏆 Seeded ${seededAchievements.length} System Achievements/Badges.`);

  // 2. Hash default passwords
  const adminPass = await bcrypt.hash('Admin@123456', 10);
  const facultyPass = await bcrypt.hash('Teacher@123', 10);
  const studentPass = await bcrypt.hash('Student@123', 10);

  // 3. Seed Users
  // Admin
  const admin = await User.create({
    name: 'Dr. Suresh Chandra (Admin)',
    email: 'admin@shikshasetu.edu',
    passwordHash: adminPass,
    role: 'ADMIN',
    department: 'Dean of Academics & Administration',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    points: 1000,
    streakDays: 45,
  });

  // Faculty Users
  const faculty1 = await User.create({
    name: 'Prof. Rajesh Sharma',
    email: 'teacher@shikshasetu.edu',
    passwordHash: facultyPass,
    role: 'FACULTY',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    bio: 'Professor of Algorithms and Data Structures with 15+ years in competitive programming.',
    points: 620,
    streakDays: 28,
  });

  const faculty2 = await User.create({
    name: 'Dr. Ananya Verma',
    email: 'ananya.verma@shikshasetu.edu',
    passwordHash: facultyPass,
    role: 'FACULTY',
    department: 'Computer Science & Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    bio: 'Associate Professor specializing in Distributed Databases, Cloud Systems & Big Data.',
    points: 540,
    streakDays: 20,
  });

  const faculty3 = await User.create({
    name: 'Prof. Vikram Patel',
    email: 'vikram.patel@shikshasetu.edu',
    passwordHash: facultyPass,
    role: 'FACULTY',
    department: 'Information Technology',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    bio: 'Assistant Professor passionate about Computer Networks, Cyber Security and IoT.',
    points: 410,
    streakDays: 14,
  });

  // 15 Students with realistic scores & profiles
  const studentNames = [
    { name: 'Suman Sengupta', email: 'student@shikshasetu.edu', id: '22BCSE001', pts: 480, streak: 12 },
    { name: 'Aarav Sharma', email: 'aarav.sharma@shikshasetu.edu', id: '22BCSE002', pts: 450, streak: 10 },
    { name: 'Priya Nair', email: 'priya.nair@shikshasetu.edu', id: '22BCSE003', pts: 450, streak: 9 },
    { name: 'Rohan Gupta', email: 'rohan.gupta@shikshasetu.edu', id: '22BCSE004', pts: 390, streak: 7 },
    { name: 'Ananya Das', email: 'ananya.das@shikshasetu.edu', id: '22BCSE005', pts: 350, streak: 8 },
    { name: 'Kabir Mehta', email: 'kabir.mehta@shikshasetu.edu', id: '22BCSE006', pts: 310, streak: 5 },
    { name: 'Sneha Iyer', email: 'sneha.iyer@shikshasetu.edu', id: '22BCSE007', pts: 280, streak: 6 },
    { name: 'Vikram Rao', email: 'vikram.rao@shikshasetu.edu', id: '22BCSE008', pts: 240, streak: 4 },
    { name: 'Tanvi Joshi', email: 'tanvi.joshi@shikshasetu.edu', id: '22BCSE009', pts: 210, streak: 3 },
    { name: 'Aditya Verma', email: 'aditya.verma@shikshasetu.edu', id: '22BCSE010', pts: 180, streak: 2 },
    { name: 'Diya Patel', email: 'diya.patel@shikshasetu.edu', id: '22BCSE011', pts: 150, streak: 2 },
    { name: 'Siddharth Malhotra', email: 'siddharth.m@shikshasetu.edu', id: '22BCSE012', pts: 120, streak: 1 },
    { name: 'Meera Joshi', email: 'meera.joshi@shikshasetu.edu', id: '22BCSE013', pts: 95, streak: 1 },
    { name: 'Arjun Kapoor', email: 'arjun.kapoor@shikshasetu.edu', id: '22BCSE014', pts: 70, streak: 1 },
    { name: 'Ishita Roy', email: 'ishita.roy@shikshasetu.edu', id: '22BCSE015', pts: 45, streak: 1 },
  ];

  const students: any[] = [];
  for (let i = 0; i < studentNames.length; i++) {
    const s = studentNames[i];
    const user = await User.create({
      name: s.name,
      email: s.email,
      passwordHash: studentPass,
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      studentId: s.id,
      points: s.pts,
      streakDays: s.streak,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${s.name.replace(' ', '')}`,
    });
    students.push(user);
  }

  console.log(`👥 Created Admin, 3 Faculty, and ${students.length} Students.`);

  // 4. Seed Classes
  const class1 = await Class.create({
    name: 'B.Tech CSE 2026',
    code: 'CSE26X91',
    description: 'Department of Computer Science & Engineering — Class of 2026 (Batch 6A)',
    academicYear: '2025-2026',
    department: 'Computer Science & Engineering',
    semester: 6,
    section: 'A',
    bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200',
    createdBy: admin._id,
  });

  const class2 = await Class.create({
    name: 'B.Tech IT 2026',
    code: 'IT26M42',
    description: 'Department of Information Technology — Class of 2026 (Batch 6B)',
    academicYear: '2025-2026',
    department: 'Information Technology',
    semester: 6,
    section: 'B',
    bannerImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
    createdBy: admin._id,
  });

  // 5. Add Class Members
  const classMembersDocs = [
    { classId: class1._id, userId: admin._id, role: 'ADMIN' },
    { classId: class1._id, userId: faculty1._id, role: 'FACULTY' },
    { classId: class1._id, userId: faculty2._id, role: 'FACULTY' },
    { classId: class1._id, userId: faculty3._id, role: 'FACULTY' },
    { classId: class2._id, userId: admin._id, role: 'ADMIN' },
    { classId: class2._id, userId: faculty3._id, role: 'FACULTY' },
    ...students.map((s) => ({ classId: class1._id, userId: s._id, role: 'STUDENT' })),
    ...students.slice(0, 5).map((s) => ({ classId: class2._id, userId: s._id, role: 'STUDENT' })),
  ];
  await ClassMember.insertMany(classMembersDocs);
  console.log('🏫 Seeded Classes and enrolled Members.');

  // 6. Seed Subjects
  const subject1 = await Subject.create({
    classId: class1._id,
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    description: 'Advanced Trees, Graphs, Greedy, Dynamic Programming, and Amortized Complexity Analysis.',
    subjectImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
    semester: 6,
    credits: 4,
    primaryFacultyId: faculty1._id,
    coFaculties: [faculty3._id],
    facultyPermissions: [
      {
        facultyId: faculty1._id,
        manageMaterials: true,
        createAssignments: true,
        gradeAssignments: true,
        createChallenges: true,
        moderateForum: true,
      },
      {
        facultyId: faculty3._id,
        manageMaterials: true,
        createAssignments: true,
        gradeAssignments: true,
        createChallenges: true,
        moderateForum: true,
      },
    ],
  });

  const subject2 = await Subject.create({
    classId: class1._id,
    name: 'Database Management Systems',
    code: 'CS302',
    description: 'Relational Model, Normalization, Concurrency Control, Indexing, and NoSQL Architectures.',
    subjectImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=600',
    semester: 6,
    credits: 4,
    primaryFacultyId: faculty2._id,
    coFaculties: [],
    facultyPermissions: [
      {
        facultyId: faculty2._id,
        manageMaterials: true,
        createAssignments: true,
        gradeAssignments: true,
        createChallenges: true,
        moderateForum: true,
      },
    ],
  });

  const subject3 = await Subject.create({
    classId: class1._id,
    name: 'Computer Networks',
    code: 'CS303',
    description: 'Routing Protocols, TCP Congestion Control, Transport Layer Security, and SDN.',
    subjectImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600',
    semester: 6,
    credits: 3,
    primaryFacultyId: faculty3._id,
    coFaculties: [],
    facultyPermissions: [
      {
        facultyId: faculty3._id,
        manageMaterials: true,
        createAssignments: true,
        gradeAssignments: true,
        createChallenges: true,
        moderateForum: true,
      },
    ],
  });

  // Seed Subject Members
  const subjectMembersDocs: any[] = [];
  [subject1, subject2, subject3].forEach((sub) => {
    subjectMembersDocs.push({
      subjectId: sub._id,
      classId: sub.classId,
      userId: sub.primaryFacultyId,
      role: 'FACULTY',
    });
    if (sub.coFaculties.length > 0) {
      sub.coFaculties.forEach((coFacId) => {
        subjectMembersDocs.push({
          subjectId: sub._id,
          classId: sub.classId,
          userId: coFacId,
          role: 'FACULTY',
        });
      });
    }
    students.forEach((std) => {
      subjectMembersDocs.push({
        subjectId: sub._id,
        classId: sub.classId,
        userId: std._id,
        role: 'STUDENT',
      });
    });
  });
  await SubjectMember.insertMany(subjectMembersDocs);
  console.log('📚 Seeded Subjects and Subject Members.');

  // 7. Seed Materials
  await Material.insertMany([
    {
      classId: class1._id,
      subjectId: subject1._id,
      title: 'Module 1: Balanced Binary Trees & AVL Trees Guide',
      description: 'Comprehensive lecture notes covering tree height calculations, single and double rotations with visual diagrams.',
      type: 'NOTE',
      fileUrl: '/uploads/sample-avl-notes.pdf',
      fileName: 'Module1_AVL_Trees_Notes.pdf',
      fileSize: 2450000,
      mimeType: 'application/pdf',
      uploadedBy: faculty1._id,
      tags: ['trees', 'avl', 'dsa', 'rotations'],
      viewCount: 42,
    },
    {
      classId: class1._id,
      subjectId: subject1._id,
      title: 'Graph Algorithms Handbook: Dijkstra & Floyd-Warshall',
      description: 'Shortest path algorithms, step-by-step trace tables, and time complexity derivations.',
      type: 'BOOK',
      fileUrl: '/uploads/sample-graph-handbook.pdf',
      fileName: 'Graph_Algorithms_Handbook.pdf',
      fileSize: 4800000,
      mimeType: 'application/pdf',
      uploadedBy: faculty1._id,
      tags: ['graphs', 'dijkstra', 'shortest-path'],
      viewCount: 65,
    },
    {
      classId: class1._id,
      subjectId: subject2._id,
      title: 'Complete Relational SQL & Normalization Cheatsheet',
      description: '1NF, 2NF, 3NF, BCNF rules, lossless join decomposition, and practical PostgreSQL queries.',
      type: 'MATERIAL',
      fileUrl: '/uploads/sample-dbms-cheatsheet.pdf',
      fileName: 'DBMS_Normalization_SQL_Cheatsheet.pdf',
      fileSize: 1850000,
      mimeType: 'application/pdf',
      uploadedBy: faculty2._id,
      tags: ['dbms', 'sql', 'normalization', 'bcnf'],
      viewCount: 88,
    },
    {
      classId: class1._id,
      subjectId: subject3._id,
      title: 'TCP/IP & OSI Protocol Stack Architecture Slides',
      description: 'Presentation slides covering sliding window protocols, congestion windows, and subnetting.',
      type: 'SLIDES',
      fileUrl: '/uploads/sample-tcp-slides.pdf',
      fileName: 'Lecture_Slides_TCP_Congestion.pdf',
      fileSize: 3200000,
      mimeType: 'application/pdf',
      uploadedBy: faculty3._id,
      tags: ['networking', 'tcp', 'osi', 'protocols'],
      viewCount: 37,
    },
  ]);
  console.log('📄 Seeded Study Materials.');

  // 8. Seed Assignments
  const now = new Date();
  const assignment1 = await Assignment.create({
    classId: class1._id,
    subjectId: subject1._id,
    title: 'Assignment 1: AVL Tree Implementation with Rebalancing Logs',
    description: 'Implement a generic AVL tree in C++ or Java with insert, delete, and real-time rotation printouts.',
    instructions: 'Include your source code along with a test runner file demonstrating all 4 rotation cases (LL, RR, LR, RL).',
    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // in 5 days
    maxMarks: 100,
    rewardPoints: 25,
    allowedFileTypes: ['.pdf', '.zip', '.cpp', '.java'],
    maxFileSizeMb: 25,
    allowLateSubmissions: true,
    createdBy: faculty1._id,
  });

  const assignment2 = await Assignment.create({
    classId: class1._id,
    subjectId: subject2._id,
    title: 'Assignment 2: Schema Normalization & Complex Query Optimization',
    description: 'Decompose the given e-commerce transaction schema into BCNF and write indexed SQL queries.',
    instructions: 'Submit a PDF report detailing functional dependencies and relational algebra representations.',
    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    maxMarks: 100,
    rewardPoints: 30,
    allowedFileTypes: ['.pdf', '.zip'],
    maxFileSizeMb: 20,
    allowLateSubmissions: true,
    createdBy: faculty2._id,
  });

  // Seed student submissions for demo
  await Submission.create({
    assignmentId: assignment1._id,
    subjectId: subject1._id,
    classId: class1._id,
    studentId: students[0]._id, // Suman
    fileUrl: '/uploads/suman_avl_solution.zip',
    fileName: 'Suman_22BCSE001_AVL_Solution.zip',
    fileSize: 124000,
    submissionText: 'Implemented AVL tree in C++ with template support and tested on 10,000 randomized integers.',
    status: 'GRADED',
    marksObtained: 95,
    feedback: 'Excellent clean implementation and thorough test cases!',
    gradedBy: faculty1._id,
    gradedAt: new Date(),
    pointsAwarded: 25,
  });

  await Submission.create({
    assignmentId: assignment1._id,
    subjectId: subject1._id,
    classId: class1._id,
    studentId: students[1]._id, // Aarav
    fileUrl: '/uploads/aarav_avl_solution.zip',
    fileName: 'Aarav_22BCSE002_AVL_Solution.zip',
    fileSize: 110000,
    submissionText: 'Submitted Java implementation of AVL tree with visualization methods.',
    status: 'SUBMITTED',
    pointsAwarded: 25,
  });

  console.log('📝 Seeded Assignments and Submissions.');

  // 9. Seed Quizzes
  const quiz1 = await Quiz.create({
    classId: class1._id,
    subjectId: subject1._id,
    title: 'DSA Mastery Quiz: Trees, Graphs & DP',
    description: 'Test your understanding of tree balance factors, Dijkstra edge relaxation, and optimal substructure.',
    type: 'NATIVE_MCQ',
    timeLimitMinutes: 15,
    attemptLimit: 2,
    rewardPoints: 30,
    totalMarks: 3,
    isPublished: true,
    questions: [
      {
        questionText: 'What is the maximum balance factor allowed in a valid AVL Tree node?',
        type: 'MCQ',
        options: [
          { text: '0 only', isCorrect: false },
          { text: '+1, 0, or -1', isCorrect: true },
          { text: '+2 or -2', isCorrect: false },
          { text: 'Any positive integer', isCorrect: false },
        ],
        explanation: 'In an AVL tree, the height difference between left and right subtrees must not exceed 1 (|BF| <= 1).',
        marks: 1,
      },
      {
        questionText: 'What is the time complexity of Dijkstra’s Algorithm using a Fibonacci Heap?',
        type: 'MCQ',
        options: [
          { text: 'O(V^2)', isCorrect: false },
          { text: 'O(E + V log V)', isCorrect: true },
          { text: 'O(E log V)', isCorrect: false },
          { text: 'O(V log E)', isCorrect: false },
        ],
        explanation: 'With a Fibonacci Heap, decrease-key is amortized O(1), leading to an overall runtime of O(E + V log V).',
        marks: 1,
      },
      {
        questionText: 'Which graph algorithm can detect negative-weight cycles in directed graphs?',
        type: 'MCQ',
        options: [
          { text: 'Prim’s Algorithm', isCorrect: false },
          { text: 'Kruskal’s Algorithm', isCorrect: false },
          { text: 'Bellman-Ford Algorithm', isCorrect: true },
          { text: 'Dijkstra’s Algorithm', isCorrect: false },
        ],
        explanation: 'Bellman-Ford can detect negative cycles by checking for distance improvements during the V-th relaxation step.',
        marks: 1,
      },
    ],
    createdBy: faculty1._id,
  });

  // Seed Google Form quiz for demonstration of embedded external quizzes
  await Quiz.create({
    classId: class1._id,
    subjectId: subject2._id,
    title: 'Mid-Semester DBMS Concept & Feedback Survey (Google Form)',
    description: 'Interactive feedback and concept quiz embedded directly from Google Forms.',
    type: 'GOOGLE_FORM',
    googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfD_mock_google_form_for_sih/viewform?embedded=true',
    timeLimitMinutes: 20,
    attemptLimit: 1,
    rewardPoints: 20,
    isPublished: true,
    createdBy: faculty2._id,
  });

  console.log('⚡ Seeded Quizzes.');

  // 10. Seed Gamified Challenges
  const challenge1 = await Challenge.create({
    classId: class1._id,
    subjectId: subject1._id,
    title: 'Daily Challenge: Graph Cycle Detection Mystery',
    description: 'Solve this tricky algorithmic riddle to earn quick daily points and keep your streak alive!',
    category: 'DAILY',
    difficulty: 'EASY',
    rewardPoints: 25,
    timeLimitMinutes: 10,
    startDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 12 * 60 * 60 * 1000),
    tasks: [
      {
        question: 'Which traversal color state in 3-color DFS indicates a back-edge and hence a cycle in a directed graph?',
        options: ['WHITE (Unvisited)', 'GRAY (Visiting / In Call Stack)', 'BLACK (Visited)', 'BLUE (Cross-edge)'],
        correctIndex: 1,
        explanation: 'Visiting a GRAY node during DFS indicates you encountered an ancestor currently on the recursion stack, confirming a directed cycle.',
        hint: 'Think about active recursion stack frames in DFS traversal.',
      },
      {
        question: 'Can topological sort be performed on a graph with directed cycles?',
        options: ['Yes, always', 'No, only Directed Acyclic Graphs (DAGs) have a topological ordering', 'Yes, but only with BFS', 'Only if weights are positive'],
        correctIndex: 1,
        explanation: 'Topological sort is only defined for DAGs (Directed Acyclic Graphs).',
        hint: 'Topological sort requires a linear ordering without circular dependencies.',
      },
    ],
    createdBy: faculty1._id,
  });

  const challenge2 = await Challenge.create({
    classId: class1._id,
    title: 'Weekly Challenge: Database Concurrency & ACID Isolation',
    description: 'Master strict two-phase locking, phantom reads, and MVCC to earn +75 points!',
    category: 'WEEKLY',
    difficulty: 'MEDIUM',
    rewardPoints: 75,
    timeLimitMinutes: 20,
    startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    tasks: [
      {
        question: 'Which SQL Isolation Level prevents Dirty Reads and Non-Repeatable Reads, but may still allow Phantom Reads?',
        options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
        correctIndex: 2,
        explanation: 'Repeatable Read locks existing read rows but may allow new rows matching range queries (phantom reads) in standard SQL-92.',
        hint: 'It is one level below Serializable.',
      },
    ],
    createdBy: faculty2._id,
  });

  // Seed completion record for student1
  await ChallengeAttempt.create({
    challengeId: challenge1._id,
    studentId: students[0]._id,
    completedAt: new Date(),
    score: 2,
    maxScore: 2,
    pointsAwarded: 25,
    status: 'COMPLETED',
  });

  console.log('🎯 Seeded Daily & Weekly Challenges.');

  // 11. Seed Discussion Forums
  const post1 = await ForumPost.create({
    classId: class1._id,
    subjectId: subject1._id,
    title: 'How does HashMap work internally in Java 8+ when collisions occur?',
    description: `I understand the basic array indexing formula hash(key) & (n - 1), but what happens when many keys hash to the same bucket index? When does it transform into a Red-Black Tree and what is the TREEIFY_THRESHOLD?`,
    tags: ['java', 'hashmap', 'data-structures', 'trees'],
    authorId: students[0]._id, // Suman
    authorRole: 'STUDENT',
    upvotesCount: 8,
    downvotesCount: 0,
    answersCount: 2,
    hasAcceptedAnswer: true,
  });

  const answer1 = await ForumAnswer.create({
    postId: post1._id,
    classId: class1._id,
    subjectId: subject1._id,
    content: `Great question Suman! Here is the internal breakdown:

1. **Bucket Structure**: Initially, each bucket is a singly linked list with Node<K,V>.
2. **TREEIFY_THRESHOLD**: When the number of nodes in a single bucket reaches **8** and the overall table capacity is at least **64**, the bucket is transformed into a balanced **Red-Black Tree (TreeNode<K,V>)**.
3. **Complexity**: This improves the worst-case collision lookup time from **O(N)** down to **O(log N)**!
4. **UNTREEIFY_THRESHOLD**: If elements are removed and drop to **6**, it shrinks back to a linked list.`,
    authorId: faculty1._id,
    authorRole: 'FACULTY',
    upvotesCount: 14,
    downvotesCount: 0,
    isAccepted: true,
  });

  const answer2 = await ForumAnswer.create({
    postId: post1._id,
    classId: class1._id,
    subjectId: subject1._id,
    content: `Also note that if the table capacity is less than 64, Java will resize/double the table first rather than converting to a tree immediately.`,
    authorId: students[2]._id, // Priya
    authorRole: 'STUDENT',
    upvotesCount: 5,
    downvotesCount: 0,
    isAccepted: false,
  });

  // Seed sample votes
  await Vote.create({
    userId: students[1]._id,
    targetType: 'POST',
    targetId: post1._id,
    voteValue: 1,
  });
  await Vote.create({
    userId: students[0]._id,
    targetType: 'ANSWER',
    targetId: answer1._id,
    voteValue: 1,
  });

  const post2 = await ForumPost.create({
    classId: class1._id,
    subjectId: subject2._id,
    title: 'Difference between B-Tree and B+ Tree indexing in PostgreSQL / MySQL InnoDB?',
    description: 'Why do almost all production relational database engines use B+ Trees instead of standard B-Trees for table indices?',
    tags: ['dbms', 'indexing', 'b-trees', 'postgresql'],
    authorId: students[1]._id,
    authorRole: 'STUDENT',
    upvotesCount: 6,
    downvotesCount: 0,
    answersCount: 1,
    hasAcceptedAnswer: false,
  });

  await ForumAnswer.create({
    postId: post2._id,
    classId: class1._id,
    subjectId: subject2._id,
    content: `B+ Trees store data records/pointers **only in the leaf nodes**, while internal nodes only store navigation keys. 

Key Advantages:
- Leaf nodes are linked as a doubly-linked list, making **range queries (e.g. WHERE age BETWEEN 20 AND 30)** blazing fast with sequential disk I/O.
- Internal nodes are much smaller, allowing more keys per disk block (higher fanout), reducing tree height and disk seek times.`,
    authorId: faculty2._id,
    authorRole: 'FACULTY',
    upvotesCount: 9,
    downvotesCount: 0,
    isAccepted: false,
  });

  console.log('💬 Seeded Community Forum Threads & Answers.');

  // 12. Seed Point Transactions & Badges for top students
  await PointTransaction.create({
    userId: students[0]._id,
    sourceType: 'CHALLENGE',
    sourceId: challenge1._id,
    points: 25,
    reason: 'Solved daily challenge: "Graph Cycle Detection Mystery"',
  });

  await PointTransaction.create({
    userId: students[0]._id,
    sourceType: 'ASSIGNMENT',
    sourceId: assignment1._id,
    points: 25,
    reason: 'Submitted assignment: "AVL Tree Implementation"',
  });

  await UserAchievement.create({
    userId: students[0]._id,
    achievementId: seededAchievements[0]._id, // First Steps
  });
  await UserAchievement.create({
    userId: students[0]._id,
    achievementId: seededAchievements[1]._id, // First Challenge
  });
  await UserAchievement.create({
    userId: students[0]._id,
    achievementId: seededAchievements[3]._id, // Century Club
  });

  // 13. Seed In-App Notifications
  await Notification.create({
    recipientId: students[0]._id,
    senderId: faculty1._id,
    type: 'ASSIGNMENT_GRADED',
    title: 'Assignment 1 Graded (95/100)',
    message: 'Prof. Rajesh Sharma graded your AVL Tree assignment with top feedback.',
    isRead: false,
  });

  await Notification.create({
    recipientId: students[0]._id,
    senderId: faculty1._id,
    type: 'ANSWER_ACCEPTED',
    title: 'Accepted Answer on HashMap Discussion 🎉',
    message: 'Your discussion question now has a verified solution.',
    isRead: false,
  });

  // 14. Seed Audit Logs
  await AuditLog.create({
    actorId: admin._id,
    actorRole: 'ADMIN',
    action: 'CLASS_CREATED',
    targetType: 'CLASS',
    targetId: class1._id.toString(),
    metadata: { name: class1.name, code: class1.code },
    ipAddress: '127.0.0.1',
  });

  console.log('🎉 Full ShikshaSetu database successfully seeded!');
  console.log('\n---------------- OFFICIAL DEMO CREDENTIALS ----------------');
  console.log('👑 Admin:   admin@shikshasetu.edu     / Admin@123456');
  console.log('🎓 Teacher: teacher@shikshasetu.edu   / Teacher@123 (Prof. Rajesh Sharma)');
  console.log('🎓 Faculty: ananya.verma@shikshasetu.edu / Teacher@123 (Dr. Ananya Verma)');
  console.log('🧑 Student: student@shikshasetu.edu   / Student@123 (Suman Sengupta)');
  console.log('🧑 Student: aarav.sharma@shikshasetu.edu / Student@123 (Aarav Sharma)');
  console.log('-----------------------------------------------------------\n');
};

if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase()
    .then(() => disconnectDB())
    .catch((err) => {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    });
}
