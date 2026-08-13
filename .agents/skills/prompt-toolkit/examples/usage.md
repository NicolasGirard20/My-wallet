# Uso de prompt-toolkit

Este ejemplo muestra cómo un usuario puede pedir ayuda a un agente para construir, validar y usar un prompt correctamente.

## Flujo de uso con un agente

### 1. El usuario define la necesidad

El usuario no empieza pidiendo el prompt final, sino el objetivo.

Ejemplo:

> Quiero revisar una función de autenticación para detectar riesgos de seguridad.

### 2. El agente elige el template correcto

El agente consulta `templates/index.json` y selecciona el template que mejor encaja con la tarea.

Por ejemplo:

- `review/security-review.md` para auditorías de seguridad
- `coding/refactor.md` para refactorización
- `meta/handoff.md` para transferencias entre agentes

### 3. El agente pide o completa las variables necesarias

Si faltan datos, el agente los solicita. Si ya los tiene, construye el prompt renderizado.

Ejemplo de template de revisión de seguridad:

```md
Archivo: {{file_path}}
Código a revisar:
{{code_snippet}}
```

Valores que el agente completa:

- `file_path`: `src/auth/login.py`
- `code_snippet`: bloque de código a revisar

### 4. El agente valida el prompt antes de enviarlo

Antes de mandar el prompt al modelo, el agente ejecuta los validadores del toolkit para evitar entradas incompletas o débiles.

```json
{
  "prompt": "prompt renderizado",
  "rules": {
    "max_length": 8000,
    "max_tokens_estimate": 6000,
    "coherence": {
      "min_words": 3,
      "max_repetition_ratio": 0.4,
      "require_context": true
    }
  }
}
```

Orden recomendado:

1. `check_length.py`
2. `detect_injection.py`
3. `check_coherence.py`

### 5. El agente interpreta el resultado

- `BLOCK`: el prompt no se envía y se corrige primero.
- `WARN`: se revisa manualmente antes de continuar.
- Sin hallazgos: el prompt está listo para usar.

### 6. El usuario ve el uso correcto de la skill

La skill se usa bien cuando el agente no improvisa el prompt, sino que:

- selecciona el template adecuado
- completa variables concretas
- valida el prompt antes de usarlo
- rechaza entradas sin contexto claro

## Ejemplo breve de conversación

Usuario:

> Necesito preparar un prompt para revisar este archivo.

Agente:

> Usaré el template `review/security-review.md`. Envíame `file_path` y `code_snippet` para generar el prompt renderizado y validarlo antes de usarlo.

Usuario:

> `file_path`: `src/auth/login.py`
>
> `code_snippet`: ...

Agente:

> El prompt ya está renderizado y validado. Resultado: listo para enviar.

## Regla práctica

Si el prompt no tiene contexto claro, variables concretas o una intención única, el agente debe frenarse y pedir más información o dividir la tarea en pasos más pequeños.

## Cuándo sí y cuándo no

### Sí se usa

- Cuando hay que reutilizar un template existente.
- Cuando el prompt necesita variables concretas y debe quedar consistente.
- Cuando antes de enviar el prompt conviene validar longitud, coherencia o riesgo de inyección.

### No se usa

- Cuando la tarea se resuelve sin construir un prompt nuevo.
- Cuando no existe un template adecuado y el flujo todavía no está definido.
- Cuando el trabajo pertenece a otra skill, como mapear contexto o hacer una transferencia entre agentes sin necesidad de renderizar un prompt.
