import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeAmazonLink(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(data);

    let amazonLink: string | null = null;

    $("a").each((_, el) => {
      let href = $(el).attr("href");

      if (!href) return;

      // --- STEP 1: decode redirect links like /go?url=... ---
      if (href.includes("url=")) {
        const parts = href.split("url=");
        if (parts[1]) {
          href = decodeURIComponent(parts[1]);
        }
      }

      // --- STEP 2: decode any encoded URLs ---
      href = decodeURIComponent(href);

      // --- STEP 3: prioritize short Amazon links first ---
      if (href.includes("amzn.to")) {
        amazonLink = href;
        return false; // stop iteration
      }

      // --- STEP 4: real Amazon product pages ---
      if (
        href.includes("amazon.") &&
        (href.includes("/dp/") || href.includes("/gp/product/"))
      ) {
        amazonLink = href;
        return false; // stop iteration
      }
    });

    return amazonLink;
  } catch (error) {
    console.error("Scraping error:", error);
    return null;
  }
}
