// normalize-csv.js
// Normalizes CryptoDataDownload and other public CSV formats to ts,price,volume for eth-backtest.js
// Usage: node normalize-csv.js input.csv output.csv
import fs from 'fs';
import path from 'path';

function parseCryptoDataDownload(line) {
  // Example: Date,Symbol,Open,High,Low,Close,Volume,Market Cap
  // 2023-09-10 00:00:00,ETHUSD,1620.12,1625.00,1618.90,1622.45,1200,123456789
  const parts = line.split(',');
  if (parts.length < 7) return null;
  const dateStr = parts[0];
  const close = parseFloat(parts[5]);
  const volume = parseFloat(parts[6]);
  const ts = Date.parse(dateStr);
  if (isNaN(ts) || isNaN(close) || isNaN(volume)) return null;
  return `${ts},${close},${volume}`;
}

function normalize(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath, 'utf8').split('\n');
  const output = ['ts,price,volume'];
  for (const line of input) {
    if (line.startsWith('Date') || line.trim() === '') continue;
    const norm = parseCryptoDataDownload(line);
    if (norm) output.push(norm);
  }
  fs.writeFileSync(outputPath, output.join('\n'));
  console.log(`Normalized CSV written to ${outputPath}`);
}

if (process.argv.length < 4) {
  console.log('Usage: node normalize-csv.js input.csv output.csv');
  process.exit(1);
}
normalize(process.argv[2], process.argv[3]);
