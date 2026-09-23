/** Cosmetic fill for an unknown wait. Approaches a ceiling and keeps stepping forward. */
export function nextGenerationProgress(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  const eased = 0.84 * (1 - Math.exp(-elapsed / 8));
  const creep = Math.floor(elapsed / 1.8) * 0.0035;
  return Math.min(0.94, eased + creep);
}
