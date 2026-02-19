
// Fritzbox Callmonitor TCP Client (Port 1012)
//
// Aktivierung des Callmonitors auf der Fritzbox:
// 1. Telefon (Festnetztelefon oder DECT) an die Fritzbox anschließen.
// 2. Folgende Sequenz wählen: #96*5* (und mit Auflegen bestätigen)
//    → Der Callmonitor ist jetzt auf Port 1012 aktiv.
// 3. Zum Deaktivieren: #96*4*
//
// Usage: node fritzbox_callmonitor.js


require('dotenv').config();
const net = require('net');
const TelegramBot = require('node-telegram-bot-api');

// Konfiguration aus Umgebungsvariablen (siehe .env)
const FRITZBOX_IP = process.env.FRITZBOX_IP || '192.168.0.1';
const FRITZBOX_PORT = 1012;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const RECONNECT_DELAY_MS = 5000;

const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  console.log(`[${ts}] ${msg}`);
}

function startMonitor() {
  log('='.repeat(60));
  log('FRITZ!Box Callmonitor (Port 1012)');
  log('='.repeat(60));
  log(`Connecting to ${FRITZBOX_IP}:${FRITZBOX_PORT} ...`);

  let client = net.createConnection({ host: FRITZBOX_IP, port: FRITZBOX_PORT }, () => {
    log('Connected to server!');
  });

  client.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(';');
      if (parts.length >= 6 && parts[1] === 'RING') {
        const [date, type, , caller, called, connection] = parts;
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
        log(`Received: ${line}`);
      }
    }
  });

  client.on('end', () => {
    log('Disconnected from server.');
    reconnect();
  });

  client.on('error', (err) => {
    log('Connection error: ' + err.message);
    try { client.destroy(); } catch {}
    reconnect();
  });

  function reconnect() {
    log(`Reconnecting in ${RECONNECT_DELAY_MS / 1000} seconds...`);
    setTimeout(startMonitor, RECONNECT_DELAY_MS);
  }
}

// Start as daemon
startMonitor();
