# Eliminar colores fosforescentes de la landing page

## Objetivo
Reducir la intensidad visual del naranja Ember para lograr una estética más sobria, profesional y legible sobre el fondo oscuro Charcoal.

## Cambios

### 1. Desaturar el color primary en el tema
- Reducir la cromática del `primary` en `src/styles.css` de `oklch(0.68 0.18 38)` a un tono más apagado (ej. `oklch(0.60 0.10 38)` o similar).
- Ajustar `accent`, `ring`, `sidebar-primary` y `chart-*` que derivan del mismo hue.

### 2. Reducir o eliminar glows difusos
- En el Hero (`src/routes/index.tsx`): eliminar o reemplazar el halo `bg-primary/30 blur-[120px]` detrás del mockup del teléfono.
- Reemplazar transparencias de primary en iconos, avatares y checkmarks (`bg-primary/10`, `bg-primary/15`, `bg-primary/30`) por fondos neutros (`bg-muted`, `bg-secondary`, etc.) o bordes sutiles.

### 3. Sección CTA sin naranja puro
- Cambiar la sección `FinalCTA` de `bg-primary` a `bg-card` o `bg-secondary` con texto `foreground`, manteniendo el contraste sin el impacto visual de un bloque naranja completo.

### 4. Animaciones más sutiles
- Reemplazar `animate-ping` del logo por un estado estático o una transición hover sutil.
- Reducir `animate-pulse` en badges a un cambio de opacidad más lento, o eliminarlo.

## Archivos a modificar
- `src/styles.css` — ajuste de tokens de color
- `src/routes/index.tsx` — reemplazo de clases con transparencias y glows

## Validación
- Verificar que el constraste sigue siendo adecuado para accesibilidad.
- Confirmar que la página compila sin errores.