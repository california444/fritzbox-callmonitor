// Telegram-Benachrichtigung für eingehende Anrufe
//
// Eigenes Modul, damit die Anbindung an node-telegram-bot-api
// unabhängig vom laufenden Daemon geprüft werden kann.

import TelegramBot from 'node-telegram-bot-api';

/**
 * Erzeugt einen Notifier für eingehende Anrufe.
 * Wirft, wenn die installierte node-telegram-bot-api-Version inkompatibel ist -
 * so scheitert der Daemon beim Start und nicht erst beim ersten Anruf.
 */
export function createTelegramNotifier({ token, chatId, log = () => {} }) {
  const bot = new TelegramBot(token, { polling: false });

  if (typeof bot.sendMessage !== 'function') {
    throw new TypeError(
      'node-telegram-bot-api: bot.sendMessage fehlt - inkompatible Version?'
    );
  }

  return {
    sendCallNotification({ date, caller }) {
      return bot
        .sendMessage(chatId, formatCallMessage({ date, caller }))
        .catch((e) => log('Telegram-Fehler: ' + e.message));
    },
  };
}

/** Text der Anruf-Benachrichtigung. Reine Funktion, ohne Netzwerkzugriff. */
export function formatCallMessage({ date, caller }) {
  const rufnummer = caller && caller.trim() ? caller : 'unbekannt';
  return `📞 Eingehender Anruf\nDatum: ${date}\nRufnummer: ${rufnummer}`;
}
