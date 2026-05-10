import { describe, it, expect } from 'vitest';
import { VERSION } from '../index.js';

describe('smoke', () => {
  it('exports a version string', () => {
    expect(VERSION).toBe('0.0.0');
  });
});
