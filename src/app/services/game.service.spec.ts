import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';

describe('GameService - Multiplication Training Score Window', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameService]
    });
    service = TestBed.inject(GameService);
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
