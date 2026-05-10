import { describe, it, expect, vi, beforeEach } from 'vitest';

const { detectForVideo, close, forVisionTasks, createFromOptions } = vi.hoisted(() => ({
  detectForVideo: vi.fn(),
  close: vi.fn(),
  forVisionTasks: vi.fn().mockResolvedValue({}),
  createFromOptions: vi.fn(),
}));

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks },
  HandLandmarker: {
    createFromOptions,
  },
}));

import { HandAdapter } from '../hand.js';

describe('HandAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    forVisionTasks.mockResolvedValue({});
    createFromOptions.mockResolvedValue({ detectForVideo, close });
  });

  it('emits readings while running', async () => {
    const a = new HandAdapter({ tickIntervalMs: 0 });
    const readings: unknown[] = [];
    a.on('reading', (r) => readings.push(r));
    detectForVideo.mockReturnValue({
      landmarks: [
        Array.from({ length: 21 }, (_, i) => {
          if (i === 4) return { x: 0.5, y: 0.5, z: 0 };
          if (i === 8) return { x: 0.51, y: 0.51, z: 0 };
          return { x: 0.5, y: 0.5, z: 0 };
        }),
      ],
    });
    const fakeStream = {
      getVideoTracks: () => [{ getSettings: () => ({ width: 640, height: 480 }) }],
    } as unknown as MediaStream;
    await a.start(fakeStream);
    a._tickForTest(100);
    a._tickForTest(200);
    expect(readings.length).toBeGreaterThan(0);
    const last = readings[readings.length - 1] as { gesture: string; heldMs: number };
    expect(last.gesture).toBe('pinch');
    expect(last.heldMs).toBeGreaterThanOrEqual(100);
    a.stop();
    expect(close).toHaveBeenCalled();
  });
});
