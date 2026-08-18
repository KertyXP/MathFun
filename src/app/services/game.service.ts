import { Injectable, signal, computed } from '@angular/core';
import { GameLevel, MissingPosition, MissingTarget } from '../config/game-levels';

export interface Question {
  text: string;
  num1: number;
  num2: number;
  operation: '+' | '-' | '*';
  result: number;
  correctAnswer: number;
  missingPosition: MissingPosition;
}

export interface UserAnswer {
  question: Question;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // Global config parameter for easily adjusting number of questions
  readonly QUESTIONS_COUNT = 10;

  // Signals for active game state
  private activeLevel = signal<GameLevel | null>(null);
  private questions = signal<Question[]>([]);
  private currentIndex = signal<number>(0);
  private userAnswers = signal<UserAnswer[]>([]);
  private isTimerMode = signal<boolean>(true);
  private trainingTables = signal<number[]>([]);
  
  // Lobby and timer states
  private started = signal<boolean>(false);
  private elapsedSeconds = signal<number>(0);
  private startTime = 0;
  private stopwatchInterval: any = null;

  // Computeds
  readonly currentLevel = computed(() => this.activeLevel());
  readonly isTimerEnabled = computed(() => this.isTimerMode());
  readonly isGameStarted = computed(() => this.started());
  readonly currentQuestion = computed(() => {
    const qList = this.questions();
    const idx = this.currentIndex();
    return qList.length > 0 && idx < qList.length ? qList[idx] : null;
  });
  readonly currentQuestionIndex = computed(() => this.currentIndex());
  readonly totalQuestionsCount = computed(() => {
    if (!this.isTimerMode()) {
      return this.questions().length;
    }
    return this.QUESTIONS_COUNT;
  });
  readonly correctAnswersCount = computed(() => this.userAnswers().filter(a => a.isCorrect).length);
  readonly allAnswers = computed(() => this.userAnswers());

  // Sliding window properties for unlimited training mode (last 10 answers)
  readonly recentAnswers = computed(() => this.userAnswers().slice(-10));
  readonly trainingRecentCorrectCount = computed(() => 
    this.userAnswers().slice(-10).filter(a => a.isCorrect).length
  );
  readonly trainingRecentTotalCount = computed(() => 
    Math.min(this.userAnswers().length, 10)
  );
  readonly trainingScore = computed(() => ({
    correct: this.trainingRecentCorrectCount(),
    total: this.trainingRecentTotalCount(),
    formatted: `${this.trainingRecentCorrectCount()}/${this.trainingRecentTotalCount()}`
  }));

  readonly isGameOver = computed(() => {
    if (!this.isTimerMode()) {
      return false; // Unlimited training mode never ends automatically
    }
    return this.started() && this.currentIndex() >= this.QUESTIONS_COUNT;
  });
  readonly gameDuration = computed(() => this.elapsedSeconds());

  // Initialize a new game round in the "pre-game lobby" state
  startGame(level: GameLevel) {
    this.isTimerMode.set(true);
    this.activeLevel.set(level);
    this.currentIndex.set(0);
    this.userAnswers.set([]);
    this.started.set(false);
    this.elapsedSeconds.set(0);
    this.clearStopwatch();

    const generated = this.generateQuestions(level);
    this.questions.set(generated);
  }

  // Initialize multiplication practice round (no timer, unlimited questions)
  startMultiplicationTraining(tables: number[]) {
    this.isTimerMode.set(false);
    const sortedTables = [...tables].sort((a, b) => a - b);
    this.trainingTables.set(sortedTables);

    const customLevel: GameLevel = {
      id: 99,
      name: `Tables de ${sortedTables.join(', ')}`,
      description: `Entraînement illimité sur les tables ${sortedTables.join(', ')} (Sans chrono)`,
      icon: '♾️',
      operations: ['*'],
      operatorConfig: {
        '*': { minVal: 1, maxVal: 10 }
      },
      questionsCount: 9999,
      passingScore: 8,
      bgColor: 'linear-gradient(135deg, #FFE9FB 0%, #FFB6F3 100%)',
      cardColor: '#BE185D'
    };

    this.activeLevel.set(customLevel);
    this.currentIndex.set(0);
    this.userAnswers.set([]);
    this.started.set(false);
    this.elapsedSeconds.set(0);
    this.clearStopwatch();

    const generated = this.generateMultiplicationQuestions(sortedTables, 30);
    this.questions.set(generated);
  }

