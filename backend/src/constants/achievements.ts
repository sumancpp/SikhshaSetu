export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  icon: string;
  pointsRequired: number;
  category: 'CHALLENGE' | 'QUIZ' | 'FORUM' | 'STREAK' | 'GENERAL';
}

export const SYSTEM_ACHIEVEMENTS: AchievementDef[] = [
  {
    code: 'FIRST_STEPS',
    title: 'First Steps',
    description: 'Joined your first subject and began your learning journey.',
    icon: '🌱',
    pointsRequired: 0,
    category: 'GENERAL',
  },
  {
    code: 'FIRST_CHALLENGE',
    title: 'Challenge Explorer',
    description: 'Successfully completed your first learning challenge.',
    icon: '🎯',
    pointsRequired: 25,
    category: 'CHALLENGE',
  },
  {
    code: 'QUIZ_WHIZ',
    title: 'Quiz Whiz',
    description: 'Scored 100% on an interactive subject quiz.',
    icon: '⚡',
    pointsRequired: 50,
    category: 'QUIZ',
  },
  {
    code: 'CENTURY_CLUB',
    title: 'Century Club',
    description: 'Earned over 100 total academic points across the platform.',
    icon: '💯',
    pointsRequired: 100,
    category: 'GENERAL',
  },
  {
    code: 'MASTERMIND',
    title: 'Academic Mastermind',
    description: 'Accumulated 500+ points and reached top tiers on the leaderboard.',
    icon: '👑',
    pointsRequired: 500,
    category: 'GENERAL',
  },
  {
    code: 'HELPFUL_PEER',
    title: 'Helpful Peer',
    description: 'Had an answer marked as the Accepted Solution on the forum.',
    icon: '💡',
    pointsRequired: 50,
    category: 'FORUM',
  },
  {
    code: 'SEVEN_DAY_STREAK',
    title: 'Unstoppable Momentum',
    description: 'Maintained a 7-day continuous active learning streak.',
    icon: '🔥',
    pointsRequired: 150,
    category: 'STREAK',
  },
];
