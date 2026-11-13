# 🚀 Guía de Despliegue: Security Arcade (Vercel + Supabase)

Esta guía explica en 3 pasos sencillos cómo conectar el repositorio de GitHub, configurar la base de datos en Supabase y desplegar en Vercel en producción.

---

## Paso 1: Subir el Proyecto a tu Repositorio de GitHub

El repositorio local Git ya ha sido inicializado y tiene el commit inicial listo en la rama `main`.

1. Crea un nuevo repositorio en [GitHub](https://github.com/new) (puede ser público o privado, sin README ni .gitignore iniciales).
2. Conecta y sube los cambios ejecutando en tu terminal:

```bash
# Reemplaza TU-USUARIO y TU-REPOSITORIO con tus datos de GitHub
git remote add origin https://github.com/MateoRomero08/NOMBRE-DEL-REPO.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Configurar Supabase (Base de Datos Real)

1. Ingresa a [database.new](https://database.new) (o a tu panel de Supabase) y crea un nuevo proyecto:
   - **Name:** `security-arcade-intouchcx`
   - **Database Password:** (Elige una contraseña segura y guárdala)
   - **Region:** Selecciona la más cercana a tu audiencia (ej. *East US / São Paulo*).
2. Ve al menú lateral izquierdo y abre el **SQL Editor**.
3. Copia todo el contenido del archivo [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) y pégalo en el editor.
4. Haz clic en **Run** (botón verde). Esto creará:
   - Tablas: `events`, `areas`, `players`, `game_sessions`, `session_actions`, `audit_items`, `phishing_scenarios`.
   - Políticas de seguridad Row Level Security (RLS).
   - Vistas automáticas de Leaderboard (`v_leaderboard`) y función de cálculo por áreas (`get_area_leaderboard`).
   - Las 7 áreas oficiales estandarizadas de InTouchCX (`HR, EX, LSS, IT, RECRUITMENT, S-OPS, FACILITIES`).
5. Ve a **Project Settings** → **API** y copia las siguientes 3 credenciales:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **anon public key** (`ey...`)
   - **service_role secret key** (`ey...`)

---

## Paso 3: Desplegar en Vercel (1 Clic)

1. Ingresa a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** → **"Project"**.
3. Selecciona tu repositorio recién subido (`security-arcade` o el nombre que le diste).
4. En la sección **Environment Variables**, agrega las siguientes 3 variables:

| Variable | Valor | Tipo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Tu Project URL de Supabase | Pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu llave `anon` de Supabase | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu llave `service_role` de Supabase | Secreta (Servidor) |

5. Haz clic en **"Deploy"**.
6. En ~60 segundos Vercel te entregará la URL de producción (ej. `https://security-arcade.vercel.app`).

---

## 🔒 Arquitectura de Resiliencia Fuera de Línea

La aplicación cuenta con arquitectura **cero caídas**:
- Si Supabase está desconectado o las variables no se han configurado aún, la aplicación funciona de forma completamente autónoma usando su motor procedural en memoria y almacenamiento local (`localStorage`).
- Tan pronto configures las variables de entorno en Vercel, el sistema comenzará a registrar automáticamente a los jugadores y sus sesiones en las tablas de Postgres en tiempo real.
