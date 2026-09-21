# Dockerfile für Fritzbox Callmonitor als Node.js-Daemon
FROM node:24-trixie-slim

ENV NODE_ENV=production

WORKDIR /app

# Erst nur die Manifeste kopieren, dann installieren: solange sich
# package-lock.json nicht ändert, trifft dieser Layer den Build-Cache,
# auch wenn am Quellcode geschraubt wurde.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Quellcode aus dem Build-Kontext statt per "git clone" zur Build-Zeit.
# Der Clone war über seine Kommandozeile cachebar und konnte deshalb
# stillschweigend einen alten Stand liefern; so entspricht das Image
# genau dem Commit, aus dem es gebaut wurde.
COPY fritzbox_callmonitor.js callmonitor_parser.js telegram_notifier.js ./

USER node

# Standard-Start: Node.js Daemon
CMD ["node", "fritzbox_callmonitor.js"]
