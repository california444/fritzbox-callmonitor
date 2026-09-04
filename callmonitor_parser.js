// Parsing der Callmonitor-Zeilen (Port 1012)
//
// Zeilenformat der FRITZ!Box, Felder durch ';' getrennt, z. B.:
//   06.09.25 12:34:56;RING;0;004930123456;123456;SIP0;
//
// Reines Modul ohne Seiteneffekte - dadurch testbar.

/**
 * Parst eine einzelne Callmonitor-Zeile.
 * @returns {{kind: 'ring', date, caller, called, connection} | {kind: 'other', line} | null}
 *          null, wenn die Zeile leer ist.
 */
export function parseCallmonitorLine(line) {
  if (!line || !line.trim()) return null;

  const parts = line.split(';');
  if (parts.length >= 6 && parts[1] === 'RING') {
    const [date, , , caller, called, connection] = parts;
    return { kind: 'ring', date, caller, called, connection };
  }

  return { kind: 'other', line };
}

/**
 * Parst einen kompletten TCP-Datenblock (kann mehrere Zeilen enthalten).
 * @returns {Array} Liste der Events, leere Zeilen werden verworfen.
 */
export function parseCallmonitorData(data) {
  return data
    .toString()
    .split(/\r?\n/)
    .map(parseCallmonitorLine)
    .filter((event) => event !== null);
}
