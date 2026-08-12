export interface LevelRecord {
  levelId: number;
  bestScore: number;
  bestTimeSeconds: number; // Fastest time to achieve bestScore
}

export interface Profile {
  id: string;
  name: string;
  avatar: string; // Emoji string (e.g. '🦊', '🦄')
  unlockedLevel: number; // Highest level unlocked (1-indexed, e.g. 1 to 5)
  highScore: number; // Maximum score in a single game
  totalPoints: number; // Total points earned across all games
  gamesPlayed: number;
  badges: string[]; // List of names of earned badges
  levelRecords: LevelRecord[]; // Records for each level
}
