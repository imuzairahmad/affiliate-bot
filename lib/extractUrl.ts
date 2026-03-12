export function extractUrl(text?: string): string | null {
  if (!text) return null;

  const regex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(regex);

  if (!urls) return null;

  return urls[0];
}
