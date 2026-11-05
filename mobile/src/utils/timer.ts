/**
 * Helper to manage OTP resend cooldown timers reliably across app lifecycle.
 */
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export function calculateRemainingSeconds(
  startedAtMs: number,
  durationSeconds: number = OTP_RESEND_COOLDOWN_SECONDS,
  nowMs: number = Date.now()
): number {
  const elapsedMs = nowMs - startedAtMs;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remaining = durationSeconds - elapsedSeconds;
  return Math.max(0, remaining);
}

export function canResendOtp(remainingSeconds: number): boolean {
  return remainingSeconds <= 0;
}

export function formatTimerDisplay(seconds: number): string {
  const clamped = Math.max(0, seconds);
  return clamped < 10 ? `0${clamped}` : `${clamped}`;
}

