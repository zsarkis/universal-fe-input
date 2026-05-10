export type Gesture = 'pinch' | 'open_palm' | 'none';

export type IntentName =
  | 'open'
  | 'select'
  | 'close'
  | 'back'
  | 'scroll_down'
  | 'scroll_up'
  | 'top'
  | 'bottom'
  | 'next'
  | 'previous'
  | 'summarize'
  | 'read_aloud'
  | 'stop_reading'
  | 'calibrate'
  | 'cancel'
  | 'help';

export interface GazeReading {
  kind: 'gaze';
  x: number;
  y: number;
  confidence: number;
  fixated: boolean;
  ts: number;
}

export interface HandReading {
  kind: 'hand';
  gesture: Gesture;
  heldMs: number;
  confidence: number;
  ts: number;
}

export type VoiceReading =
  | { kind: 'voice'; phase: 'started'; ts: number }
  | {
      kind: 'voice';
      phase: 'transcript';
      transcript: string;
      intent: IntentName | null;
      confidence: number;
      ts: number;
    };

export type PerceptionReading = GazeReading | HandReading | VoiceReading;

export interface Target {
  id: string;
  rect: { x: number; y: number; width: number; height: number };
}

export interface Intent {
  name: IntentName;
  targetId?: string;
  ts: number;
  meta?: Record<string, unknown>;
}

export type FusionState =
  | 'IDLE'
  | 'HOVERED'
  | 'ARMED'
  | 'DICTATING'
  | 'CALIBRATING';

export interface FusionConfig {
  hoverDwellMs: number;
  armTimeoutMs: number;
  commitPinchMs: number;
  gazeConfidenceMin: number;
  gazeAbortLeaveMs: number;
}

export const DEFAULT_FUSION_CONFIG: FusionConfig = {
  hoverDwellMs: 80,
  armTimeoutMs: 800,
  commitPinchMs: 250,
  gazeConfidenceMin: 0.6,
  gazeAbortLeaveMs: 150,
};
