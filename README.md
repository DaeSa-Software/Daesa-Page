# DAESA Software

Landing page estática de DAESA Software, publicada desde `main` con GitHub Pages.

## Estructura

- `index.html`: portada, catálogo de productos, capacidades y contacto.
- `styles.css`: estilos responsivos y accesibles.
- `script.js`: menú móvil, año del footer y revelado sutil al desplazarse.
- `experience.js`: escenas Three.js y etapas interactivas Entender, Construir y Evolucionar.
- `assets/vendor/`: Three.js 0.186.1 con su licencia MIT, servido localmente.
- `swipy/index.html`: redirección directa a la landing oficial de SWIPY.

## Publicación

El sitio usa el dominio `daesasoftware.com`. GitHub Pages publica desde la raíz de `main`; los registros A del dominio apuntan a GitHub Pages. Para actualizar el sitio, edita los archivos anteriores y publica los cambios en `main`.

La dirección `https://daesasoftware.com/swipy/` lleva a `https://daesa-software.github.io/swipy/`.

## Vista previa y animación

Ejecuta `python3 -m http.server 8765` y abre `http://localhost:8765/`. No se requiere compilación. Las escenas usan WebGL, limitan la resolución y se detienen fuera de pantalla. Respetan movimiento reducido y ofrecen una ilustración alternativa cuando WebGL no está disponible. El botón de pausa controla ambas escenas.
