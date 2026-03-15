import { NextRequest } from "next/server";
import {
  extractUrl,
  sendMessage,
  scrapeAmazonLink,
  expandShortLink,
  extractASIN,
  buildAffiliateLink,
  checkUserLimit,
  getCachedAffiliate,
  storeAffiliate,
} from "@/lib";

/*
-----------------------------------
Webhook Verification
-----------------------------------
*/
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}

/*
-----------------------------------
Webhook Message Receiver
-----------------------------------
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    const from: string = message.from;

    // --------------------
    // Rate limit
    // --------------------
    if (!checkUserLimit(from)) {
      await sendMessage(
        from,
        "⚠️ Too many requests. Please wait a few minutes before sending more links.",
      );
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // --------------------
    // Get text or caption
    // --------------------
    const text =
      message.text?.body ||
      message.image?.caption ||
      message.video?.caption ||
      message.document?.caption;

    if (!text) {
      await sendMessage(from, "❌ Please send a product link.");
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // --------------------
    // Extract URL
    // --------------------
    let url = extractUrl(text);
    if (!url) {
      await sendMessage(from, "❌ Could not find a link.");
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // --------------------
    // Expand short link
    // --------------------
    url = await expandShortLink(url);

    // --------------------
    // If not Amazon → scrape page
    // --------------------
    if (!url.includes("amazon") && !url.includes("amzn.to")) {
      const scraped = await scrapeAmazonLink(url);
      if (!scraped) {
        await sendMessage(from, "❌ Could not find Amazon product link.");
        return new Response("EVENT_RECEIVED", { status: 200 });
      }
      url = await expandShortLink(scraped);
    }

    // --------------------
    // Extract ASIN
    // --------------------
    const asin = extractASIN(url);
    if (!asin) {
      await sendMessage(from, "❌ Could not detect Amazon product.");
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // --------------------
    // Check cache
    // --------------------
    const cached = getCachedAffiliate(asin);
    if (cached) {
      await sendMessage(
        from,
        `⚠️ This product was already processed recently.\n\n${cached}`,
      );
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    // --------------------
    // Build affiliate link
    // --------------------
    const affiliateLink = buildAffiliateLink(asin);

    // --------------------
    // Store in cache
    // --------------------
    storeAffiliate(asin, affiliateLink);

    // --------------------
    // Send reply
    // --------------------
    await sendMessage(from, `✅ Your Affiliate Link:\n\n${affiliateLink}`);

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Server Error", { status: 500 });
  }
}
