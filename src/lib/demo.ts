/** Demo mode is on unless explicitly disabled */
export function isDemoMode(): boolean {
  if (typeof process.env.NEXT_PUBLIC_DEMO_MODE === "string") {
    return process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
  }
  if (typeof process.env.DEMO_MODE === "string") {
    return process.env.DEMO_MODE !== "false";
  }
  return true;
}
