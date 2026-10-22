/* ------------------------------------------------------------------ */
/*  Web Arama (DuckDuckGo HTML sunucu tarafı - anahtar gerektirmez)   */
/* ------------------------------------------------------------------ */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const DDG_ENDPOINT = "https://html.duckduckgo.com/html/";

export async function webSearch(query: string, limit = 5): Promise<SearchResult[]> {
  try {
    const res = await fetch(`${DDG_ENDPOINT}?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html",
      },
      // @ts-ignore - Node 22 global fetch
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseDuckDuckGo(html, limit);
  } catch {
    return [];
  }
}

function parseDuckDuckGo(html: string, limit: number): SearchResult[] {
  const results: SearchResult[] = [];
  // Basit, dayanaklı regex tabanlı ayıklama.
  const resultRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = resultRegex.exec(html)) && results.length < limit) {
    let url = match[1];
    let title = stripTags(match[2]);
    // DuckDuckGo redirect linkini düzelt.
    if (url.startsWith("//duckduckgo.com/l/?")) {
      try {
        const u = new URL("https:" + url);
        const ddg = u.searchParams.get("uddg");
        if (ddg) url = decodeURIComponent(ddg);
      } catch {}
    }
    results.push({ title: title.trim(), url, snippet: "" });
  }

  // Snippet'leri yakala.
  const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let i = 0;
  let sMatch;
  while ((sMatch = snippetRegex.exec(html)) && i < results.length) {
    results[i].snippet = stripTags(sMatch[1]).trim();
    i++;
  }
  return results;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

/* ------------------------------------------------------------------ */
/*  Web Gezinme: URL içeriğini çekip temiz metin döndür               */
/* ------------------------------------------------------------------ */

export async function browseUrl(url: string): Promise<{ title?: string; text: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { text: `İçerik alınamadı (HTTP ${res.status})` };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? stripTags(titleMatch[1]).trim() : undefined;
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { title, text: text.slice(0, 12000) };
  } catch (err: any) {
    return { text: `Web gezinti hatası: ${err?.message || err}` };
  }
}
