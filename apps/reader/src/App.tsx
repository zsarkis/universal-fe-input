import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { EngineProvider } from './engine/EngineProvider.js';
import { GazeCursor } from './components/GazeCursor.js';
import { VoiceIndicator } from './components/VoiceIndicator.js';
import { GestureReadout } from './components/GestureReadout.js';
import { Library } from './routes/Library.js';
import { Reader } from './routes/Reader.js';
import { Calibration } from './routes/Calibration.js';
import { useIntentRouter } from './engine/useIntentRouter.js';
import { usePerception } from './engine/usePerception.js';

function RoutedShell() {
  useIntentRouter();
  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/read/:id" element={<Reader />} />
      <Route path="/calibrate" element={<Calibration />} />
    </Routes>
  );
}

function PerceptionShell({ children }: { children: ReactNode }) {
  const p = usePerception();
  return (
    <>
      {!p.ready && (
        <button
          onClick={() => { void p.start(); }}
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
