---
name: prompt-toolkit
description: >-
  Biblioteca de templates de prompts parametrizables y validador de seguridad.
  Úsala cuando el usuario quiera: (a) aplicar un prompt template reutilizable,
  (b) validar un prompt antes de enviarlo al modelo, o (c) sanitizar instrucciones
  potencialmente riesgosas. Incluye templates para coding, review y meta-prompts,
  más reglas de longitud, coherencia e inyección de prompts.
---

# Prompt Toolkit

## 1. Biblioteca de templates
Los templates viven en `templates/`. Para usarlos:
1. Lee `templates/index.json` para ver el catálogo.
2. Carga el archivo `.md` o `.json` solicitado.
3. Reemplaza las variables `{{nombre}}` con los valores proporcionados por el usuario.
4. Si faltan variables obligatorias, pregunta antes de renderizar.

### Convenciones de variables
- `{{lang}}` → lenguaje de programación
- `{{code}}` → bloque de código a procesar
- `{{goal}}` → objetivo en lenguaje natural
- `{{framework}}` → framework de testing/stack

## 2. Validador de prompts
Antes de enviar cualquier prompt al modelo, ejecuta la validación:

### Paso 1: Carga reglas
Lee `validator/rules.json`.

### Paso 2: Ejecuta sanitizadores
Corre los scripts en `validator/scripts/` pasando el prompt por stdin como JSON:
```json
{"prompt": "...", "rules": {...}}
```
Scripts principales:
- `validator/scripts/check_length.py`: detecta prompts demasiado largos.
- `validator/scripts/detect_injection.py`: detecta jailbreaks e instrucciones peligrosas.
- `validator/scripts/check_coherence.py`: detecta incoherencias, repetición excesiva y falta de contexto.

### Paso 3: Evalúa severidad
- **BLOCK**: Si hay coincidencias en forbidden_patterns o dangerous_instructions,
detén el flujo, informa al usuario y NO envíes el prompt.
- **WARN**: Si hay problemas de longitud o coherencia, muestra advertencia
y pide confirmación antes de continuar.

### Paso 3b: Validación de coherencia (fallback si no hay scripts)
Si los scripts no pueden ejecutarse, aplica heurísticas inline:
- **Rechaza prompts con < 3 palabras.**
- **Rechaza si más del 40% del texto es repetición exacta.**
- **Rechaza si contiene instrucciones contradictorias ("haz X" + "no hagas X").**

## 3. Ejemplos de uso
Consulta `examples/usage.md` para ver un flujo completo de selección de template,
renderizado de variables y validación previa al envío.