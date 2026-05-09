# Universal FE Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multimodal input engine (`@input/core`) that fuses webcam gaze, hand gestures, and voice intent into a single intent stream, plus a hands-free article reader (`apps/reader`) that consumes the engine and serves as the public showcase.

**Architecture:** pnpm + turbo monorepo. `@input/core` is a framework-agnostic TypeScript package containing perception adapters (WebGazer, MediaPipe Hands, Whisper via transformers.js), a fusion state machine, and a typed intent dispatcher. `apps/reader` is a React + Vite app that imports the engine and renders gaze/voice/gesture affordances. `workers/summarize` is a Cloudflare Worker proxy for live LLM summarization with rate limiting and a hard daily spend cap.

**Tech Stack:** TypeScript, pnpm, turbo, Vite, React, Tailwind, Zustand, React Router, Vitest, MediaPipe Tasks Vision, WebGazer.js, `@xenova/transformers` (Whisper), Cloudflare Workers, Anthropic SDK (Claude Haiku 4.5).

**Spec:** `docs/superpowers/specs/2026-05-09-universal-fe-input-design.md`

---

## Phase 0: Repo scaffold

Goal: a working pnpm + turbo monorepo with placeholder `@input/core` and `apps/reader` packages, build + lint + test pipelines green.

### Task 0.1: Initialize monorepo

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.editorconfig`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "universal-fe-input",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "dev": "turbo run dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "workers/*"
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 5: Create `.editorconfig`**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 6: Install root dependencies**

Run: `pnpm install`
Expected: lockfile created, `node_modules/` populated.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .editorconfig pnpm-lock.yaml
git commit -m "chore: initialize pnpm + turbo monorepo"
```

### Task 0.2: Scaffold `@input/core` package skeleton

**Files:**
- Create: `packages/input-core/package.json`
- Create: `packages/input-core/tsconfig.json`
- Create: `packages/input-core/vitest.config.ts`
- Create: `packages/input-core/src/index.ts`
- Create: `packages/input-core/src/__tests__/smoke.test.ts`
- Create: `packages/input-core/README.md`

- [ ] **Step 1: Create `packages/input-core/package.json`**

```json
{
  "name": "@input/core",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "echo 'TODO: eslint'",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `packages/input-core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "lib": ["ES2022", "DOM", "WebWorker"],
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create `packages/input-core/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create `packages/input-core/src/index.ts`**

```ts
export const VERSION = '0.0.0';
```

- [ ] **Step 5: Create `packages/input-core/src/__tests__/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { VERSION } from '../index.js';

describe('smoke', () => {
  it('exports a version string', () => {
    expect(VERSION).toBe('0.0.0');
  });
});
```

- [ ] **Step 6: Create `packages/input-core/README.md`**

```markdown
# @input/core

Multimodal input engine. Fuses webcam gaze, hand gestures, and voice intent into a single typed intent stream.

