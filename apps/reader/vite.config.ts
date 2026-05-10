import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createReadStream, existsSync, statSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));

// WebGazer 3.x bundles an old MediaPipe FaceMesh that fetches its WASM
// assets from `/mediapipe/face_mesh/` on the origin at runtime. This plugin
// serves those files from the `@mediapipe/face_mesh` npm package.
function serveFaceMesh(): Plugin {
  const pkgDir = join(here, 'node_modules', '@mediapipe', 'face_mesh');
  return {
    name: 'serve-mediapipe-face-mesh',
    configureServer(server) {
      server.middlewares.use('/mediapipe/face_mesh', (req, res, next) => {
        if (!req.url) return next();
        const filePath = join(pkgDir, req.url.split('?')[0] ?? '');
        if (!existsSync(filePath) || !statSync(filePath).isFile()) return next();
        const ext = filePath.split('.').pop();
        const ct =
          ext === 'js' ? 'application/javascript' :
          ext === 'wasm' ? 'application/wasm' :
          ext === 'json' ? 'application/json' :
          ext === 'data' ? 'application/octet-stream' :
          'application/octet-stream';
        res.setHeader('content-type', ct);
        res.setHeader('cross-origin-resource-policy', 'same-origin');
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveFaceMesh()],
  server: {
    port: 5173,
    // Cross-origin isolation enables SharedArrayBuffer, which the Whisper
    // adapter needs for multi-threaded WASM inference. `credentialless` allows
    // cross-origin no-cors fetches (e.g. Hugging Face model files) without
    // requiring CORP headers on the remote.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});
