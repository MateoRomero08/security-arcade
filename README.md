# SECURITY ARCADE · InTouchCX (Fraud Awareness Week)

Aplicación web gamificada para la **Fraud Awareness Week** de **InTouchCX**, centrada en concienciación en seguridad de la información, prevención de fraude, ingeniería social y cumplimiento normativo **PCI DSS v4.0.1**. Diseñada específicamente como una experiencia arcade móvil de alto impacto para colaboradores de **InTouchCX**, optimizada para teléfonos celulares en orientación vertical y pantallas corporativas.

---

## 🌟 Reglas Fundamentales de UX y Arquitectura de Navegación

La **experiencia de usuario (UX)** y la **estabilidad de navegación** son las prioridades #1 de la aplicación:

### 1. 🎯 Límite Estricto de 2 Intentos por Juego (`MAX_GAME_ATTEMPTS = 2`)
Para evitar el abuso de puntuaciones y garantizar una competencia justa entre áreas:
- Cada colaborador registrado dispone de un **máximo de 2 intentos** por cada minijuego:
  - 2 intentos para *"The Auditor is Coming!"* (Inspección de Escritorio).
  - 2 intentos para *"Fraud Hunter"* (Simulador de Phishing).
- **Control Visual en el Menú:** Cada tarjeta muestra en tiempo real `Attempts: 0/2`, `1/2` o `2/2 (Locked 🔒)`.
- **Bloqueo Inteligente:** Al completar el segundo intento, el botón se bloquea con el estado `2/2 ATTEMPTS COMPLETED 🔒`. Si el usuario intenta acceder forzadamente mediante la URL, la pantalla muestra un bloqueo informativo indicando que su mejor puntaje ha sido registrado en el leaderboard.
- **Cómputo en Ranking:** El ranking individual y departamental conserva siempre la **mejor puntuación** obtenida entre los intentos válidos.

### 2. 🎵 Música Chiptune Retro Arcade en Lobby/Inicio y Separación de SFX
- **Sintetizador Procedural Web Audio API (0 KB de descarga en red):** Genera en tiempo real un arpegio y línea de bajo retro arcade de 8 bits a 125 BPM para ambientar la pantalla inicial (`/`) y el menú principal (`/menu`).
- **Botón de Silenciar Dividido (`🔇/🔊`):** El interruptor de audio **únicamente silencia la música chiptune arcade**, permitiendo que todos los efectos de sonido táctiles (taps, aciertos, errores, fanfarria de victoria y el cómico rebuzno del burro) se sigan escuchando con total claridad.
- **Respeto a las Políticas del Navegador:** Inicia de forma no intrusiva con la primera interacción del usuario o al pulsar el botón de audio.
- **Silenciado Automático en Partidas:** La música se detiene automáticamente al ingresar a las partidas activas para no interferir con la concentración y la tensión sonora del juego.

### 3. 🐴 Efecto Cómico del Burrito ("Donkey Alert! 🐴")
- **Pop-up Rápido y No Obstructivo:** Cuando un colaborador comete un error (dejar una infracción en la mesa, triturar un elemento permitido o caer en una trampa de correo phishing con SPF inválido), asoma en la parte superior central de la pantalla un burrito caricaturesco con animación elástica.
- **Duración Ultrarrápida (850 ms):** Desaparece de inmediato sin tapar los botones de acción en la parte inferior del celular. Cuenta con `pointer-events: none` para que los toques táctiles pasen directo a los controles del juego.
- **Sonido Procedural de Rebuzno (*Hee-Haw! / ¡I-AAAH!*):** El sintetizador emite un sonido cómico de burro con osciladores de frecuencia modulada en dos sílabas alternadas, reforzando el aprendizaje lúdico sin frustración.

### 4. 🏢 Áreas Corporativas Oficiales Estandarizadas (`src/config/areas.ts`)
Toda la plataforma (registro, tableros de puntuación, filtrado y simuladores) utiliza exclusivamente las 7 áreas oficiales de InTouchCX:
1. **`HR`**
2. **`EX`**
3. **`LSS`**
4. **`IT`**
5. **`RECRUITMENT`**
6. **`S-OPS`**
7. **`FACILITIES`**

### 5. 🛡️ Protección contra Salida Accidental (Navigation Lock)
- **Modal de Confirmación (`ExitConfirmModal`):** Si un jugador intenta tocar el botón "Menú" o el logotipo durante una partida activa, se despliega un diálogo de confirmación que advierte sobre la pérdida de la racha actual antes de permitir el abandono.
- **Intercepción del Botón Atrás (`popstate`):** En teléfonos móviles, si el usuario desliza para retroceder o presiona el botón físico/virtual de "Atrás", el evento se intercepta con `window.history.pushState` y abre el modal de confirmación en lugar de cerrar el juego.
- **Protección de Cierre o Recarga (`beforeunload`):** Si intenta recargar la pestaña en plena partida, el navegador despliega la advertencia nativa de prevención de pérdida de datos.

