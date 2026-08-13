# 🗺️ Guía de Uso — Project Mapper

## 🚀 Instalación y Requisitos

Activar el entorno virtual en Windows e instalar las dependencias:

```cmd
:: En Command Prompt (cmd)
venv\Scripts\activate.bat

:: En PowerShell
venv\Scripts\Activate.ps1

:: Instalar LLMLingua
pip install llmlingua
```

---

## 🔄 Flujo de Uso Real

> **Escenario:** Refactorizar autenticación  
> **Usuario:** *"Necesito refactorizar el sistema de autenticación para usar OAuth2"*

**Respuesta / Comportamiento automático del agente:**

```text
1. [Detecta "refactorizar" + "sistema" → activa project-mapper]
2. Ejecuta: generate_map.py → genera project_map.json
3. Ejecuta: inject_relevant.py --query "autenticación OAuth2 refactor"
   → Genera context_task.json con solo 5 archivos relevantes
4. Lee context_task.json → entiende la estructura sin escanear todo el proyecto
5. Lee SOLO los archivos identificados como relevantes
```

---

## 📋 Cuándo Usar Cada Script

| Script | Cuándo se usa | Quién lo ejecuta |
| :--- | :--- | :--- |
| `generate_map.py` | Al inicio de la sesión, o cuando el mapa tiene +2 horas | Automático — el agente lo detecta |
| `compress_context.py` | Cuando el mapa es muy grande (>4000 tokens estimados) o la tarea es muy específica | Automático — el agente decide según tamaño |
| `inject_relevant.py` | Antes de cada tarea concreta, para filtrar solo lo necesario | Automático — el agente lo ejecuta con la query de la tarea |

---

## 🛠️ Uso Manual (Cuándo y Cómo)

### 1. `generate_map.py` — Manual

**Cuándo forzarlo manualmente:**
- Pasaron más de 2 horas y el agente no lo regeneró solo.
- Hiciste `git pull` o cambios externos grandes.
- El agente parece "perdido" con la estructura actual.

**Cómo ejecutarlo:**

```bash
# Regenerar forzado
python .\.agent\skills\project-mapper\scripts\generate_map.py --project . --output .\.agent\skills\project-mapper\resources\project_map.json --force
```

---

### 2. `compress_context.py` — Manual

**Cuándo usarlo manualmente:**
- El agente te dice que el contexto es muy largo.
- Querés enviar el mapa a otro agente/LLM con límite de tokens.
- El proyecto tiene 200+ archivos y el mapa pesa >50KB.

**Cómo ejecutarlo:**

```bash
# Comprimir al 40% del tamaño original
python .agents/skills/project-mapper/scripts/compress_context.py --input .agents/skills/project-mapper/resources/project_map.json --output .agents/skills/project-mapper/resources/project_map_compressed.json --ratio 0.4
```

**Parámetros de compresión:**
- `--ratio 0.3` : Más agresivo (menos tokens, menos detalle).
- `--ratio 0.6` : Más conservador (más tokens, más detalle).

---

### 3. `inject_relevant.py` — Manual

**Cuándo usarlo manualmente:**
- El agente está leyendo archivos que no tienen nada que ver con tu tarea.
- Querés pre-filtrar el contexto antes de pedirle algo al agente.
- Estás debuggeando algo específico y querés ver solo la cadena de dependencias.

**Cómo ejecutarlo:**

```bash
# Extraer solo lo relevante para "autenticación OAuth"
python .agents/skills/project-mapper/scripts/inject_relevant.py --map .agents/skills/project-mapper/resources/project_map.json --query "autenticación OAuth login" --output .agents/skills/project-mapper/resources/context_task.json --max-files 10 --dep-depth 2
```

**Opciones útiles:**
- `--max-files 10` : Solo los 10 archivos más relevantes.
- `--dep-depth 2` : Incluye dependencias hasta 2 niveles de profundidad.
- `--no-deps` : Solo archivos directamente relevantes, sin seguir dependencias.

---

## 🌟 Regla de Oro

> [!IMPORTANT]
> 1. **Siempre empezá** con `generate_map.py`.
> 2. **Después**, si la tarea es específica, usá `inject_relevant.py`.
> 3. **Usá** `compress_context.py` solo si el agente se queja de que el contexto es demasiado largo.
