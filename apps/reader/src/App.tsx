import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { EngineProvider } from './engine/EngineProvider.js';
import { GazeCursor } from './components/GazeCursor.js';
import { VoiceIndicator } from './components/VoiceIndicator.js';
import { GestureReadout } from './components/GestureReadout.js';
import { MicMeter } from './components/MicMeter.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { Toast } from './components/Toast.js';
import { Library } from './routes/Library.js';
import { Reader } from './routes/Reader.js';
import { Calibration } from './routes/Calibration.js';
import { Settings } from './routes/Settings.js';
import { useIntentRouter } from './engine/useIntentRouter.js';
import { usePerception } from './engine/usePerception.js';
import { useUi } from './store/ui.js';

function RoutedShell() {
  useIntentRouter();
  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/read/:id" element={<Reader />} />
      <Route path="/calibrate" element={<Calibration />} />
      <Route path="/settings" element={<Settings />} />
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
      {p.ready && <MicMeter getRms={() => p.micRms} getThreshold={() => p.micThreshold} />}
      {children}
    </>
  );
}

function HelpHost() {
  const { helpOpen, setHelp } = useUi();
  return <HelpOverlay open={helpOpen} onClose={() => setHelp(false)} />;
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
      <HelpHost />
      <Toast />
    </EngineProvider>
  );
}
