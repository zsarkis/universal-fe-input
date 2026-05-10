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
  gaze.stop();
  hand.stop();
  voice.stop();
  log('stopped');
});
