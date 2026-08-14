import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('should create the app and have correct title signal', () => {
    const app = new App();
    expect(app).toBeTruthy();
    expect((app as any).title()).toEqual('MathFun');
  });
});
