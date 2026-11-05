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
- Sólo frontend: no registra usuarios, no almacena datos personales y no realiza canjes. Los premios y puntos se identifican como ejemplos del piloto.
- No se inventaron aliados, contactos, testimonios ni métricas de tracción. Los canales de inscripción se incorporarán cuando estén confirmados.

## Editar

- `src/pages/index.astro`: secciones, textos, metadatos y ejemplos de recompensas.
- `src/styles/global.css`: colores, tipografías, componentes y puntos de adaptación.
- `src/scripts/interactions.ts`: filtros, menú, diálogos y animación de aparición.
- `public/assets/`: imágenes locales. Procedencia en `ASSETS.md`.
- Las fuentes Space Grotesk y Plus Jakarta Sans se solicitan a Google Fonts; hay fuentes de respaldo si no hay conexión.

Los valores de recompensas en la página y en `interactions.ts` son ilustrativos y deben actualizarse juntos al definir el piloto.

## Identidad

Oro `#FFB800`, púrpura `#6C2BD9`, verde `#00E676`, fondo `#0F0E17`. El emblema original se obtuvo del manual; el trofeo 3D es una ilustración de campaña independiente.

## Publicación

`.openai/hosting.json` configura la salida estática para Sites. La instancia creada conserva acceso privado. El despliegue no habilita registros ni premios reales.