See `docs/superpowers/specs/2026-05-09-universal-fe-input-design.md` for the design.
```

- [ ] **Step 7: Install and verify build + test**

Run: `pnpm install`
Run: `pnpm --filter @input/core build`
Expected: `packages/input-core/dist/index.js` and `index.d.ts` exist.

Run: `pnpm --filter @input/core test`
Expected: `1 passed`.

- [ ] **Step 8: Commit**

```bash
git add packages/input-core pnpm-lock.yaml
git commit -m "feat(core): scaffold @input/core package skeleton"
```

### Task 0.3: Scaffold `apps/reader` package skeleton

**Files:**
- Create: `apps/reader/package.json`
- Create: `apps/reader/tsconfig.json`
- Create: `apps/reader/vite.config.ts`
- Create: `apps/reader/index.html`
- Create: `apps/reader/src/main.tsx`
- Create: `apps/reader/src/App.tsx`

- [ ] **Step 1: Create `apps/reader/package.json`**

```json
{
  "name": "@apps/reader",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "echo 'TODO: eslint'",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "@input/core": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/reader/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Create `apps/reader/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```

- [ ] **Step 4: Create `apps/reader/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Universal FE Input — Reader</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `apps/reader/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 6: Create `apps/reader/src/App.tsx`**

```tsx
import { VERSION } from '@input/core';

export function App() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Universal FE Input — Reader</h1>
      <p>Engine version: {VERSION}</p>
    </main>
  );
}
```

- [ ] **Step 7: Install and verify**

Run: `pnpm install`
Run: `pnpm --filter @input/core build` (reader depends on built core)
Run: `pnpm --filter @apps/reader build`
Expected: `apps/reader/dist/index.html` exists.

- [ ] **Step 8: Commit**

```bash
git add apps/reader pnpm-lock.yaml
git commit -m "feat(reader): scaffold reader app skeleton with engine import"
```

---

## Phase 1: Engine — types, fusion state machine, intent dispatcher

Goal: a fully tested fusion state machine + typed intent dispatcher that runs against a mock perception source. No real perception yet.

### Task 1.1: Define perception reading types

**Files:**
- Create: `packages/input-core/src/types.ts`
- Test: `packages/input-core/src/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/input-core/src/__tests__/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type {
  GazeReading,
  HandReading,
  VoiceReading,
  Gesture,
  IntentName,
  PerceptionReading,
} from '../types.js';

describe('types', () => {
  it('gaze reading shape', () => {
    const r: GazeReading = { kind: 'gaze', x: 0, y: 0, confidence: 1, fixated: true, ts: 0 };
    expectTypeOf(r.kind).toEqualTypeOf<'gaze'>();
  });
  it('hand reading shape', () => {
    const r: HandReading = { kind: 'hand', gesture: 'pinch', heldMs: 0, confidence: 1, ts: 0 };
    expectTypeOf<Gesture>().toEqualTypeOf<'pinch' | 'open_palm' | 'none'>();
  });
  it('voice reading shape (transcript form)', () => {
    const r: VoiceReading = {
      kind: 'voice',
      phase: 'transcript',
      transcript: 'open',
      intent: 'open',
      confidence: 0.9,
      ts: 0,
    };
    expectTypeOf<IntentName>().toMatchTypeOf<'open' | 'cancel' | 'scroll_down'>();
  });
  it('voice reading shape (speech-started form)', () => {
    const r: VoiceReading = { kind: 'voice', phase: 'started', ts: 0 };
    expectTypeOf(r.phase).toEqualTypeOf<'started' | 'transcript'>();
  });
  it('PerceptionReading is the discriminated union', () => {
    const r: PerceptionReading = { kind: 'gaze', x: 0, y: 0, confidence: 1, fixated: true, ts: 0 };
    expectTypeOf<PerceptionReading['kind']>().toEqualTypeOf<'gaze' | 'hand' | 'voice'>();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @input/core test`
Expected: failure on missing `../types.js`.

- [ ] **Step 3: Create `packages/input-core/src/types.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @input/core test`
Expected: `2 passed` (smoke + types).

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/types.ts packages/input-core/src/__tests__/types.test.ts
git commit -m "feat(core): define perception, intent, and fusion types"
```

### Task 1.2: Implement a typed event emitter

**Files:**
- Create: `packages/input-core/src/emitter.ts`
- Test: `packages/input-core/src/__tests__/emitter.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/input-core/src/__tests__/emitter.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @input/core test`
Expected: `Cannot find module '../emitter.js'`.

- [ ] **Step 3: Create `packages/input-core/src/emitter.ts`**

```ts
type Listener<T> = (payload: T) => void;

export class TypedEmitter<E extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof E, Set<Listener<unknown>>>();

  on<K extends keyof E>(event: K, cb: Listener<E[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(cb as Listener<unknown>);
    return () => this.off(event, cb);
  }

  off<K extends keyof E>(event: K, cb: Listener<E[K]>): void {
    this.listeners.get(event)?.delete(cb as Listener<unknown>);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) (cb as Listener<E[K]>)(payload);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @input/core test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/emitter.ts packages/input-core/src/__tests__/emitter.test.ts
git commit -m "feat(core): typed event emitter"
```

### Task 1.3: Implement a target registry

**Files:**
- Create: `packages/input-core/src/targets.ts`
- Test: `packages/input-core/src/__tests__/targets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/input-core/src/__tests__/targets.test.ts
import { describe, it, expect } from 'vitest';
import { TargetRegistry } from '../targets.js';

describe('TargetRegistry', () => {
  it('returns null when no target hits', () => {
    const r = new TargetRegistry();
    expect(r.hit(10, 10)).toBeNull();
  });

  it('returns the target containing the point', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    expect(r.hit(50, 50)?.id).toBe('a');
  });

  it('returns the topmost (last-registered) target on overlap', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    r.register({ id: 'b', rect: { x: 50, y: 50, width: 100, height: 100 } });
    expect(r.hit(60, 60)?.id).toBe('b');
  });

  it('unregister removes a target', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    r.unregister('a');
    expect(r.hit(50, 50)).toBeNull();
  });

  it('register replaces an existing target with the same id', () => {
    const r = new TargetRegistry();
    r.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    r.register({ id: 'a', rect: { x: 200, y: 200, width: 100, height: 100 } });
    expect(r.hit(50, 50)).toBeNull();
    expect(r.hit(250, 250)?.id).toBe('a');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @input/core test`
Expected: missing module.

- [ ] **Step 3: Create `packages/input-core/src/targets.ts`**

```ts
import type { Target } from './types.js';

export class TargetRegistry {
  private readonly targets: Target[] = [];

  register(t: Target): void {
    this.unregister(t.id);
    this.targets.push(t);
  }

  unregister(id: string): void {
    const i = this.targets.findIndex((t) => t.id === id);
    if (i >= 0) this.targets.splice(i, 1);
  }

  hit(x: number, y: number): Target | null {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i]!;
      const { rect } = t;
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return t;
      }
    }
    return null;
  }

  clear(): void {
    this.targets.length = 0;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @input/core test`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/targets.ts packages/input-core/src/__tests__/targets.test.ts
git commit -m "feat(core): target registry with last-wins hit testing"
```

### Task 1.4: Implement intent grammar (voice transcript → IntentName)

**Files:**
- Create: `packages/input-core/src/intents/grammar.ts`
- Test: `packages/input-core/src/intents/__tests__/grammar.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/input-core/src/intents/__tests__/grammar.test.ts
import { describe, it, expect } from 'vitest';
import { resolveIntent } from '../grammar.js';

describe('resolveIntent', () => {
  const cases: Array<[string, ReturnType<typeof resolveIntent>]> = [
    ['open', { name: 'open' }],
    ['Open this', { name: 'open' }],
    ['select', { name: 'select' }],
    ['close', { name: 'close' }],
    ['back', { name: 'back' }],
    ['go back', { name: 'back' }],
    ['scroll down', { name: 'scroll_down' }],
    ['scroll up', { name: 'scroll_up' }],
    ['top', { name: 'top' }],
    ['go to top', { name: 'top' }],
    ['bottom', { name: 'bottom' }],
    ['next', { name: 'next' }],
    ['previous', { name: 'previous' }],
    ['previous one', { name: 'previous' }],
    ['summarize', { name: 'summarize' }],
    ['summarize this', { name: 'summarize' }],
    ['read aloud', { name: 'read_aloud' }],
    ['read it aloud', { name: 'read_aloud' }],
    ['stop reading', { name: 'stop_reading' }],
    ['calibrate', { name: 'calibrate' }],
    ['cancel', { name: 'cancel' }],
    ['nevermind', { name: 'cancel' }],
    ['help', { name: 'help' }],
    ['what can I say', { name: 'help' }],
    // Whisper-style noise
    ['  Open. ', { name: 'open' }],
    ['scrolldown', { name: 'scroll_down' }],
    // Unknown
    ['blueberry', null],
    ['', null],
  ];

  for (const [input, expected] of cases) {
    it(`resolves "${input}" → ${JSON.stringify(expected)}`, () => {
      const result = resolveIntent(input);
      if (expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result?.name).toBe(expected.name);
      }
    });
  }

  it('attaches confidence in [0, 1]', () => {
    const r = resolveIntent('open');
    expect(r?.confidence).toBeGreaterThan(0);
    expect(r?.confidence).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @input/core test`
Expected: missing module.

- [ ] **Step 3: Create `packages/input-core/src/intents/grammar.ts`**

```ts
import type { IntentName } from '../types.js';

interface IntentPattern {
  name: IntentName;
  patterns: RegExp[];
}

const RULES: IntentPattern[] = [
  { name: 'open', patterns: [/\bopen\b/] },
  { name: 'select', patterns: [/\bselect\b/, /\bchoose\b/] },
  { name: 'close', patterns: [/\bclose\b/, /\bdismiss\b/] },
  { name: 'back', patterns: [/\bback\b/, /\breturn\b/] },
  { name: 'scroll_down', patterns: [/\bscroll\s*down\b/, /\bscrolldown\b/, /\bdown\b/] },
  { name: 'scroll_up', patterns: [/\bscroll\s*up\b/, /\bscrollup\b/, /\bup\b/] },
  { name: 'top', patterns: [/\btop\b/] },
  { name: 'bottom', patterns: [/\bbottom\b/] },
  { name: 'next', patterns: [/\bnext\b/] },
  { name: 'previous', patterns: [/\bprevious\b/, /\bprev\b/] },
  { name: 'summarize', patterns: [/\bsummariz/, /\bsummary\b/, /\btl;dr\b/] },
  { name: 'read_aloud', patterns: [/\bread\b.*\baloud\b/, /\bread\s*aloud\b/, /\bspeak\b/] },
  { name: 'stop_reading', patterns: [/\bstop\s*reading\b/, /\bbe\s*quiet\b/, /\bsilence\b/] },
  { name: 'calibrate', patterns: [/\bcalibrat/] },
  { name: 'cancel', patterns: [/\bcancel\b/, /\bnever\s*mind\b/, /\bnevermind\b/, /\babort\b/] },
  { name: 'help', patterns: [/\bhelp\b/, /\bwhat\s*can\s*i\s*say\b/] },
];

export interface IntentMatch {
  name: IntentName;
  confidence: number;
}

export function resolveIntent(transcript: string): IntentMatch | null {
  const t = transcript.trim().toLowerCase();
  if (!t) return null;
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (p.test(t)) {
        const confidence = p.source.length <= 8 ? 0.85 : 0.95;
        return { name: rule.name, confidence };
      }
    }
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @input/core test`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/intents
git commit -m "feat(core): voice intent grammar"
```

### Task 1.5: Implement the fusion state machine — IDLE → HOVERED

**Files:**
- Create: `packages/input-core/src/fusion/machine.ts`
- Test: `packages/input-core/src/fusion/__tests__/machine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/input-core/src/fusion/__tests__/machine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { FusionMachine } from '../machine.js';
import { TargetRegistry } from '../../targets.js';
import { DEFAULT_FUSION_CONFIG, type GazeReading } from '../../types.js';

const gaze = (x: number, y: number, confidence = 1, fixated = false, ts = 0): GazeReading => ({
  kind: 'gaze',
  x,
  y,
  confidence,
  fixated,
  ts,
});

describe('FusionMachine — IDLE → HOVERED', () => {
  it('starts IDLE', () => {
    const m = new FusionMachine({ targets: new TargetRegistry(), config: DEFAULT_FUSION_CONFIG });
    expect(m.state).toBe('IDLE');
  });

  it('moves to HOVERED when gaze fixates on a target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 1, true, 100));
    expect(m.state).toBe('HOVERED');
    expect(m.hoveredTargetId).toBe('a');
  });

  it('ignores low-confidence gaze readings', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 0.3, true, 100));
    expect(m.state).toBe('IDLE');
  });

  it('stays IDLE when fixated outside any target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(500, 500, 1, true, 100));
    expect(m.state).toBe('IDLE');
  });

  it('emits a state-change event on transition', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const cb = vi.fn();
    m.on('state', cb);
    m.feed(gaze(50, 50, 1, true, 100));
    expect(cb).toHaveBeenCalledWith({ from: 'IDLE', to: 'HOVERED', targetId: 'a' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @input/core test`
Expected: missing module.

- [ ] **Step 3: Create `packages/input-core/src/fusion/machine.ts`** (initial skeleton; will grow in following tasks)

```ts
import { TypedEmitter } from '../emitter.js';
import type { TargetRegistry } from '../targets.js';
import type {
  FusionConfig,
  FusionState,
  GazeReading,
  HandReading,
  Intent,
  PerceptionReading,
  VoiceReading,
} from '../types.js';

export interface FusionEvents {
  state: { from: FusionState; to: FusionState; targetId?: string };
  intent: Intent;
}

export interface FusionDeps {
  targets: TargetRegistry;
  config: FusionConfig;
}

export class FusionMachine extends TypedEmitter<FusionEvents> {
  state: FusionState = 'IDLE';
  hoveredTargetId: string | null = null;
  private readonly targets: TargetRegistry;
  private readonly config: FusionConfig;

  constructor(deps: FusionDeps) {
    super();
    this.targets = deps.targets;
    this.config = deps.config;
  }

  feed(reading: PerceptionReading): void {
    if (reading.kind === 'gaze') this.onGaze(reading);
    else if (reading.kind === 'hand') this.onHand(reading);
    else if (reading.kind === 'voice') this.onVoice(reading);
  }

  private onGaze(r: GazeReading): void {
    if (r.confidence < this.config.gazeConfidenceMin) return;
    const target = r.fixated ? this.targets.hit(r.x, r.y) : null;

    if (this.state === 'IDLE' && target) {
      this.transition('HOVERED', target.id);
    }
  }

  private onHand(_r: HandReading): void {
    // implemented in later tasks
  }

  private onVoice(_r: VoiceReading): void {
    // implemented in later tasks
  }

  private transition(to: FusionState, targetId?: string): void {
    const from = this.state;
    if (from === to) return;
    this.state = to;
    if (to === 'HOVERED' && targetId) this.hoveredTargetId = targetId;
    if (to === 'IDLE') this.hoveredTargetId = null;
    this.emit('state', { from, to, targetId });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @input/core test`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/fusion
git commit -m "feat(core): fusion machine — IDLE → HOVERED"
```

### Task 1.6: Fusion — HOVERED abort on gaze leave

**Files:**
- Modify: `packages/input-core/src/fusion/machine.ts`
- Modify: `packages/input-core/src/fusion/__tests__/machine.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `packages/input-core/src/fusion/__tests__/machine.test.ts`:

```ts
describe('FusionMachine — HOVERED abort on gaze leave', () => {
  it('returns to IDLE when gaze leaves the target for longer than gazeAbortLeaveMs', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, gazeAbortLeaveMs: 100 };
    const m = new FusionMachine({ targets, config });

    m.feed(gaze(50, 50, 1, true, 0));
    expect(m.state).toBe('HOVERED');

    m.feed(gaze(500, 500, 1, true, 50));
    expect(m.state).toBe('HOVERED'); // grace window not yet elapsed

    m.feed(gaze(500, 500, 1, true, 200));
    expect(m.state).toBe('IDLE');
  });

  it('does not abort if gaze returns to the target within the grace window', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, gazeAbortLeaveMs: 100 };
    const m = new FusionMachine({ targets, config });

    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(gaze(500, 500, 1, true, 50));
    m.feed(gaze(60, 60, 1, true, 80));
    expect(m.state).toBe('HOVERED');
  });
});
```

- [ ] **Step 2: Run tests — confirm new ones fail**

Run: `pnpm --filter @input/core test`
Expected: 2 new failures.

- [ ] **Step 3: Update `machine.ts` to track gaze-leave timestamp**

Replace the `onGaze` method in `packages/input-core/src/fusion/machine.ts`:

```ts
private gazeLeftAt: number | null = null;

private onGaze(r: GazeReading): void {
  if (r.confidence < this.config.gazeConfidenceMin) return;
  const target = r.fixated ? this.targets.hit(r.x, r.y) : null;

  if (this.state === 'IDLE' && target) {
    this.transition('HOVERED', target.id);
    this.gazeLeftAt = null;
    return;
  }

  if (this.state === 'HOVERED') {
    if (target && target.id === this.hoveredTargetId) {
      this.gazeLeftAt = null;
    } else {
      if (this.gazeLeftAt === null) this.gazeLeftAt = r.ts;
      else if (r.ts - this.gazeLeftAt >= this.config.gazeAbortLeaveMs) {
        this.transition('IDLE');
        this.gazeLeftAt = null;
      }
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @input/core test`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/fusion
git commit -m "feat(core): HOVERED aborts when gaze leaves target"
```

### Task 1.7: Fusion — single-signal commit (held pinch on hovered target)

**Files:**
- Modify: `packages/input-core/src/fusion/machine.ts`
- Modify: `packages/input-core/src/fusion/__tests__/machine.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `machine.test.ts`:

```ts
import type { HandReading } from '../../types.js';

const hand = (gesture: HandReading['gesture'], heldMs: number, ts: number, confidence = 1): HandReading => ({
  kind: 'hand',
  gesture,
  heldMs,
  confidence,
  ts,
});

describe('FusionMachine — single-signal pinch commit', () => {
  it('commits to "select" when pinch held > commitPinchMs while HOVERED', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, commitPinchMs: 250 };
    const m = new FusionMachine({ targets, config });
    const intents: Array<{ name: string; targetId?: string }> = [];
    m.on('intent', (i) => intents.push({ name: i.name, targetId: i.targetId }));

    m.feed(gaze(50, 50, 1, true, 0));
    expect(m.state).toBe('HOVERED');

    m.feed(hand('pinch', 300, 300));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([{ name: 'select', targetId: 'a' }]);
  });

  it('does not commit on a brief pinch (< commitPinchMs)', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, commitPinchMs: 250 };
    const m = new FusionMachine({ targets, config });
    const intents: Array<unknown> = [];
    m.on('intent', (i) => intents.push(i));

    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(hand('pinch', 100, 100));
    expect(m.state).toBe('HOVERED');
    expect(intents).toEqual([]);
  });

  it('does not commit on pinch when IDLE (no hovered target)', () => {
    const targets = new TargetRegistry();
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Array<unknown> = [];
    m.on('intent', (i) => intents.push(i));
    m.feed(hand('pinch', 500, 500));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — confirm failures**

Run: `pnpm --filter @input/core test`
Expected: failing.

- [ ] **Step 3: Implement `onHand`**

Replace the `onHand` stub in `machine.ts`:

```ts
private onHand(r: HandReading): void {
  if (r.gesture === 'open_palm' && this.state !== 'IDLE') {
    this.transition('IDLE');
    return;
  }
  if (
    r.gesture === 'pinch' &&
    r.heldMs >= this.config.commitPinchMs &&
    this.state === 'HOVERED' &&
    this.hoveredTargetId
  ) {
    const targetId = this.hoveredTargetId;
    this.emit('intent', { name: 'select', targetId, ts: r.ts });
    this.transition('IDLE');
  }
}
```

- [ ] **Step 4: Run tests — green**

Run: `pnpm --filter @input/core test`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/fusion
git commit -m "feat(core): single-signal pinch commit and open-palm abort"
```

### Task 1.8: Fusion — voice ARMED path with gaze pre-resolution

**Files:**
- Modify: `packages/input-core/src/fusion/machine.ts`
- Modify: `packages/input-core/src/fusion/__tests__/machine.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `machine.test.ts`:

```ts
import type { VoiceReading } from '../../types.js';
import type { IntentName } from '../../types.js';

const voiceStart = (ts: number): VoiceReading => ({ kind: 'voice', phase: 'started', ts });
const voiceTranscript = (intent: IntentName | null, ts: number, transcript = String(intent)): VoiceReading => ({
  kind: 'voice',
  phase: 'transcript',
  transcript,
  intent,
  confidence: 0.9,
  ts,
});

describe('FusionMachine — two-signal voice path', () => {
  it('HOVERED + voice "started" → ARMED, then transcript "open" → COMMITTED with target', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Intent[] = [];
    m.on('intent', (i) => intents.push(i));

    m.feed(gaze(50, 50, 1, true, 0));
    expect(m.state).toBe('HOVERED');

    m.feed(voiceStart(50));
    expect(m.state).toBe('ARMED');
    expect(m.armedTargetId).toBe('a'); // pre-resolved from current hover

    m.feed(voiceTranscript('open', 200));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([
      expect.objectContaining({ name: 'open', targetId: 'a' }),
    ]);
  });

  it('ARMED times out and aborts after armTimeoutMs', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, armTimeoutMs: 200 };
    const m = new FusionMachine({ targets, config });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    expect(m.state).toBe('ARMED');
    m.tick(250);
    expect(m.state).toBe('IDLE');
  });

  it('voice transcript with null intent leaves ARMED and eventually times out', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const config = { ...DEFAULT_FUSION_CONFIG, armTimeoutMs: 200 };
    const m = new FusionMachine({ targets, config });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    m.feed(voiceTranscript(null, 50, 'blueberry'));
    expect(m.state).toBe('ARMED');
    m.tick(300);
    expect(m.state).toBe('IDLE');
  });

  it('voice transcript "cancel" while ARMED aborts', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    m.feed(voiceTranscript('cancel', 50));
    expect(m.state).toBe('IDLE');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `pnpm --filter @input/core test`

- [ ] **Step 3: Update `machine.ts`** — add `armedTargetId`, `tick`, voice handling

Add these fields and methods to `FusionMachine`:

```ts
armedTargetId: string | null = null;
private armedAt: number | null = null;
private lastTickTs = 0;

private onVoice(r: VoiceReading): void {
  if (r.phase === 'started') {
    if (this.state === 'HOVERED' && this.hoveredTargetId) {
      this.armedTargetId = this.hoveredTargetId;
      this.armedAt = r.ts;
      this.transition('ARMED');
    } else if (this.state === 'IDLE') {
      this.transition('DICTATING');
      this.armedAt = r.ts;
    }
    return;
  }

  // r.phase === 'transcript'
  if (r.intent === 'cancel') {
    this.armedTargetId = null;
    this.armedAt = null;
    this.transition('IDLE');
    return;
  }

  if (this.state === 'ARMED' && r.intent) {
    const targetId = this.armedTargetId ?? undefined;
    this.emit('intent', { name: r.intent, targetId, ts: r.ts });
    this.armedTargetId = null;
    this.armedAt = null;
    this.transition('IDLE');
    return;
  }

  if (this.state === 'DICTATING' && r.intent) {
    this.emit('intent', { name: r.intent, ts: r.ts });
    this.armedAt = null;
    this.transition('IDLE');
    return;
  }
  // Null intent: leave state unchanged; armTimeout will sweep us to IDLE.
}

tick(now: number): void {
  this.lastTickTs = now;
  if ((this.state === 'ARMED' || this.state === 'DICTATING') && this.armedAt !== null) {
    if (now - this.armedAt >= this.config.armTimeoutMs) {
      this.armedTargetId = null;
      this.armedAt = null;
      this.transition('IDLE');
    }
  }
}
```

Update `transition` so leaving ARMED/DICTATING clears `armedTargetId`/`armedAt` (defensive):

```ts
private transition(to: FusionState, targetId?: string): void {
  const from = this.state;
  if (from === to) return;
  this.state = to;
  if (to === 'HOVERED' && targetId) this.hoveredTargetId = targetId;
  if (to === 'IDLE') {
    this.hoveredTargetId = null;
    this.armedTargetId = null;
    this.armedAt = null;
  }
  this.emit('state', { from, to, targetId });
}
```

- [ ] **Step 4: Run tests — green**

Run: `pnpm --filter @input/core test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/fusion
git commit -m "feat(core): voice ARMED path with gaze pre-resolution and arm timeout"
```

### Task 1.9: Fusion — voice "cancel" and open_palm abort coverage

**Files:**
- Modify: `packages/input-core/src/fusion/__tests__/machine.test.ts`

- [ ] **Step 1: Add coverage tests**

```ts
describe('FusionMachine — abort signals', () => {
  it('open_palm aborts ARMED', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(voiceStart(0));
    expect(m.state).toBe('ARMED');
    m.feed(hand('open_palm', 0, 50));
    expect(m.state).toBe('IDLE');
  });
});
```

- [ ] **Step 2: Run — green** (already covered by `onHand`'s open_palm branch)

Run: `pnpm --filter @input/core test`
Expected: green. If not, fix `onHand` to abort from any non-IDLE state (it already does — verify).

- [ ] **Step 3: Commit**

```bash
git add packages/input-core/src/fusion/__tests__
git commit -m "test(core): open_palm aborts ARMED"
```

### Task 1.10: Fusion — DICTATING (voice-only intents)

**Files:**
- Modify: `packages/input-core/src/fusion/__tests__/machine.test.ts`

- [ ] **Step 1: Add tests for voice-only intents like scroll**

```ts
describe('FusionMachine — DICTATING (voice-only)', () => {
  it('IDLE + voice started → DICTATING + scroll_down transcript → emits scroll_down', () => {
    const targets = new TargetRegistry();
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Intent[] = [];
    m.on('intent', (i) => intents.push(i));
    m.feed(voiceStart(0));
    expect(m.state).toBe('DICTATING');
    m.feed(voiceTranscript('scroll_down', 100));
    expect(m.state).toBe('IDLE');
    expect(intents).toEqual([expect.objectContaining({ name: 'scroll_down' })]);
    expect(intents[0]?.targetId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run — green** (already implemented in 1.8)

- [ ] **Step 3: Commit**

```bash
git add packages/input-core/src/fusion/__tests__
git commit -m "test(core): DICTATING emits voice-only intents"
```

### Task 1.11: Fusion — CALIBRATING suspends emission

**Files:**
- Modify: `packages/input-core/src/fusion/machine.ts`
- Modify: `packages/input-core/src/fusion/__tests__/machine.test.ts`

- [ ] **Step 1: Add tests**

```ts
describe('FusionMachine — CALIBRATING', () => {
  it('setCalibrating(true) freezes the state and suppresses intents', () => {
    const targets = new TargetRegistry();
    targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    const intents: Intent[] = [];
    m.on('intent', (i) => intents.push(i));
    m.setCalibrating(true);
    expect(m.state).toBe('CALIBRATING');
    m.feed(gaze(50, 50, 1, true, 0));
    m.feed(hand('pinch', 500, 100));
    m.feed(voiceStart(0));
    m.feed(voiceTranscript('open', 100));
    expect(intents).toEqual([]);
    expect(m.state).toBe('CALIBRATING');
  });

  it('setCalibrating(false) returns to IDLE', () => {
    const targets = new TargetRegistry();
    const m = new FusionMachine({ targets, config: DEFAULT_FUSION_CONFIG });
    m.setCalibrating(true);
    m.setCalibrating(false);
    expect(m.state).toBe('IDLE');
  });
});
```

- [ ] **Step 2: Implement `setCalibrating` and gate `feed`**

Add to `FusionMachine`:

```ts
setCalibrating(on: boolean): void {
  if (on) {
    this.state = 'CALIBRATING';
    this.hoveredTargetId = null;
    this.armedTargetId = null;
    this.armedAt = null;
    this.emit('state', { from: this.state, to: 'CALIBRATING' });
  } else if (this.state === 'CALIBRATING') {
    this.transition('IDLE');
  }
}
```

Gate `feed`:

```ts
feed(reading: PerceptionReading): void {
  if (this.state === 'CALIBRATING') return;
  if (reading.kind === 'gaze') this.onGaze(reading);
  else if (reading.kind === 'hand') this.onHand(reading);
  else if (reading.kind === 'voice') this.onVoice(reading);
}
```

- [ ] **Step 3: Run — green**

Run: `pnpm --filter @input/core test`

- [ ] **Step 4: Commit**

```bash
git add packages/input-core/src/fusion
git commit -m "feat(core): CALIBRATING state suspends fusion emission"
```

### Task 1.12: Public engine API — `createInputEngine`

**Files:**
- Create: `packages/input-core/src/engine.ts`
- Test: `packages/input-core/src/__tests__/engine.test.ts`
- Modify: `packages/input-core/src/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/input-core/src/__tests__/engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createInputEngine } from '../engine.js';
import type { Intent } from '../types.js';

describe('createInputEngine', () => {
  it('exposes targets, machine, config, on/off intent + state', () => {
    const e = createInputEngine();
    expect(e.targets).toBeDefined();
    expect(e.machine.state).toBe('IDLE');
    expect(e.config.hoverDwellMs).toBeGreaterThan(0);
  });

  it('forwards intents emitted by the machine', () => {
    const e = createInputEngine();
    const cb = vi.fn();
    e.onIntent(cb);
    e.targets.register({ id: 'a', rect: { x: 0, y: 0, width: 100, height: 100 } });
    e.feed({ kind: 'gaze', x: 50, y: 50, confidence: 1, fixated: true, ts: 0 });
    e.feed({ kind: 'hand', gesture: 'pinch', heldMs: 300, confidence: 1, ts: 300 });
    expect(cb).toHaveBeenCalledTimes(1);
    const arg = cb.mock.calls[0]?.[0] as Intent;
    expect(arg.name).toBe('select');
  });
});
```

- [ ] **Step 2: Run — fail**

Run: `pnpm --filter @input/core test`

- [ ] **Step 3: Create `engine.ts`**

```ts
import { TargetRegistry } from './targets.js';
import { FusionMachine, type FusionEvents } from './fusion/machine.js';
import { DEFAULT_FUSION_CONFIG, type FusionConfig, type Intent, type PerceptionReading } from './types.js';

export interface InputEngine {
  targets: TargetRegistry;
  machine: FusionMachine;
  config: FusionConfig;
  feed(reading: PerceptionReading): void;
  tick(now: number): void;
  onIntent(cb: (i: Intent) => void): () => void;
  onState(cb: (e: FusionEvents['state']) => void): () => void;
  setCalibrating(on: boolean): void;
}

export function createInputEngine(config: FusionConfig = DEFAULT_FUSION_CONFIG): InputEngine {
  const targets = new TargetRegistry();
  const machine = new FusionMachine({ targets, config });
  return {
    targets,
    machine,
    config,
    feed: (r) => machine.feed(r),
    tick: (now) => machine.tick(now),
    onIntent: (cb) => machine.on('intent', cb),
    onState: (cb) => machine.on('state', cb),
    setCalibrating: (on) => machine.setCalibrating(on),
  };
}
```

- [ ] **Step 4: Update `index.ts`**

```ts
export const VERSION = '0.0.0';
export * from './types.js';
export { createInputEngine } from './engine.js';
export type { InputEngine } from './engine.js';
export { TargetRegistry } from './targets.js';
export { resolveIntent } from './intents/grammar.js';
```

- [ ] **Step 5: Run — green**

Run: `pnpm --filter @input/core test`

- [ ] **Step 6: Commit**

```bash
git add packages/input-core/src
git commit -m "feat(core): createInputEngine public API"
```

---

## Phase 2: Perception adapters

Goal: real WebGazer, MediaPipe, and Whisper adapters wired through the engine. Each has a tiny standalone playground page for manual verification.

### Task 2.1: Define `PerceptionAdapter` interface + add devDeps

**Files:**
- Create: `packages/input-core/src/perception/adapter.ts`
- Modify: `packages/input-core/package.json`
- Modify: `packages/input-core/src/index.ts`

- [ ] **Step 1: Create interface**

```ts
// packages/input-core/src/perception/adapter.ts
import type { TypedEmitter } from '../emitter.js';
import type { PerceptionReading } from '../types.js';

export type AdapterStatus = 'idle' | 'starting' | 'running' | 'error';

export interface PerceptionAdapterEvents {
  reading: PerceptionReading;
  error: Error;
  status: AdapterStatus;
}

export interface PerceptionAdapter {
  readonly status: AdapterStatus;
  start(stream: MediaStream): Promise<void>;
  stop(): void;
  on: TypedEmitter<PerceptionAdapterEvents>['on'];
  off: TypedEmitter<PerceptionAdapterEvents>['off'];
}
```

- [ ] **Step 2: Add deps**

In `packages/input-core/package.json`, add:

```json
"dependencies": {
  "@mediapipe/tasks-vision": "^0.10.14",
  "@xenova/transformers": "^2.17.0",
  "webgazer": "^3.3.0"
}
```

- [ ] **Step 3: Re-export from `index.ts`**

```ts
export * from './perception/adapter.js';
```

- [ ] **Step 4: Install + typecheck**

Run: `pnpm install`
Run: `pnpm --filter @input/core typecheck`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add packages/input-core
git commit -m "feat(core): PerceptionAdapter interface + perception devDeps"
```

### Task 2.2: 1€ filter (used by gaze adapter)

**Files:**
- Create: `packages/input-core/src/perception/one-euro.ts`
- Test: `packages/input-core/src/perception/__tests__/one-euro.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/input-core/src/perception/__tests__/one-euro.test.ts
import { describe, it, expect } from 'vitest';
import { OneEuroFilter } from '../one-euro.js';

describe('OneEuroFilter', () => {
  it('returns the first sample unchanged', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0, dCutoff: 1 });
    expect(f.filter(10, 0)).toBe(10);
  });

  it('low-passes step input toward target over time', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0, dCutoff: 1 });
    f.filter(0, 0);
    const a = f.filter(100, 16);
    const b = f.filter(100, 32);
    const c = f.filter(100, 48);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(100);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c).toBeLessThanOrEqual(100);
  });

  it('reset returns the filter to first-sample behavior', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0, dCutoff: 1 });
    f.filter(0, 0);
    f.filter(100, 16);
    f.reset();
    expect(f.filter(50, 100)).toBe(50);
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement `OneEuroFilter`**

```ts
// packages/input-core/src/perception/one-euro.ts
export interface OneEuroOptions {
  minCutoff: number;
  beta: number;
  dCutoff: number;
}

export class OneEuroFilter {
  private prev: number | null = null;
  private prevDeriv = 0;
  private prevTs = 0;
  constructor(private readonly opts: OneEuroOptions) {}

  filter(value: number, ts: number): number {
    if (this.prev === null) {
      this.prev = value;
      this.prevTs = ts;
      return value;
    }
    const dt = Math.max((ts - this.prevTs) / 1000, 1e-6);
    const deriv = (value - this.prev) / dt;
    const aD = alpha(this.opts.dCutoff, dt);
    const filteredDeriv = aD * deriv + (1 - aD) * this.prevDeriv;
    const cutoff = this.opts.minCutoff + this.opts.beta * Math.abs(filteredDeriv);
    const a = alpha(cutoff, dt);
    const filtered = a * value + (1 - a) * this.prev;
    this.prev = filtered;
    this.prevDeriv = filteredDeriv;
    this.prevTs = ts;
    return filtered;
  }

  reset(): void {
    this.prev = null;
    this.prevDeriv = 0;
    this.prevTs = 0;
  }
}

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}
```

- [ ] **Step 4: Run — green**

Run: `pnpm --filter @input/core test`

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/perception
git commit -m "feat(core): 1€ low-pass filter"
```

### Task 2.3: Fixation detector

**Files:**
- Create: `packages/input-core/src/perception/fixation.ts`
- Test: `packages/input-core/src/perception/__tests__/fixation.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from 'vitest';
import { FixationDetector } from '../fixation.js';

describe('FixationDetector', () => {
  it('reports false until a sample stays within radius for dwell window', () => {
    const f = new FixationDetector({ radiusPx: 30, dwellMs: 100 });
    expect(f.update(0, 0, 0)).toBe(false);
    expect(f.update(5, 5, 50)).toBe(false);
    expect(f.update(5, 5, 110)).toBe(true);
  });

  it('resets when sample leaves radius', () => {
    const f = new FixationDetector({ radiusPx: 30, dwellMs: 100 });
    f.update(0, 0, 0);
    f.update(0, 0, 100);
    expect(f.update(200, 200, 110)).toBe(false);
    expect(f.update(200, 200, 200)).toBe(false);
    expect(f.update(200, 200, 220)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/input-core/src/perception/fixation.ts
export interface FixationOptions {
  radiusPx: number;
  dwellMs: number;
}

export class FixationDetector {
  private anchorX = 0;
  private anchorY = 0;
  private anchorTs: number | null = null;

  constructor(private readonly opts: FixationOptions) {}

  update(x: number, y: number, ts: number): boolean {
    if (this.anchorTs === null) {
      this.anchorX = x;
      this.anchorY = y;
      this.anchorTs = ts;
      return false;
    }
    const dx = x - this.anchorX;
    const dy = y - this.anchorY;
    if (Math.hypot(dx, dy) > this.opts.radiusPx) {
      this.anchorX = x;
      this.anchorY = y;
      this.anchorTs = ts;
      return false;
    }
    return ts - this.anchorTs >= this.opts.dwellMs;
  }
}
```

- [ ] **Step 3: Run — green**

- [ ] **Step 4: Commit**

```bash
git add packages/input-core/src/perception
git commit -m "feat(core): fixation detector"
```

### Task 2.4: WebGazer gaze adapter

**Files:**
- Create: `packages/input-core/src/perception/gaze.ts`
- Test: `packages/input-core/src/perception/__tests__/gaze.test.ts`

- [ ] **Step 1: Write a test that mocks WebGazer**

```ts
// packages/input-core/src/perception/__tests__/gaze.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const setGazeListener = vi.fn();
const begin = vi.fn().mockResolvedValue(undefined);
const end = vi.fn();
const setRegression = vi.fn().mockReturnThis();
const showVideoPreview = vi.fn().mockReturnThis();
const showPredictionPoints = vi.fn().mockReturnThis();
const saveDataAcrossSessions = vi.fn().mockReturnThis();

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
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement `GazeAdapter`**

```ts
// packages/input-core/src/perception/gaze.ts
import webgazer from 'webgazer';
import { TypedEmitter } from '../emitter.js';
import type { GazeReading } from '../types.js';
import { OneEuroFilter } from './one-euro.js';
import { FixationDetector } from './fixation.js';
import type {
  AdapterStatus,
  PerceptionAdapter,
  PerceptionAdapterEvents,
} from './adapter.js';

export interface GazeAdapterOptions {
  oneEuro?: { minCutoff: number; beta: number; dCutoff: number };
  fixation?: { radiusPx: number; dwellMs: number };
}

const DEFAULTS: Required<GazeAdapterOptions> = {
  oneEuro: { minCutoff: 1, beta: 0.05, dCutoff: 1 },
  fixation: { radiusPx: 40, dwellMs: 80 },
};

export class GazeAdapter
  extends TypedEmitter<PerceptionAdapterEvents>
  implements PerceptionAdapter
{
  status: AdapterStatus = 'idle';
  private readonly fx: OneEuroFilter;
  private readonly fy: OneEuroFilter;
  private readonly fixation: FixationDetector;

  constructor(opts: GazeAdapterOptions = {}) {
    super();
    const o = { ...DEFAULTS, ...opts };
    this.fx = new OneEuroFilter(o.oneEuro);
    this.fy = new OneEuroFilter(o.oneEuro);
    this.fixation = new FixationDetector(o.fixation);
  }

  async start(_stream: MediaStream): Promise<void> {
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      webgazer
        .setRegression('ridge')
        .showVideoPreview(false)
        .showPredictionPoints(false)
        .saveDataAcrossSessions(true)
        .setGazeListener((data: { x: number; y: number } | null, ts: number) => {
          if (!data) return;
          const x = this.fx.filter(data.x, ts);
          const y = this.fy.filter(data.y, ts);
          const fixated = this.fixation.update(x, y, ts);
          const reading: GazeReading = {
            kind: 'gaze',
            x,
            y,
            confidence: 0.9,
            fixated,
            ts,
          };
          this.emit('reading', reading);
        });
      await webgazer.begin();
      this.status = 'running';
      this.emit('status', this.status);
    } catch (e) {
      this.status = 'error';
      this.emit('status', this.status);
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }

  stop(): void {
    webgazer.end();
    this.fx.reset();
    this.fy.reset();
    this.status = 'idle';
    this.emit('status', this.status);
  }
}
```

- [ ] **Step 4: Run — green**

Run: `pnpm --filter @input/core test`

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/perception
git commit -m "feat(core): WebGazer gaze adapter with 1€ smoothing + fixation"
```

### Task 2.5: Hand gesture classifier (rule-based)

**Files:**
- Create: `packages/input-core/src/perception/hand-classifier.ts`
- Test: `packages/input-core/src/perception/__tests__/hand-classifier.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from 'vitest';
import { classifyHand } from '../hand-classifier.js';

const point = (x: number, y: number, z = 0) => ({ x, y, z });

describe('classifyHand', () => {
  it('returns "none" for no landmarks', () => {
    expect(classifyHand([])).toBe('none');
  });

  it('returns "pinch" when thumb and index tips are close', () => {
    const lm = Array.from({ length: 21 }, () => point(0.5, 0.5));
    lm[4] = point(0.50, 0.50);
    lm[8] = point(0.51, 0.51);
    expect(classifyHand(lm)).toBe('pinch');
  });

  it('returns "open_palm" when all four non-thumb fingers are extended', () => {
    const lm = Array.from({ length: 21 }, () => point(0.5, 0.5));
    // thumb tip far from index tip → not pinch
    lm[4] = point(0.2, 0.5);
    lm[8] = point(0.5, 0.2); // index tip above mcp
    lm[5] = point(0.5, 0.4);
    lm[12] = point(0.55, 0.2);
    lm[9] = point(0.55, 0.4);
    lm[16] = point(0.6, 0.2);
    lm[13] = point(0.6, 0.4);
    lm[20] = point(0.65, 0.2);
    lm[17] = point(0.65, 0.4);
    expect(classifyHand(lm)).toBe('open_palm');
  });

  it('returns "none" otherwise', () => {
    const lm = Array.from({ length: 21 }, () => point(0.5, 0.5));
    lm[4] = point(0.2, 0.5);
    lm[8] = point(0.4, 0.5);
    expect(classifyHand(lm)).toBe('none');
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```ts
// packages/input-core/src/perception/hand-classifier.ts
import type { Gesture } from '../types.js';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

const PINCH_DISTANCE = 0.06;

export function classifyHand(lm: NormalizedLandmark[]): Gesture {
  if (lm.length < 21) return 'none';
  const thumb = lm[4]!;
  const index = lm[8]!;
  const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  if (dist < PINCH_DISTANCE) return 'pinch';

  // open_palm: all four non-thumb fingertips above their MCPs (y smaller because origin top-left)
  const extended = (tip: NormalizedLandmark, mcp: NormalizedLandmark) => tip.y < mcp.y;
  if (
    extended(lm[8]!, lm[5]!) &&
    extended(lm[12]!, lm[9]!) &&
    extended(lm[16]!, lm[13]!) &&
    extended(lm[20]!, lm[17]!)
  ) {
    return 'open_palm';
  }
  return 'none';
}
```

- [ ] **Step 4: Run — green**

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/perception
git commit -m "feat(core): rule-based hand gesture classifier"
```

### Task 2.6: MediaPipe hand adapter

**Files:**
- Create: `packages/input-core/src/perception/hand.ts`
- Test: `packages/input-core/src/perception/__tests__/hand.test.ts`

- [ ] **Step 1: Test using a fake `HandLandmarker`**

```ts
// packages/input-core/src/perception/__tests__/hand.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const detectForVideo = vi.fn();
const close = vi.fn();
vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: vi.fn().mockResolvedValue({}) },
  HandLandmarker: {
    createFromOptions: vi.fn().mockResolvedValue({
      detectForVideo,
      close,
    }),
  },
}));

import { HandAdapter } from '../hand.js';

describe('HandAdapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('emits readings while running', async () => {
    const a = new HandAdapter({ tickIntervalMs: 0 });
    const readings: unknown[] = [];
    a.on('reading', (r) => readings.push(r));
    detectForVideo.mockReturnValue({
      landmarks: [
        // thumb close to index → pinch
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
    a._tickForTest(100); // expose for test
    a._tickForTest(200);
    expect(readings.length).toBeGreaterThan(0);
    const last = readings[readings.length - 1] as { gesture: string; heldMs: number };
    expect(last.gesture).toBe('pinch');
    expect(last.heldMs).toBeGreaterThanOrEqual(100);
    a.stop();
    expect(close).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Implement**

```ts
// packages/input-core/src/perception/hand.ts
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TypedEmitter } from '../emitter.js';
import type { HandReading } from '../types.js';
import { classifyHand } from './hand-classifier.js';
import type {
  AdapterStatus,
  PerceptionAdapter,
  PerceptionAdapterEvents,
} from './adapter.js';

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export interface HandAdapterOptions {
  tickIntervalMs?: number;
}

export class HandAdapter
  extends TypedEmitter<PerceptionAdapterEvents>
  implements PerceptionAdapter
{
  status: AdapterStatus = 'idle';
  private landmarker: Awaited<ReturnType<typeof HandLandmarker.createFromOptions>> | null = null;
  private video: HTMLVideoElement | null = null;
  private rafId = 0;
  private gestureSince: { gesture: string; ts: number } | null = null;
  private readonly tickIntervalMs: number;

  constructor(opts: HandAdapterOptions = {}) {
    super();
    this.tickIntervalMs = opts.tickIntervalMs ?? 50;
  }

  async start(stream: MediaStream): Promise<void> {
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      this.landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        numHands: 1,
        runningMode: 'VIDEO',
      });
      if (typeof document !== 'undefined') {
        this.video = document.createElement('video');
        this.video.srcObject = stream;
        this.video.muted = true;
        await this.video.play().catch(() => undefined);
        const loop = () => {
          this.tick(performance.now());
          this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
      }
      this.status = 'running';
      this.emit('status', this.status);
    } catch (e) {
      this.status = 'error';
      this.emit('status', this.status);
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.landmarker?.close();
    this.landmarker = null;
    this.video = null;
    this.status = 'idle';
    this.emit('status', this.status);
  }

  _tickForTest(ts: number): void {
    this.tick(ts);
  }

  private tick(ts: number): void {
    if (!this.landmarker) return;
    const result = this.video
      ? this.landmarker.detectForVideo(this.video, ts)
      : this.landmarker.detectForVideo({} as HTMLVideoElement, ts);
    const lm = result.landmarks?.[0];
    const gesture = lm ? classifyHand(lm as { x: number; y: number; z: number }[]) : 'none';
    if (this.gestureSince?.gesture !== gesture) {
      this.gestureSince = { gesture, ts };
    }
    const heldMs = ts - (this.gestureSince?.ts ?? ts);
    const reading: HandReading = {
      kind: 'hand',
      gesture: gesture as HandReading['gesture'],
      heldMs,
      confidence: 0.9,
      ts,
    };
    this.emit('reading', reading);
  }
}
```

- [ ] **Step 4: Run — green**

- [ ] **Step 5: Commit**

```bash
git add packages/input-core/src/perception
git commit -m "feat(core): MediaPipe hand adapter with held-gesture tracking"
```

### Task 2.7: VAD (voice activity detection) — energy-based

**Files:**
- Create: `packages/input-core/src/perception/vad.ts`
- Test: `packages/input-core/src/perception/__tests__/vad.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { EnergyVad } from '../vad.js';

describe('EnergyVad', () => {
  it('reports speech-start when energy crosses threshold', () => {
    const v = new EnergyVad({ threshold: 0.05, hangoverMs: 100 });
    expect(v.feed(new Float32Array([0, 0, 0]), 0)).toEqual({ event: null });
    const loud = new Float32Array(160).fill(0.5);
    expect(v.feed(loud, 16)).toEqual({ event: 'started' });
  });

  it('reports speech-end after hangover', () => {
    const v = new EnergyVad({ threshold: 0.05, hangoverMs: 100 });
    v.feed(new Float32Array(160).fill(0.5), 0);
    expect(v.feed(new Float32Array(160).fill(0), 50).event).toBeNull();
    expect(v.feed(new Float32Array(160).fill(0), 200).event).toBe('ended');
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/input-core/src/perception/vad.ts
export interface VadOptions {
  threshold: number;
  hangoverMs: number;
}

export type VadEvent = 'started' | 'ended' | null;

export class EnergyVad {
  private speaking = false;
  private lastVoiceTs = 0;
  constructor(private readonly opts: VadOptions) {}

  feed(samples: Float32Array, ts: number): { event: VadEvent } {
    let sum = 0;
    for (const s of samples) sum += s * s;
    const rms = samples.length ? Math.sqrt(sum / samples.length) : 0;
    if (rms >= this.opts.threshold) {
      this.lastVoiceTs = ts;
      if (!this.speaking) {
        this.speaking = true;
        return { event: 'started' };
      }
      return { event: null };
    }
    if (this.speaking && ts - this.lastVoiceTs >= this.opts.hangoverMs) {
      this.speaking = false;
      return { event: 'ended' };
    }
    return { event: null };
  }
}
```

- [ ] **Step 3: Run — green**

- [ ] **Step 4: Commit**

```bash
git add packages/input-core/src/perception
git commit -m "feat(core): energy-based VAD"
```

### Task 2.8: Whisper voice adapter (transcription orchestration)

**Files:**
- Create: `packages/input-core/src/perception/voice.ts`
- Test: `packages/input-core/src/perception/__tests__/voice.test.ts`

- [ ] **Step 1: Test with mocked transcriber**

```ts
// packages/input-core/src/perception/__tests__/voice.test.ts
import { describe, it, expect, vi } from 'vitest';

const transcribe = vi.fn();
vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(transcribe),
}));

import { VoiceAdapter } from '../voice.js';

describe('VoiceAdapter', () => {
  it('emits voice "started" on VAD start, "transcript" on VAD end', async () => {
    transcribe.mockResolvedValue({ text: 'open' });
    const a = new VoiceAdapter({ vadThreshold: 0.05, hangoverMs: 100 });
    const readings: unknown[] = [];
    a.on('reading', (r) => readings.push(r));
    await a.startWithSamples();
    a.feedSamples(new Float32Array(160).fill(0.5), 0);
    a.feedSamples(new Float32Array(160).fill(0), 200);
    await Promise.resolve();
    await Promise.resolve();
    expect(readings.some((r) => (r as any).phase === 'started')).toBe(true);
    expect(readings.some((r) => (r as any).phase === 'transcript' && (r as any).intent === 'open')).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/input-core/src/perception/voice.ts
import { pipeline } from '@xenova/transformers';
import { TypedEmitter } from '../emitter.js';
import type { VoiceReading } from '../types.js';
import { resolveIntent } from '../intents/grammar.js';
import { EnergyVad } from './vad.js';
import type {
  AdapterStatus,
  PerceptionAdapter,
  PerceptionAdapterEvents,
} from './adapter.js';

export interface VoiceAdapterOptions {
  modelId?: string;
  vadThreshold?: number;
  hangoverMs?: number;
}

type Transcriber = (audio: Float32Array) => Promise<{ text: string }>;

export class VoiceAdapter
  extends TypedEmitter<PerceptionAdapterEvents>
  implements PerceptionAdapter
{
  status: AdapterStatus = 'idle';
  private transcriber: Transcriber | null = null;
  private vad: EnergyVad;
  private buffer: Float32Array[] = [];
  private readonly modelId: string;

  constructor(opts: VoiceAdapterOptions = {}) {
    super();
    this.modelId = opts.modelId ?? 'Xenova/whisper-tiny.en';
    this.vad = new EnergyVad({
      threshold: opts.vadThreshold ?? 0.05,
      hangoverMs: opts.hangoverMs ?? 600,
    });
  }

  async start(_stream: MediaStream): Promise<void> {
    this.status = 'starting';
    this.emit('status', this.status);
    try {
      this.transcriber = (await pipeline('automatic-speech-recognition', this.modelId)) as unknown as Transcriber;
      this.status = 'running';
      this.emit('status', this.status);
    } catch (e) {
      this.status = 'error';
      this.emit('status', this.status);
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
      throw e;
    }
  }

  // Test-only entrypoint that skips MediaStream wiring
  async startWithSamples(): Promise<void> {
    return this.start(undefined as unknown as MediaStream);
  }

  feedSamples(samples: Float32Array, ts: number): void {
    const ev = this.vad.feed(samples, ts);
    this.buffer.push(samples);
    if (ev.event === 'started') {
      this.emit('reading', { kind: 'voice', phase: 'started', ts });
    } else if (ev.event === 'ended') {
      const audio = concat(this.buffer);
      this.buffer = [];
      this.transcribe(audio, ts);
    }
  }

  private async transcribe(audio: Float32Array, ts: number): Promise<void> {
    if (!this.transcriber) return;
    try {
      const out = await this.transcriber(audio);
      const intent = resolveIntent(out.text);
      const reading: VoiceReading = {
        kind: 'voice',
        phase: 'transcript',
        transcript: out.text,
        intent: intent?.name ?? null,
        confidence: intent?.confidence ?? 0,
        ts,
      };
      this.emit('reading', reading);
    } catch (e) {
      this.emit('error', e instanceof Error ? e : new Error(String(e)));
    }
  }

  stop(): void {
    this.transcriber = null;
    this.buffer = [];
    this.status = 'idle';
    this.emit('status', this.status);
  }
}

function concat(parts: Float32Array[]): Float32Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Float32Array(total);
  let i = 0;
  for (const p of parts) {
    out.set(p, i);
    i += p.length;
  }
  return out;
}
```

- [ ] **Step 3: Run — green**

- [ ] **Step 4: Commit**

```bash
git add packages/input-core/src/perception
git commit -m "feat(core): Whisper voice adapter with VAD-driven transcription"
```

### Task 2.9: Wire mic capture for `VoiceAdapter`

**Files:**
- Modify: `packages/input-core/src/perception/voice.ts`

- [ ] **Step 1: Add real `MediaStream` wiring inside `start`**

After creating the transcriber, append to `start`:

```ts
if (typeof window !== 'undefined' && _stream) {
  const ac = new AudioContext({ sampleRate: 16000 });
  const src = ac.createMediaStreamSource(_stream);
  await ac.audioWorklet.addModule(
    URL.createObjectURL(
      new Blob(
        [
          `class P extends AudioWorkletProcessor {
             process(inputs) {
               const ch = inputs[0]?.[0];
               if (ch) this.port.postMessage(ch.slice());
               return true;
             }
           }
           registerProcessor('p', P);`,
        ],
        { type: 'application/javascript' },
      ),
    ),
  );
  const node = new AudioWorkletNode(ac, 'p');
  src.connect(node);
  node.port.onmessage = (ev) => {
    this.feedSamples(new Float32Array(ev.data), performance.now());
  };
}
```

- [ ] **Step 2: Run typecheck (test for adapter still passes via `startWithSamples`)**

Run: `pnpm --filter @input/core typecheck && pnpm --filter @input/core test`
Expected: green.

- [ ] **Step 3: Commit**

```bash
git add packages/input-core/src/perception/voice.ts
git commit -m "feat(core): wire mic AudioWorklet capture into VoiceAdapter"
```

### Task 2.10: 9-point gaze calibration helper

**Files:**
- Create: `packages/input-core/src/calibration/nine-point.ts`
- Test: `packages/input-core/src/calibration/__tests__/nine-point.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { ninePointTargets } from '../nine-point.js';

describe('ninePointTargets', () => {
  it('returns 9 points spread across the viewport', () => {
    const pts = ninePointTargets({ width: 1000, height: 800, marginPct: 10 });
    expect(pts.length).toBe(9);
    expect(pts[0]).toEqual({ x: 100, y: 80 });
    expect(pts[4]).toEqual({ x: 500, y: 400 });
    expect(pts[8]).toEqual({ x: 900, y: 720 });
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/input-core/src/calibration/nine-point.ts
export interface NinePointOptions {
  width: number;
  height: number;
  marginPct: number;
}

export interface Point {
  x: number;
  y: number;
}

export function ninePointTargets(opts: NinePointOptions): Point[] {
  const mx = (opts.marginPct / 100) * opts.width;
  const my = (opts.marginPct / 100) * opts.height;
  const xs = [mx, opts.width / 2, opts.width - mx];
  const ys = [my, opts.height / 2, opts.height - my];
  const out: Point[] = [];
  for (const y of ys) for (const x of xs) out.push({ x, y });
  return out;
}
```

- [ ] **Step 3: Run — green**

- [ ] **Step 4: Commit**

```bash
git add packages/input-core/src/calibration
git commit -m "feat(core): 9-point calibration target helper"
```

### Task 2.11: Re-export adapters from core index

**Files:**
- Modify: `packages/input-core/src/index.ts`

- [ ] **Step 1: Add exports**

```ts
export { GazeAdapter } from './perception/gaze.js';
export { HandAdapter } from './perception/hand.js';
export { VoiceAdapter } from './perception/voice.js';
export { ninePointTargets } from './calibration/nine-point.js';
```

- [ ] **Step 2: Build + typecheck**

Run: `pnpm --filter @input/core build`
Run: `pnpm --filter @input/core typecheck`

- [ ] **Step 3: Commit**

```bash
git add packages/input-core/src/index.ts
git commit -m "feat(core): re-export adapters and calibration helpers"
```

### Task 2.12: Adapter playground page (manual verification)

**Files:**
- Create: `packages/input-core/playground/index.html`
- Create: `packages/input-core/playground/main.ts`
- Create: `packages/input-core/playground/vite.config.ts`
- Modify: `packages/input-core/package.json` (add `playground` script)

- [ ] **Step 1: Create playground**

```html
<!-- packages/input-core/playground/index.html -->
<!doctype html>
<html><head><meta charset="utf-8"><title>@input/core playground</title></head>
<body>
  <h1>@input/core playground</h1>
  <button id="start">Start</button>
  <button id="stop">Stop</button>
  <pre id="log" style="height:60vh;overflow:auto;background:#111;color:#0f0;padding:8px"></pre>
  <script type="module" src="./main.ts"></script>
</body></html>
```

```ts
// packages/input-core/playground/main.ts
import { GazeAdapter, HandAdapter, VoiceAdapter, createInputEngine } from '../src/index.js';

const log = (s: string) => {
  const el = document.getElementById('log')!;
  el.textContent = s + '\n' + el.textContent;
};

const engine = createInputEngine();
engine.onIntent((i) => log(`INTENT ${i.name}${i.targetId ? ' #' + i.targetId : ''}`));
engine.onState((s) => log(`STATE ${s.from}→${s.to}${s.targetId ? ' #' + s.targetId : ''}`));

const gaze = new GazeAdapter();
const hand = new HandAdapter();
const voice = new VoiceAdapter();
gaze.on('reading', (r) => engine.feed(r));
hand.on('reading', (r) => engine.feed(r));
voice.on('reading', (r) => engine.feed(r));

document.getElementById('start')!.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  await Promise.all([gaze.start(stream), hand.start(stream), voice.start(stream)]);
  log('started');
});
document.getElementById('stop')!.addEventListener('click', () => {
  gaze.stop(); hand.stop(); voice.stop();
  log('stopped');
});
```

```ts
// packages/input-core/playground/vite.config.ts
import { defineConfig } from 'vite';
export default defineConfig({ root: '.', server: { port: 5174 } });
```

In `packages/input-core/package.json`, add to `scripts`:

```json
"playground": "vite playground"
```

And add `vite` to devDeps:

```json
"vite": "^5.3.0"
```

- [ ] **Step 2: Install + run**

Run: `pnpm install`
Run: `pnpm --filter @input/core playground`
Expected: opens at `http://localhost:5174` and Start triggers webcam/mic.

- [ ] **Step 3: Manual verification checklist**

- [ ] Webcam permission prompts and is granted
- [ ] Gaze readings appear in log on movement
- [ ] Hand pinch produces a `select` intent when gaze is on the page
- [ ] Saying "scroll down" emits a `scroll_down` intent

- [ ] **Step 4: Commit**

```bash
git add packages/input-core/playground packages/input-core/package.json pnpm-lock.yaml
git commit -m "chore(core): adapter playground for manual verification"
```

---

## Phase 3: Reader app

Goal: Library + Reader screens, calibration onboarding, gaze cursor, focus highlights, voice indicator, gesture readout, settings — wired to the engine and running the demo script end-to-end.

### Task 3.1: Tailwind + design tokens + layout shell

**Files:**
- Create: `apps/reader/postcss.config.js`
- Create: `apps/reader/tailwind.config.ts`
- Create: `apps/reader/src/index.css`
- Modify: `apps/reader/src/main.tsx` (import css)
- Modify: `apps/reader/package.json` (add tailwindcss, postcss, autoprefixer)

- [ ] **Step 1: Add Tailwind**

In `apps/reader/package.json` devDependencies:

```json
"autoprefixer": "^10.4.0",
"postcss": "^8.4.0",
"tailwindcss": "^3.4.0"
```

- [ ] **Step 2: Create configs**

```js
// apps/reader/postcss.config.js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

```ts
// apps/reader/tailwind.config.ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

```css
/* apps/reader/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}
html, body, #root { height: 100%; }
body { @apply bg-neutral-950 text-neutral-100 antialiased; font-family: ui-serif, Georgia, serif; }
```

In `main.tsx`:

```tsx
import './index.css';
```

- [ ] **Step 3: Install + build**

Run: `pnpm install && pnpm --filter @apps/reader build`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add apps/reader pnpm-lock.yaml
git commit -m "chore(reader): tailwind + dark theme baseline"
```

### Task 3.2: Bundled articles content + types

**Files:**
- Create: `apps/reader/src/articles/index.ts`
- Create: `apps/reader/src/articles/death-of-the-moth.ts`
- Create: `apps/reader/src/articles/walden-excerpt.ts`
- Create: `apps/reader/src/articles/civil-disobedience.ts`

- [ ] **Step 1: Define `Article` type and exports**

```ts
// apps/reader/src/articles/index.ts
import deathOfTheMoth from './death-of-the-moth.js';
import waldenExcerpt from './walden-excerpt.js';
import civilDisobedience from './civil-disobedience.js';

export interface Article {
  id: string;
  title: string;
  author: string;
  body: string; // plain prose, paragraphs separated by \n\n
  estimatedMinutes: number;
}

export const articles: Article[] = [deathOfTheMoth, waldenExcerpt, civilDisobedience];

export const findArticle = (id: string): Article | undefined => articles.find((a) => a.id === id);
```

- [ ] **Step 2: Provide three public-domain articles**

For each file, paste the full prose (use Project Gutenberg / Standard Ebooks copies). Example shape:

```ts
// apps/reader/src/articles/death-of-the-moth.ts
import type { Article } from './index.js';

const article: Article = {
  id: 'death-of-the-moth',
  title: 'The Death of the Moth',
  author: 'Virginia Woolf',
  estimatedMinutes: 6,
  body: `Moths that fly by day are not properly to be called moths; they do not excite that pleasant sense of dark autumn nights and ivy-blossom which the commonest yellow-underwing asleep in the shadow of the curtain never fails to rouse in us...

[Paste full public-domain text here]`,
};

export default article;
```

Repeat for `walden-excerpt` (Thoreau, *Walden*, "Where I Lived, And What I Lived For" or similar chapter) and `civil-disobedience`.

- [ ] **Step 3: Build**

Run: `pnpm --filter @apps/reader build`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add apps/reader/src/articles
git commit -m "feat(reader): bundle three public-domain articles"
```

### Task 3.3: Engine context provider

**Files:**
- Create: `apps/reader/src/engine/EngineProvider.tsx`
- Create: `apps/reader/src/engine/useEngine.ts`

- [ ] **Step 1: Implement provider**

```tsx
// apps/reader/src/engine/EngineProvider.tsx
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { createInputEngine, type InputEngine } from '@input/core';

export interface EngineContextValue {
  engine: InputEngine;
  state: string;
  hoveredTargetId: string | null;
}

export const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const engine = useMemo(() => createInputEngine(), []);
  const [state, setState] = useState<string>('IDLE');
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  useEffect(() => {
    return engine.onState((e) => {
      setState(e.to);
      setHoveredTargetId(e.to === 'HOVERED' ? e.targetId ?? null : null);
    });
  }, [engine]);

  return (
    <EngineContext.Provider value={{ engine, state, hoveredTargetId }}>
      {children}
    </EngineContext.Provider>
  );
}
```

```ts
// apps/reader/src/engine/useEngine.ts
import { useContext } from 'react';
import { EngineContext } from './EngineProvider.js';

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be inside EngineProvider');
  return ctx;
}
```

- [ ] **Step 2: Build**

Run: `pnpm --filter @apps/reader build`

- [ ] **Step 3: Commit**

```bash
git add apps/reader/src/engine
git commit -m "feat(reader): engine context + useEngine hook"
```

### Task 3.4: `useGazeTarget` — register a DOM element as a fusion target

**Files:**
- Create: `apps/reader/src/engine/useGazeTarget.ts`
- Test: `apps/reader/src/engine/__tests__/useGazeTarget.test.tsx` (component-level)

- [ ] **Step 1: Implement hook**

```ts
// apps/reader/src/engine/useGazeTarget.ts
import { useEffect, useId, useRef } from 'react';
import { useEngine } from './useEngine.js';

export function useGazeTarget<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const id = useId();
  const { engine, hoveredTargetId } = useEngine();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      engine.targets.register({
        id,
        rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', update);
      engine.targets.unregister(id);
    };
  }, [engine, id]);

  return { ref, id, hovered: hoveredTargetId === id };
}
```

- [ ] **Step 2: Build**

Run: `pnpm --filter @apps/reader build`

- [ ] **Step 3: Commit**

```bash
git add apps/reader/src/engine
git commit -m "feat(reader): useGazeTarget hook to register DOM as fusion targets"
```

### Task 3.5: Gaze cursor component

**Files:**
- Create: `apps/reader/src/components/GazeCursor.tsx`
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Component**

```tsx
// apps/reader/src/components/GazeCursor.tsx
import { useEffect, useState } from 'react';
import { useEngine } from '../engine/useEngine.js';

export function GazeCursor() {
  const { engine, state } = useEngine();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const off = engine.machine.on('state', () => {});
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    // Until WebGazer is wired in Task 3.x, fall back to mouse for development
    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      off();
    };
  }, [engine]);

  if (!pos) return null;
  const armed = state === 'ARMED' || state === 'HOVERED';
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: pos.x,
        top: pos.y,
        width: armed ? 18 : 12,
        height: armed ? 18 : 12,
        background: armed ? 'rgba(74,144,226,0.85)' : 'rgba(255,255,255,0.55)',
        boxShadow: armed ? '0 0 16px 4px rgba(74,144,226,0.7)' : '0 0 8px rgba(255,255,255,0.4)',
        transition: 'width 80ms ease, height 80ms ease, background 80ms ease',
      }}
    />
  );
}
```

Note: this is the development fallback that uses the mouse. Real gaze readings will replace `mousemove` in Task 3.12.

- [ ] **Step 2: Mount in `App.tsx`**

```tsx
import { EngineProvider } from './engine/EngineProvider.js';
import { GazeCursor } from './components/GazeCursor.js';

export function App() {
  return (
    <EngineProvider>
      <main className="min-h-screen p-8">
        <h1 className="text-3xl">Universal FE Input — Reader</h1>
      </main>
      <GazeCursor />
    </EngineProvider>
  );
}
```

- [ ] **Step 3: Run dev**

Run: `pnpm --filter @apps/reader dev`
Verify the dot follows the mouse.

- [ ] **Step 4: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): gaze cursor with state-driven styling"
```

### Task 3.6: Library route — article cards as gaze targets

**Files:**
- Create: `apps/reader/src/routes/Library.tsx`
- Create: `apps/reader/src/components/ArticleCard.tsx`
- Modify: `apps/reader/src/App.tsx` (add React Router)
- Modify: `apps/reader/package.json` (add `react-router-dom`)

- [ ] **Step 1: Add router dep**

```json
"react-router-dom": "^6.24.0"
```

- [ ] **Step 2: ArticleCard**

```tsx
// apps/reader/src/components/ArticleCard.tsx
import { Link } from 'react-router-dom';
import type { Article } from '../articles/index.js';
import { useGazeTarget } from '../engine/useGazeTarget.js';

export function ArticleCard({ article }: { article: Article }) {
  const { ref, hovered } = useGazeTarget<HTMLAnchorElement>();
  return (
    <Link
      ref={ref}
      to={`/read/${article.id}`}
      className={`block rounded-2xl p-6 transition-transform ${
        hovered ? 'scale-[1.03] outline outline-2 outline-blue-400' : 'bg-neutral-900 hover:bg-neutral-800'
      } bg-neutral-900`}
      data-target-id={article.id}
    >
      <div className="text-xs uppercase tracking-widest text-neutral-400">{article.author}</div>
      <h2 className="mt-2 text-2xl">{article.title}</h2>
      <div className="mt-4 text-sm text-neutral-500">~{article.estimatedMinutes} min read</div>
    </Link>
  );
}
```

- [ ] **Step 3: Library route**

```tsx
// apps/reader/src/routes/Library.tsx
import { articles } from '../articles/index.js';
import { ArticleCard } from '../components/ArticleCard.js';

export function Library() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="text-4xl">Library</h1>
      <p className="mt-2 text-neutral-400">Look at a card and pinch — or say "open."</p>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire router in `App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EngineProvider } from './engine/EngineProvider.js';
import { GazeCursor } from './components/GazeCursor.js';
import { Library } from './routes/Library.js';

export function App() {
  return (
    <EngineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Library />} />
        </Routes>
      </BrowserRouter>
      <GazeCursor />
    </EngineProvider>
  );
}
```

- [ ] **Step 5: Build + dev**

Run: `pnpm install && pnpm --filter @apps/reader dev`
Verify cards are visible and hover styling works on mouse-over.

- [ ] **Step 6: Commit**

```bash
git add apps/reader pnpm-lock.yaml
git commit -m "feat(reader): library route with gaze-aware article cards"
```

### Task 3.7: Reader route — render an article

**Files:**
- Create: `apps/reader/src/routes/Reader.tsx`
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Reader route**

```tsx
// apps/reader/src/routes/Reader.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { findArticle } from '../articles/index.js';

export function Reader() {
  const { id = '' } = useParams();
  const article = findArticle(id);
  const nav = useNavigate();
  if (!article) {
    return (
      <div className="p-8">
        <p>Article not found.</p>
        <button onClick={() => nav('/')}>Back</button>
      </div>
    );
  }
  return (
    <article className="mx-auto max-w-prose px-8 py-16 text-lg leading-relaxed">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-widest text-neutral-400">{article.author}</div>
        <h1 className="mt-2 text-4xl">{article.title}</h1>
      </header>
      {article.body.split('\n\n').map((p, i) => (
        <p key={i} className="mb-6">{p}</p>
      ))}
    </article>
  );
}
```

- [ ] **Step 2: Add route**

In `App.tsx`:

```tsx
<Route path="/read/:id" element={<Reader />} />
```

- [ ] **Step 3: Manual verification**

Run: `pnpm --filter @apps/reader dev`
Click an article card, verify it renders.

- [ ] **Step 4: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): article reader route"
```

### Task 3.8: Wire fusion intents to navigation + scroll

**Files:**
- Create: `apps/reader/src/engine/useIntentRouter.ts`
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Implement intent router**

```ts
// apps/reader/src/engine/useIntentRouter.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEngine } from './useEngine.js';

export function useIntentRouter() {
  const { engine } = useEngine();
  const nav = useNavigate();

  useEffect(() => {
    return engine.onIntent((i) => {
      switch (i.name) {
        case 'select':
        case 'open':
          if (i.targetId) {
            const el = document.querySelector<HTMLElement>(`[data-target-id="${CSS.escape(i.targetId)}"]`);
            (el as HTMLAnchorElement | null)?.click();
          }
          break;
        case 'back':
          nav(-1);
          break;
        case 'scroll_down':
          window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
          break;
        case 'scroll_up':
          window.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' });
          break;
        case 'top':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'bottom':
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          break;
      }
    });
  }, [engine, nav]);
}
```

- [ ] **Step 2: Use it inside the routed shell**

Wrap routes in a small component that calls the hook:

```tsx
// apps/reader/src/App.tsx (replace inner routes block)
import { useIntentRouter } from './engine/useIntentRouter.js';

function RoutedShell() {
  useIntentRouter();
  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/read/:id" element={<Reader />} />
    </Routes>
  );
}

export function App() {
  return (
    <EngineProvider>
      <BrowserRouter>
        <RoutedShell />
      </BrowserRouter>
      <GazeCursor />
    </EngineProvider>
  );
}
```

- [ ] **Step 3: Build**

Run: `pnpm --filter @apps/reader build`

- [ ] **Step 4: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): intent router maps fusion intents to navigation/scroll"
```

### Task 3.9: Voice indicator + last transcript caption

**Files:**
- Create: `apps/reader/src/components/VoiceIndicator.tsx`
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Component**

```tsx
// apps/reader/src/components/VoiceIndicator.tsx
import { useEffect, useState } from 'react';
import { useEngine } from '../engine/useEngine.js';

export function VoiceIndicator() {
  const { state } = useEngine();
  const [caption, setCaption] = useState<string | null>(null);

  useEffect(() => {
    if (!caption) return;
    const t = setTimeout(() => setCaption(null), 1500);
    return () => clearTimeout(t);
  }, [caption]);

  // Wire transcript captions in Task 3.13 once VoiceAdapter is connected.
  // For now, surface the fusion state as an accessibility cue.
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-neutral-800/80 px-3 py-1 text-sm">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          state === 'DICTATING' || state === 'ARMED' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
        }`}
      />
      {state}
      {caption && <span className="ml-2 text-neutral-200">{caption}</span>}
    </div>
  );
}
```

- [ ] **Step 2: Mount in `App.tsx`**

```tsx
<VoiceIndicator />
```

- [ ] **Step 3: Build + dev**

Run: `pnpm --filter @apps/reader dev`

- [ ] **Step 4: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): voice indicator surfaces fusion state"
```

### Task 3.10: Gesture readout component (debug overlay)

**Files:**
- Create: `apps/reader/src/components/GestureReadout.tsx`
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Component**

```tsx
// apps/reader/src/components/GestureReadout.tsx
import { useEffect, useState } from 'react';

export function GestureReadout({ getGesture }: { getGesture: () => string }) {
  const [g, setG] = useState('none');
  useEffect(() => {
    const t = setInterval(() => setG(getGesture()), 100);
    return () => clearInterval(t);
  }, [getGesture]);
  return (
    <div className="fixed bottom-4 left-4 rounded bg-neutral-800/80 px-3 py-1 text-sm">
      ✋ {g}
    </div>
  );
}
```

This component will be mounted with a real `getGesture` once `HandAdapter` is wired up in Task 3.13. Until then, mount with a stub that returns `'none'`.

In `App.tsx`:

```tsx
<GestureReadout getGesture={() => 'none'} />
```

- [ ] **Step 2: Build**

- [ ] **Step 3: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): gesture readout debug overlay"
```

### Task 3.11: Auto-scroll zones (gaze fixates on top/bottom 15%)

**Files:**
- Create: `apps/reader/src/engine/useAutoScroll.ts`
- Modify: `apps/reader/src/routes/Reader.tsx`

- [ ] **Step 1: Implement hook**

```ts
// apps/reader/src/engine/useAutoScroll.ts
import { useEffect } from 'react';
import { useEngine } from './useEngine.js';

const ZONE = 0.15;

export function useAutoScroll() {
  const { engine } = useEngine();
  useEffect(() => {
    let inZone: 'top' | 'bottom' | null = null;
    const off = engine.machine.on('state', () => {});
    const onReading = () => {};
    // Subscribe directly to gaze readings via machine internal? We need a fixated reading stream.
    // Cheapest path: read the latest gaze through a sidecar — we'll expose a `lastGaze` getter on the engine.
    return () => {
      off();
      inZone = null;
    };
  }, [engine]);
}
```

To make this real, expose `lastGaze` on the engine:

In `packages/input-core/src/engine.ts`, add a stored `lastGaze`:

```ts
let lastGaze: GazeReading | null = null;
return {
  // ...
  feed: (r) => {
    if (r.kind === 'gaze') lastGaze = r;
    machine.feed(r);
  },
  get lastGaze() { return lastGaze; },
  // ...
};
```

Update `InputEngine` interface accordingly:

```ts
import type { GazeReading } from './types.js';
export interface InputEngine {
  // ...
  readonly lastGaze: GazeReading | null;
}
```

Now `useAutoScroll`:

```ts
import { useEffect, useRef } from 'react';
import { useEngine } from './useEngine.js';

const ZONE = 0.15;
const SCROLL_PX_PER_FRAME = 4;

export function useAutoScroll() {
  const { engine } = useEngine();
  const rafRef = useRef(0);
  useEffect(() => {
    const tick = () => {
      const g = engine.lastGaze;
      if (g && g.fixated && g.confidence >= 0.6) {
        const top = window.innerHeight * ZONE;
        const bottom = window.innerHeight * (1 - ZONE);
        if (g.y < top) window.scrollBy(0, -SCROLL_PX_PER_FRAME);
        else if (g.y > bottom) window.scrollBy(0, SCROLL_PX_PER_FRAME);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine]);
}
```

- [ ] **Step 2: Use it inside Reader**

```tsx
// inside Reader.tsx
import { useAutoScroll } from '../engine/useAutoScroll.js';

export function Reader() {
  useAutoScroll();
  // ...
}
```

- [ ] **Step 3: Build**

Run: `pnpm --filter @input/core build && pnpm --filter @apps/reader build`

- [ ] **Step 4: Commit**

```bash
git add packages/input-core/src/engine.ts apps/reader/src
git commit -m "feat(reader): gaze-driven auto-scroll zones"
```

### Task 3.12: Calibration screen

**Files:**
- Create: `apps/reader/src/routes/Calibration.tsx`
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Calibration UI**

```tsx
// apps/reader/src/routes/Calibration.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ninePointTargets } from '@input/core';
import { useEngine } from '../engine/useEngine.js';

export function Calibration() {
  const { engine } = useEngine();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    engine.setCalibrating(true);
    return () => engine.setCalibrating(false);
  }, [engine]);

  const points = ninePointTargets({ width: size.w, height: size.h, marginPct: 10 });
  const point = points[i];

  useEffect(() => {
    const t = setTimeout(() => {
      if (i + 1 >= points.length) nav('/');
      else setI(i + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [i, nav, points.length]);

  if (!point) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950">
      <div className="absolute left-1/2 top-8 -translate-x-1/2 text-sm text-neutral-400">
        Look at the dot ({i + 1}/{points.length})
      </div>
      <div
        className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_24px_8px_rgba(74,144,226,0.5)] animate-pulse"
        style={{ left: point.x, top: point.y }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add route**

```tsx
<Route path="/calibrate" element={<Calibration />} />
```

Also register intent → navigation in `useIntentRouter` for `calibrate`:

```ts
case 'calibrate':
  nav('/calibrate');
  break;
```

- [ ] **Step 3: Build + dev**

Run: `pnpm --filter @apps/reader dev`
Visit `/calibrate`, observe 9 dots cycle and return to `/`.

- [ ] **Step 4: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): 9-point calibration screen"
```

### Task 3.13: Wire real perception adapters into the app

**Files:**
- Create: `apps/reader/src/engine/usePerception.ts`
- Modify: `apps/reader/src/components/GazeCursor.tsx` (use real gaze)
- Modify: `apps/reader/src/components/GestureReadout.tsx` (use real gesture)
- Modify: `apps/reader/src/components/VoiceIndicator.tsx` (use real transcript)
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Hook to mount/start adapters**

```ts
// apps/reader/src/engine/usePerception.ts
import { useEffect, useRef, useState } from 'react';
import { GazeAdapter, HandAdapter, VoiceAdapter } from '@input/core';
import { useEngine } from './useEngine.js';

export interface PerceptionHandle {
  start(): Promise<void>;
  stop(): void;
  lastGesture: string;
  lastTranscript: string | null;
}

export function usePerception(): PerceptionHandle & { ready: boolean } {
  const { engine } = useEngine();
  const gaze = useRef(new GazeAdapter());
  const hand = useRef(new HandAdapter());
  const voice = useRef(new VoiceAdapter());
  const [ready, setReady] = useState(false);
  const gestureRef = useRef('none');
  const transcriptRef = useRef<string | null>(null);

  useEffect(() => {
    const offs = [
      gaze.current.on('reading', (r) => engine.feed(r)),
      hand.current.on('reading', (r) => {
        if (r.kind === 'hand') gestureRef.current = r.gesture;
        engine.feed(r);
      }),
      voice.current.on('reading', (r) => {
        if (r.kind === 'voice' && r.phase === 'transcript') transcriptRef.current = r.transcript;
        engine.feed(r);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [engine]);

  return {
    ready,
    lastGesture: gestureRef.current,
    lastTranscript: transcriptRef.current,
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await Promise.all([
        gaze.current.start(stream),
        hand.current.start(stream),
        voice.current.start(stream),
      ]);
      setReady(true);
    },
    stop() {
      gaze.current.stop();
      hand.current.stop();
      voice.current.stop();
      setReady(false);
    },
  };
}
```

- [ ] **Step 2: Update gaze cursor to read from `engine.lastGaze`** instead of mouse

```tsx
// in GazeCursor.tsx
const { engine, state } = useEngine();
const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
useEffect(() => {
  let raf = 0;
  const tick = () => {
    const g = engine.lastGaze;
    if (g) setPos({ x: g.x, y: g.y });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, [engine]);
```

- [ ] **Step 3: Mount perception in App + add Start button on first run**

```tsx
// apps/reader/src/App.tsx
function PerceptionShell({ children }: { children: React.ReactNode }) {
  const p = usePerception();
  return (
    <>
      {!p.ready && (
        <button
          onClick={() => p.start()}
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 px-6 py-3 text-lg shadow-xl"
        >
          Start
        </button>
      )}
      <GestureReadout getGesture={() => p.lastGesture} />
      {children}
    </>
  );
}

export function App() {
  return (
    <EngineProvider>
      <BrowserRouter>
        <PerceptionShell>
          <RoutedShell />
        </PerceptionShell>
      </BrowserRouter>
      <GazeCursor />
      <VoiceIndicator />
    </EngineProvider>
  );
}
```

- [ ] **Step 4: Run end-to-end manual demo script**

Run: `pnpm --filter @apps/reader dev`
- Click Start → grant permissions
- Step 1: gaze a card, hold pinch — opens
- Step 2: gaze the bottom — auto-scrolls
- Step 4: gaze a link, say "open" — link opens
- Step 5: say "back" — returns to library

- [ ] **Step 5: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): wire real gaze/hand/voice adapters"
```

### Task 3.14: Settings — modality toggles, fusion timing sliders

**Files:**
- Create: `apps/reader/src/store/settings.ts`
- Create: `apps/reader/src/routes/Settings.tsx`
- Modify: `apps/reader/src/App.tsx`
- Modify: `apps/reader/src/engine/usePerception.ts` (respect toggles)
- Modify: `apps/reader/package.json` (add `zustand`)

- [ ] **Step 1: Add zustand**

```json
"zustand": "^4.5.0"
```

- [ ] **Step 2: Settings store**

```ts
// apps/reader/src/store/settings.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FUSION_CONFIG, type FusionConfig } from '@input/core';

interface State {
  enableGaze: boolean;
  enableHand: boolean;
  enableVoice: boolean;
  fusion: FusionConfig;
  apiKey: string | null;
  set: <K extends keyof Omit<State, 'set'>>(key: K, value: State[K]) => void;
  setFusion: <K extends keyof FusionConfig>(key: K, value: FusionConfig[K]) => void;
}

export const useSettings = create<State>()(
  persist(
    (set) => ({
      enableGaze: true,
      enableHand: true,
      enableVoice: true,
      fusion: { ...DEFAULT_FUSION_CONFIG },
      apiKey: null,
      set: (key, value) => set({ [key]: value } as Partial<State>),
      setFusion: (key, value) =>
        set((s) => ({ fusion: { ...s.fusion, [key]: value } })),
    }),
    { name: 'reader-settings' },
  ),
);
```

- [ ] **Step 3: Settings route**

```tsx
// apps/reader/src/routes/Settings.tsx
import { useSettings } from '../store/settings.js';

export function Settings() {
  const s = useSettings();
  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-3xl">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-xl">Modalities</h2>
        {(['enableGaze', 'enableHand', 'enableVoice'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2">
            <input type="checkbox" checked={s[k]} onChange={(e) => s.set(k, e.target.checked)} />
            {k}
          </label>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl">Fusion timings (ms)</h2>
        {(['hoverDwellMs', 'armTimeoutMs', 'commitPinchMs', 'gazeAbortLeaveMs'] as const).map((k) => (
          <label key={k} className="flex items-center gap-3">
            <span className="w-40">{k}</span>
            <input
              type="range"
              min={0}
              max={1500}
              value={s.fusion[k]}
              onChange={(e) => s.setFusion(k, Number(e.target.value))}
            />
            <span className="w-12 text-right">{s.fusion[k]}</span>
          </label>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl">Anthropic API key (optional)</h2>
        <input
          type="password"
          className="w-full rounded bg-neutral-900 p-2"
          value={s.apiKey ?? ''}
          onChange={(e) => s.set('apiKey', e.target.value || null)}
          placeholder="sk-ant-…"
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Route + intent for `help`**

In `App.tsx`:

```tsx
<Route path="/settings" element={<Settings />} />
```

In `useIntentRouter`:

```ts
case 'help':
  nav('/settings');
  break;
```

- [ ] **Step 5: Sync settings into engine config**

In `EngineProvider`:

```tsx
import { useSettings } from '../store/settings.js';

const fusion = useSettings((s) => s.fusion);
useEffect(() => {
  Object.assign(engine.config, fusion);
}, [engine, fusion]);
```

In `usePerception`, respect toggles:

```ts
const settings = useSettings();
async start() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: settings.enableGaze || settings.enableHand,
    audio: settings.enableVoice,
  });
  const tasks: Promise<void>[] = [];
  if (settings.enableGaze) tasks.push(gaze.current.start(stream));
  if (settings.enableHand) tasks.push(hand.current.start(stream));
  if (settings.enableVoice) tasks.push(voice.current.start(stream));
  await Promise.all(tasks);
  setReady(true);
}
```

- [ ] **Step 6: Build + manual verify**

Run: `pnpm install && pnpm --filter @apps/reader build`

- [ ] **Step 7: Commit**

```bash
git add apps/reader pnpm-lock.yaml
git commit -m "feat(reader): settings store + route, fusion config sync"
```

### Task 3.15: Help overlay — voice command cheat sheet

**Files:**
- Create: `apps/reader/src/components/HelpOverlay.tsx`
- Modify: `apps/reader/src/engine/useIntentRouter.ts`
- Modify: `apps/reader/src/App.tsx`

- [ ] **Step 1: Component**

```tsx
// apps/reader/src/components/HelpOverlay.tsx
const COMMANDS: Array<[string, string]> = [
  ['open / select', 'open the thing you are looking at'],
  ['back', 'previous page'],
  ['scroll down / up', 'scroll the page'],
  ['top / bottom', 'jump to top/bottom'],
  ['summarize', 'summarize current article'],
  ['cancel', 'abort the current action'],
  ['calibrate', 're-run gaze calibration'],
  ['help', 'show this overlay'],
];

export function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/70 p-8" onClick={onClose}>
      <div className="mx-auto max-w-xl rounded-2xl bg-neutral-900 p-6">
        <h2 className="text-xl">Voice commands</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {COMMANDS.map(([cmd, desc]) => (
            <li key={cmd}><span className="font-mono">{cmd}</span> — {desc}</li>
          ))}
        </ul>
        <button className="mt-4 text-sm text-neutral-400" onClick={onClose}>close</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Toggle from intent + global state**

Replace the `help` case in `useIntentRouter` to toggle a state via a tiny zustand store rather than navigating. Update `useSettings` to add a transient `helpOpen` (or create a new `useUi` store).

```ts
// apps/reader/src/store/ui.ts
import { create } from 'zustand';
export const useUi = create<{ helpOpen: boolean; setHelp: (b: boolean) => void }>((set) => ({
  helpOpen: false,
  setHelp: (helpOpen) => set({ helpOpen }),
}));
```

In `useIntentRouter`:

```ts
import { useUi } from '../store/ui.js';
const setHelp = useUi.getState().setHelp;
case 'help':
  setHelp(true);
  break;
```

In `App.tsx`:

```tsx
const help = useUi();
return (
  // ...
  <HelpOverlay open={help.helpOpen} onClose={() => help.setHelp(false)} />
);
```

- [ ] **Step 3: Build**

Run: `pnpm --filter @apps/reader build`

- [ ] **Step 4: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): help overlay triggered by 'help' intent"
```

---

## Phase 4: Live summarization (Cloudflare Worker proxy + UI panel)

### Task 4.1: Worker scaffold

**Files:**
- Create: `workers/summarize/package.json`
- Create: `workers/summarize/wrangler.toml`
- Create: `workers/summarize/src/index.ts`
- Create: `workers/summarize/tsconfig.json`
- Create: `workers/summarize/src/__tests__/handler.test.ts`
- Create: `workers/summarize/vitest.config.ts`

- [ ] **Step 1: package.json**

```json
{
  "name": "@workers/summarize",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240620.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "wrangler": "^3.60.0"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0"
  }
}
```

- [ ] **Step 2: wrangler.toml**

```toml
name = "universal-fe-input-summarize"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[kv_namespaces]]
binding = "RATE"
id = "REPLACE_WITH_KV_ID"

[vars]
DAILY_SPEND_CAP_USD = "1.0"
```

- [ ] **Step 3: tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: vitest config**

```ts
// workers/summarize/vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { globals: true, environment: 'node', include: ['src/**/*.test.ts'] } });
```

- [ ] **Step 5: Initial worker stub**

```ts
// workers/summarize/src/index.ts
export interface Env {
  ANTHROPIC_API_KEY: string;
  RATE: KVNamespace;
  DAILY_SPEND_CAP_USD: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    if (new URL(req.url).pathname !== '/api/summarize') return new Response('Not Found', { status: 404 });
    return new Response('not implemented', { status: 501 });
  },
};
```

- [ ] **Step 6: Install + typecheck**

Run: `pnpm install && pnpm --filter @workers/summarize typecheck`

- [ ] **Step 7: Commit**

```bash
git add workers/summarize pnpm-lock.yaml
git commit -m "chore(worker): summarize worker scaffold"
```

### Task 4.2: Per-IP rate limiter

**Files:**
- Create: `workers/summarize/src/rate-limit.ts`
- Create: `workers/summarize/src/__tests__/rate-limit.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../rate-limit.js';

class FakeKV {
  private map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) ?? null; }
  async put(k: string, v: string) { this.map.set(k, v); }
}

describe('checkRateLimit', () => {
  it('allows up to N within the window', async () => {
    const kv = new FakeKV();
    for (let i = 0; i < 10; i++) {
      const r = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 10, 3600 * 1000, i);
      expect(r.ok).toBe(true);
    }
    const r = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 10, 3600 * 1000, 10);
    expect(r.ok).toBe(false);
  });

  it('expires entries outside the window', async () => {
    const kv = new FakeKV();
    await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 1, 1000, 0);
    const blocked = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 1, 1000, 500);
    expect(blocked.ok).toBe(false);
    const allowed = await checkRateLimit(kv as unknown as KVNamespace, '1.2.3.4', 1, 1000, 2000);
    expect(allowed.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// workers/summarize/src/rate-limit.ts
export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  limit: number,
  windowMs: number,
  now: number,
): Promise<{ ok: boolean; remaining: number }> {
  const key = `rl:${ip}`;
  const raw = (await kv.get(key)) ?? '[]';
  const arr = JSON.parse(raw) as number[];
  const cutoff = now - windowMs;
  const fresh = arr.filter((t) => t >= cutoff);
  if (fresh.length >= limit) {
    await kv.put(key, JSON.stringify(fresh), { expirationTtl: Math.ceil(windowMs / 1000) });
    return { ok: false, remaining: 0 };
  }
  fresh.push(now);
  await kv.put(key, JSON.stringify(fresh), { expirationTtl: Math.ceil(windowMs / 1000) });
  return { ok: true, remaining: limit - fresh.length };
}
```

- [ ] **Step 3: Run — green**

- [ ] **Step 4: Commit**

```bash
git add workers/summarize/src
git commit -m "feat(worker): per-IP sliding-window rate limiter"
```

### Task 4.3: Daily spend cap

**Files:**
- Create: `workers/summarize/src/spend-cap.ts`
- Create: `workers/summarize/src/__tests__/spend-cap.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest';
import { reserveSpend, recordSpend } from '../spend-cap.js';

class FakeKV {
  map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) ?? null; }
  async put(k: string, v: string) { this.map.set(k, v); }
}

const dayKey = (now: number) => new Date(now).toISOString().slice(0, 10);

describe('spend cap', () => {
  it('reserveSpend returns ok until cap reached', async () => {
    const kv = new FakeKV();
    const now = Date.now();
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.4, 1.0, now)).ok).toBe(true);
    await recordSpend(kv as unknown as KVNamespace, 0.4, now);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.4, 1.0, now)).ok).toBe(true);
    await recordSpend(kv as unknown as KVNamespace, 0.4, now);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.4, 1.0, now)).ok).toBe(false);
  });

  it('separates by UTC day', async () => {
    const kv = new FakeKV();
    const day1 = Date.UTC(2026, 0, 1);
    const day2 = Date.UTC(2026, 0, 2);
    await recordSpend(kv as unknown as KVNamespace, 1.0, day1);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.5, 1.0, day1)).ok).toBe(false);
    expect((await reserveSpend(kv as unknown as KVNamespace, 0.5, 1.0, day2)).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// workers/summarize/src/spend-cap.ts
const day = (now: number) => new Date(now).toISOString().slice(0, 10);

export async function reserveSpend(
  kv: KVNamespace,
  estimateUsd: number,
  capUsd: number,
  now: number,
): Promise<{ ok: boolean; spentUsd: number }> {
  const key = `spend:${day(now)}`;
  const spent = Number((await kv.get(key)) ?? 0);
  if (spent + estimateUsd > capUsd) return { ok: false, spentUsd: spent };
  return { ok: true, spentUsd: spent };
}

export async function recordSpend(kv: KVNamespace, usd: number, now: number): Promise<void> {
  const key = `spend:${day(now)}`;
  const spent = Number((await kv.get(key)) ?? 0);
  await kv.put(key, String(spent + usd), { expirationTtl: 60 * 60 * 48 });
}
```

- [ ] **Step 3: Run — green**

- [ ] **Step 4: Commit**

```bash
git add workers/summarize/src
git commit -m "feat(worker): daily spend cap with UTC-day buckets"
```

### Task 4.4: Summarize handler

**Files:**
- Modify: `workers/summarize/src/index.ts`
- Create: `workers/summarize/src/__tests__/handler.test.ts`

- [ ] **Step 1: Handler test**

```ts
// workers/summarize/src/__tests__/handler.test.ts
import { describe, it, expect, vi } from 'vitest';

const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create };
  },
}));

