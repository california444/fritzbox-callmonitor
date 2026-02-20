# Fritzbox Callmonitor mit Telegram-Benachrichtigung

Dieses Projekt überwacht eingehende Anrufe auf deiner Fritzbox und sendet eine Benachrichtigung per Telegram.

## Features
- Überwachung der Fritzbox über den Callmonitor-Port (1012)
- Telegram-Benachrichtigung bei jedem eingehenden Anruf
- Läuft als Node.js-Daemon im Docker-Container
- Quellcode wird im Dockerfile direkt aus dem GitHub-Repo geladen
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

Der Container lädt den Quellcode automatisch aus dem GitHub-Repo:

```Dockerfile
FROM node:24-bookworm
WORKDIR /app
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/california444/fritzbox-callmonitor.git .
RUN npm install --omit=dev
CMD ["node", "fritzbox_callmonitor.js"]
```

Mit Docker Compose:

docker-compose.yml:
```yaml


version: '3.8'
services:
  fritzbox-callmonitor:
    image: california444/fritzbox-dslstatus:latest
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
docker-compose up -d
```

Logs anzeigen:

```bash
docker-compose logs -f
```

Service stoppen:

```bash
docker-compose down
```

## Hinweise
- Der Callmonitor muss auf der Fritzbox aktiviert sein.
- Die IP-Adresse der Fritzbox ggf. anpassen.
- Die Datei `.env` darf sensible Daten enthalten und ist durch `.gitignore` geschützt.

## Lizenz
MIT
