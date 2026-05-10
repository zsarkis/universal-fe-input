import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EngineProvider } from './engine/EngineProvider.js';
import { GazeCursor } from './components/GazeCursor.js';
import { VoiceIndicator } from './components/VoiceIndicator.js';
import { GestureReadout } from './components/GestureReadout.js';
import { Library } from './routes/Library.js';
import { Reader } from './routes/Reader.js';
import { Calibration } from './routes/Calibration.js';
import { useIntentRouter } from './engine/useIntentRouter.js';

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

export function App() {
  return (
    <EngineProvider>
      <BrowserRouter>
        <RoutedShell />
      </BrowserRouter>
      <GazeCursor />
      <VoiceIndicator />
      <GestureReadout getGesture={() => 'none'} />
    </EngineProvider>
  );
}
