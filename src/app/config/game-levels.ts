export interface GameLevel {
  id: number;
  name: string;
  description: string;
  icon: string; // Emoji
  minVal: number;
  maxVal: number;
  minVal2?: number;
  maxVal2?: number;
  subMinVal?: number;
  subMaxVal?: number;
  operations: ('+' | '-' | '*')[];
  questionsCount: number;
  passingScore: number; // e.g. 8 out of 10
  bgColor: string; // Background gradient class or style
  cardColor: string; // Solid or gradient color for card
}

export const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    name: 'Aventure des Additions',
    description: 'Additions faciles à un chiffre ! 4 + 2 = ?',
    icon: '🐣',
    minVal: 1,
    maxVal: 9,
    operations: ['+'],
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #FFF6E5 0%, #FFDCA2 100%)',
    cardColor: '#FF9F43'
  },
  {
    id: 2,
    name: 'Super Additions',
    description: 'Additionne un chiffre (1-9) avec un grand nombre (11-30) ! 7 + 15 = ?',
    icon: '🚀',
    minVal: 1,
    maxVal: 9,
    minVal2: 11,
    maxVal2: 30,
    operations: ['+'],
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
    cardColor: '#0284C7'
  },
  {
    id: 3,
    name: 'Safari des Soustractions',
    description: 'Soustractions à un chiffre ! 7 - 3 = ?',
    icon: '🦊',
    minVal: 1,
    maxVal: 9,
    operations: ['-'],
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #E3F8FF 0%, #B8EEFF 100%)',
    cardColor: '#00D2D3'
  },
  {
    id: 4,
    name: 'Double Défi',
    description: 'Additions et soustractions avec de grands nombres ! 7 + 15 = ? ou 23 - 5 = ?',
    icon: '🦁',
    minVal: 1,
    maxVal: 9,
    minVal2: 11,
    maxVal2: 30,
    subMinVal: 2,
    subMaxVal: 11,
    operations: ['+', '-'],
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #EAFCE8 0%, #C4F7BE 100%)',
    cardColor: '#10AC84'
  },
  {
    id: 5,
    name: 'Magie des Multiplications',
    description: 'Apprends les tables de multiplication ! 3 × 4 = ?',
    icon: '🦄',
    minVal: 1,
    maxVal: 10,
    operations: ['*'],
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #FFE9FB 0%, #FFB6F3 100%)',
    cardColor: '#FF9FF3'
  },
  {
    id: 6,
    name: 'Génie des Maths',
    description: 'Le défi ultime de maths ! Réussiras-tu ?',
    icon: '👑',
    minVal: 2,
    maxVal: 12,
    operations: ['+', '-', '*'],
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #ECE5FF 0%, #CFBCFF 100%)',
    cardColor: '#5F27CD'
  }
];
