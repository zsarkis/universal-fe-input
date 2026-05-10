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