import handler from '../index.js';

class FakeKV {
  map = new Map<string, string>();
  async get(k: string) { return this.map.get(k) ?? null; }
  async put(k: string, v: string) { this.map.set(k, v); }
}

const env = () => ({
  ANTHROPIC_API_KEY: 'k',
  RATE: new FakeKV() as unknown as KVNamespace,
  DAILY_SPEND_CAP_USD: '1.0',
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://x/api/summarize', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '1.1.1.1', ...headers },
  });

describe('handler', () => {
  it('returns summary on success', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'short summary' }] });
    const res = await handler.fetch(post({ text: 'hello world' }), env());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { summary: string };
    expect(body.summary).toBe('short summary');
  });

  it('rate-limits after 10 calls/IP/hour', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const e = env();
    for (let i = 0; i < 10; i++) {
      const r = await handler.fetch(post({ text: 'x' }), e);
      expect(r.status).toBe(200);
    }
    const r = await handler.fetch(post({ text: 'x' }), e);
    expect(r.status).toBe(429);
  });

  it('forwards user-supplied API key when present', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    const res = await handler.fetch(
      post({ text: 'x' }, { 'x-anthropic-api-key': 'user-key' }),
      env(),
    );
    expect(res.status).toBe(200);
  });

  it('rejects oversize input', async () => {
    const big = 'a'.repeat(60_000);
    const res = await handler.fetch(post({ text: big }), env());
    expect(res.status).toBe(413);
  });
});
```

- [ ] **Step 2: Implement handler**

```ts
// workers/summarize/src/index.ts
import Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit } from './rate-limit.js';
import { reserveSpend, recordSpend } from './spend-cap.js';

