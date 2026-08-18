export type OperationType = '+' | '-' | '*';
export type MissingTarget = 'result' | 'num1' | 'num2' | 'random-operand' | 'any';
export type MissingPosition = 'result' | 'num1' | 'num2';

export interface OperatorConfig {
  minVal?: number;
  maxVal?: number;
  maxResult?: number;
  minVal2?: number;
  maxVal2?: number;
  subMinVal?: number;
  subMaxVal?: number;
  missingTarget?: MissingTarget;
  fixedNum1?: number;
  fixedResult?: number;
}

export interface GameLevel {
  id: number;
  name: string;
  description: string;
  icon: string; // Emoji
  operations: OperationType[];
  operatorConfig: Partial<Record<OperationType, OperatorConfig>>;
  missingTarget?: MissingTarget;
  questionsCount: number;
  passingScore: number; // e.g. 8 out of 10
  bgColor: string; // Background gradient class or style
  cardColor: string; // Solid or gradient color for card
}

export const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    name: 'Premières Additions',
    description: 'Additions très faciles jusqu\'à 10 ! 3 + 2 = ?',
    icon: '🌱',
    operations: ['+'],
    operatorConfig: {
      '+': { minVal: 1, maxVal: 9, maxResult: 10 }
    },
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)',
    cardColor: '#B45309'
  },
  {
    id: 2,
    name: 'Aventure des Additions',
    description: 'Additions faciles à un chiffre ! 4 + 7 = ?',
    icon: '🐣',
    operations: ['+'],
    operatorConfig: {
      '+': { minVal: 1, maxVal: 9 }
    },
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #FFF6E5 0%, #FFDCA2 100%)',
    cardColor: '#C2410C'
  },
  {
    id: 3,
    name: 'Safari des Soustractions',
    description: 'Soustractions à un chiffre ! 7 - 3 = ?',
    icon: '🦊',
    operations: ['-'],
    operatorConfig: {
      '-': { minVal: 1, maxVal: 9 }
    },
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #E3F8FF 0%, #B8EEFF 100%)',
    cardColor: '#0E7490'
  },
  {
    id: 4,
    name: 'Super Additions',
    description: 'Additionne un chiffre (1-9) avec un grand nombre (11-30) ! 7 + 15 = ?',
    icon: '🚀',
    operations: ['+'],
    operatorConfig: {
      '+': { minVal: 1, maxVal: 9, minVal2: 11, maxVal2: 30 }
    },
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
    cardColor: '#0369A1'
  },
  {
    id: 5,
    name: 'Double Défi',
    description: 'Additions et soustractions avec de grands nombres ! 7 + 15 = ? ou 23 - 5 = ?',
    icon: '🦁',
    operations: ['+', '-'],
    operatorConfig: {
      '+': { minVal: 1, maxVal: 9, minVal2: 11, maxVal2: 30 },
      '-': { minVal2: 11, maxVal2: 30, subMinVal: 2, subMaxVal: 11 }
    },
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #EAFCE8 0%, #C4F7BE 100%)',
    cardColor: '#047857'
  },
  {
    id: 6,
    name: 'Le Mystère du 10',
    description: 'Trouve le nombre caché (X) avec le nombre 10 ! 10 - X = 7 ou 4 + X = 10',
    icon: '🧩',
    operations: ['+', '-'],
    operatorConfig: {
      '+': { minVal: 1, maxVal: 9, fixedResult: 10, missingTarget: 'num2' },
      '-': { minVal: 1, maxVal: 9, fixedNum1: 10, missingTarget: 'num2' }
    },
    missingTarget: 'num2',
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    cardColor: '#B45309'
  },
  {
    id: 7,
    name: 'Magie des Multiplications',
    description: 'Apprends les tables de multiplication ! 3 × 4 = ?',
    icon: '🦄',
    operations: ['*'],
    operatorConfig: {
      '*': { minVal: 1, maxVal: 10 }
    },
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #FFE9FB 0%, #FFB6F3 100%)',
    cardColor: '#A21CAF'
  },
  {
    id: 8,
    name: 'Le Mystère des Nombres',
    description: 'Trouve le nombre caché (X) avec de grands nombres ! 15 - X = 8 ou 7 + X = 19',
    icon: '🕵️‍♂️',
    operations: ['+', '-'],
    operatorConfig: {
      '+': { minVal: 1, maxVal: 9, minVal2: 10, maxVal2: 25, missingTarget: 'num2' },
      '-': { minVal2: 11, maxVal2: 30, subMinVal: 2, subMaxVal: 10, missingTarget: 'num2' }
    },
    missingTarget: 'num2',
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
    cardColor: '#6D28D9'
  },
  {
    id: 9,
    name: 'Génie des Maths',
    description: 'Le défi ultime avec calculs et nombres mystères ! Réussiras-tu ?',
    icon: '👑',
    operations: ['+', '-', '*'],
    operatorConfig: {
      '+': { minVal: 1, maxVal: 30 },
      '-': { minVal: 1, maxVal: 30 },
      '*': { minVal: 1, maxVal: 10 }
    },
    missingTarget: 'any',
    questionsCount: 10,
    passingScore: 8,
    bgColor: 'linear-gradient(135deg, #ECE5FF 0%, #CFBCFF 100%)',
    cardColor: '#5F27CD'
  }
];
