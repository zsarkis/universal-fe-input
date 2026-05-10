import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  setGazeListener,
  begin,
  end,
  setRegression,
  showVideoPreview,
  showPredictionPoints,
  saveDataAcrossSessions,
} = vi.hoisted(() => ({
  setGazeListener: vi.fn(),
  begin: vi.fn().mockResolvedValue(undefined),
  end: vi.fn(),
  setRegression: vi.fn().mockReturnThis(),
  showVideoPreview: vi.fn().mockReturnThis(),
  showPredictionPoints: vi.fn().mockReturnThis(),
  saveDataAcrossSessions: vi.fn().mockReturnThis(),
}));

vi.mock('webgazer', () => ({
  default: {
    setGazeListener,
    begin,
    end,
    setRegression,
    showVideoPreview,
    showPredictionPoints,
    saveDataAcrossSessions,
  },
}));

import { GazeAdapter } from '../gaze.js';

describe('GazeAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The mocks are reset; re-bind chainable returns
    setRegression.mockReturnThis();
    showVideoPreview.mockReturnThis();
    showPredictionPoints.mockReturnThis();
    saveDataAcrossSessions.mockReturnThis();
    begin.mockResolvedValue(undefined);
  });

  it('start() initializes WebGazer and registers a gaze listener', async () => {
    const a = new GazeAdapter();
    await a.start({} as MediaStream);
    expect(begin).toHaveBeenCalled();
    expect(setGazeListener).toHaveBeenCalled();
    expect(a.status).toBe('running');
  });

  it('emits readings (with smoothing + fixation) when WebGazer fires', async () => {
    const a = new GazeAdapter();
    const readings: unknown[] = [];
    a.on('reading', (r) => readings.push(r));
    await a.start({} as MediaStream);
    const listener = setGazeListener.mock.calls[0]?.[0] as (
      data: { x: number; y: number } | null,
      ts: number,
    ) => void;
    listener({ x: 100, y: 100 }, 0);
    listener({ x: 100, y: 100 }, 50);
    listener({ x: 100, y: 100 }, 200);
    expect(readings.length).toBe(3);
    const last = readings[readings.length - 1] as { kind: string; fixated: boolean };
    expect(last.kind).toBe('gaze');
    expect(last.fixated).toBe(true);
  });

  it('stop() ends WebGazer and resets status', async () => {
    const a = new GazeAdapter();
    await a.start({} as MediaStream);
    a.stop();
    expect(end).toHaveBeenCalled();
    expect(a.status).toBe('idle');
  });
});
