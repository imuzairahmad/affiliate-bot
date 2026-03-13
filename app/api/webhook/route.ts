import { NextRequest } from "next/server";
import { extractUrl } from "@/lib/extractUrl";
import { convertToAffiliate } from "@/lib/amazon";
import { sendMessage } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new Response("Verification failed", { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("Webhook event:", JSON.stringify(body, null, 2));

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const from: string = message.from;
  const text: string | undefined = message.text?.body;

  const url = extractUrl(text);

  if (!url) {
    await sendMessage(from, "Please send an Amazon product link.");
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const affiliateLink = convertToAffiliate(url);

  await sendMessage(from, `Your affiliate link:\n${affiliateLink}`);

  return new Response("EVENT_RECEIVED", { status: 200 });
}