### 6. 🚨 Pantallas de "Game Over" Sin Crasheos
- **Llegada del Auditor (Fin de Tiempo en Juego 1):** Cuando la cuenta regresiva llega a `0s`:
  - Se activa la fase `GAMEOVER` con la mascota del auditor sorprendido (`MascotAuditor mood="shocked"`).
  - Letrero neón de alto impacto: **`🚨 TIME'S UP · GAME OVER!`**.
  - Presenta un resumen de ítems auditados y puntaje salvado.
  - Opciones inmediatas: 🔄 **Reintentar (Intento 2 de 2)**, 📋 **Ver Informe Educativo con Requisitos PCI DSS**, o 🏠 **Volver al Menú**.
- **Agotamiento de Escudos (Juego 2 - Fraud Hunter):** Cuando el colaborador cae en 3 trampas de fraude:
  - Los escudos se descuentan visualmente en tiempo real (`🛡️🛡️🛡️` → `🖤🖤🖤`) junto al sonido de quiebre de escudo y alerta del burrito.
  - Al llegar a 0 escudos, se activa la fase `GAMEOVER` con animación de pantalla roja y advertencia clara: **`💀 GAME OVER · ALL SHIELDS DOWN`**.
  - Permite reintentar si queda intento disponible o revisar el informe de hallazgos.
- **Evaluación Fallback:** Si la conexión a la base de datos llegara a interrumpirse al enviar los resultados, el cliente genera una evaluación de contingencia fuera de línea, garantizando que `result.findings` nunca sea `undefined` y eliminando cualquier caída de React.

---

## 🎨 Control Central de Marca e Identidad Visual

Toda la identidad gráfica se administra desde un único archivo de configuración:

📍 **`src/config/brand.ts`**

### ¿Cómo actualizar el logo oficial de InTouchCX?
1. **Opción A (URL Externa o Supabase Storage):** Configura la URL en `BRAND_CONFIG.logo.url`.
2. **Opción B (Vectorial Oficial Integrado):** Si `url` es `null`, `<BrandLogo />` renderiza automáticamente el SVG vectorial oficial con los arcos concéntricos.
3. **Opción C (Placeholder):** Muestra un recuadro horizontal punteado (~160×48 px) con el texto **"LOGO AQUÍ"** para pruebas.

### ¿Dónde cambiar los colores oficiales?
En `src/config/brand.ts`:
```typescript
// TODO: reemplazar con colores oficiales de InTouchCX
colors: {
  primary: "#43E568",       // Verde Neón Corporativo
  primaryHover: "#58F27B",
  secondary: "#0D2E16",     // Verde Oscuro
  accent: "#FF5A65",        // Rojo / Alerta / Infracción
  bg: "#051B0B",            // Fondo Principal Oscuro
  surface: "#0D2E16",       // Tarjetas Glassmorphism
  text: "#FFFFFF",
  textMuted: "#A3C6AD",
}
```
Las variables CSS se reflejan en `:root` dentro de `src/app/globals.css`.

---

## 🎮 Mecánica de los Minijuegos

### 1. "The Auditor is Coming!" (Clean Desk & PCI DSS Operativo)
- **Objetivo:** Auditar 8 objetos sobre la estación de trabajo antes de que el auditor ingrese a la sala (60 segundos).
- **Táctil:** Toca los pines circulares del escritorio para ver detalles en la tarjeta inferior.
- **Decisión:**
  - ✅ **Está Permitido:** Conservar en el escritorio (ej. credencial visible, libreta limpia, vaso corporativo).
  - 🚨 **Es Infracción:** Triturar o reportar (ej. post-it con contraseña, libreta con números PAN, memorias USB sospechosas).
- **Rachas y Multiplicadores:** x1.5 (3 aciertos) y x2.0 (5 aciertos).

### 2. "Fraud Hunter" (Simulador de Ingeniería Social)
- **Objetivo:** Proteger 3 escudos evaluando 8 comunicaciones multicanal (Email, SMS, Chat CRM, Vishing, Notificaciones Push MFA y puesto físico).
- **Mecánica de Escudos en Vivo:** Cada vez que el jugador clasifica un ataque como "Legítimo", pierde 1 escudo (`setShields(prev - 1)`), reproduce el efecto sonoro de impacto y activa la alerta del burrito. Perder los 3 escudos culmina en **Game Over** inmediato.
- **Herramientas:** Visor de cabeceras SPF/DKIM y pistas técnicas para detectar anomalías.
- **Botones Arcade Exclusivos:**
  - 🟢 **`btn-fraud-legit`**: Verde esmeralda con `🛡️✅` ("LEGITIMATE / TRUSTED").
  - 🔴 **`btn-fraud-danger`**: Rojo neón con `🚨⚡` ("FRAUD / PHISHING").

---

## ⚙️ Motor Determínico y Banco de Pruebas

Toda la aleatoriedad de las partidas se genera en servidor utilizando **Mulberry32 PRNG (32-bit state)**:
- **Reproducibilidad:** Semillas deterministas para auditoría.
- **Cuotas Balanceadas:**
  - Juego 1: ~65% infracciones / ~35% permitidos.
  - Juego 2: ~60% fraudes / ~40% legítimos.
- **Protección Anti-Trampa:** Decisiones en tiempos no humanos (< 250 ms) son penalizadas.

### Pruebas Unitarias
```bash
node scripts/test-runner.js
```

---

## 📦 Puesta en Marcha Local

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar tipos y verificar código
npx tsc --noEmit

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador en modo emulación móvil (F12)
# http://localhost:3000
```