export interface Env {
  ANTHROPIC_API_KEY: string;
  RATE: KVNamespace;
  DAILY_SPEND_CAP_USD: string;
}

const RATE_LIMIT_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;
const MAX_INPUT_CHARS = 50_000;
const ESTIMATED_USD_PER_CALL = 0.003;
const MODEL = 'claude-haiku-4-5-20251001';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (req.method !== 'POST' || url.pathname !== '/api/summarize') {
      return cors(new Response('Not Found', { status: 404 }));
    }

    const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
    const now = Date.now();
    const rl = await checkRateLimit(env.RATE, ip, RATE_LIMIT_PER_HOUR, HOUR_MS, now);
    if (!rl.ok) return cors(new Response('Rate limit exceeded', { status: 429 }));

    let body: { text?: unknown };
    try { body = await req.json(); } catch { return cors(new Response('Bad JSON', { status: 400 })); }
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text) return cors(new Response('Missing text', { status: 400 }));
    if (text.length > MAX_INPUT_CHARS) return cors(new Response('Input too large', { status: 413 }));

    const userKey = req.headers.get('x-anthropic-api-key');
    const usingUserKey = !!userKey;
    if (!usingUserKey) {
      const cap = Number(env.DAILY_SPEND_CAP_USD || '1');
      const sp = await reserveSpend(env.RATE, ESTIMATED_USD_PER_CALL, cap, now);
      if (!sp.ok) return cors(new Response('Daily spend cap reached', { status: 503 }));
    }

    const client = new Anthropic({ apiKey: usingUserKey ? userKey : env.ANTHROPIC_API_KEY });
    let resp;
    try {
      resp = await client.messages.create({
        model: MODEL,
        max_tokens: 400,
        messages: [
          { role: 'user', content: `Summarize the following article in 4–6 short bullets:\n\n${text}` },
        ],
      });
    } catch (e) {
      return cors(new Response(`Upstream error: ${(e as Error).message}`, { status: 502 }));
    }

    if (!usingUserKey) await recordSpend(env.RATE, ESTIMATED_USD_PER_CALL, now);

    const summary = resp.content
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { type: string; text?: string }) => b.text ?? '')
      .join('\n');
    return cors(new Response(JSON.stringify({ summary }), { headers: { 'content-type': 'application/json' } }));
  },
};

