import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  protected readonly profileService = inject(ProfileService);
  protected readonly audioService = inject(AudioService);
  private readonly router = inject(Router);

  toggleTheme() {
    this.audioService.playClick();
    const doc = document.documentElement;
    if (doc.classList.contains('dark-theme')) {
      doc.classList.remove('dark-theme');
      localStorage.setItem('mathfun_theme', 'light');
    } else {
      doc.classList.add('dark-theme');
      localStorage.setItem('mathfun_theme', 'dark');
    }
  }

  isDarkTheme(): boolean {
    return document.documentElement.classList.contains('dark-theme');
  }

  toggleSound() {
    this.audioService.toggleSound(!this.audioService.isSoundEnabled());
    this.audioService.playClick();
  }

  changeProfile() {
    this.audioService.playClick();
    this.profileService.selectProfile(null);
    this.router.navigate(['/profiles']);
  }
}
