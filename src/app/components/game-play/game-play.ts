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
  private colors = ['#FFD700', '#FF1493', '#00E5FF', '#00FF7F', '#FF4500', '#9370DB', '#FF007F', '#7C3AED', '#FFD93D'];

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
    const profile = this.profileService.currentProfile();

    if (!profile) {
      this.router.navigate(['/profiles']);
      return;
    }

    if (levelId === 99) {
      if (!this.gameService.currentLevel()) {
        this.router.navigate(['/multiplication']);
        return;
      }
    } else {
      const level = GAME_LEVELS.find(l => l.id === levelId);
      if (!level || profile.unlockedLevel < level.id) {
        this.router.navigate(['/levels']);
        return;
      }
      this.gameService.startGame(level);
    }

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

  finishTrainingSession() {
    this.audioService.playSuccess();
    this.router.navigate(['/summary']);
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
    } else {
      this.audioService.playError();
      if (this.gameService.isTimerEnabled()) {
        this.gameService.applyTimePenalty(5);
        this.triggerPenaltyBadge();
        this.addFloatingFeedback('+5s ⚠️', 'wrong');
      } else {
        this.addFloatingFeedback('❌ Oups !', 'wrong');
      }
    }

    // Submit answer immediately to advance question without blocking delay
    this.gameService.submitAnswer(answerNum);

    if (this.gameService.isGameOver()) {
      const level = this.gameService.currentLevel();
      const score = this.gameService.correctAnswersCount();
      const totalTime = this.gameService.gameDuration();
      
      let isNewRecord = false;
      if (level && this.gameService.isTimerEnabled()) {
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

  // --- HTML5 Full-Screen Confetti Logic ---
  private setupConfetti() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Center radial blast (70 particles)
    for (let i = 0; i < 70; i++) {
      const angle = (i / 70) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
      const velocity = 12 + Math.random() * 20;
      this.particles.push({
        x: width / 2,
        y: height / 2,
        size: 8 + Math.random() * 12,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        speedX: Math.cos(angle) * velocity,
        speedY: Math.sin(angle) * velocity - 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 14 - 7,
        opacity: 1
      });
    }

    // 2. Four screen corners blast (80 particles)
    for (let i = 0; i < 20; i++) {
      this.particles.push(this.createParticle(0, 0, 45));
      this.particles.push(this.createParticle(width, 0, 135));
      this.particles.push(this.createParticle(0, height, -45));
      this.particles.push(this.createParticle(width, height, -135));
    }
  }

  private createParticle(x: number, y: number, angleDeg: number): ConfettiParticle {
    const velocity = 12 + Math.random() * 18;
    const angleRad = (angleDeg + (Math.random() * 40 - 20)) * (Math.PI / 180);
    
    return {
      x,
      y,
      size: 7 + Math.random() * 10,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      speedX: Math.cos(angleRad) * velocity * (y === 0 ? 1 : (angleDeg > 90 ? -1 : 1)),
      speedY: Math.sin(angleRad) * velocity * (y === 0 ? 1 : -1),
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 12 - 6,
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
      p.speedY += 0.22;
      p.speedX *= 0.98;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.015;

      if (p.opacity <= 0 || p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
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
