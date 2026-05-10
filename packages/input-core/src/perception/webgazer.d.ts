declare module 'webgazer' {
  type GazeListener = (
    data: { x: number; y: number } | null,
    ts: number,
  ) => void;

  interface WebGazer {
    setRegression(name: string): WebGazer;
    showVideoPreview(flag: boolean): WebGazer;
    showPredictionPoints(flag: boolean): WebGazer;
    saveDataAcrossSessions(flag: boolean): WebGazer;
    setGazeListener(listener: GazeListener): WebGazer;
    begin(): Promise<void>;
    end(): void;
  }

  const webgazer: WebGazer;
  export default webgazer;
}
