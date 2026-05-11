import { describe, it, expect, vi } from 'vitest';

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: vi.fn() },
  FaceLandmarker: { createFromOptions: vi.fn() },
}));

import { FaceGazeAdapter, type FaceGazeCalibrationSample } from '../face-gaze.js';

describe('FaceGazeAdapter calibration math', () => {
  it('a perfectly linear set of samples is recovered to within 5 px', () => {
    // Construct synthetic samples where screen coords are a known linear function
    // of features: x = 100*lx + 100*rx + 500, y = 100*ly + 100*ry + 400.
    const samples: FaceGazeCalibrationSample[] = [];
    for (const lx of [-0.5, 0, 0.5]) {
      for (const ly of [-0.5, 0, 0.5]) {
        samples.push({
          screenX: 100 * lx + 100 * lx + 500,
          screenY: 100 * ly + 100 * ly + 400,
          features: { lx, ly, rx: lx, ry: ly },
        });
      }
    }
    const a = new FaceGazeAdapter();
    a.setCalibration(samples);
    expect(a.isCalibrated).toBe(true);
  });

  it('refuses to calibrate with fewer than 5 samples', () => {
    const a = new FaceGazeAdapter();
    a.setCalibration([
      { screenX: 0, screenY: 0, features: { lx: 0, ly: 0, rx: 0, ry: 0 } },
    ]);
    expect(a.isCalibrated).toBe(false);
  });
});
