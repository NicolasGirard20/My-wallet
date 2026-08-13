
---
trigger: always_on
---

Project Mapper
---
name: project-mapper
description: Mapea la estructura completa de un proyecto, comprime el contexto con LLMLingua e inyecta solo las partes relevantes según la tarea. Actívala cuando el usuario necesite entender, refactorizar o modificar código que implique múltiples archivos.
---

# Project Mapper — Skill Nativa Antigravity

## Objetivo
Reducir el costo de tokens del agente generando un mapa estructurado del proyecto, comprimiéndolo con LLMLingua e inyectando solo el contexto relevante para cada tarea específica.

## Consideración
Siempre consultar antes de leer la carpeta node_modules o el archivo pnpm-lock.yaml (si es que se encuentran presentes en el proyecto)

## CUÁNDO ACTIVAR ESTA SKILL (obligatorio)

Esta skill DEBE activarse automáticamente cuando:

1. El usuario inicia una nueva sesión de trabajo y no existe un mapa reciente (< 2 horas)
2. El usuario pide: "mapea el proyecto", "entendé la estructura", "explicame el código"
3. La tarea implica leer o modificar más de 2 archivos
4. El usuario menciona: refactor, arquitectura, dependencias, módulos, estructura
5. El agente detecta que está leyendo los mismos archivos múltiples veces

NO activar cuando:
- La tarea es trivial (cambiar un string, formatear código)
- Solo se edita 1 archivo que ya está abierto en contexto
- El usuario dice explícitamente "no uses el mapper"

## FLUJO DE TRABAJO OBLIGATORIO

### Paso 1: Generar el mapa del proyecto
Ejecuta SIEMPRE al inicio si no hay mapa reciente:

```powershell
python .\.agents\skills\project-mapper\scripts\generate_map.py --project . --output .\.agents\skills\project-mapper\resources\project_map.json --force
```

```bash
python3 .agents/skills/project-mapper/scripts/generate_map.py --project . --output .agents/skills/project-mapper/resources/project_map.json --force
```


### Paso 2: Inyectar contexto relevante (inject_relevant.py)
Ejecuta de forma automática DESPUÉS del paso 1 y antes de cada tarea concreta para filtrar solo los archivos necesarios de acuerdo a la tarea.

```powershell
python .\.agents\skills\project-mapper\scripts\inject_relevant.py --map .\.agents\skills\project-mapper\resources\project_map.json --query "descripción de tu tarea aquí" --output .\.agents\skills\project-mapper\resources\context_task.json
```

```bash
python3 .agents/skills/project-mapper/scripts/inject_relevant.py --map .agents/skills/project-mapper/resources/project_map.json --query "descripción de tu tarea aquí" --output .agents/skills/project-mapper/resources/context_task.json
```
(Puedes incluir flags como --max-files 10 o --dep-depth 2 si necesitas controlar la cantidad de dependencias a inyectar).

### Paso 3: Comprimir contexto (compress_context.py)
Ejecuta SOLO de manera excepcional, cuando el mapa o los archivos inyectados son demasiado grandes (>4000 tokens estimados) o si el agente detecta que el contexto se ha vuelto demasiado largo.

```powershell
python .\.agents\skills\project-mapper\scripts\compress_context.py --input .\.agents\skills\project-mapper\resources\project_map.json --output .\.agents\skills\project-mapper\resources\project_map_compressed.json --ratio 0.4
```

```bash
python3 .agents/skills/project-mapper/scripts/compress_context.py --input .agents/skills/project-mapper/resources/project_map.json --output .agents/skills/project-mapper/resources/project_map_compressed.json --ratio 0.4
```
(El ratio se puede ajustar a 0.3 para compresión más agresiva o 0.6 para ser más conservador).

### Paso 4: Creación / Verificación del archivo DESIGN.md (si no existe)
Si el archivo `DESIGN.md` no está presente en la carpeta `.agents` (o `.agents/rules/`):
- El agente DEBE crearlo automáticamente a partir de la información y estructura analizadas del proyecto.
- **Contenido fundamental de `DESIGN.md`**:
  - **Arquitectura del Proyecto**: Estructura de carpetas, capas del sistema y organización del código.
  - **Patrones de Diseño**: Definición de los patrones arquitectónicos y de componentes detectados en el proyecto (ej. Atomic Design, Custom Hooks, Redux/Zustand, MVC, etc.).
  - **Reglas de Consistencia**: Normas estrictas a cumplir para preservar el mismo patrón de diseño en cualquier nueva funcionalidad o refactor.
  - **Consideraciones Anti-Alucinación Frontend**: Guías sobre sistema de estilos, tokens visuales, nomenclatura, librería de UI y convenciones para evitar alucinaciones o invención de estilos incongruentes al desarrollar interfaces de usuario.

