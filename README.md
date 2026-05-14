# Tres en Raya

Juego clásico de Tic-Tac-Toe construido con Next.js 15, TypeScript y Tailwind CSS.

## Características

- Tablero 3x3 interactivo
- Turnos alternos entre jugador X y O
- Detección de ganador (filas, columnas, diagonales)
- Detección de empate
- Indicador del turno actual
- Mensaje de resultado animado
- Botón para reiniciar la partida
- Diseño responsive y atractivo
- Marcadores de victorias por jugador

## Instalación

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
pm2 start ecosystem.config.js
```

La aplicación se sirve en `/tres-en-raya`.
