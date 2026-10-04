/**
 * The browser's own user agent, so the API records each session against the
 * device that holds it rather than against this server's `fetch`.
 */
export function userAgentHeader(userAgent: string | null): Record<string, string> {
  return userAgent ? { 'user-agent': userAgent } : {};
}
