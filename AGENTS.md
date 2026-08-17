# My Wallet — Reglas de Diseño y Arquitectura

> Este documento es la fuente de verdad para cualquier agente o desarrollador que trabaje en este proyecto. **Toda regla aquí descrita debe respetarse sin excepción.**

---

## Project Mapper — Skill nativa obligatoria

### Trigger y activación

Esta skill debe activarse automáticamente cuando:

1. El usuario inicia una nueva sesión de trabajo y no existe un mapa reciente (< 2 horas).
2. El usuario pide: "mapea el proyecto", "entendé la estructura", "explicame el código".
3. La tarea implica leer o modificar más de 2 archivos.
4. El usuario menciona: refactor, arquitectura, dependencias, módulos, estructura.
5. El agente detecta que está leyendo los mismos archivos múltiples veces.

No activar la skill cuando:

- La tarea es trivial (ej. cambiar un string o formatear código).
- Solo se edita 1 archivo que ya está abierto en contexto.
- El usuario dice explícitamente "no uses el mapper".

### Regla especial

Antes de leer la carpeta `node_modules` o el archivo `pnpm-lock.yaml`, el agente debe consultar esta skill y decidir si existe una necesidad real y acotada. En general, se debe evitar leer esos archivos salvo que la tarea lo requiera estrictamente.

### Flujo de trabajo obligatorio

#### Paso 1: Generar el mapa del proyecto

Ejecutar siempre al inicio si no hay mapa reciente:

```bash
python3 .agents/skills/project-mapper/scripts/generate_map.py --project . --output .agents/skills/project-mapper/resources/project_map.json --force
```

#### Paso 2: Inyectar contexto relevante

Ejecutar automáticamente después del paso 1 y antes de cada tarea concreta para filtrar solo los archivos necesarios:

```bash
python3 .agents/skills/project-mapper/scripts/inject_relevant.py --map .agents/skills/project-mapper/resources/project_map.json --query "descripción de tu tarea aquí" --output .agents/project-mapper/resources/context_task.json
```

Se puede limitar la cantidad de archivos con flags como `--max-files 10` o `--dep-depth 2` cuando sea necesario.

#### Paso 3: Comprimir contexto

Ejecutar solo si el mapa o el contexto inyectado son demasiado grandes (>4000 tokens estimados) o si el contexto se volvió demasiado largo:

```bash
python3 .agents/skills/project-mapper/scripts/compress_context.py --input .agents/skills/project-mapper/resources/project_map.json --output .agents/project-mapper/resources/project_map_compressed.json --ratio 0.4
```

Se puede ajustar a `0.3` para compresión más agresiva o `0.6` para ser más conservador.

#### Paso 4: Actualizar AGENTS.md

Si el proyecto cambia o el mapa del proyecto indica que la arquitectura, rutas, dependencias o convenciones ya no coinciden con la guía actual, el agente debe actualizar `AGENTS.md` para reflejar esa nueva realidad.

La actualización debe incluir:

- Arquitectura del proyecto: estructura de carpetas, capas del sistema y organización del código.
- Patrones de diseño detectados en la aplicación.
- Reglas de consistencia para preservar la misma arquitectura en futuras funcionalidades o refactors.
- Consideraciones anti-alucinación frontend: estilos, tokens visuales, nomenclatura, UI library y convenciones para evitar inventar interfaz incongruente.

En resumen, el agente no debe crear o modificar `DESIGN.md`; debe mantener actualizada la información de `AGENTS.md` según el proyecto real.

---

## Arquitectura General

Proyecto **Next.js 16 con App Router** con arquitectura **3 capas**: Client Components → Server Actions → Service Layer → PostgreSQL (Prisma ORM). Los contexts de React mantienen caché local sincronizada con el backend mediante Server Actions.

### Estructura de carpetas

