
// Fritzbox Callmonitor TCP Client (Port 1012)
//
// Aktivierung des Callmonitors auf der Fritzbox:
// 1. Telefon (Festnetztelefon oder DECT) an die Fritzbox anschließen.
// 2. Folgende Sequenz wählen: #96*5* (und mit Auflegen bestätigen)
//    → Der Callmonitor ist jetzt auf Port 1012 aktiv.
// 3. Zum Deaktivieren: #96*4*
//

// Usage: node fritzbox_callmonitor.js

import 'dotenv/config';
import net from 'net';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { parseCallmonitorData } from './callmonitor_parser.js';
import { createTelegramNotifier } from './telegram_notifier.js';

// Konfiguration aus Umgebungsvariablen (siehe .env)
const FRITZBOX_IP = process.env.FRITZBOX_IP || '192.168.0.1';
const FRITZBOX_PORT = 1012;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RECONNECT_DELAY_MS = 5000;

// Herkunft des laufenden Stands. Basis-Image und Commit setzt der
// Docker-Build als ENV; ausserhalb des Containers bleiben sie leer.
const PKG_VERSION = readPackageVersion();
const BASE_IMAGE = process.env.APP_BASE_IMAGE || '';
const REVISION = process.env.APP_REVISION || '';

function readPackageVersion() {
  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
    return pkg.version || 'unbekannt';
  } catch {
    return 'unbekannt';
  }
}

// Ohne Token wirft der Api-Client beim Anlegen - deshalb nur erzeugen,
// wenn beides konfiguriert ist. Der Banner weist den Zustand aus.
const notifier = TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID
  ? createTelegramNotifier({
      token: TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID,
      log: (msg) => log(msg),
    })
  : null;

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  console.log(`[${ts}] ${msg}`);
}


let client = null;
let shuttingDown = false;

/**
 * Baut den Startbanner als Zeilenliste. Reine Funktion, damit sich das
 * Format testen laesst, ohne den Daemon zu starten.
 */
export function formatStartupBanner({
  version, nodeVersion, platform, baseImage, revision,
  host, port, reconnectDelayMs, telegramAktiv
}) {
  const zeilen = [`FRITZ!Box Callmonitor Daemon ${version} gestartet`];

  const laufzeit = [`Node ${nodeVersion}`, platform];
  if (baseImage) laufzeit.push(`Image ${baseImage}`);
  if (revision) laufzeit.push(`Commit ${revision.slice(0, 7)}`);
  zeilen.push(`  Laufzeit: ${laufzeit.join(', ')}`);

  zeilen.push(
    `  Fritzbox: ${host}:${port}, Reconnect nach ${Math.round(reconnectDelayMs / 1000)} s`
  );
  zeilen.push(`  Telegram: ${telegramAktiv ? 'aktiv' : 'nicht konfiguriert'}`);

  return zeilen;
}

/**
 * Loggt einmalig beim Start, welcher Stand laeuft und wohin er sich
 * verbindet. Bewusst ausserhalb von startMonitor: die Funktion laeuft bei
 * jedem Reconnect erneut, der Banner soll aber nur einmal erscheinen.
 */
function logStartupStatus() {
  for (const zeile of formatStartupBanner({
    version: PKG_VERSION,
    nodeVersion: process.version,
    platform: `${process.platform}/${process.arch}`,
    baseImage: BASE_IMAGE,
    revision: REVISION,
    host: FRITZBOX_IP,
    port: FRITZBOX_PORT,
    reconnectDelayMs: RECONNECT_DELAY_MS,
    telegramAktiv: Boolean(notifier),
  })) {
    log(zeile);
  }
}

function startMonitor() {
  log(`Connecting to ${FRITZBOX_IP}:${FRITZBOX_PORT} ...`);

  client = net.createConnection({ host: FRITZBOX_IP, port: FRITZBOX_PORT }, () => {
    log('Connected to server!');
    client.setKeepAlive(true, 30 * 1000); // Detect silently dropped connections (probe after 30s idle)
  });

  client.on('data', (data) => {
    for (const event of parseCallmonitorData(data)) {
      if (event.kind === 'ring') {
        const { date, caller, called, connection } = event;
        log('\n' + '-'.repeat(50));
        log(`📞 Incoming Call!`);
        log('-'.repeat(50));
        log(`Date:        ${date}`);
        log(`Caller:      ${caller}`);
        log(`Called:      ${called}`);
        log(`Connection:  ${connection}`);
        log('-'.repeat(50) + '\n');

        // Telegram-Benachrichtigung
        if (notifier) {
          notifier.sendCallNotification({ date, caller });
        } else {
          log('Telegram-Konfiguration fehlt, keine Nachricht gesendet.');
        }
      } else {
        log(`Received: ${event.line}`);
      }
    }
  });

  client.on('end', () => {
    log('Disconnected from server.');
    if (!shuttingDown) reconnect();
  });

  client.on('error', (err) => {
    log('Connection error: ' + err.message);
    try { client.destroy(); } catch {}
    if (!shuttingDown) reconnect();
  });

  function reconnect() {
    log(`Reconnecting in ${RECONNECT_DELAY_MS / 1000} seconds...`);
    setTimeout(startMonitor, RECONNECT_DELAY_MS);
  }
}

function shutdownHandler(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`Received ${signal}, shutting down...`);
  if (client) {
    try {
      client.end();
      client.destroy();
    } catch {}
  }
  setTimeout(() => {
    log('Shutdown complete.');
    process.exit(0);
  }, 500);
}

process.on('SIGINT', () => shutdownHandler('SIGINT'));
process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
process.on('SIGQUIT', () => shutdownHandler('SIGQUIT'));
process.on('uncaughtException', (err) => {
  log('Uncaught Exception: ' + err.message);
  shutdownHandler('uncaughtException');
});

// Nur starten, wenn direkt ausgefuehrt (beim Import aus Tests passiert nichts).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  logStartupStatus();
  startMonitor();
}
