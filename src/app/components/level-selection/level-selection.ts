import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { GameService } from '../../services/game.service';
import { AudioService } from '../../services/audio.service';
import { GAME_LEVELS, GameLevel } from '../../config/game-levels';

@Component({
  selector: 'app-level-selection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './level-selection.html',
  styleUrl: './level-selection.css'
})
export class LevelSelectionComponent {
  protected readonly profileService = inject(ProfileService);
  private readonly gameService = inject(GameService);
  protected readonly audioService = inject(AudioService);
  private readonly router = inject(Router);

  readonly levels = GAME_LEVELS;

  isLevelUnlocked(levelId: number): boolean {
    const profile = this.profileService.currentProfile();
    if (!profile) return false;
    return profile.unlockedLevel >= levelId;
  }

  selectLevel(level: GameLevel) {
    if (!this.isLevelUnlocked(level.id)) {
      this.audioService.playError();
      return;
    }

    this.audioService.playSuccess();
    this.gameService.startGame(level);
    this.router.navigate(['/game', level.id]);
  }
}
