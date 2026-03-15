const userRequests = new Map<string, number[]>();

const LIMIT = 10;
const WINDOW = 10 * 60 * 1000;

export function checkUserLimit(user: string): boolean {
  const now = Date.now();

  const timestamps = userRequests.get(user) || [];

  const filtered = timestamps.filter((t) => now - t < WINDOW);

  filtered.push(now);

  userRequests.set(user, filtered);

  return filtered.length <= LIMIT;
}
