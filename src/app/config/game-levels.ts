export interface GameLevel {
  id: number;
  name: string;
  description: string;
  icon: string; // Emoji
  minVal: number;
  maxVal: number;
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
    id: 3,
    name: 'Double Défi',
    description: 'Les nombres à deux chiffres entrent en jeu ! 12 + 5 = ?',
    icon: '🦁',
    minVal: 5,
    maxVal: 20,
    operations: ['+', '-'],
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #EAFCE8 0%, #C4F7BE 100%)',
    cardColor: '#10AC84'
  },
  {
    id: 4,
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
    id: 5,
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
