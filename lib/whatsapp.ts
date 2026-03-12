import axios from "axios";

export async function sendMessage(to: string, message: string): Promise<void> {
  const phoneId = process.env.PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneId || !token) {
    throw new Error("Missing WhatsApp environment variables");
  }

  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}
