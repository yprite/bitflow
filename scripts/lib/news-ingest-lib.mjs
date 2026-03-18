import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

export const NEWS_FEEDS = [
  {
    name: 'Google News BTC',
    url: 'https://news.google.com/rss/search?q=%28bitcoin%20OR%20BTC%29%20when%3A7d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News ETF',
    url: 'https://news.google.com/rss/search?q=%28bitcoin%20ETF%20OR%20BlackRock%20OR%20Fidelity%20OR%20SEC%29%20when%3A7d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News Strategy',
    url: 'https://news.google.com/rss/search?q=%28Strategy%20OR%20MicroStrategy%29%20bitcoin%20when%3A7d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'SEC Press Releases',
    url: 'https://www.sec.gov/news/pressreleases.rss',
  },
  {
    name: 'Bitcoin.org Blog',
    url: 'https://bitcoin.org/en/rss/blog.xml',
  },
];

export const DEFAULT_X_ACCOUNTS = ['BtcPicture', 'cyp3er'];

const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';

export function setEnvFromText(text) {
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    if (!process.env[key]) {
      process.env[key] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

export async function loadEnvFile(filePath) {
  try {
    const text = await readFile(filePath, 'utf8');
    setEnvFromText(text);
  } catch {
    // Optional env file.
  }
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function resolveChromePath() {
  return process.env.BITFLOW_CHROME_PATH || DEFAULT_CHROME_PATH;
}

export function getXSessionStatePath(rootDir) {
  return path.join(rootDir, '.openchrome', 'x-news-storage-state.json');
}

export function getTrackedXAccounts() {
  const configured = (process.env.BITFLOW_X_TRACKED_ACCOUNTS || '')
    .split(',')
    .map((value) => value.trim().replace(/^@/, ''))
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_X_ACCOUNTS, ...configured]));
}

export function stripHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, 'i'));
  return match ? stripHtml(match[1]) : '';
}

export function extractSource(block, fallbackName) {
  const match = block.match(/<source(?:\s+url="([^"]+)")?>([\s\S]*?)<\/source>/i);
  if (!match) {
    return { sourceName: fallbackName, sourceUrl: null };
  }

  return {
    sourceName: stripHtml(match[2]) || fallbackName,
    sourceUrl: match[1] ?? null,
  };
}

export function normalizeTitle(value) {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d'"]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, ' ')
    .trim();
}

export function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function inferTopicFromText(text) {
  const normalized = text.toLowerCase();
  if (/etf|blackrock|fidelity|sec/.test(normalized)) return 'ETF/정책';
  if (/strategy|microstrategy|treasury|reserve|saylor/.test(normalized)) return '기업 매수';
  if (/hack|exploit|security|stolen|exchange/.test(normalized)) return '보안/거래소';
  if (/miner|mining|hashrate|difficulty/.test(normalized)) return '마이닝';
  if (/fed|cpi|inflation|jobs|employment|macro/.test(normalized)) return '거시';
  return '시장 일반';
}

export function isRelevantXPost(body, accountHandle) {
  if (!body || body.trim().length < 20) {
    return false;
  }

  const normalized = body.toLowerCase();
  if (accountHandle.toLowerCase() === 'btcpicture') {
    return true;
  }

  return /bitcoin|btc|crypto|비트코인|암호화폐|라이트닝|lightning|wallet|hardware wallet|stablecoin|sats|satoshi|etf|sec|genius act/.test(
    normalized
  );
}

export function scoreNewsCandidate(candidate, sinceTimeMs) {
  const publishedAt = candidate.publishedAt ? new Date(candidate.publishedAt) : null;
  const text = `${candidate.title} ${candidate.body ?? candidate.description ?? ''}`.toLowerCase();
  let score = 0;

  if (publishedAt && Number.isFinite(publishedAt.getTime())) {
    const ageHours = Math.max(0, Math.floor((Date.now() - publishedAt.getTime()) / (60 * 60 * 1000)));
    score += Math.max(0, 12 - Math.floor(ageHours / 12));
    if (publishedAt.getTime() < sinceTimeMs) {
      score -= 4;
    }
  }

  if (/bitcoin|btc/.test(text)) score += 6;
  if (/etf|sec|blackrock|fidelity/.test(text)) score += 5;
  if (/strategy|microstrategy|treasury|reserve|saylor/.test(text)) score += 5;
  if (/hack|exploit|security|exchange/.test(text)) score += 4;
  if (/miner|mining|hashrate|difficulty/.test(text)) score += 3;
  if (/fed|cpi|inflation|jobs/.test(text)) score += 2;
  if (candidate.feedName === 'SEC Press Releases') score += 3;
  if (candidate.sourceType === 'x') score += 1;

  return score;
}