```
app/                          # Next.js App Router (páginas y layouts)
  layout.tsx                  # Layout raíz (metadata, Providers, Analytics)
  page.tsx                    # Página raíz (redirección por auth)
  globals.css                 # Estilos globales, Tailwind v4, variables CSS, dark mode
  imports/
    dev.ts                    # Constante DEV y logger global
  login/
    page.tsx                  # Página de login
  (dashboard)/                # Route group con layout compartido (sidebar + auth guard)
    layout.tsx
    inicio/page.tsx           # Dashboard principal (stats, gráficos, últimas transacciones)
    transferencias/
      layout.tsx              # Sub-layout con tabs ingresos/gastos
      ingresos/page.tsx       # CRUD de transacciones de ingreso
      gastos/page.tsx         # CRUD de transacciones de gasto
    ahorros/page.tsx          # Metas de ahorro con barras de progreso
    inversiones/
      page.tsx                # Listado de inversiones
      [id]/page.tsx           # Detalle de inversión + contribuciones
  actions/                    # Server Actions — validación + auth guard + mapping
    auth.ts                   # loginAction, logoutAction, getSessionAction, changePasswordAction
    transactions.ts           # CRUD + import transacciones
    categories.ts             # CRUD categorías
    savings.ts                # CRUD metas de ahorro
    investments.ts            # CRUD inversiones + contribuciones
  service/                    # Capa de datos — queries Prisma
    db.ts                     # Singleton PrismaClient con adapter-pg
    auth.service.ts           # validación y hashing de contraseñas (bcryptjs)
    transaction.service.ts    # CRUD transacciones
    category.service.ts       # CRUD categorías
    saving-goal.service.ts    # CRUD metas de ahorro
    investment.service.ts     # CRUD inversiones + transacciones atómicas
  lib/
    session.ts                # Sesión cifrada con iron-session (cookie)

components/
  providers.tsx               # Composición de providers globales
  layout/
    sidebar.tsx               # Navegación desktop
    mobile-nav.tsx            # Navegación mobile (Sheet)
    page-header.tsx           # Título + descripción + acciones de página
    currency-toggle.tsx       # Toggle USD/ARS
  dashboard/
    stat-card.tsx             # Tarjeta de métrica con ícono y monto formateado
    balance-chart.tsx         # Gráfico de área (ingresos vs gastos en el tiempo)
    category-chart.tsx        # Gráfico de torta (desglose por categoría)
  transferencias/
    transaction-form.tsx      # Formulario (Dialog) para crear/editar transacciones
    transaction-table.tsx     # Tabla con búsqueda, filtro, ordenamiento, editar, eliminar
    category-manager.tsx      # Dialog para gestionar categorías
    import-dialog.tsx         # Diálogo multi-paso para importar desde Excel
  shared/
    amount-display.tsx        # Formateador de montos sensible a moneda
    category-badge.tsx        # Badge coloreado para categorías
    color-picker.tsx          # Selector de colores de gráficos
    confirm-dialog.tsx        # Diálogo de confirmación reutilizable
  ui/                         # Primitivas shadcn/ui (basadas en Base UI)
    avatar.tsx, badge.tsx, button.tsx, card.tsx, chart.tsx
    dialog.tsx, dropdown-menu.tsx, empty.tsx, field.tsx
    input.tsx, label.tsx, progress.tsx, select.tsx
    separator.tsx, sheet.tsx, sonner.tsx, table.tsx
    tabs.tsx, tooltip.tsx

context/                      # Caché local del lado cliente
  auth-context.tsx            # AuthProvider: login/logout, sesión en memoria + cookie
  currency-context.tsx        # CurrencyProvider: estado USD/ARS + helper de formato
  data-context.tsx            # DataProvider: CRUD mediante Server Actions, datos refrescados del backend

lib/
  types.ts                    # Interfaces y tipos TypeScript del dominio
  mock-data.ts                # Datos semilla y generador de IDs
  format.ts                   # Formateo de moneda (Intl.NumberFormat) y fechas
  selectors.ts                # Datos derivados: totals(), monthlySeries(), categoryBreakdown()
  excel.ts                    # Export/import Excel con XLSX
  theme.ts                    # Temas dinámicos por moneda (USD=emerald, ARS=celeste)
  nav.ts                      # Definición de ítems de navegación con match functions
  utils.ts                    # Utilidad cn() (clsx + tailwind-merge)

prisma/
  schema.prisma               # Modelos: User, Category, Transaction, SavingGoal, Investment, InvestmentContribution
  seed.ts                     # Usuario admin + categorías default
  migrations/                 # Migraciones SQL (pendientes de ejecutar)

.env                          # DATABASE_URL, AUTH_SECRET, ADMIN_INIT_PASSWORD

### Stack tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.0 |
| Lenguaje | TypeScript (strict) | 5.7.3 |
| UI | React | 19 |
| Componentes base | @base-ui/react (shadcn/ui) | 1.5.0 |
| Estilos | Tailwind CSS v4 | 4.3.3 |
| Gráficos | recharts | 3.8.0 |
| Toasts | sonner | 2.0.8 |
| Excel | xlsx (SheetJS) | 0.18.5 |
| Iconos | lucide-react | 1.16.0 |
| Tema claro/oscuro | next-themes | 0.4.6 |
| ORM | Prisma + @prisma/adapter-pg | 7.9.1 |
| Base de datos | PostgreSQL (pg) | 8.23.0 |
| Autenticación | iron-session (cookie cifrada) | 8.0.4 |
| Hashing | bcryptjs | 3.0.3 |
| Validación | Zod (declarado) | 4.4.3 |
| Package manager | pnpm | workspace |

### Rutas

| Ruta | Descripción |
|---|---|
| `/` | Splash de redirección (→ `/login` o `/inicio`) |
| `/login` | Login con credenciales hardcodeadas |
| `/inicio` | Dashboard principal |
| `/transferencias/ingresos` | Ingresos |
| `/transferencias/gastos` | Gastos |
| `/ahorros` | Metas de ahorro |
| `/inversiones` | Lista de inversiones |
| `/inversiones/[id]` | Detalle de inversión |

### Manejo de estado

Tres React Contexts anidados en `components/providers.tsx`:

1. **AuthContext** → autenticación (login/logout) y sesión en memoria + cookie cifrada via iron-session
2. **CurrencyContext** → moneda activa (USD/ARS) y formateo
3. **DataContext** → datos de la app (transacciones, categorías, ahorros, inversiones) con CRUD completo

Todos usan el patrón `createContext<T | null>(null)` + hook `useX()` que lanza error si se usa fuera del provider.

Los datos NO son volátiles — se obtienen del backend mediante Server Actions (`app/actions/`) que consultan PostgreSQL a través de Prisma. El DataContext refresca su estado local luego de cada mutación llamando a las Server Actions correspondientes.

### Modelos de datos

Definidos en `lib/types.ts` usando `interface` para objetos y `type` para uniones:

- `Currency` = `"USD"` | `"ARS"`
- `TransactionKind` = `"income"` | `"expense"`
- `Category` — id, name, kind, color
- `Transaction` — id, kind, amount (USD base), description, categoryId, date (ISO)
- `SavingGoal` — id, name, target, saved, color, deadline?
- `Investment` — id, name, description, invested, currentValue, contributions[], createdAt
- `InvestmentContribution` — id, date, amount, note?

Los IDs son auto-incrementales manejados por Prisma/PostgreSQL.

---

## Reglas de Diseño

### Convenciones de nomenclatura

- **Archivos y carpetas**: `kebab-case` (`auth-context.tsx`, `page-header.tsx`, `amount-display.tsx`)
- **Páginas Next.js**: siempre `page.tsx`
- **Layouts**: siempre `layout.tsx`
- **Código**: inglés (variables, funciones, tipos)
- **UI/UX**: español (labels, textos, mensajes al usuario)
- **Exports**: `named exports` siempre, salvo páginas Next.js que requieren `export default`
- **Props**: interfaces explícitas con nombre descriptivo

### Convenciones de componentes

- **`"use client"`** al inicio de todo componente que use hooks, estado o DOM
- Componentes **funcionales**, nunca clases
- **No crear archivos de componente inline en pages** — extraer a `components/`
- **No estilos inline** — usar Tailwind exclusivamente
- `cn()` de `@/lib/utils` para combinar clases condicionales
- Variables CSS custom en `app/globals.css` usando `@theme inline`
- OKLCH para colores del tema (`--chart-1` a `--chart-5`)

### Convenciones de React

- `useCallback` para funciones expuestas en contextos
- `useMemo` para valores computados costosos
- `useEffect` solo para side effects (auth redirects, hydration)
- Patrón de contexto: null-check en el hook de consumo
- Estado `hydrated` para evitar flash de página incorrecta en auth

### Convenciones de TypeScript

- `"strict": true` siempre
- `interface` para objetos, `type` para uniones y alias
- Path alias `@/*` para imports desde raíz
- Tipos de dominio centralizados en `lib/types.ts`
- No usar `any`

---

## Seguridad (REGLA CRÍTICA)

> **LA SEGURIDAD ES LA REGLA MÁS IMPORTANTE DE ESTE PROYECTO. NINGÚN CAMBIO PUEDE VIOLAR ESTAS REGLAS.**

### Reglas obligatorias

1. **NUNCA exponer secretos, tokens, claves API o contraseñas en el código fuente**, ni en variables de entorno visibles en el cliente. Todo secreto debe estar del lado del servidor. Las claves residen en `.env` (DATABASE_URL, AUTH_SECRET, ADMIN_INIT_PASSWORD) y nunca deben filtrarse al bundle del cliente.

2. **NUNCA loguear información sensible**: credenciales, tokens, datos personales, montos exactos con contexto identificable. Los logs deben ser genéricos y no contener PII (Personally Identifiable Information).

3. **Validación de inputs**: todo dato que ingrese al sistema (formularios, archivos Excel, parámetros de URL) debe ser validado antes de procesarse:
   - Montos: `Number.isFinite()` y `> 0`
   - Strings: trim + no vacíos
   - Fechas: parseo y validación de formato ISO
   - Archivos: validar estructura antes de importar

4. **Credenciales actuales**: el login usa credenciales hardcodeadas (`adminWallet` / `Hola1234`) SOLO para propósitos de demostración. Estas credenciales se muestran en la UI de login. Antes de cualquier despliegue a producción, DEBE reemplazarse por un sistema de autenticación real con tokens seguros.

5. **Sanitización**: aunque React escapa HTML por defecto, cualquier contenido que se renderice con `dangerouslySetInnerHTML` debe ser sanitizado previamente. Evitar `dangerouslySetInnerHTML` siempre que sea posible.

6. **localStorage**: solo almacenar datos no sensibles. Nunca guardar contraseñas, tokens de acceso sin expiración, ni datos financieros completos.

7. **Dependencias**: mantener las dependencias actualizadas. No agregar librerías sin revisar su estado de seguridad y mantenimiento.

8. **CORS/CSRF**: si en el futuro se agregan API routes REST tradicionales, implementar protección CSRF y configurar CORS restrictivamente. Las Server Actions actuales están protegidas por `requireSession()` y no exponen rutas REST.
9. **env**: Nunca leer archivo .env sin autorización.

---

## Logging

### Variable global DEV

El proyecto cuenta con una variable global de desarrollo ubicada en `app/imports/dev.ts`:

```typescript
export const DEV = true  // true = desarrollo, false = producción
```

### Regla de uso de logs

- **DEV = true** → los logs se imprimen en consola normalmente.
- **DEV = false** → ningún log debe imprimirse (modo producción silencioso).

### Logger oficial

Usar siempre el logger exportado desde `app/imports/dev.ts`:

```typescript
import { logger } from "@/app/imports/dev"
// o
import { DEV, logger } from "@/app/imports/dev"
```

NUNCA usar `console.log()`, `console.warn()`, `console.error()` o `console.debug()` directamente. Siempre usar `logger.log()`, `logger.warn()`, `logger.error()`, `logger.debug()`, `logger.info()`.

El logger respeta automáticamente la variable `DEV`:
- Si `DEV === true`: imprime normalmente.
- Si `DEV === false`: no imprime nada (no-op).

### Cuándo loguear

- **logger.error**: errores capturados en try/catch, validaciones fallidas críticas
- **logger.warn**: condiciones inesperadas pero no fatales, datos faltantes
- **logger.info**: eventos importantes del flujo (login exitoso, importación completada, etc.)
- **logger.debug**: datos de debugging durante desarrollo (estado de variables, parámetros)
- **logger.log**: uso general, solo para desarrollo

### Cuándo NO loguear

- Credenciales, tokens, contraseñas
- Datos personales de usuarios
- Montos con contexto que pueda identificar a una persona
- NUNCA en producción si no es estrictamente necesario para diagnosticar un error

### Cambio a producción

Antes de cualquier build de producción, verificar que `DEV` esté en `false` en `app/imports/dev.ts`.

---

## Estilo de código

- Tailwind utility classes exclusivamente (no CSS modules, no styled-components, no CSS-in-JS)
- No comentarios innecesarios en el código (el código debe ser autodocumentado)
- Funciones pequeñas y con una sola responsabilidad
- Componentes con una sola responsabilidad
- Preferir composición sobre herencia
- Evitar `useEffect` innecesarios
- No usar `any` ni suprimir reglas de TypeScript sin justificación
- Imports ordenados: librerías externas → imports de proyecto → tipos

---

## Comandos

```bash
pnpm dev          # Iniciar servidor de desarrollo con Turbopack
pnpm build        # Build de producción
pnpm start        # Iniciar servidor de producción
pnpm lint         # Ejecutar ESLint
pnpm prisma:seed  # Poblar DB con usuario admin + categorías default
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
