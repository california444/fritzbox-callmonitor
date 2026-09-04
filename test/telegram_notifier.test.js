import test from 'node:test';
import assert from 'node:assert/strict';
import { createTelegramNotifier, formatCallMessage } from '../telegram_notifier.js';

// Dummy-Token: mit polling:false erfolgt beim Anlegen kein Netzwerkzugriff.
const TOKEN = '123456:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

test('Notifier lässt sich mit der installierten Bibliothek anlegen', () => {
  // Fängt inkompatible node-telegram-bot-api-Versionen ab (fehlender
  // Default-Export bzw. fehlendes bot.sendMessage).
  const notifier = createTelegramNotifier({ token: TOKEN, chatId: '42' });
  assert.equal(typeof notifier.sendCallNotification, 'function');
});

test('Benachrichtigung enthält Datum und Rufnummer', () => {
  const msg = formatCallMessage({ date: '06.09.25 12:34:56', caller: '004930123456' });
  assert.match(msg, /Eingehender Anruf/);
  assert.match(msg, /Datum: 06\.09\.25 12:34:56/);
  assert.match(msg, /Rufnummer: 004930123456/);
});

test('unterdrückte Rufnummer wird als "unbekannt" ausgewiesen', () => {
  const msg = formatCallMessage({ date: '06.09.25 12:34:56', caller: '' });
  assert.match(msg, /Rufnummer: unbekannt/);
});
