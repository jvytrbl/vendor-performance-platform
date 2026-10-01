// Vercel appends the connecting client's IP as the first entry of
// x-forwarded-for (proxied hops, if any, follow after it). Absent locally
// and in any environment without a proxy in front of the app.
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return null;
  }

  const first = forwardedFor.split(",")[0]?.trim();
  return first || null;
}
