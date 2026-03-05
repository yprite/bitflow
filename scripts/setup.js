#!/usr/bin/env node
/**
 * setup.js - Initial setup: create dirs, validate env, install launchd plists,
 *            check macOS security settings.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BITFLOW_HOME = process.env.BITFLOW_HOME || path.resolve(__dirname, '..');
const LAUNCH_AGENTS_DIR = path.join(process.env.HOME, 'Library', 'LaunchAgents');

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const OPTIONAL_ENV = [
  'WHALE_ALERT_API_KEY',
  'COINGECKO_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
];

function checkEnv() {
  const envPath = path.join(BITFLOW_HOME, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found. Copy .env.local.example and fill in values.');
    return false;
  }

  // Check file permissions
  const stats = fs.statSync(envPath);
  const mode = (stats.mode & 0o777).toString(8);
  if (mode !== '600') {
    console.warn(`⚠️  .env.local permissions are ${mode}, should be 600. Fixing...`);
    fs.chmodSync(envPath, 0o600);
    console.log('✅ Fixed .env.local permissions to 600');
  }

  // Load and check env vars
  require('dotenv').config({ path: envPath });

  let ok = true;
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      console.error(`❌ Missing required: ${key}`);
      ok = false;
    } else {
      console.log(`✅ ${key}`);
    }
  }

  for (const key of OPTIONAL_ENV) {
    if (!process.env[key]) {
      console.warn(`⚠️  Optional missing: ${key}`);
    } else {
      console.log(`✅ ${key}`);
    }
  }

  return ok;
}

function createDirs() {
  const dirs = [
    path.join(BITFLOW_HOME, 'logs'),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Directory: ${dir}`);
  }
}

function generatePlist(name, script, schedule) {
  const nodePath = execSync('which node', { encoding: 'utf-8' }).trim();

  let calendarEntries = '';
  for (const entry of schedule) {
    calendarEntries += `      <dict>\n`;
    if (entry.weekday !== undefined) {
      calendarEntries += `        <key>Weekday</key>\n        <integer>${entry.weekday}</integer>\n`;
    }
    if (entry.hour !== undefined) {
      calendarEntries += `        <key>Hour</key>\n        <integer>${entry.hour}</integer>\n`;
    }
    if (entry.minute !== undefined) {
      calendarEntries += `        <key>Minute</key>\n        <integer>${entry.minute}</integer>\n`;
    }
    calendarEntries += `      </dict>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${name}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${path.join(BITFLOW_HOME, 'scripts', script)}</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
${calendarEntries}  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>BITFLOW_HOME</key>
    <string>${BITFLOW_HOME}</string>
    <key>TZ</key>
    <string>Asia/Seoul</string>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${BITFLOW_HOME}</string>
  <key>StandardOutPath</key>
  <string>${path.join(BITFLOW_HOME, 'logs', `${script.replace('.js', '')}.log`)}</string>
  <key>StandardErrorPath</key>
  <string>${path.join(BITFLOW_HOME, 'logs', `${script.replace('.js', '')}.error.log`)}</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>`;
}

function installPlists() {
  fs.mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });

  const jobs = [
    {
      name: 'kr.bitflow.collect-data',
      script: 'collect-data.js',
      // Every hour at :05
      schedule: Array.from({ length: 24 }, (_, h) => ({ hour: h, minute: 5 })),
    },
    {
      name: 'kr.bitflow.post-tweet',
      script: 'post-tweet.js',
      schedule: [
        { hour: 8, minute: 0 },   // 08:00 KST
        { hour: 20, minute: 0 },  // 20:00 KST
      ],
    },
    {
      name: 'kr.bitflow.whale-detect',
      script: 'whale-detect.js',
      schedule: [
        { hour: 8, minute: 10 },   // 08:10 KST
        { hour: 14, minute: 10 },  // 14:10 KST
        { hour: 20, minute: 10 },  // 20:10 KST
      ],
    },
    {
      name: 'kr.bitflow.weekly-report',
      script: 'weekly-report.js',
      schedule: [
        { weekday: 0, hour: 10, minute: 0 },  // Sunday 10:00 KST
      ],
    },
  ];

  for (const job of jobs) {
    const plistPath = path.join(LAUNCH_AGENTS_DIR, `${job.name}.plist`);
    const content = generatePlist(job.name, job.script, job.schedule);
    fs.writeFileSync(plistPath, content);
    console.log(`✅ Plist: ${plistPath}`);

    // Load the plist
    try {
      execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`);
      execSync(`launchctl load "${plistPath}"`);
      console.log(`   ↳ Loaded ${job.name}`);
    } catch (err) {
      console.warn(`   ⚠️  Failed to load ${job.name}: ${err.message}`);
    }
  }
}

function checkMacSecurity() {
  console.log('\n=== macOS Security Checks ===');

  // FileVault
  try {
    const fv = execSync('fdesetup status', { encoding: 'utf-8' }).trim();
    if (fv.includes('On')) {
      console.log('✅ FileVault: 활성화됨');
    } else {
      console.warn('⚠️  FileVault: 비활성화. 시스템 설정에서 활성화를 권장합니다.');
    }
  } catch {
    console.warn('⚠️  FileVault 상태 확인 불가');
  }

  // Screen lock
  console.log('ℹ️  잠금 화면 비밀번호: 시스템 설정 → 잠금 화면에서 확인하세요.');
  console.log('ℹ️  자동 로그인: 시스템 설정 → 사용자 및 그룹에서 설정하세요.');
}

async function main() {
  console.log('=== Bitflow Setup ===\n');
  console.log(`BITFLOW_HOME: ${BITFLOW_HOME}\n`);

  // 1. Create directories
  console.log('--- Directories ---');
  createDirs();

  // 2. Validate env
  console.log('\n--- Environment ---');
  const envOk = checkEnv();
  if (!envOk) {
    console.error('\n❌ Fix missing environment variables before continuing.');
    process.exit(1);
  }

  // 3. Install launchd plists
  console.log('\n--- LaunchAgents ---');
  installPlists();

  // 4. macOS security
  checkMacSecurity();

  console.log('\n=== Setup Complete ===');
  console.log('다음 단계:');
  console.log('  1. Supabase에서 SQL 마이그레이션 실행 (supabase/migrations/001_initial_schema.sql)');
  console.log('  2. npm run collect -- 첫 데이터 수집 테스트');
  console.log('  3. npm run dev -- 대시보드 확인');
  console.log('  4. Vercel에 배포');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
