import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EngineProvider } from './engine/EngineProvider.js';
import { GazeCursor } from './components/GazeCursor.js';
import { VoiceIndicator } from './components/VoiceIndicator.js';
import { Library } from './routes/Library.js';
import { Reader } from './routes/Reader.js';
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
      <VoiceIndicator />
    </EngineProvider>
  );
}
