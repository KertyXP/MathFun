import { Injectable, signal, computed } from '@angular/core';
import { GameLevel } from '../config/game-levels';

export interface Question {
  text: string;
  num1: number;
  num2: number;
  operation: '+' | '-' | '*';
  correctAnswer: number;
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
  
  // Lobby and timer states
  private started = signal<boolean>(false);
  private elapsedSeconds = signal<number>(0);
  private startTime = 0;
  private stopwatchInterval: any = null;

  // Computeds
  readonly currentLevel = computed(() => this.activeLevel());
  readonly isGameStarted = computed(() => this.started());
  readonly currentQuestion = computed(() => {
    const qList = this.questions();
    const idx = this.currentIndex();
    return qList.length > 0 && idx < qList.length ? qList[idx] : null;
  });
  readonly currentQuestionIndex = computed(() => this.currentIndex());
  readonly totalQuestionsCount = computed(() => this.QUESTIONS_COUNT);
  readonly correctAnswersCount = computed(() => this.userAnswers().filter(a => a.isCorrect).length);
  readonly allAnswers = computed(() => this.userAnswers());
  readonly isGameOver = computed(() => {
    return this.started() && this.currentIndex() >= this.QUESTIONS_COUNT;
  });
  readonly gameDuration = computed(() => this.elapsedSeconds());

  // Initialize a new game round in the "pre-game lobby" state
  startGame(level: GameLevel) {
    this.activeLevel.set(level);
    this.currentIndex.set(0);
    this.userAnswers.set([]);
    this.started.set(false);
    this.elapsedSeconds.set(0);
    this.clearStopwatch();

    const generated = this.generateQuestions(level);
    this.questions.set(generated);
  }

  // Active quiz starts (when user presses Enter)
  startActiveQuiz() {
    if (this.started()) return;
    this.started.set(true);
    this.startTime = Date.now();
    
    // Start stopwatch ticking every 100ms for precision display (e.g. 1.2s)
    this.clearStopwatch();
    this.stopwatchInterval = setInterval(() => {
      const diffMs = Date.now() - this.startTime;
      this.elapsedSeconds.set(Number((diffMs / 1000).toFixed(1)));
    }, 100);
  }

  // Adds a penalty in seconds to the stopwatch timing
  applyTimePenalty(seconds: number) {
    if (!this.started()) return;
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

    // If game is over, stop the stopwatch
    if (nextIdx >= this.QUESTIONS_COUNT) {
      this.clearStopwatch();
      // Record final precise duration
      const finalDiffMs = Date.now() - this.startTime;
      this.elapsedSeconds.set(Number((finalDiffMs / 1000).toFixed(2)));
    }

    return isCorrect;
  }

  private clearStopwatch() {
    if (this.stopwatchInterval) {
      clearInterval(this.stopwatchInterval);
      this.stopwatchInterval = null;
    }
  }

  // Generate random questions according to level guidelines
  private generateQuestions(level: GameLevel): Question[] {
    const list: Question[] = [];
    for (let i = 0; i < this.QUESTIONS_COUNT; i++) {
      list.push(this.generateSingleQuestion(level));
    }
    return list;
  }

  private generateSingleQuestion(level: GameLevel): Question {
    const op = level.operations[Math.floor(Math.random() * level.operations.length)];
    let num1 = 0;
    let num2 = 0;
    let correctAnswer = 0;

    if (op === '+') {
      if (level.minVal2 !== undefined && level.maxVal2 !== undefined) {
        const valA = Math.floor(Math.random() * (level.maxVal - level.minVal + 1)) + level.minVal;
        const valB = Math.floor(Math.random() * (level.maxVal2 - level.minVal2 + 1)) + level.minVal2;
        if (Math.random() < 0.5) {
          num1 = valA;
          num2 = valB;
        } else {
          num1 = valB;
          num2 = valA;
        }
      } else {
        num1 = Math.floor(Math.random() * (level.maxVal - level.minVal + 1)) + level.minVal;
        num2 = Math.floor(Math.random() * (level.maxVal - level.minVal + 1)) + level.minVal;
      }
      correctAnswer = num1 + num2;
    } else if (op === '-') {
      // Subtraction: ensure positive results for children
      if (level.minVal2 !== undefined && level.maxVal2 !== undefined) {
        const sMin = level.subMinVal !== undefined ? level.subMinVal : 2;
        const sMax = level.subMaxVal !== undefined ? level.subMaxVal : 11;
        num1 = Math.floor(Math.random() * (level.maxVal2 - level.minVal2 + 1)) + level.minVal2;
        num2 = Math.floor(Math.random() * (sMax - sMin + 1)) + sMin;
      } else {
        const valA = Math.floor(Math.random() * (level.maxVal - level.minVal + 1)) + level.minVal;
        const valB = Math.floor(Math.random() * (level.maxVal - level.minVal + 1)) + level.minVal;
        num1 = Math.max(valA, valB);
        num2 = Math.min(valA, valB);
      }
      correctAnswer = num1 - num2;
    } else {
      // Multiplication
      num1 = Math.floor(Math.random() * (level.maxVal - level.minVal + 1)) + level.minVal;
      num2 = Math.floor(Math.random() * (level.maxVal - level.minVal + 1)) + level.minVal;
      correctAnswer = num1 * num2;
    }

    return {
      text: `${num1} ${op === '*' ? '×' : op} ${num2}`,
      num1,
      num2,
      operation: op,
      correctAnswer
    };
  }
}
