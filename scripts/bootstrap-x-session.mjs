#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';
import {
  getTrackedXAccounts,
  getXSessionStatePath,
  hasXAuthCookies,
  loadEnvFile,
  resolveChromePath,
} from './lib/news-ingest-lib.mjs';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

async function main() {
  await loadEnvFile(path.join(ROOT_DIR, '.env.local'));
  await loadEnvFile(path.join(ROOT_DIR, 'python', '.env'));

  const storageStatePath = getXSessionStatePath(ROOT_DIR);
  await mkdir(path.dirname(storageStatePath), { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    executablePath: resolveChromePath(),
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'en-US',
    timezoneId: 'Asia/Seoul',
  });
  const page = await context.newPage();

  console.log('X session bootstrap started.');
  console.log(`Tracked accounts: ${getTrackedXAccounts().map((account) => `@${account}`).join(', ')}`);
  console.log('A Chrome window has been opened.');
  console.log('Complete the Google login flow on X, then wait. The script will capture the session automatically.');

  await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

  const deadline = Date.now() + SESSION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await page.waitForTimeout(3000);
    const authenticated = await hasXAuthCookies(context);
    const currentPage = context.pages().find((candidate) => !candidate.url().includes('/i/flow/login'));
    if (authenticated && currentPage) {
      await context.storageState({ path: storageStatePath });
      console.log(`Saved X session to ${storageStatePath}`);
      await browser.close();
      return;
    }
  }

  await browser.close();
  throw new Error('Timed out waiting for X login. Re-run the bootstrap and complete login within 15 minutes.');
}

main().catch((error) => {
  console.error('bootstrap-x-session failed:', error);
  process.exitCode = 1;
});