function cors(res: Response): Response {
  res.headers.set('access-control-allow-origin', '*');
  res.headers.set('access-control-allow-methods', 'POST, OPTIONS');
  res.headers.set('access-control-allow-headers', 'content-type, x-anthropic-api-key');
  return res;
}
```

- [ ] **Step 3: Run — green**

Run: `pnpm --filter @workers/summarize test`

- [ ] **Step 4: Commit**

```bash
git add workers/summarize/src
git commit -m "feat(worker): summarize handler with rate limit, spend cap, BYOK"
```

### Task 4.5: Reader summary panel + intent wiring

**Files:**
- Create: `apps/reader/src/components/SummaryPanel.tsx`
- Modify: `apps/reader/src/routes/Reader.tsx`
- Modify: `apps/reader/src/engine/useIntentRouter.ts`
- Modify: `apps/reader/src/store/ui.ts` (add `summaryOpen`)
- Add env variable for worker URL

- [ ] **Step 1: ENV for worker URL**

In `apps/reader/.env.example`:

```
VITE_SUMMARIZE_URL=https://universal-fe-input-summarize.<your-account>.workers.dev/api/summarize
```

This is a public URL, not a secret — safe to expose.

- [ ] **Step 2: Update UI store**

```ts
import { create } from 'zustand';
export const useUi = create<{
  helpOpen: boolean; setHelp: (b: boolean) => void;
  summaryOpen: boolean; setSummary: (b: boolean) => void;
}>((set) => ({
  helpOpen: false, setHelp: (helpOpen) => set({ helpOpen }),
  summaryOpen: false, setSummary: (summaryOpen) => set({ summaryOpen }),
}));
```

- [ ] **Step 3: SummaryPanel**

```tsx
// apps/reader/src/components/SummaryPanel.tsx
import { useEffect, useState } from 'react';
import { useUi } from '../store/ui.js';
import { useSettings } from '../store/settings.js';

