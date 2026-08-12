import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../services/game.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-multiplication-setup',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './multiplication-setup.html',
  styleUrl: './multiplication-setup.css'
})
export class MultiplicationSetupComponent {
  private readonly gameService = inject(GameService);
  protected readonly audioService = inject(AudioService);
  private readonly router = inject(Router);

  readonly availableTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  // Selected tables signals (defaults to table 2 selected)
  selectedTables = signal<number[]>([2]);

  isSelected(table: number): boolean {
    return this.selectedTables().includes(table);
  }

  toggleTable(table: number) {
    this.audioService.playClick();
    this.selectedTables.update(current => {
      if (current.includes(table)) {
        return current.filter(t => t !== table);
      } else {
        return [...current, table];
      }
    });
  }

  toggleSelectAll() {
    this.audioService.playClick();
    if (this.selectedTables().length === this.availableTables.length) {
      this.selectedTables.set([]);
    } else {
      this.selectedTables.set([...this.availableTables]);
    }
  }

  startPractice() {
    if (this.selectedTables().length === 0) return;
    
    this.audioService.playSuccess();
    this.gameService.startMultiplicationTraining(this.selectedTables());
    this.router.navigate(['/game/99']);
  }
}