  // Active quiz starts (when user presses Enter or clicks button)
  startActiveQuiz() {
    if (this.started()) return;
    this.started.set(true);
    this.startTime = Date.now();
    
    if (this.isTimerMode()) {
      this.clearStopwatch();
      this.stopwatchInterval = setInterval(() => {
        const diffMs = Date.now() - this.startTime;
        this.elapsedSeconds.set(Number((diffMs / 1000).toFixed(1)));
      }, 100);
    }
  }

  // Adds a penalty in seconds to the stopwatch timing
  applyTimePenalty(seconds: number) {
    if (!this.started() || !this.isTimerMode()) return;
    this.startTime -= seconds * 1000;
    const diffMs = Date.now() - this.startTime;
    this.elapsedSeconds.set(Number((diffMs / 1000).toFixed(1)));
  }

  // Record an answer typed by the player
  submitAnswer(val: number | null): boolean {
    const currentQ = this.currentQuestion();
    if (!currentQ || !this.started()) return false;

    const isCorrect = val !== null && val === currentQ.correctAnswer;
    const answerRecord: UserAnswer = {
      question: currentQ,
      selectedAnswer: val,
      isCorrect
    };

    this.userAnswers.update(prev => [...prev, answerRecord]);
    
    // Move to next question
    const nextIdx = this.currentIndex() + 1;
    this.currentIndex.set(nextIdx);

    // In unlimited training mode, replenish more questions if getting near the end
    if (!this.isTimerMode()) {
      if (nextIdx >= this.questions().length - 3) {
        const extraQuestions = this.generateMultiplicationQuestions(this.trainingTables(), 20, this.questions());
        this.questions.update(q => [...q, ...extraQuestions]);
      }
    } else {
      // If game is over in regular mode, stop the stopwatch
      if (nextIdx >= this.QUESTIONS_COUNT) {
        this.clearStopwatch();
        const finalDiffMs = Date.now() - this.startTime;
        this.elapsedSeconds.set(Number((finalDiffMs / 1000).toFixed(2)));
      }
    }

    return isCorrect;
  }

  private clearStopwatch() {
    if (this.stopwatchInterval) {
      clearInterval(this.stopwatchInterval);
      this.stopwatchInterval = null;
    }
  }

  private isDuplicateInRecent(q: Question, history: Question[], recentCount = 5): boolean {
    if (history.length === 0) return false;
    const recent = history.slice(-recentCount);
    return recent.some(item => item.text === q.text);
  }

  // Generate random questions according to level guidelines (ensuring no duplicates in recent 5)
  private generateQuestions(level: GameLevel): Question[] {
    const list: Question[] = [];
    for (let i = 0; i < this.QUESTIONS_COUNT; i++) {
      let q: Question;
      let attempts = 0;
      do {
        q = this.generateSingleQuestion(level);
        attempts++;
      } while (attempts < 50 && this.isDuplicateInRecent(q, list, 5));
      list.push(q);
    }
    return list;
  }

