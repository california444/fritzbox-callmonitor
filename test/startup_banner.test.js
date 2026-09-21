import test from 'node:test';
import assert from 'node:assert/strict';

import { formatStartupBanner } from '../fritzbox_callmonitor.js';

const basis = {
  version: '1.0.1',
  nodeVersion: 'v24.13.1',
  platform: 'linux/arm64',
  baseImage: '',
  revision: '',
  host: '192.168.0.1',
  port: 1012,
  reconnectDelayMs: 5000,
  telegramAktiv: true
};

test('Banner nennt Version, Laufzeit und Verbindungsziel', () => {
  const [kopf, laufzeit, fritzbox] = formatStartupBanner(basis);

  assert.match(kopf, /Callmonitor Daemon 1\.0\.1 gestartet/);
  assert.match(laufzeit, /Node v24\.13\.1, linux\/arm64/);
  assert.match(fritzbox, /192\.168\.0\.1:1012, Reconnect nach 5 s/);
});

test('Image und Commit erscheinen nur, wenn der Build sie gesetzt hat', () => {
  const ohne = formatStartupBanner(basis)[1];
  assert.doesNotMatch(ohne, /Image|Commit/);

  const mit = formatStartupBanner({
    ...basis,
    baseImage: 'node:24-trixie-slim',
    revision: '4f3c2b1a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b'
  })[1];
  assert.match(mit, /Image node:24-trixie-slim/);
  assert.match(mit, /Commit 4f3c2b1/);
  // nur die Kurzform, nicht der volle SHA
  assert.doesNotMatch(mit, /4f3c2b1a9e8d/);
});

test('Telegram-Zustand wird benannt', () => {
  assert.match(formatStartupBanner(basis).join('\n'), /Telegram: aktiv/);
  assert.match(
    formatStartupBanner({ ...basis, telegramAktiv: false }).join('\n'),
    /Telegram: nicht konfiguriert/
  );
});

test('Import startet den Daemon nicht', () => {
  // Der Banner ist nur testbar, weil das Modul beim Import nichts tut.
  // Wuerde startMonitor mitlaufen, haetten die Tests eine offene
  // TCP-Verbindung und wuerden nicht mehr beenden.
  assert.equal(typeof formatStartupBanner, 'function');
});
