import { Injectable, signal, computed } from '@angular/core';
import { Profile, LevelRecord } from '../models/profile.model';
import { GAME_LEVELS } from '../config/game-levels';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly STORAGE_KEY = 'mathfun_profiles';
  private readonly ACTIVE_PROFILE_KEY = 'mathfun_active_profile_id';

  // Signals
  private profiles = signal<Profile[]>([]);
  private activeProfileId = signal<string | null>(null);

  // Read-only public views of the signals
  readonly allProfiles = computed(() => this.profiles());
  readonly currentProfile = computed(() => {
    const activeId = this.activeProfileId();
    if (!activeId) return null;
    return this.profiles().find(p => p.id === activeId) || null;
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const rawProfiles = localStorage.getItem(this.STORAGE_KEY);
    if (rawProfiles) {
      try {
        const parsed = JSON.parse(rawProfiles) as Profile[];
        // Migrations: ensure levelRecords exist on older stored profiles
        const migrated = parsed.map(p => ({
          ...p,
          levelRecords: p.levelRecords || []
        }));
        this.profiles.set(migrated);
      } catch (e) {
        console.error('Failed to parse profiles from localStorage', e);
        this.profiles.set([]);
      }
    }

    const activeId = localStorage.getItem(this.ACTIVE_PROFILE_KEY);
    if (activeId) {
      this.activeProfileId.set(activeId);
    }
  }

  private saveToStorage(updatedProfiles: Profile[]) {
    this.profiles.set(updatedProfiles);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProfiles));
  }

  createProfile(name: string, avatar: string): Profile {
    const newProfile: Profile = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      avatar: avatar,
      unlockedLevel: 1,
      highScore: 0,
      totalPoints: 0,
      gamesPlayed: 0,
      badges: [],
      levelRecords: []
    };

    const currentList = this.profiles();
    const updated = [...currentList, newProfile];
    this.saveToStorage(updated);
    
    // Automatically select the newly created profile
    this.selectProfile(newProfile.id);
    return newProfile;
  }

  selectProfile(id: string | null) {
    this.activeProfileId.set(id);
    if (id) {
      localStorage.setItem(this.ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_PROFILE_KEY);
    }
  }

  deleteProfile(id: string) {
    const currentList = this.profiles();
    const updated = currentList.filter(p => p.id !== id);
    this.saveToStorage(updated);

    if (this.activeProfileId() === id) {
      this.selectProfile(null);
    }
  }

  updateProfileProgress(levelId: number, score: number, timeTakenSeconds: number): { unlockedNextLevel: boolean; newBadges: string[]; isNewRecord: boolean } {
    const current = this.currentProfile();
    if (!current) return { unlockedNextLevel: false, newBadges: [], isNewRecord: false };

    let unlockedNextLevel = false;
    let isNewRecord = false;
    const newBadges: string[] = [];

    // Points calculation: 10 points per correct answer + speed bonus (for positive scores)
    const pointsEarned = score * 10 + (score > 0 ? Math.max(0, 100 - timeTakenSeconds) : 0);

    const updatedProfiles = this.profiles().map(p => {
      if (p.id === current.id) {
        // Calculate new level unlock dynamically based on total levels
        let nextUnlockedLevel = p.unlockedLevel;
        if (score >= 8 && p.unlockedLevel === levelId && levelId < GAME_LEVELS.length) {
          nextUnlockedLevel = levelId + 1;
          unlockedNextLevel = true;
        }

        // Record tracking
        const records = [...(p.levelRecords || [])];
        const existingRecordIdx = records.findIndex(r => r.levelId === levelId);

        if (existingRecordIdx === -1) {
          // First record at this level
          records.push({
            levelId,
            bestScore: score,
            bestTimeSeconds: timeTakenSeconds
          });
          isNewRecord = score > 0; // count as a record if they got at least one question right
        } else {
          const rec = records[existingRecordIdx];
          if (score > rec.bestScore) {
            records[existingRecordIdx] = {
              levelId,
              bestScore: score,
              bestTimeSeconds: timeTakenSeconds
            };
            isNewRecord = true;
          } else if (score === rec.bestScore && timeTakenSeconds < rec.bestTimeSeconds) {
            records[existingRecordIdx] = {
              levelId,
              bestScore: score,
              bestTimeSeconds: timeTakenSeconds
            };
            isNewRecord = true;
          }
        }

        // Badges evaluation
        const currentBadges = new Set(p.badges);
        
        // 1. Badge for completing any level with full score
        if (score === 10) {
          const masterBadge = `Maître du Niveau ${levelId}`;
          if (!currentBadges.has(masterBadge)) {
            currentBadges.add(masterBadge);
            newBadges.push(masterBadge);
          }
        }

        // 2. Speed demon badge (all correct under 30 seconds)
        if (score === 10 && timeTakenSeconds < 30) {
          const speedBadge = 'Démon de la Vitesse ⚡';
          if (!currentBadges.has(speedBadge)) {
            currentBadges.add(speedBadge);
            newBadges.push(speedBadge);
          }
        }

        // 3. First game played badge
        if (p.gamesPlayed === 0) {
          const firstStepBadge = 'Première Étoile en Maths ⭐';
          if (!currentBadges.has(firstStepBadge)) {
            currentBadges.add(firstStepBadge);
            newBadges.push(firstStepBadge);
          }
        }

        // 4. Ultimate solver badge for beating the final level
        if (levelId === GAME_LEVELS.length && score >= 8) {
          const geniusBadge = 'Génie des Maths 👑';
          if (!currentBadges.has(geniusBadge)) {
            currentBadges.add(geniusBadge);
            newBadges.push(geniusBadge);
          }
        }

        return {
          ...p,
          unlockedLevel: nextUnlockedLevel,
          highScore: Math.max(p.highScore, score),
          totalPoints: p.totalPoints + Math.round(pointsEarned),
          gamesPlayed: p.gamesPlayed + 1,
          badges: Array.from(currentBadges),
          levelRecords: records
        };
      }
      return p;
    });

    this.saveToStorage(updatedProfiles);
    return { unlockedNextLevel, newBadges, isNewRecord };
  }
}
