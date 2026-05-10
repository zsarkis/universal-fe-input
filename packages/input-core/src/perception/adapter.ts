import type { TypedEmitter } from '../emitter.js';
import type { PerceptionReading } from '../types.js';

export type AdapterStatus = 'idle' | 'starting' | 'running' | 'error';

export type PerceptionAdapterEvents = {
  reading: PerceptionReading;
  error: Error;
  status: AdapterStatus;
};

export interface PerceptionAdapter {
  readonly status: AdapterStatus;
  start(stream: MediaStream): Promise<void>;
  stop(): void;
  on: TypedEmitter<PerceptionAdapterEvents>['on'];
  off: TypedEmitter<PerceptionAdapterEvents>['off'];
}
