# Ganadazo

Landing en español de Ganadazo, una startup de Cusco que conecta juegos y recompensas de negocios locales. Construida con **Astro 7.4.5**, TypeScript y CSS adaptable, a partir del manual de marca y el modelo de negocio proporcionados.

## Ejecutar

Requiere Node.js 22.23.4 o superior en una versión LTS compatible (se verificó con Node 24.22.1).

```powershell
npm install
npm run dev
```

Astro muestra la dirección local al iniciar, normalmente `http://localhost:4321`.

```powershell
npm run build
npm run preview
```

La salida estática está en `dist/` y puede alojarse en cualquier servidor de archivos estáticos. No necesita servidor de aplicación ni base de datos.

## Contenido y funcionamiento

- Hero de marca con ilustración original del trofeo, animación sutil y navegación interna.
- Explicación en tres pasos, catálogo filtrable de ejemplos, detalles en diálogos accesibles, sección para negocios y preguntas desplegables.
- Menú adaptable, navegación por teclado, restitución de foco y respeto de movimiento reducido.
- Beta jugable en `/juego/`, reconstruida con Phaser 4.2.1 y TypeScript a partir del runner HTML proporcionado: torito, salto, agacharse, monedas, obstáculos, dificultad progresiva, pausa y récord local.
- Simulación a pasos fijos independiente de la frecuencia de la pantalla, controles táctiles y teclado, ajuste al tamaño del dispositivo y pausa al salir de la pestaña o redimensionar.
- Sólo frontend: no registra usuarios ni realiza canjes. El récord de la beta se guarda únicamente en `localStorage` de este navegador, con recuperación si el almacenamiento no está disponible. Los puntos de práctica no se conectan al catálogo de premios.
- No se inventaron aliados, contactos, testimonios ni métricas de tracción. Los canales de inscripción se incorporarán cuando estén confirmados.

## Editar

- `src/pages/index.astro`: secciones, textos, metadatos y ejemplos de recompensas.
- `src/styles/global.css`: colores, tipografías, componentes y puntos de adaptación.
- `src/scripts/interactions.ts`: filtros, menú, diálogos y animación de aparición.
- `src/pages/juego.astro` y `src/styles/game.css`: pantalla de juego y controles adaptables.
- `src/game/runner-model.ts`: simulación, colisiones, dificultad y puntuación.
- `src/game/runner-scene.ts`: escenario, personaje y renderizador Phaser. Se carga sólo en la página del juego.
- `src/game/beta-controller.ts`: controles, pausa, pantalla completa y récord local.
- `public/assets/`: imágenes locales. Procedencia en `ASSETS.md`.
- Las fuentes Space Grotesk y Plus Jakarta Sans se solicitan a Google Fonts; hay fuentes de respaldo si no hay conexión.

Los valores de recompensas en la página y en `interactions.ts` son ilustrativos y deben actualizarse juntos al definir el piloto.

## Verificar la beta

`npm test` comprueba consistencia entre 30/60/120 Hz, salto, agacharse, colisiones, recogida de monedas, pausa, cambio de tamaño y reinicio. Usa Node 24 LTS, con soporte nativo de TypeScript para los tests.

Teclado: Espacio / ↑ / W para saltar; ↓ / S para agacharse; P o Escape para pausar. En móvil, usa los botones visibles; también puedes tocar la pista para saltar. La pantalla completa se ofrece cuando el navegador la admite.

## Identidad

Oro `#FFB800`, púrpura `#6C2BD9`, verde `#00E676`, fondo `#0F0E17`. El emblema original se obtuvo del manual; el trofeo 3D es una ilustración de campaña independiente.

## Publicación

`.openai/hosting.json` configura la salida estática para Sites. La instancia creada conserva acceso privado. El despliegue no habilita registros ni premios reales.
