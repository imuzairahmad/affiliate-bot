export function convertToAffiliate(url: string | null): string | null {
  if (!url) return null;

  const tag = process.env.AMAZON_TAG;

  if (!tag) {
    throw new Error("Missing AMAZON_TAG");
  }

  if (url.includes("?")) {
    return `${url}&tag=${tag}`;
  }

  return `${url}?tag=${tag}`;
}
