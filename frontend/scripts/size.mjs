/* global console, process */
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const BUDGET_KB = 300;
const files = readdirSync('dist/assets').filter((n) => /^index-.*\.js$/.test(n));
const kb = files.reduce((t, n) => t + gzipSync(readFileSync('dist/assets/' + n)).length, 0) / 1024;
console.log(`initial JS ${kb.toFixed(1)} KB gzip of ${BUDGET_KB} KB: ${kb <= BUDGET_KB ? 'ok' : 'OVER BUDGET'}`);
process.exit(kb <= BUDGET_KB ? 0 : 1);
