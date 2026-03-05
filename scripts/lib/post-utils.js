/**
 * Shared utility functions for tweet generation/posting scripts.
 */

function toKstDateString(date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function toDateFromSourceTimestamp(sourceTimestamp) {
  if (typeof sourceTimestamp === 'number') {
    return new Date(sourceTimestamp * 1000);
  }
  if (typeof sourceTimestamp === 'string' && sourceTimestamp.trim() !== '') {
    const asNumber = Number(sourceTimestamp);
    if (Number.isFinite(asNumber)) return new Date(asNumber * 1000);
    const asDate = new Date(sourceTimestamp);
    if (!Number.isNaN(asDate.getTime())) return asDate;
  }
  return null;
}

function getMetricTimestamp(metricRow) {
  if (!metricRow) return null;
  const metadata = metricRow.metadata || {};
  const sourceDate = metadata.source_date;
  if (typeof sourceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
    return `${sourceDate}T00:00:00.000Z`;
  }

  const fromSourceTs = toDateFromSourceTimestamp(metadata.source_timestamp);
  if (fromSourceTs) return fromSourceTs.toISOString();

  return metricRow.collected_at || null;
}

function getDailyDate(metricRow) {
  if (!metricRow) return null;
  const metadata = metricRow.metadata || {};
  const sourceDate = metadata.source_date;
  if (typeof sourceDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
    return sourceDate;
  }

  const timestamp = getMetricTimestamp(metricRow);
  if (!timestamp) return null;
  return toKstDateString(new Date(timestamp));
}

function evaluateStale(metricRows, now = new Date()) {
  const hourly = ['exchange_netflow', 'mempool_fees'];
  const daily = ['fear_greed', 'utxo_age_1y'];

  const hourlyStale = [];
  for (const key of hourly) {
    const row = metricRows[key];
    if (!row) {
      hourlyStale.push(`${key}:missing`);
      continue;
    }
    const ts = getMetricTimestamp(row);
    if (!ts) {
      hourlyStale.push(`${key}:missing_timestamp`);
      continue;
    }
    const ageHours = (now.getTime() - new Date(ts).getTime()) / (60 * 60 * 1000);
    if (ageHours > 3) {
      hourlyStale.push(`${key}:${ageHours.toFixed(1)}h`);
    }
  }

  const today = toKstDateString(now);
  const yesterday = toKstDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const dailyStale = [];
  for (const key of daily) {
    const row = metricRows[key];
    if (!row) {
      dailyStale.push(`${key}:missing`);
      continue;
    }
    const date = getDailyDate(row);
    if (!date) {
      dailyStale.push(`${key}:missing_date`);
      continue;
    }
    if (date !== today && date !== yesterday) {
      dailyStale.push(`${key}:${date}`);
    }
  }

  const shouldSkip = hourlyStale.length > 0 || dailyStale.length === daily.length;
  return {
    shouldSkip,
    hourlyStale,
    dailyStale,
    reason: shouldSkip
      ? `hourly=[${hourlyStale.join(', ')}], daily=[${dailyStale.join(', ')}]`
      : 'fresh',
  };
}

function truncateTweet(text, max = 280) {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function buildTweetText(summaryResult) {
  const lines = [];
  lines.push(`${summaryResult.emoji} ${summaryResult.label}`);
  lines.push('');
  if (summaryResult.summary) lines.push(summaryResult.summary);
  lines.push('');
  if (summaryResult.netflow !== null && summaryResult.netflow !== undefined) {
    const netflow = Number(summaryResult.netflow);
    const sign = netflow > 0 ? '+' : '';
    lines.push(`거래소 넷플로우: ${sign}${Math.round(netflow).toLocaleString()} BTC`);
  }
  if (summaryResult.mempoolFee !== null && summaryResult.mempoolFee !== undefined) {
    lines.push(`멤풀 수수료: ${Math.round(Number(summaryResult.mempoolFee)).toLocaleString()} sat/vB`);
  }
  if (summaryResult.fearGreed !== null && summaryResult.fearGreed !== undefined) {
    lines.push(`공포/탐욕: ${Math.round(Number(summaryResult.fearGreed))}`);
  }
  lines.push('');
  lines.push('#Bitcoin #비트코인 #온체인데이터');

  return truncateTweet(lines.join('\n'), 280);
}

module.exports = {
  evaluateStale,
  buildTweetText,
  getMetricTimestamp,
  getDailyDate,
  toKstDateString,
};
