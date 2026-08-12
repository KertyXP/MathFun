import { Component, OnInit, OnDestroy, inject, signal, viewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameService } from '../../services/game.service';
import { ProfileService } from '../../services/profile.service';
import { AudioService } from '../../services/audio.service';
import { GAME_LEVELS } from '../../config/game-levels';
import { FormsModule } from '@angular/forms';

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export interface FloatingFeedback {
  id: number;
  text: string;
  type: 'correct' | 'wrong';
  offsetX: number;
}

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './game-play.html',
  styleUrl: './game-play.css'
})
export class GamePlayComponent implements OnInit, OnDestroy {
  protected readonly gameService = inject(GameService);
  protected readonly profileService = inject(ProfileService);
  protected readonly audioService = inject(AudioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Template element references
  private canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('confettiCanvas');
  private inputRef = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  // Input states - typedAnswer is typed as any to handle string/number binding safely
  typedAnswer: any = '';
  
  // Non-blocking floating feedback popups
  floatingFeedbacks = signal<FloatingFeedback[]>([]);
  private nextFeedbackId = 0;

  // Timing penalty states
  showPenalty = signal<boolean>(false);
  private penaltyTimeout: any = null;

  // Confetti particles
  private particles: ConfettiParticle[] = [];
  private animationFrameId: number | null = null;
  private colors = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#FF9F43', '#AC87FF'];

  get hasTypedAnswer(): boolean {
    if (this.typedAnswer === undefined || this.typedAnswer === null) return false;
    return String(this.typedAnswer).trim() !== '';
  }

  // Listen for Enter key globally to start the quiz
  @HostListener('window:keydown.enter', ['$event'])
  handleGlobalEnter(event: Event) {
    if (!this.gameService.isGameStarted()) {
      event.preventDefault();
      this.startQuiz();
    }
  }

  ngOnInit() {
    const levelId = Number(this.route.snapshot.paramMap.get('levelId'));
    const level = GAME_LEVELS.find(l => l.id === levelId);

    if (!level) {
      this.router.navigate(['/levels']);
      return;
    }

    const profile = this.profileService.currentProfile();
    if (!profile || profile.unlockedLevel < level.id) {
      this.router.navigate(['/levels']);
      return;
    }

    this.gameService.startGame(level);
    this.setupConfetti();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.penaltyTimeout) {
      clearTimeout(this.penaltyTimeout);
    }
  }

  startQuiz() {
    this.audioService.playSuccess();
    this.gameService.startActiveQuiz();
    this.focusInput();
  }

  submitTypedAnswer() {
    if (this.typedAnswer === undefined || this.typedAnswer === null) return;
    const answerStr = String(this.typedAnswer).trim();
    if (answerStr === '') return; // do not submit empty answers

    const answerNum = Number(answerStr);
    if (isNaN(answerNum)) return;

    const question = this.gameService.currentQuestion();
    if (!question) return;

    const correct = answerNum === question.correctAnswer;

    // Clear typed answer instantly so player can type the next answer without delay
    this.typedAnswer = '';

    if (correct) {
      this.audioService.playSuccess();
      this.triggerConfetti();
      this.addFloatingFeedback('✨ Correct !', 'correct');
    } else {
      this.audioService.playError();
      this.gameService.applyTimePenalty(5);
      this.triggerPenaltyBadge();
      this.addFloatingFeedback('+5s ⚠️', 'wrong');
    }

    // Submit answer immediately to advance question without blocking delay
    this.gameService.submitAnswer(answerNum);

    if (this.gameService.isGameOver()) {
      const level = this.gameService.currentLevel();
      const score = this.gameService.correctAnswersCount();
      const totalTime = this.gameService.gameDuration();
      
      let isNewRecord = false;
      if (level) {
        const recordResult = this.profileService.updateProfileProgress(level.id, score, totalTime);
        isNewRecord = recordResult.isNewRecord;
      }

      sessionStorage.setItem('mathfun_last_is_record', isNewRecord ? 'true' : 'false');
      setTimeout(() => {
        this.router.navigate(['/summary']);
      }, 400);
    } else {
      this.focusInput();
    }
  }

  appendDigit(digit: string) {
    this.audioService.playClick();
    
    // Safely append digit to typedAnswer (string representation)
    const current = this.typedAnswer === undefined || this.typedAnswer === null ? '' : String(this.typedAnswer);
    if (current.length >= 4) return; // limit input to 4 digits
    
    this.typedAnswer = current === '' ? digit : current + digit;
  }

  backspaceDigit() {
    this.audioService.playClick();
    
    const current = this.typedAnswer === undefined || this.typedAnswer === null ? '' : String(this.typedAnswer);
    if (current.length <= 1) {
      this.typedAnswer = '';
    } else {
      this.typedAnswer = current.substring(0, current.length - 1);
    }
  }

  clearDigits() {
    this.audioService.playClick();
    this.typedAnswer = '';
  }

  private addFloatingFeedback(text: string, type: 'correct' | 'wrong') {
    const id = ++this.nextFeedbackId;
    const offsetX = (Math.random() - 0.5) * 60;
    const item: FloatingFeedback = { id, text, type, offsetX };
    
    this.floatingFeedbacks.update(items => [...items, item]);

    setTimeout(() => {
      this.floatingFeedbacks.update(items => items.filter(i => i.id !== id));
    }, 1000);
  }

  private triggerPenaltyBadge() {
    this.showPenalty.set(true);
    if (this.penaltyTimeout) {
      clearTimeout(this.penaltyTimeout);
    }
    this.penaltyTimeout = setTimeout(() => {
      this.showPenalty.set(false);
    }, 900);
  }

  private focusInput() {
    setTimeout(() => {
      const input = this.inputRef()?.nativeElement;
      if (input) {
        input.focus();
      }
    }, 50);
  }

  // --- HTML5 Confetti Logic ---
  private setupConfetti() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      this.drawConfetti();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private triggerConfetti() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const count = 40;
    // Sprays from bottom left & right
    for (let i = 0; i < count / 2; i++) {
      this.particles.push(this.createParticle(0, canvas.height, 45));
    }
    for (let i = 0; i < count / 2; i++) {
      this.particles.push(this.createParticle(canvas.width, canvas.height, 135));
    }
  }

  private createParticle(x: number, y: number, angleDeg: number): ConfettiParticle {
    const velocity = 8 + Math.random() * 12;
    const angleRad = (angleDeg + (Math.random() * 40 - 20)) * (Math.PI / 180);
    
    return {
      x,
      y,
      size: 5 + Math.random() * 7,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      speedX: Math.cos(angleRad) * velocity * (angleDeg > 90 ? -1 : 1),
      speedY: -Math.sin(angleRad) * velocity - 2,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
      opacity: 1
    };
  }

  private drawConfetti() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.25;
      p.speedX *= 0.98;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.018;

      if (p.opacity <= 0 || p.y > canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }
}
