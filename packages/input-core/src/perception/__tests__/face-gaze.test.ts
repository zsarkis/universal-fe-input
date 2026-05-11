import { describe, it, expect, vi } from 'vitest';

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: vi.fn() },
  FaceLandmarker: { createFromOptions: vi.fn() },
}));

import { FaceGazeAdapter, type FaceGazeCalibrationSample, type GazeFeatures } from '../face-gaze.js';

const sample = (
  screenX: number,
  screenY: number,
  partial: Partial<GazeFeatures> = {},
): FaceGazeCalibrationSample => ({
  screenX,
  screenY,
  features: {
    lx: 0, ly: 0, rx: 0, ry: 0,
    yaw: 0, pitch: 0, roll: 0,
    tx: 0, ty: 0, tz: 0,
    ...partial,
  },
});

describe('FaceGazeAdapter calibration', () => {
  it('calibrates from 12 distinct samples spanning the iris feature space', () => {
    // Generate 16 samples on a 4x4 grid so the regression has plenty of data.
    const samples: FaceGazeCalibrationSample[] = [];
    for (const lx of [-1, -0.33, 0.33, 1]) {
      for (const ly of [-1, -0.33, 0.33, 1]) {
        samples.push(
          sample(500 * (lx + 1), 400 * (ly + 1), { lx, ly, rx: lx, ry: ly }),
        );
      }
    }
    const a = new FaceGazeAdapter();
    a.setCalibration(samples);
    expect(a.isCalibrated).toBe(true);
  });

  it('refuses to calibrate with fewer than 12 samples', () => {
    const samples: FaceGazeCalibrationSample[] = Array.from({ length: 9 }, (_, k) =>
      sample(k * 100, k * 100, { lx: k * 0.1, ly: k * 0.1 }),
    );
    const a = new FaceGazeAdapter();
    a.setCalibration(samples);
    expect(a.isCalibrated).toBe(false);
  });
});
