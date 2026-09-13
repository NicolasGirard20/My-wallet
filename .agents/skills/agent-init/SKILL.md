---
name: agent-init
description: >-
  Scaffolding automático de configuración de agentes para cualquier proyecto.
  Detecta el stack tecnológico, genera .opencode/config.json, .agents/rules/coding-rules.json
  y AGENTS.md con reglas de negocio. Se activa automáticamente en la primera sesión
  de un proyecto nuevo.
---

# Agent Init — Scaffolding de Configuración de Agentes

## Objetivo
Inicializar la configuración de agentes de IA en cualquier proyecto nuevo de forma automática,
detectando el stack tecnológico y generando los archivos específicos del proyecto.

## Cuándo activar esta skill
- En la PRIMERA sesión de trabajo en un proyecto nuevo.
- Cuando el usuario pide "inicializar configuración de agentes", "scaffolding", "setup del proyecto".
- Cuando `.opencode/config.json` no existe en el proyecto.

## Flujo de trabajo

### Paso 1: Detectar stack
Ejecuta `detect_stack.py` que lee `package.json` y detecta:
- Framework (Next.js, React, Vue, Angular)
- ORM (Prisma, Drizzle, TypeORM)
- Estilos (Tailwind, Styled Components, Emotion)
- UI Library (shadcn, Radix, MUI, Ant Design)
- Auth (NextAuth, Clerk, JWT custom)
- Testing (Jest, Vitest)

### Paso 2: Elegir template
Según el stack detectado, elige el template más adecuado:
- `nextjs-prisma/` → Next.js + Prisma + Tailwind + shadcn/ui
- `react-vite/` → React + Vite + Tailwind
- `vanilla-ts/` → Genérico TypeScript

Si el framework detectado **no tiene template dedicado** (Angular, Vue, Svelte, Astro, Solid, Nuxt, Remix), se usa el **fallback generativo**: `generate_framework_rules.py` genera un `coding-rules.json` específico del framework (nomenclatura, estructura de carpetas y convenciones propias) sin crear `AGENTS.md`, que queda para el usuario.

### Paso 3: Generar archivos
- `.opencode/config.json` → Configuración técnica del agente
- `.agents/rules/coding-rules.json` → Reglas estructuradas del proyecto
- `AGENTS.md` → Reglas de negocio en markdown (solo si hay template dedicado o framework genérico)

### Paso 4: Generar mapa inicial
Ejecuta `project-mapper` para generar el primer mapa del proyecto.

## Salida esperada
```
.opencode/config.json
.agents/rules/coding-rules.json
AGENTS.md
.agents/skills/project-mapper/resources/project_map.json
```

## Validación
- Verificar que los JSON generados sean válidos.
- Verificar que AGENTS.md tenga las secciones mínimas (si se generó).
- Si el stack no coincide con ningún template, se genera configuración genérica.