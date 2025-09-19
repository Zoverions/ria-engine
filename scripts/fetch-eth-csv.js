// Fetch hourly ETHUSDT klines from Binance and write CSV: ts,price,volume
// Env: SYMBOL=ETHUSDT INTERVAL=1h DAYS=365 OUTPUT=./ria-engine-v2/data/eth_hourly.csv

const SYMBOL = process.env.SYMBOL || 'ETHUSDT';
const INTERVAL = process.env.INTERVAL || '1h';
const DAYS = Number(process.env.DAYS || 365);
const OUTPUT = process.env.OUTPUT || './ria-engine-v2/data/eth_hourly.csv';

const BINANCE = 'https://api.binance.com/api/v3/klines';
const LIMIT = 1000; // max per request

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchChunk(symbol, interval, startTime, endTime) {
  const url = `${BINANCE}?symbol=${symbol}&interval=${interval}&limit=${LIMIT}&startTime=${startTime}&endTime=${endTime}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    await sleep(500 * (attempt + 1));
  }
  throw new Error('Failed to fetch klines from Binance');
}

function intervalMs(interval) {
  const m = interval.match(/(\d+)([mhdw])/);
  const n = Number(m[1]);
  const u = m[2];
  const map = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return n * map[u];
}

async function main() {
  const now = Date.now();
  const start = now - DAYS * 24 * 3_600_000;
  const step = LIMIT * intervalMs(INTERVAL);

  console.log(`⛓️  Downloading ${SYMBOL} ${INTERVAL} for ~${DAYS} days from Binance...`);

  const rows = [];
  let cursor = start;
  while (cursor < now) {
    const chunkEnd = Math.min(cursor + step - 1, now);
    const data = await fetchChunk(SYMBOL, INTERVAL, cursor, chunkEnd);
    if (!Array.isArray(data) || data.length === 0) {
      cursor = chunkEnd + 1;
      continue;
    }
    for (const k of data) {
      const openTime = Number(k[0]);
      const close = Number(k[4]);
      const volume = Number(k[5]); // base asset volume
      rows.push({ ts: openTime, price: close, volume });
    }
    cursor = Number(data[data.length - 1][0]) + intervalMs(INTERVAL);
    process.stdout.write(`\r  Fetched: ${rows.length} candles`);
    await sleep(100); // be polite
  }

  // Deduplicate and sort
  const map = new Map();
  for (const r of rows) map.set(r.ts, r);
  const dedup = Array.from(map.values()).sort((a, b) => a.ts - b.ts);

  // Write CSV
  const fs = await import('node:fs/promises');
  await fs.mkdir(new URL(OUTPUT, `file://${process.cwd()}/`).pathname.replace(/\/[^/]+$/, ''), { recursive: true }).catch(()=>{});
  const lines = ['ts,price,volume', ...dedup.map(r => `${r.ts},${r.price},${r.volume}`)];
  await fs.writeFile(OUTPUT, lines.join('\n'));

  console.log(`\n✅ Saved ${dedup.length} rows to ${OUTPUT}`);
}

main().catch(e => {
  console.error('Downloader error:', e.message);
  console.error('Fallback: download a ready CSV e.g. from https://www.cryptodatadownload.com (Binance ETHUSDT hourly),');
  console.error('then normalize to ts,price,volume and run:');
  console.error('  CSV=./ria-engine-v2/data/eth_hourly.csv node ria-engine-v2/demos/eth-backtest.js');
  process.exit(1);
});