export function parseRssFeed(xml, feedName) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return items.map((block, index) => {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');
    const source = extractSource(block, feedName);

    return {
      id: `${feedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
      sourceType: 'rss',
      feedName,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      authorHandle: null,
      title,
      body: description,
      description,
      url: normalizeUrl(link),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
      topicHint: inferTopicFromText(`${title} ${description}`),
      rawPayload: {
        itemXml: block,
      },
    };
  });
}

export async function fetchRssCandidates({
  sinceIso,
  limit = 40,
}) {
  const sinceTimeMs = new Date(sinceIso).getTime();
  const seen = new Set();
  const candidates = [];

  for (const feed of NEWS_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (!response.ok) {
        continue;
      }

      const xml = await response.text();
      const items = parseRssFeed(xml, feed.name);

      for (const item of items) {
        if (!item.title || !item.url) {
          continue;
        }

        if (item.publishedAt) {
          const publishedAt = new Date(item.publishedAt);
          if (!Number.isFinite(publishedAt.getTime()) || publishedAt.getTime() < sinceTimeMs) {
            continue;
          }
        }

        const dedupeKey = `${normalizeTitle(item.title)}::${normalizeUrl(item.url)}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);

        candidates.push({
          ...item,
          score: scoreNewsCandidate(item, sinceTimeMs),
        });
      }
    } catch {
      // Skip broken feeds and continue.
    }
  }

  return candidates
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.publishedAt ?? '').localeCompare(left.publishedAt ?? '');
    })
    .slice(0, limit);
}

export async function launchXBrowserContext({
  headless,
  storageStatePath,
}) {
  const browser = await chromium.launch({
    headless,
    executablePath: resolveChromePath(),
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    storageState: storageStatePath,
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 960 },
    locale: 'en-US',
    timezoneId: 'Asia/Seoul',
  });

  return { browser, context };
}

export async function hasXAuthCookies(context) {
  const cookies = await context.cookies('https://x.com');
  const names = new Set(cookies.map((cookie) => cookie.name));
  return names.has('auth_token') && names.has('ct0');
}

export async function fetchXCandidates({
  storageStatePath,
  accounts,
  sinceIso,
  limitPerAccount = 6,
}) {
  const sinceTimeMs = new Date(sinceIso).getTime();
  const { browser, context } = await launchXBrowserContext({
    headless: true,
    storageStatePath,
  });

  try {
    const homePage = await context.newPage();
    await homePage.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await homePage.waitForTimeout(2500);

    if (!(await hasXAuthCookies(context)) || homePage.url().includes('/i/flow/login')) {
      throw new Error('X session is missing or expired. Re-run bootstrap:x-session.');
    }

    const seen = new Set();
    const results = [];

    for (const account of accounts) {
      const page = await context.newPage();
      try {
        await page.goto(`https://x.com/${account}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2500);

        const tweets = await page.locator('article[data-testid="tweet"]').evaluateAll(
          (nodes, config) =>
            nodes.slice(0, config.perAccountLimit * 2).map((node) => {
              const statusLink = node.querySelector('a[href*="/status/"]');
              const timeNode = node.querySelector('time');
              const textNode = node.querySelector('[data-testid="tweetText"]');
              const userLink = Array.from(node.querySelectorAll('a[href^="/"]'))
                .map((anchor) => anchor.getAttribute('href'))
                .find((href) => href && /^\/[^/]+$/.test(href));
              const url = statusLink ? statusLink.href : null;
              const match = url ? url.match(/status\/(\d+)/) : null;

              return {
                externalId: match ? match[1] : null,
                accountHandle: config.accountHandle,
                authorHandle: userLink ? userLink.replace(/^\//, '') : null,
                url,
                publishedAt: timeNode ? timeNode.dateTime : null,
                body: textNode ? textNode.innerText.trim() : '',
              };
            }),
          {
            accountHandle: account,
            perAccountLimit: limitPerAccount,
          }
        );

        for (const tweet of tweets) {
          if (!tweet.externalId || !tweet.url || !tweet.body) {
            continue;
          }

          if (seen.has(tweet.externalId)) {
            continue;
          }

          const publishedTime = tweet.publishedAt ? new Date(tweet.publishedAt).getTime() : NaN;
          if (Number.isFinite(publishedTime) && publishedTime < sinceTimeMs) {
            continue;
          }

          if (tweet.authorHandle && tweet.authorHandle.toLowerCase() !== account.toLowerCase()) {
            continue;
          }

          if (!isRelevantXPost(tweet.body, account)) {
            continue;
          }

          seen.add(tweet.externalId);
          const title = tweet.body.length > 140 ? `${tweet.body.slice(0, 137)}...` : tweet.body;
          const candidate = {
            id: `x-${tweet.externalId}`,
            sourceType: 'x',
            feedName: 'X',
            sourceName: 'X',
            sourceUrl: `https://x.com/${account}`,
            authorHandle: account,
            title,
            body: tweet.body,
            description: tweet.body,
            url: tweet.url,
            publishedAt: tweet.publishedAt,
            topicHint: inferTopicFromText(tweet.body),
            rawPayload: tweet,
          };

          results.push({
            ...candidate,
            score: scoreNewsCandidate(candidate, sinceTimeMs),
          });
        }
      } finally {
        await page.close();
      }
    }

    await context.storageState({ path: storageStatePath });

    return results
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return (right.publishedAt ?? '').localeCompare(left.publishedAt ?? '');
      })
      .slice(0, accounts.length * limitPerAccount);
  } finally {
    await browser.close();
  }
}
