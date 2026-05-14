# Tres en Raya Online

Juego de Tres en Raya multijugador en tiempo real con WebSockets.

## Características

- Sistema de salas/lobbies
- Emparejamiento de jugadores
- Sincronización del tablero en tiempo real via Socket.IO
- Indicador de turno
- Detección de victoria/empate con notificación a ambos jugadores
- Sistema de revancha
- Marcador de puntuación

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Socket.IO (servidor WebSocket embebido)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

El servidor Socket.IO corre en el puerto 3001 (configurable via `SOCKET_PORT`).
El servidor Next.js corre en el puerto 3000.

## Variables de entorno

```
SOCKET_PORT=3001  # Puerto del servidor WebSocket (default: 3001)
```
