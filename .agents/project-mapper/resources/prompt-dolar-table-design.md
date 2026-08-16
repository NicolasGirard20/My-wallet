# Prompt para otro modelo: Diseño de tabla de cotizaciones de dólares

## Contexto del proyecto

Estoy trabajando en un proyecto **Next.js 16 con App Router**, usando:
- **shadcn/ui** (basado en @base-ui/react) para componentes
- **Tailwind CSS v4** para estilos
- **lucide-react** para íconos
- **TypeScript strict**

El componente en cuestión es `components/layout/currency-toggle.tsx`, que contiene un `DropdownMenu` de shadcn/ui. Dentro del `DropdownMenuContent`, tengo un `DropdownMenuRadioGroup` con `DropdownMenuRadioItem` para cada tipo de dólar.

## Objetivo

Quiero que la tabla de cotizaciones de dólares se vea **exactamente** así al abrir el dropdown:

```
Tipo de dólar
Activo: Blue
Actualizado 14:32 hs
─────────────────────────
Blue              C: $1000  V: $1020
Oficial           C: $950   V: $980
Tarjeta           C: $1030  V: $1080
─────────────────────────
🔄 Actualizar cotización
```

## Requisitos específicos

1. **Header del dropdown**:
   - Tres líneas de texto apiladas verticalmente:
     - Línea 1: "Tipo de dólar" (título, font-medium)
     - Línea 2: "Activo: {nombre}" (font-medium, color foreground) — donde {nombre} es el nombre del tipo de dólar seleccionado (ej: "Blue")
     - Línea 3: "Actualizado {hora} hs" (text-xs, text-muted-foreground) — donde {hora} es la hora de actualización

2. **Filas de cotizaciones** (DropdownMenuRadioItem):
   - Cada fila debe tener un layout de **3 columnas alineadas**:
     - **Columna 1 (izquierda)**: nombre del tipo de dólar (ej: "Blue", "Oficial", "Tarjeta")
       - `flex-1` para ocupar espacio disponible
       - `truncate` para evitar overflow
     - **Columna 2 (centro-derecha)**: valor de compra
       - Formato: `C: $1000` (con "C:" de prefijo)
       - Ancho fijo: `w-24` (96px)
       - Alineación: `text-right`
       - Tipografía: `font-mono tabular-nums` para alineación de dígitos
       - Color: `text-muted-foreground`
     - **Columna 3 (derecha)**: valor de venta
       - Formato: `V: $1020` (con "V:" de prefijo)
       - Ancho fijo: `w-24` (96px)
       - Alineación: `text-right`
       - Tipografía: `font-mono tabular-nums`
       - Color: `text-muted-foreground`
   - Separación entre columnas: `gap-3`
   - Todas las filas deben tener el mismo layout para que los números se alineen verticalmente

3. **Botón de actualizar**:
   - Debajo de las filas, separado por un `DropdownMenuSeparator`
   - Texto: "Actualizar cotización" con ícono `RefreshCw`

## Código actual (para referencia)

```tsx
<DropdownMenuContent align="start" className="w-64">
  <DropdownMenuGroup>
    <DropdownMenuLabel className="flex flex-col gap-0.5">
      <span>Tipo de dólar</span>
      {rate ? (
        <span className="text-xs font-medium text-foreground">
          Activo: {rate.nombre}
        </span>
      ) : null}
      {updatedAtLabel ? (
        <span className="text-[10px] font-normal text-muted-foreground">
          Actualizado {updatedAtLabel} hs
        </span>
      ) : null}
    </DropdownMenuLabel>
  </DropdownMenuGroup>
  <DropdownMenuSeparator />
  <DropdownMenuRadioGroup
    value={dollarType}
    onValueChange={(v) => setDollarType(String(v))}
  >
    {rates.length === 0 && !ratesLoading ? (
      <DropdownMenuItem disabled>Sin cotizaciones disponibles</DropdownMenuItem>
    ) : (
      rates.map((r) => (
        <DropdownMenuRadioItem key={r.casa} value={r.casa}>
          <span className="flex w-full items-center justify-between gap-3">
            <span className="flex-1 truncate">{r.nombre}</span>
            <span className="flex items-center gap-3 font-mono tabular-nums text-muted-foreground">
              <span className="w-24 text-right">C: ${r.compra.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
              <span className="w-24 text-right">V: ${r.venta.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
            </span>
          </span>
        </DropdownMenuRadioItem>
      ))
    )}
  </DropdownMenuRadioGroup>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => refreshRates(true)} disabled={ratesLoading}>
    <RefreshCw className={cn("size-4", ratesLoading && "animate-spin")} />
    Actualizar cotización
  </DropdownMenuItem>
</DropdownMenuContent>
```

## Pregunta

¿Este diseño logra el alineamiento visual correcto? ¿Hay algún problema técnico con usar `DropdownMenuRadioItem` de shadcn/ui con este layout de 3 columnas? ¿Hay alguna limitación de Base UI que pueda romper el alineamiento? ¿Qué cambios recomendarías para que los números de compra/venta se alineen perfectamente verticalmente entre filas, considerando que los nombres de los tipos de dólar tienen diferentes largos?

## Restricciones

- No cambiar la arquitectura del componente (debe seguir usando `DropdownMenu`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem` de shadcn/ui)
- No usar CSS modules, styled-components, ni CSS-in-JS
- Solo Tailwind utility classes
- Mantener el `w-64` (256px) de ancho del dropdown
- El componente usa `"use client"` y es un Client Component
