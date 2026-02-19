# Dockerfile für Fritzbox Callmonitor als systemd-Daemon
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# System-Updates und benötigte Pakete
RUN apt-get update && \
    apt-get install -y systemd nodejs npm curl && \
    npm install -g npm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis
WORKDIR /opt/fritzbox-callmonitor

# Projektdateien kopieren
COPY fritzbox_callmonitor.js ./
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install --production || :

# Systemd Service-Unit
COPY fritzbox-callmonitor.service /etc/systemd/system/fritzbox-callmonitor.service

# Service aktivieren
RUN systemctl enable fritzbox-callmonitor.service

# systemd als Init-Prozess
STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init"]
