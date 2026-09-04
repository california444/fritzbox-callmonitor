
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
import TelegramBot from 'node-telegram-bot-api';
import { parseCallmonitorData } from './callmonitor_parser.js';

// Konfiguration aus Umgebungsvariablen (siehe .env)
const FRITZBOX_IP = process.env.FRITZBOX_IP || '192.168.0.1';
const FRITZBOX_PORT = 1012;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RECONNECT_DELAY_MS = 5000;

const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  console.log(`[${ts}] ${msg}`);
}


let client = null;
let shuttingDown = false;

function startMonitor() {
  log('='.repeat(60));
  log('FRITZ!Box Callmonitor (Port 1012)');
  log('='.repeat(60));
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
        const msg = `📞 Eingehender Anruf\nDatum: ${date}\nRufnummer: ${caller}`;
        telegramBot.sendMessage(TELEGRAM_CHAT_ID, msg).catch(e => log('Telegram-Fehler: ' + e.message));
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

// Start as daemon
startMonitor();
