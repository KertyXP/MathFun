import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AudioService } from '../../services/audio.service';
import { Profile } from '../../models/profile.model';

@Component({
  selector: 'app-profile-selection',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile-selection.html',
  styleUrl: './profile-selection.css'
})
export class ProfileSelectionComponent {
  protected readonly profileService = inject(ProfileService);
  protected readonly audioService = inject(AudioService);
  private readonly router = inject(Router);

  // Form fields
  newName = '';
  selectedAvatar = '🦊';
  showCreateForm = false;

  // Available kid-friendly emojis
  readonly avatars = ['🦊', '🦄', '🦁', '🐼', '🐨', '🐯', '🐸', '🐙', '🦕', '🦖', '🐝', '🦉', '🐱', '🐶', '🐵', '🐣'];

  selectAvatar(avatar: string) {
    this.audioService.playClick();
    this.selectedAvatar = avatar;
  }

  toggleCreateForm(show: boolean) {
    this.audioService.playClick();
    this.showCreateForm = show;
    if (show) {
      this.newName = '';
      this.selectedAvatar = this.avatars[Math.floor(Math.random() * this.avatars.length)];
    }
  }

  createProfile() {
    if (!this.newName.trim()) return;
    
    this.audioService.playSuccess();
    this.profileService.createProfile(this.newName, this.selectedAvatar);
    this.newName = '';
    this.showCreateForm = false;
    
    // Redirect to levels on success
    this.router.navigate(['/levels']);
  }

  selectProfile(profile: Profile) {
    this.audioService.playSuccess();
    this.profileService.selectProfile(profile.id);
    this.router.navigate(['/levels']);
  }

  deleteProfile(id: string, event: Event) {
    event.stopPropagation(); // Avoid selecting the profile when clicking delete
    this.audioService.playError();
    if (confirm('Voulez-vous vraiment supprimer ce profil ? Tous les points seront perdus !')) {
      this.profileService.deleteProfile(id);
    }
  }
}
