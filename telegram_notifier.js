// Telegram-Benachrichtigung für eingehende Anrufe
//
// Eigenes Modul, damit die Anbindung an node-telegram-bot-api
// unabhängig vom laufenden Daemon geprüft werden kann.
//
// Der Daemon sendet ausschließlich - er empfängt keine Updates.
// Deshalb reicht der schlanke Api-Client, kein vollständiger Bot.

import { Api } from 'node-telegram-bot-api';

/**
 * Erzeugt einen Notifier für eingehende Anrufe.
 * Wirft, wenn die installierte node-telegram-bot-api-Version inkompatibel ist -
 * so scheitert der Daemon beim Start und nicht erst beim ersten Anruf.
 */
export function createTelegramNotifier({ token, chatId, log = () => {} }) {
  const api = new Api(token);

  if (typeof api.sendMessage !== 'function') {
    throw new TypeError(
      'node-telegram-bot-api: api.sendMessage fehlt - inkompatible Version?'
    );
  }

  /** Sendet Rohtext. Fehler werden geloggt, nicht geworfen -
   *  ein Telegram-Ausfall darf den Daemon nicht beenden. */
  function sendText(text) {
    return api
      .sendMessage({ chat_id: chatId, text })
      .catch((e) => log('Telegram-Fehler: ' + e.message));
  }

  return {
    sendText,
    sendCallNotification({ date, caller }) {
      return sendText(formatCallMessage({ date, caller }));
    },
  };
}

/** Text der Anruf-Benachrichtigung. Reine Funktion, ohne Netzwerkzugriff. */
export function formatCallMessage({ date, caller }) {
  const rufnummer = caller && caller.trim() ? caller : 'unbekannt';
  return `📞 Eingehender Anruf\nDatum: ${date}\nRufnummer: ${rufnummer}`;
}
