import { describe, it, expect, vi } from 'vitest';
import { TypedEmitter } from '../emitter.js';

type Events = { ping: number; pong: string };

describe('TypedEmitter', () => {
  it('calls listeners with typed payloads', () => {
    const e = new TypedEmitter<Events>();
    const cb = vi.fn();
    e.on('ping', cb);
    e.emit('ping', 42);
    expect(cb).toHaveBeenCalledWith(42);
  });

  it('off removes a listener', () => {
    const e = new TypedEmitter<Events>();
    const cb = vi.fn();
    e.on('pong', cb);
    e.off('pong', cb);
    e.emit('pong', 'x');
    expect(cb).not.toHaveBeenCalled();
  });

  it('on returns an unsubscribe function', () => {
    const e = new TypedEmitter<Events>();
    const cb = vi.fn();
    const off = e.on('ping', cb);
    off();
    e.emit('ping', 1);
    expect(cb).not.toHaveBeenCalled();
  });

  it('emit with no listeners is a no-op', () => {
    const e = new TypedEmitter<Events>();
    expect(() => e.emit('ping', 1)).not.toThrow();
  });
});
