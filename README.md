# owstats

Marcador de partidas competitivas de Overwatch para dos jugadoras que juegan
juntas. Next.js (App Router) + TypeScript + Tailwind, Postgres en Neon,
desplegado en Vercel.

## Cómo funciona (importante)

Blizzard no tiene API oficial. Este proyecto usa [OverFast API](https://overfast-api.tekrop.fr),
una API comunitaria no oficial que solo expone **estadísticas acumuladas**
del perfil público de cada jugadora (partidas jugadas/ganadas totales), no el
historial partida por partida.

Por eso `owstats` funciona por **deltas**:

1. Cada 15 minutos, `/api/poll` consulta `games_played` / `games_won` de
   competitivo de ambas jugadoras y guarda un snapshot.
2. Compara cada snapshot con el anterior de esa misma jugadora.
3. Si **ambas** jugadoras muestran más partidas jugadas en la misma ventana de
   15 minutos, se asume que jugaron juntas y se registra esa ventana como
   partidas nuevas (usando el mínimo de los dos deltas, por seguridad).
4. Si solo una jugadora subió de partidas, no se registra nada — probablemente
   jugó sola.

Esto es una aproximación razonable, no un historial exacto: no hay forma de
saber el resultado partida por partida con esta API, solo el agregado de cada
ventana de 15 minutos.

## 1. Configurar Neon

1. Crea un proyecto en [Neon](https://neon.tech) (plan gratuito es suficiente).
2. Copia el **connection string** (usa el que dice "pooled connection").
3. Ejecuta el schema contra tu base, por ejemplo desde el SQL Editor de Neon o
   con `psql`:

   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```

   Esto crea las tablas `players`, `snapshots`, `matches` y `sync_log`. No
   hace falta insertar nada a mano: `/api/poll` crea/actualiza las filas de
   `players` a partir de `PLAYER_1` / `PLAYER_2` en cada ejecución.

## 2. Variables de entorno

Copia `.env.example` a `.env.local` (para desarrollo) y configura las mismas
en Vercel (Project Settings → Environment Variables):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de Neon |
| `CRON_SECRET` | Secreto compartido para autenticar `/api/poll`. Generar con `openssl rand -hex 32` |
| `PLAYER_1` | Battletag de la jugadora 1, formato `Nick-1234` (con `-` en vez de `#`) |
| `PLAYER_2` | Battletag de la jugadora 2, mismo formato |
| `PLAYER_1_LABEL` / `PLAYER_2_LABEL` | Opcional, nombre a mostrar en la UI |

## 3. ⚠️ Los perfiles deben ser públicos

OverFast solo puede leer estadísticas de perfiles públicos. Cada jugadora debe
entrar al juego y activar:

**Opciones → Social → Visibilidad del perfil → Público**

Si el perfil está en privado, `/api/poll` lo detecta, lo registra en
`sync_log` como `private` y sigue funcionando con la otra jugadora sin
romperse — pero esa jugadora no sumará partidas hasta que lo cambie.

## 4. Desplegar en Vercel

1. Importa el repo en Vercel.
2. Configura las variables de entorno del paso 2 en el proyecto de Vercel.
3. Despliega. Anota la URL de producción (`APP_URL`), la necesitas para el
   siguiente paso.

## 5. Configurar el cron de GitHub Actions

El workflow en `.github/workflows/poll.yml` llama a `/api/poll` cada 15
minutos. Configura estos secrets en GitHub (Settings → Secrets and variables
→ Actions):

| Secret | Valor |
|---|---|
| `APP_URL` | URL de producción en Vercel, sin `/` final (ej. `https://owstats.vercel.app`) |
| `CRON_SECRET` | El mismo valor que configuraste en Vercel |

También se puede lanzar a mano desde la pestaña **Actions → Poll OverFast
stats → Run workflow**, útil para probar sin esperar al cron.

## Desarrollo local

```bash
npm install
npm run dev
```

Para probar el poll en local necesitas `DATABASE_URL`, `CRON_SECRET`,
`PLAYER_1` y `PLAYER_2` en `.env.local`, luego:

```bash
curl -X POST http://localhost:3000/api/poll \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Ser buena vecina de OverFast

OverFast es un servicio comunitario gratuito y ya cachea esta respuesta 10
minutos en su lado. El cron de este proyecto consulta cada 15 minutos (nunca
más seguido), así que no hace falta caché adicional de nuestro lado para ser
respetuosos con el servicio.