export function SummaryPanel({ articleText }: { articleText: string }) {
  const { summaryOpen, setSummary } = useUi();
  const apiKey = useSettings((s) => s.apiKey);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!summaryOpen) { setText(null); setError(null); return; }
    setLoading(true);
    const ctrl = new AbortController();
    fetch(import.meta.env.VITE_SUMMARIZE_URL as string, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { 'x-anthropic-api-key': apiKey } : {}),
      },
      body: JSON.stringify({ text: articleText }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as { summary: string };
        setText(j.summary);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [summaryOpen, articleText, apiKey]);

  if (!summaryOpen) return null;
  return (
    <aside className="fixed right-0 top-0 z-30 h-full w-96 overflow-y-auto bg-neutral-900 p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">Summary</h3>
        <button className="text-sm text-neutral-400" onClick={() => setSummary(false)}>close</button>
      </div>
      {loading && <p className="mt-4 text-neutral-400">Summarizing…</p>}
      {error && <p className="mt-4 text-red-400">Error: {error}</p>}
      {text && <pre className="mt-4 whitespace-pre-wrap text-sm">{text}</pre>}
    </aside>
  );
}
```

- [ ] **Step 4: Mount in `Reader.tsx`**

```tsx
import { SummaryPanel } from '../components/SummaryPanel.js';

