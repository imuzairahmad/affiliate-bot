export function buildAffiliateLink(asin: string) {
  const tag = process.env.AMAZON_TAG;

  if (!tag) {
    throw new Error("AMAZON_TAG missing");
  }

  return `https://www.amazon.com/dp/${asin}?tag=${tag}`;
}
