import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { ProfileService } from './services/profile.service';
import { ProfileSelectionComponent } from './components/profile-selection/profile-selection';
import { MainMenuComponent } from './components/main-menu/main-menu';
import { LevelSelectionComponent } from './components/level-selection/level-selection';
import { MultiplicationSetupComponent } from './components/multiplication-setup/multiplication-setup';
import { GamePlayComponent } from './components/game-play/game-play';
import { GameSummaryComponent } from './components/game-summary/game-summary';

const profileGuard = () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);
  if (profileService.currentProfile()) {
    return true;
  }
  router.navigate(['/profiles']);
  return false;
};

export const routes: Routes = [
  { path: 'profiles', component: ProfileSelectionComponent },
  { path: 'menu', component: MainMenuComponent, canActivate: [profileGuard] },
  { path: 'levels', component: LevelSelectionComponent, canActivate: [profileGuard] },
  { path: 'multiplication', component: MultiplicationSetupComponent, canActivate: [profileGuard] },
  { path: 'game/:levelId', component: GamePlayComponent, canActivate: [profileGuard] },
  { path: 'summary', component: GameSummaryComponent, canActivate: [profileGuard] },
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  { path: '**', redirectTo: 'menu' }
];
