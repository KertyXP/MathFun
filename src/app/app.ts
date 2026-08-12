import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('MathFun');

  constructor() {
    const savedTheme = localStorage.getItem('mathfun_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark-theme');
    } else {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark-theme');
      }
    }
  }
}