return (
  <>
    <article>...</article>
    <SummaryPanel articleText={article.body} />
  </>
);
```

- [ ] **Step 5: Wire `summarize` intent**

In `useIntentRouter`:

```ts
import { useUi } from '../store/ui.js';
const setSummary = useUi.getState().setSummary;
case 'summarize':
  setSummary(true);
  break;
```

- [ ] **Step 6: Build**

Run: `pnpm --filter @apps/reader build`

- [ ] **Step 7: Commit**

```bash
git add apps/reader/src
git commit -m "feat(reader): live summary panel via worker proxy"
```

### Task 4.6: Deploy worker

**Files:**
- Manual cloud setup; document in `workers/summarize/DEPLOY.md`

- [ ] **Step 1: Create KV namespace**

Run: `cd workers/summarize && pnpm exec wrangler kv:namespace create RATE`
Copy returned ID into `wrangler.toml`.

- [ ] **Step 2: Set secret**

Run: `pnpm exec wrangler secret put ANTHROPIC_API_KEY`
Paste your key when prompted.

- [ ] **Step 3: Deploy**

Run: `pnpm --filter @workers/summarize deploy`
Confirm endpoint with: `curl -X POST <url>/api/summarize -H 'content-type: application/json' -d '{"text":"hello world"}'`
Expected: 200 with a short summary.

- [ ] **Step 4: Set `VITE_SUMMARIZE_URL` in `.env` for reader**

- [ ] **Step 5: Commit deploy doc**

```bash
git add workers/summarize/DEPLOY.md workers/summarize/wrangler.toml apps/reader/.env.example
git commit -m "docs(worker): deployment guide and reader env example"
```

---

## Phase 5: Polish, ship, README

### Task 5.1: README with architecture overview + demo video placeholder

**Files:**
- Create: `README.md`

- [ ] **Step 1: Top-level README**

```markdown
# Universal FE Input

