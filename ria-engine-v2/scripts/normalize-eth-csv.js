// Normalizes ETH hourly CSVs from common sources into ts,price,volume
// Supported inputs:
// - CryptoDataDownload (Date,Symbol,Open,High,Low,Close,Volume,Market Cap)
// - Binance kline CSV (open time,open,high,low,close,volume,...)
// - CoinGecko export (timestamp, price, volume) variations
// Usage:
//   node ria-engine-v2/scripts/normalize-eth-csv.js input.csv output.csv
import fs from 'fs';

function tryNumber(x) { const n = Number(x); return Number.isFinite(n) ? n : NaN; }

function parseCDD(line) {
  // 2023-09-10 00:00:00,ETHUSD,1620.12,1625.00,1618.90,1622.45,1200,123456789
  const parts = line.split(',');
  if (parts.length < 7) return null;
  const ts = Date.parse(parts[0]);
  const price = tryNumber(parts[5]);
  const volume = tryNumber(parts[6]);
  if (!Number.isFinite(ts) || !Number.isFinite(price) || !Number.isFinite(volume)) return null;
  return { ts, price, volume };
}

function parseBinance(line) {
  // openTime,open,high,low,close,volume,closeTime,quoteVolume,trades,tbb,tbv,ignore
  const p = line.split(',');
  if (p.length < 6) return null;
  const ts = tryNumber(p[0]);
  const price = tryNumber(p[4]);
  const volume = tryNumber(p[5]);
  if (!Number.isFinite(ts) || !Number.isFinite(price) || !Number.isFinite(volume)) return null;
  return { ts, price, volume };
}

function parseCoinGecko(line, headers) {
  // Possible headers: timestamp,price,volume OR time,price,volume OR ts,price,volume
  const p = line.split(',');
  const idx = {
    ts: headers.findIndex(h => /^(timestamp|time|ts)$/i.test(h)),
    price: headers.findIndex(h => /^price$/i.test(h)),
    volume: headers.findIndex(h => /^volume$/i.test(h))
  };
  if (idx.ts < 0 || idx.price < 0 || idx.volume < 0) return null;
  const tsVal = p[idx.ts];
  const ts = /\d{10,13}/.test(tsVal) ? Number(tsVal) : Date.parse(tsVal);
  const price = tryNumber(p[idx.price]);
  const volume = tryNumber(p[idx.volume]);
  if (!Number.isFinite(ts) || !Number.isFinite(price) || !Number.isFinite(volume)) return null;
  return { ts, price, volume };
}

function detectFormat(headerLine) {
  const h = headerLine.trim();
  if (/^Date,Symbol,Open,High,Low,Close,Volume/i.test(h)) return 'CDD';
  if (/^(openTime|open_time|Open time),/i.test(h)) return 'BINANCE';
  if (/^(timestamp|time|ts),/i.test(h) && /,price,/i.test(h) && /,volume$/i.test(h)) return 'COINGECKO';
  // If header already ts,price,volume we can pass-through
  if (/^ts,price,volume$/i.test(h)) return 'ALREADY_NORMALIZED';
  return 'UNKNOWN';
}

function normalize(inputPath, outputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8').replace(/\r/g, '').split('\n');
  if (raw.length === 0) throw new Error('Empty input');
  const header = raw[0];
  const fmt = detectFormat(header);
  const out = [];

  if (fmt === 'ALREADY_NORMALIZED') {
    fs.writeFileSync(outputPath, raw.join('\n'));
    console.log(`No normalization needed. Copied to ${outputPath}`);
    return;
  }

  for (let i = 1; i < raw.length; i++) {
    const line = raw[i].trim();
    if (!line) continue;
    let rec = null;
    if (fmt === 'CDD') rec = parseCDD(line);
    else if (fmt === 'BINANCE') rec = parseBinance(line);
    else if (fmt === 'COINGECKO') rec = parseCoinGecko(line, header.split(','));
    else {
      // Heuristic: try each parser
      rec = parseCDD(line) || parseBinance(line) || parseCoinGecko(line, header.split(','));
    }
    if (rec) out.push(`${rec.ts},${rec.price},${rec.volume}`);
  }

  if (out.length === 0) {
    throw new Error(`No rows parsed. Unsupported schema? Detected=${fmt}`);
  }

  out.unshift('ts,price,volume');
  fs.writeFileSync(outputPath, out.join('\n'));
  console.log(`Normalized ${out.length - 1} rows to ${outputPath}`);
}

if (process.argv.length < 4) {
  console.log('Usage: node ria-engine-v2/scripts/normalize-eth-csv.js input.csv output.csv');
  process.exit(1);
}

normalize(process.argv[2], process.argv[3]);
