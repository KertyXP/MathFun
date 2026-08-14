import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from './game.service';
import { GAME_LEVELS } from '../config/game-levels';

describe('GameService - Mission 1 (Easy Additions <= 10)', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
  });

  it('should generate questions where sum never exceeds 10 for Level 1', () => {
    const level1 = GAME_LEVELS.find(l => l.id === 1);
    expect(level1).toBeDefined();
    expect(level1!.maxResult).toBe(10);
    expect(level1!.operations).toEqual(['+']);

    // Run multiple rounds to ensure all randomly generated questions satisfy the constraint
    for (let round = 0; round < 20; round++) {
      service.startGame(level1!);
      for (let i = 0; i < 10; i++) {
        const q = service.currentQuestion();
        expect(q).toBeTruthy();
        expect(q!.operation).toBe('+');
        expect(q!.num1).toBeGreaterThanOrEqual(1);
        expect(q!.num2).toBeGreaterThanOrEqual(1);
        expect(q!.correctAnswer).toBeLessThanOrEqual(10);
        expect(q!.correctAnswer).toBe(q!.num1 + q!.num2);
        service.submitAnswer(q!.correctAnswer);
      }
    }
  });
});

describe('GameService - Multiplication Training Score Window', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
  });

  it('should initialize multiplication training with 0/0 score', () => {
    service.startMultiplicationTraining([2, 3]);
    service.startActiveQuiz();

    expect(service.trainingScore().formatted).toBe('0/0');
    expect(service.trainingScore().correct).toBe(0);
    expect(service.trainingScore().total).toBe(0);
  });

  it('should progress score from 0/0 to 1/1, 2/2 up to /10', () => {
    service.startMultiplicationTraining([5]);
    service.startActiveQuiz();

    expect(service.trainingScore().formatted).toBe('0/0');

    // Answer 1 correct
    const q1 = service.currentQuestion();
    expect(q1).toBeTruthy();
    service.submitAnswer(q1!.correctAnswer);
    expect(service.trainingScore().formatted).toBe('1/1');

    // Answer 2 wrong
    service.submitAnswer(99999);
    expect(service.trainingScore().formatted).toBe('1/2');

    // Answer 3 correct
    const q3 = service.currentQuestion();
    service.submitAnswer(q3!.correctAnswer);
    expect(service.trainingScore().formatted).toBe('2/3');
  });

  it('should maintain only the last 10 answers once exceeding 10 questions', () => {
    service.startMultiplicationTraining([7]);
    service.startActiveQuiz();

    // Submit 10 correct answers
    for (let i = 0; i < 10; i++) {
      const q = service.currentQuestion();
      service.submitAnswer(q!.correctAnswer);
    }
    expect(service.trainingScore().formatted).toBe('10/10');
    expect(service.trainingScore().total).toBe(10);

    // 11th answer is wrong -> first correct answer drops out of window -> 9/10
    service.submitAnswer(99999);
    expect(service.trainingScore().formatted).toBe('9/10');
    expect(service.trainingScore().total).toBe(10);

    // 12th answer is correct -> another correct answer stays in window -> 9/10 (9 correct, 1 wrong)
    const q12 = service.currentQuestion();
    service.submitAnswer(q12!.correctAnswer);
    expect(service.trainingScore().formatted).toBe('9/10');

    // Submit 9 more wrong answers -> window will be 1 correct (from q12) + 9 wrong = 1/10
    for (let i = 0; i < 9; i++) {
      service.submitAnswer(99999);
    }
    expect(service.trainingScore().formatted).toBe('1/10');

    // 1 more wrong answer -> window is 10 wrong = 0/10
    service.submitAnswer(99999);
    expect(service.trainingScore().formatted).toBe('0/10');
  });
});

describe('GameService - Mission 7 (Operator-Specific Range Configurations)', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
  });

  it('should respect operatorConfig for Level 7 (multiplication 1-10, addition and subtraction 1-30)', () => {
    const level7 = GAME_LEVELS.find(l => l.id === 7);
    expect(level7).toBeDefined();
    expect(level7!.operatorConfig).toBeDefined();
    expect(level7!.operatorConfig!['*']).toEqual({ minVal: 1, maxVal: 10 });
    expect(level7!.operatorConfig!['+']).toEqual({ minVal: 1, maxVal: 30 });
    expect(level7!.operatorConfig!['-']).toEqual({ minVal: 1, maxVal: 30 });

    let seenMul = false;
    let seenAdd = false;
    let seenSub = false;

    for (let round = 0; round < 30; round++) {
      service.startGame(level7!);
      for (let i = 0; i < 10; i++) {
        const q = service.currentQuestion();
        expect(q).toBeTruthy();
        if (q!.operation === '*') {
          seenMul = true;
          expect(q!.num1).toBeGreaterThanOrEqual(1);
          expect(q!.num1).toBeLessThanOrEqual(10);
          expect(q!.num2).toBeGreaterThanOrEqual(1);
          expect(q!.num2).toBeLessThanOrEqual(10);
          expect(q!.correctAnswer).toBe(q!.num1 * q!.num2);
        } else if (q!.operation === '+') {
          seenAdd = true;
          expect(q!.num1).toBeGreaterThanOrEqual(1);
          expect(q!.num1).toBeLessThanOrEqual(30);
          expect(q!.num2).toBeGreaterThanOrEqual(1);
          expect(q!.num2).toBeLessThanOrEqual(30);
          expect(q!.correctAnswer).toBe(q!.num1 + q!.num2);
        } else if (q!.operation === '-') {
          seenSub = true;
          expect(q!.num1).toBeGreaterThanOrEqual(1);
          expect(q!.num1).toBeLessThanOrEqual(30);
          expect(q!.num2).toBeGreaterThanOrEqual(1);
          expect(q!.num2).toBeLessThanOrEqual(30);
          expect(q!.num1).toBeGreaterThanOrEqual(q!.num2); // non-negative result
          expect(q!.correctAnswer).toBe(q!.num1 - q!.num2);
        }
        service.submitAnswer(q!.correctAnswer);
      }
    }

    expect(seenMul).toBe(true);
    expect(seenAdd).toBe(true);
    expect(seenSub).toBe(true);
  });
});