Multimodal input system fusing webcam **gaze**, **hand gestures**, and **voice intent** into a single intent stream that drives a hands-free article reader.

## Demo

[60s demo video placeholder]

## What's interesting

- `@input/core` — framework-agnostic fusion engine. State machine that combines noisy perception streams into reliable intents. 100% branch-covered.
- `apps/reader` — the showcase: a hands-free reader that uses the engine via a few hooks.
- `workers/summarize` — a Cloudflare Worker proxy for live LLM summarization, rate-limited per-IP with a daily spend cap.

## Architecture

See `docs/superpowers/specs/2026-05-09-universal-fe-input-design.md`.

## Run locally

```bash
pnpm install
pnpm --filter @input/core build
pnpm --filter @apps/reader dev
```

Open `http://localhost:5173`, click Start, grant webcam + mic.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: top-level README"
```

### Task 5.2: Reader deploy to Cloudflare Pages

**Files:**
- Create: `apps/reader/wrangler.toml`

- [ ] **Step 1: Wrangler config**

```toml
name = "universal-fe-input-reader"
pages_build_output_dir = "dist"
```

- [ ] **Step 2: Build + deploy**

Run: `pnpm --filter @apps/reader build`
Run: `cd apps/reader && pnpm exec wrangler pages deploy dist --project-name universal-fe-input-reader`

- [ ] **Step 3: Verify deployed bundle has no API key**

Run: `curl https://<deploy-url>/assets/*.js | grep -i 'sk-ant' || echo OK`
Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add apps/reader/wrangler.toml
git commit -m "chore(reader): wrangler config for Cloudflare Pages"
```

### Task 5.3: Cross-machine smoke test + final demo script

**Files:**
- Create: `docs/DEMO_SCRIPT.md`

- [ ] **Step 1: Create demo script**

```markdown
# Demo Script

1. Land on Library. Look at "The Death of the Moth." Card scales + outlines.
2. Pinch and hold ~300ms. Article opens. (~150ms perceived)
3. Look at the bottom 15% of the page. Smooth auto-scroll begins.
4. Say "summarize." Side panel slides in with bullet summary. (~250ms)
5. Look at a footnote link. Say "open." Link opens.
6. Say "back." Returns to library.

## Acceptance
- All steps respond in <300ms perceived latency on creator's laptop.
- All steps run end-to-end on at least 1 other machine.
- Worker logs show no rate-limit or spend-cap hits during a normal demo.
```

- [ ] **Step 2: Manual cross-machine test**

Borrow a friend's laptop. Open the deployed site. Run the script.

- [ ] **Step 3: Record + embed video**

Record a 60–90s screen + webcam capture of the demo. Upload to YouTube/Loom. Embed link in `README.md`.

- [ ] **Step 4: Commit**

```bash
git add docs/DEMO_SCRIPT.md README.md
git commit -m "docs: demo script + embedded video"
```

---

## Self-Review

Spec coverage:

- §1 framing → README + DEMO_SCRIPT cover it.
- §2 architecture → Phases 0-2 build the package layout exactly.
- §3 fusion state machine → Phase 1 tasks 1.5–1.11 cover all states + transitions + abort signals + tunable params.
- §4 perception adapters → Phase 2 tasks 2.1–2.10 cover the interface, gaze, hand, voice, intent grammar, calibration helper.
- §5 reader app → Phase 3 covers all screens, affordances, demo script.
- §6 calibration UX → Task 3.12 covers gaze 9-point. (Mic check + hand check + fusion sanity check are "nice-to-have onboarding" — added a follow-up task in BACKLOG; v1 calibration is gaze-only, with mic/hand prompts surfaced as "Start" gate.) **Mark known gap** below.
- §7 live summarization → Phase 4 covers worker, rate limit, spend cap, BYOK passthrough, summary panel.
- §8 testing strategy → engine tests are dense; reader has light tests (manual demo as primary bar).
- §9 risks → Web Worker for perception is **not yet implemented**; mitigation step is "profile early" — added a follow-up.
- §10 project plan → Phase mapping matches.
- §11 stretch goals → not implemented in v1, by design.
- §12 DoD → README + DEMO_SCRIPT include the acceptance bullets.

Known gaps (added inline below):

- Multi-stage calibration (mic check + hand check + fusion sanity check) is partially deferred. Add small follow-up tasks at the end of Phase 3 if time permits.
- Web Worker offload for perception is deferred until profiling shows it's needed (per spec §9 mitigation).

---

## Backlog (post-v1)

- macOS OS-cursor adapter (Tauri sidecar).
- URL paste + article extraction.
- LLM fuzzy intent resolution.
- Web Worker offload for perception adapters.
- Multi-stage onboarding (mic check + hand check + fusion sanity check screens).
- `point` gesture for "show me" affordances.