  private generateSingleQuestion(level: GameLevel): Question {
    const op = level.operations[Math.floor(Math.random() * level.operations.length)];
    const opConf = level.operatorConfig[op] ?? {};

    const minVal = opConf.minVal ?? 1;
    const maxVal = opConf.maxVal ?? 10;
    const maxResult = opConf.maxResult;
    const minVal2 = opConf.minVal2;
    const maxVal2 = opConf.maxVal2;
    const subMinVal = opConf.subMinVal;
    const subMaxVal = opConf.subMaxVal;

    let num1 = 0;
    let num2 = 0;
    let result = 0;

    if (op === '+') {
      if (maxResult !== undefined) {
        const min1 = minVal;
        const max1 = Math.max(min1, maxResult - minVal);
        num1 = Math.floor(Math.random() * (max1 - min1 + 1)) + min1;
        const max2 = Math.max(min1, maxResult - num1);
        num2 = Math.floor(Math.random() * (max2 - min1 + 1)) + min1;
        if (Math.random() < 0.5) {
          const temp = num1;
          num1 = num2;
          num2 = temp;
        }
      } else if (minVal2 !== undefined && maxVal2 !== undefined) {
        const valA = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        const valB = Math.floor(Math.random() * (maxVal2 - minVal2 + 1)) + minVal2;
        if (Math.random() < 0.5) {
          num1 = valA;
          num2 = valB;
        } else {
          num1 = valB;
          num2 = valA;
        }
      } else {
        num1 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        num2 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      }
      result = num1 + num2;
    } else if (op === '-') {
      // Subtraction: ensure positive results for children
      if (minVal2 !== undefined && maxVal2 !== undefined) {
        const sMin = subMinVal !== undefined ? subMinVal : 2;
        const sMax = subMaxVal !== undefined ? subMaxVal : 11;
        num1 = Math.floor(Math.random() * (maxVal2 - minVal2 + 1)) + minVal2;
        num2 = Math.floor(Math.random() * (sMax - sMin + 1)) + sMin;
      } else {
        const valA = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        const valB = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        num1 = Math.max(valA, valB);
        num2 = Math.min(valA, valB);
      }
      result = num1 - num2;
    } else {
      // Multiplication
      num1 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      num2 = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      result = num1 * num2;
    }

    // Determine missing position from operatorConfig or level
    const rawTarget = opConf.missingTarget ?? level.missingTarget ?? 'result';
    let missingPosition: MissingPosition = 'result';
    if (rawTarget === 'num1') {
      missingPosition = 'num1';
    } else if (rawTarget === 'num2') {
      missingPosition = 'num2';
    } else if (rawTarget === 'random-operand') {
      missingPosition = Math.random() < 0.5 ? 'num1' : 'num2';
    } else if (rawTarget === 'any') {
      const rand = Math.random();
      missingPosition = rand < 0.33 ? 'num1' : rand < 0.66 ? 'num2' : 'result';
    } else {
      missingPosition = 'result';
    }

    let correctAnswer = result;
    let displayText = '';
    const opSymbol = op === '*' ? '×' : op;

    if (missingPosition === 'num1') {
      correctAnswer = num1;
      displayText = `? ${opSymbol} ${num2} = ${result}`;
    } else if (missingPosition === 'num2') {
      correctAnswer = num2;
      displayText = `${num1} ${opSymbol} ? = ${result}`;
    } else {
      correctAnswer = result;
      displayText = `${num1} ${opSymbol} ${num2}`;
    }

    return {
      text: displayText,
      num1,
      num2,
      operation: op,
      result,
      correctAnswer,
      missingPosition
    };
  }

  private generateMultiplicationQuestions(tables: number[], count = 10, existingList: Question[] = []): Question[] {
    const list: Question[] = [];
    for (let i = 0; i < count; i++) {
      let q: Question;
      let attempts = 0;
      do {
        const table = tables[Math.floor(Math.random() * tables.length)];
        const multiplier = Math.floor(Math.random() * 10) + 1; // 1 to 10
        let num1 = table;
        let num2 = multiplier;
        if (Math.random() < 0.5) {
          num1 = multiplier;
          num2 = table;
        }
        const result = num1 * num2;
        q = {
          text: `${num1} × ${num2}`,
          num1,
          num2,
          operation: '*',
          result,
          correctAnswer: result,
          missingPosition: 'result'
        };
        attempts++;
      } while (attempts < 50 && this.isDuplicateInRecent(q, [...existingList, ...list], 5));
      list.push(q);
    }
    return list;
  }
}
