---
name: project-mapper
description: Mapea la estructura completa de un proyecto, comprime el contexto con LLMLingua e inyecta solo las partes relevantes según la tarea. Actívala cuando el usuario necesite entender, refactorizar o modificar código que implique múltiples archivos.
---

# Project Mapper

## Objetivo
Reducir el costo de tokens del agente generando un mapa estructurado del proyecto, comprimiéndolo con LLMLingua e inyectando solo el contexto relevante para cada tarea específica.

## Consideraciones

- Resolver primero la raíz del proyecto y la ubicación de la skill. En este repositorio la instalación es `local/.agents`; en un proyecto instalado directamente es `.agents`.
- No leer `node_modules` ni `pnpm-lock.yaml` sin avisar al usuario y obtener confirmación explícita.
- El mapa es un índice, no sustituye la lectura de los archivos fuente relevantes.
- No inferir patrones arquitectónicos que no estén respaldados por archivos, imports, configuración o tests.

## Cuándo activar

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

## Flujo de trabajo

### Paso 1: Generar el mapa del proyecto
Ejecuta al inicio si el mapa no existe o está obsoleto. Usa `--force` solo cuando hubo cambios externos importantes o el usuario lo pide.

```powershell
python .agents/skills/project-mapper/scripts/generate_map.py --project . --output .agents/skills/project-mapper/resources/project_map.json
```

```bash
python3 .agents/skills/project-mapper/scripts/generate_map.py --project . --output .agents/skills/project-mapper/resources/project_map.json
```


### Paso 2: Inyectar contexto relevante (inject_relevant.py)
Ejecuta de forma automática DESPUÉS del paso 1 y antes de cada tarea concreta para filtrar solo los archivos necesarios de acuerdo a la tarea.

```powershell
python .\.agents\skills\project-mapper\scripts\inject_relevant.py --map .\.agents\skills\project-mapper\resources\project_map.json --query "descripción de tu tarea aquí" --output .\.agents\skills\project-mapper\resources\context_task.json
```

```bash
python3 .agents/skills/project-mapper/scripts/inject_relevant.py --map .agents/skills/project-mapper/resources/project_map.json --query "descripción de tu tarea aquí" --output .agents/skills/project-mapper/resources/context_task.json
```
(Puedes incluir flags como `--max-files 10` o `--dep-depth 2` si necesitas controlar la cantidad de dependencias a inyectar). Si la skill está instalada en `local/.agents`, sustituye `.agents` por `local/.agents`.

### Paso 3: Comprimir contexto (compress_context.py)
Ejecuta SOLO de manera excepcional, cuando el mapa o los archivos inyectados son demasiado grandes (>4000 tokens estimados) o si el agente detecta que el contexto se ha vuelto demasiado largo.

```powershell
python .\.agents\skills\project-mapper\scripts\compress_context.py --input .\.agents\skills\project-mapper\resources\project_map.json --output .\.agents\skills\project-mapper\resources\project_map_compressed.json --ratio 0.4
```

```bash
python3 .agents/skills/project-mapper/scripts/compress_context.py --input .agents/skills/project-mapper/resources/project_map.json --output .agents/skills/project-mapper/resources/project_map_compressed.json --ratio 0.4
```
(El ratio se puede ajustar a 0.3 para compresión más agresiva o 0.6 para ser más conservador).

## Paso 4: Verificación de DESIGN.md
Si existe `DESIGN.md` en `.agents/rules/` (o `local/.agents/rules/`), consúltalo antes de proponer cambios de frontend. Si no existe, no lo crees automáticamente salvo que el usuario lo solicite o el proyecto necesite documentar su diseño.

Cuando se cree o actualice, debe basarse únicamente en evidencia del proyecto y contener:
- **Contenido fundamental de `DESIGN.md`**:
  - **Arquitectura del Proyecto**: Estructura de carpetas, capas del sistema y organización del código.
  - **Patrones de Diseño**: Definición de los patrones arquitectónicos y de componentes detectados en el proyecto (ej. Atomic Design, Custom Hooks, Redux/Zustand, MVC, etc.).
  - **Reglas de Consistencia**: Normas estrictas a cumplir para preservar el mismo patrón de diseño en cualquier nueva funcionalidad o refactor.
  - **Consideraciones Anti-Alucinación Frontend**: Guías sobre sistema de estilos, tokens visuales, nomenclatura, librería de UI y convenciones para evitar alucinaciones o invención de estilos incongruentes al desarrollar interfaces de usuario.

