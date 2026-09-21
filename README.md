# Fritzbox Callmonitor mit Telegram-Benachrichtigung

Dieses Projekt überwacht eingehende Anrufe auf deiner Fritzbox und sendet eine Benachrichtigung per Telegram.

## Features
- Überwachung der Fritzbox über den Callmonitor-Port (1012)
- Telegram-Benachrichtigung bei jedem eingehenden Anruf
- Läuft als Node.js-Daemon im Docker-Container
- Fertiges Image für `linux/arm64` (Raspberry Pi) aus der GitHub Container Registry
- Konfiguration über `.env` oder direkt im Compose-File

## Voraussetzungen
- Fritzbox mit aktiviertem Callmonitor
- Telegram-Bot und Chat-ID
- Docker und Docker Compose

## Einrichtung

### 1. Telegram-Bot erstellen
- Schreibe an [@BotFather](https://t.me/BotFather) auf Telegram.
- Erstelle einen neuen Bot und notiere den Bot-Token.
- Sende deinem Bot eine Nachricht und rufe dann
  `https://api.telegram.org/bot<DEIN_BOT_TOKEN>/getUpdates` auf, um die Chat-ID zu finden.

### 2. Callmonitor auf der Fritzbox aktivieren
- Telefon an die Fritzbox anschließen.
- Wähle: `#96*5*` (und auflegen).
- Zum Deaktivieren: `#96*4*`

### 3. Konfiguration
Lege eine `.env`-Datei an (oder nutze das `environment`-Feld im Compose-File):

```
FRITZBOX_IP=192.168.0.1
TELEGRAM_BOT_TOKEN=DEIN_BOT_TOKEN_HIER
TELEGRAM_CHAT_ID=DEINE_CHAT_ID_HIER
```

### 4. Start mit Docker

Bei jedem Push auf `main` baut GitHub Actions das Image und veröffentlicht es
unter `ghcr.io/california444/fritzbox-callmonitor`. Verfügbare Tags:

| Tag | Bedeutung |
| --- | --- |
| `latest` | aktueller Stand von `main` |
| `sha-<commit>` | genau dieser Commit – für Rollbacks |
| `<JJJJMMTT>` | Stand des jeweiligen Build-Tages |

Mit Docker Compose:

docker-compose.yml:
```yaml
services:
  fritzbox-callmonitor:
    image: ghcr.io/california444/fritzbox-callmonitor:latest
    container_name: fritzbox-callmonitor
    # Alternativ zu den Variablen kann hier ein .env gesetzt werden:
    # env_file:
      # - .env
    environment:
      FRITZBOX_IP: "192.168.0.1"
      # $ must be escaped with double dollar $$
      TELEGRAM_BOT_TOKEN: "DEIN_BOT_TOKEN_HIER"
      TELEGRAM_CHAT_ID: "DEINE_CHAT_ID_HIER"
    restart: always
    tty: true
    stdin_open: true
```

Starte den Service mit:

```bash
docker compose up -d
```

Auf eine neue Version aktualisieren:

```bash
docker compose pull && docker compose up -d
```

Logs anzeigen:

```bash
docker compose logs -f
```

Service stoppen:

```bash
docker compose down
```

### 5. Selbst bauen (optional)

```bash
docker build -t fritzbox-callmonitor .
```

Der Build nimmt den Quellcode aus dem Arbeitsverzeichnis, nicht aus dem
GitHub-Repo – das gebaute Image entspricht also dem ausgecheckten Stand.

## Hinweise
- Der Callmonitor muss auf der Fritzbox aktiviert sein.
- Die IP-Adresse der Fritzbox ggf. anpassen.
- Die Datei `.env` darf sensible Daten enthalten und ist durch `.gitignore`
  vom Repo und durch `.dockerignore` vom Image-Build ausgeschlossen.
- Neue Packages in der GitHub Container Registry sind zunächst privat. Für
  einen Pull ohne Anmeldung muss das Package in den Repo-Einstellungen auf
  "public" gestellt werden, sonst ist auf dem Host ein
  `docker login ghcr.io` mit einem PAT (Scope `read:packages`) nötig.

## Lizenz
MIT
