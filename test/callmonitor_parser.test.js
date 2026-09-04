import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCallmonitorLine, parseCallmonitorData } from '../callmonitor_parser.js';

test('RING-Zeile wird in ein Anruf-Event zerlegt', () => {
  const line = '06.09.25 12:34:56;RING;0;004930123456;123456;SIP0;';
  assert.deepEqual(parseCallmonitorLine(line), {
    kind: 'ring',
    date: '06.09.25 12:34:56',
    caller: '004930123456',
    called: '123456',
    connection: 'SIP0',
  });
});

test('unterdrückte Rufnummer liefert leeren caller', () => {
  const event = parseCallmonitorLine('06.09.25 12:34:56;RING;0;;123456;SIP0;');
  assert.equal(event.kind, 'ring');
  assert.equal(event.caller, '');
});

test('andere Ereignistypen bleiben unverändert als "other"', () => {
  for (const line of [
    '06.09.25 12:34:56;CALL;1;10;123456;004930999999;SIP0;',
    '06.09.25 12:35:01;CONNECT;1;10;004930999999;',
    '06.09.25 12:36:20;DISCONNECT;1;79;',
  ]) {
    assert.deepEqual(parseCallmonitorLine(line), { kind: 'other', line });
  }
});

test('zu kurze RING-Zeile gilt nicht als Anruf', () => {
  const line = '06.09.25 12:34:56;RING;0;004930123456;';
  assert.deepEqual(parseCallmonitorLine(line), { kind: 'other', line });
});

test('leere und rein leere Zeilen ergeben null', () => {
  assert.equal(parseCallmonitorLine(''), null);
  assert.equal(parseCallmonitorLine('   '), null);
  assert.equal(parseCallmonitorLine(undefined), null);
});

test('Datenblock mit mehreren Zeilen und CRLF wird komplett geparst', () => {
  const chunk =
    '06.09.25 12:34:56;RING;0;004930123456;123456;SIP0;\r\n' +
    '06.09.25 12:35:01;CONNECT;0;10;004930123456;\r\n' +
    '\r\n';

  const events = parseCallmonitorData(chunk);
  assert.equal(events.length, 2);
  assert.equal(events[0].kind, 'ring');
  assert.equal(events[0].caller, '004930123456');
  assert.equal(events[1].kind, 'other');
});

test('Buffer-Eingabe wird akzeptiert', () => {
  const buf = Buffer.from('06.09.25 12:34:56;RING;0;004930123456;123456;SIP0;\n');
  const events = parseCallmonitorData(buf);
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, 'ring');
});
