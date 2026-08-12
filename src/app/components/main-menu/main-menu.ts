import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.css'
})
export class MainMenuComponent {
  protected readonly profileService = inject(ProfileService);
  protected readonly audioService = inject(AudioService);
  private readonly router = inject(Router);

  navigateTo(path: string) {
    this.audioService.playClick();
    this.router.navigate([path]);
  }
}
