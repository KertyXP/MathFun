import { Component, OnInit, OnDestroy, inject, signal, viewChild, ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../services/game.service';
import { ProfileService } from '../../services/profile.service';
import { AudioService } from '../../services/audio.service';

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

@Component({
  selector: 'app-game-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game-summary.html',
  styleUrl: './game-summary.css'
})
export class GameSummaryComponent implements OnInit, OnDestroy {
  protected readonly gameService = inject(GameService);
  protected readonly profileService = inject(ProfileService);
  protected readonly audioService = inject(AudioService);
  private readonly router = inject(Router);

  private canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('confettiCanvas');

  // Summary states
  starsCount = signal<number>(0);
  passed = signal<boolean>(false);
  unlockedNext = signal<boolean>(false);
  isNewRecord = signal<boolean>(false);

  // Confetti engine
  private particles: ConfettiParticle[] = [];
  private animationFrameId: number | null = null;
  private colors = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#FF9F43', '#AC87FF'];
  private sprayInterval: any = null;

  ngOnInit() {
    const level = this.gameService.currentLevel();
    const total = this.gameService.totalQuestionsCount();

    if (!level || total === 0) {
      this.router.navigate(['/levels']);
      return;
    }

    const score = this.gameService.correctAnswersCount();
    
    // Stars rating
    if (score === 10) {
      this.starsCount.set(3);
    } else if (score >= 8) {
      this.starsCount.set(2);
    } else if (score >= 5) {
      this.starsCount.set(1);
    } else {
      this.starsCount.set(0);
    }

    this.passed.set(score >= level.passingScore);

    // Retrieve new record check
    const wasRecord = sessionStorage.getItem('mathfun_last_is_record') === 'true';
    this.isNewRecord.set(wasRecord);

    // Check unlocked state
    const profile = this.profileService.currentProfile();
    if (profile) {
      this.unlockedNext.set(this.passed() && profile.unlockedLevel > level.id);
    }

    // Play sounds & trigger animations
    if (wasRecord) {
      // Epic celebration sound arpeggio
      this.audioService.playLevelUp();
      this.setupConfetti();
      this.triggerConfetti();
      
      // Spray confetti repeatedly every 1.2s for that congrats screen effect
      this.sprayInterval = setInterval(() => {
        this.triggerConfetti();
      }, 1200);
    } else if (this.passed()) {
      this.audioService.playLevelUp();
      this.setupConfetti();
      this.triggerConfetti();
    } else {
      this.audioService.playError();
    }
  }

  ngOnDestroy() {
    if (this.sprayInterval) {
      clearInterval(this.sprayInterval);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  replayLevel() {
    const level = this.gameService.currentLevel();
    if (!level) return;
    this.audioService.playClick();
    if (this.gameService.isTimerEnabled()) {
      this.gameService.startGame(level);
      this.router.navigate(['/game', level.id]);
    } else {
      this.router.navigate(['/game', 99]);
    }
  }

  // --- HTML5 Confetti Engine ---
  private setupConfetti() {
    setTimeout(() => {
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
    }, 50);
  }

  private triggerConfetti() {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    const count = 50;
    // Sprays from bottom left & right corners
    for (let i = 0; i < count / 2; i++) {
      this.particles.push(this.createParticle(0, canvas.height, 35));
    }
    for (let i = 0; i < count / 2; i++) {
      this.particles.push(this.createParticle(canvas.width, canvas.height, 145));
    }
  }

  private createParticle(x: number, y: number, angleDeg: number): ConfettiParticle {
    const velocity = 10 + Math.random() * 15;
    const angleRad = (angleDeg + (Math.random() * 40 - 20)) * (Math.PI / 180);
    
    return {
      x,
      y,
      size: 6 + Math.random() * 8,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      speedX: Math.cos(angleRad) * velocity * (angleDeg > 90 ? -1 : 1),
      speedY: -Math.sin(angleRad) * velocity - 3,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 8 - 4,
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
      p.opacity -= 0.012;

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
