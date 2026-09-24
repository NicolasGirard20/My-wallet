#!/bin/bash
# init_project.sh — Scaffolding automático de configuración de agentes para cualquier proyecto
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../templates"

echo "=== Scaffolding de Agentes para: $(basename "$PROJECT_ROOT") ==="

# Detectar binario de Python
PYTHON_BIN=$(command -v python3 2>/dev/null || command -v python 2>/dev/null || echo "python")

# Paso 1: Detectar stack
echo "[1/4] Detectando stack tecnológico..."
STACK_JSON=$("$PYTHON_BIN" "$SCRIPT_DIR/detect_stack.py" "$PROJECT_ROOT")
FRAMEWORK=$(echo "$STACK_JSON" | "$PYTHON_BIN" -c "import sys,json; print(json.load(sys.stdin).get('framework','unknown'))")
echo "  Framework detectado: $FRAMEWORK"

# Paso 2: Elegir template
TEMPLATE_DIR=""
USE_FRAMEWORK_FALLBACK=""
case "$FRAMEWORK" in
    dotnet-mvc|aspnet-mvc)
        TEMPLATE_DIR="$TEMPLATES_DIR/dotnet-mvc"
        echo "  Template: dotnet-mvc"
        ;;
    nextjs)
        if echo "$STACK_JSON" | "$PYTHON_BIN" -c "import sys,json; s=json.load(sys.stdin); exit(0 if s.get('orm')=='prisma' else 1)" 2>/dev/null; then
            TEMPLATE_DIR="$TEMPLATES_DIR/nextjs-prisma"
            echo "  Template: nextjs-prisma"
        else
            echo "  Template: nextjs (genérico, sin template específico)"
        fi
        ;;
    react-vite|react)
        TEMPLATE_DIR="$TEMPLATES_DIR/react-vite"
        echo "  Template: react-vite"
        ;;
    angular|vue|svelte|astro|solid|nuxt|remix)
        USE_FRAMEWORK_FALLBACK="1"
        echo "  Framework sin template dedicado: $FRAMEWORK (fallback generativo)"
        ;;
    *)
        TEMPLATE_DIR="$TEMPLATES_DIR/vanilla-ts"
        echo "  Template: vanilla-ts (genérico)"
        ;;
esac

# Paso 3: Generar archivos de configuración
echo "[2/4] Generando .opencode/config.json..."
echo "$STACK_JSON" | "$PYTHON_BIN" "$SCRIPT_DIR/generate_config.py" "$PROJECT_ROOT"

echo "[3/4] Generando coding-rules.json, AGENTS.md y DESIGN.md..."
if [ -n "$USE_FRAMEWORK_FALLBACK" ]; then
    echo "  Generando coding-rules.json específico de $FRAMEWORK (sin AGENTS.md)..."
    echo "$STACK_JSON" | "$PYTHON_BIN" "$SCRIPT_DIR/generate_framework_rules.py" "$PROJECT_ROOT"
else
    echo "$STACK_JSON" | "$PYTHON_BIN" "$SCRIPT_DIR/scaffold_rules.py" "$PROJECT_ROOT"
fi

# Si existe template, copiar y reemplazar placeholders
if [ -n "$TEMPLATE_DIR" ] && [ -d "$TEMPLATE_DIR" ]; then
    echo "[3b/4] Aplicando template: $(basename "$TEMPLATE_DIR")..."
    PROJECT_NAME=$(basename "$PROJECT_ROOT")

    for tmpl_file in "$TEMPLATE_DIR"/*.json; do
        if [ -f "$tmpl_file" ]; then
            filename=$(basename "$tmpl_file")
            target=""
            case "$filename" in
                config.json) target="$PROJECT_ROOT/.opencode/config.json" ;;
                coding-rules.json) target="$PROJECT_ROOT/.agents/rules/coding-rules.json" ;;
            esac
            if [ -n "$target" ]; then
                sed "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$tmpl_file" > "$target"
                echo "    $filename aplicado"
            fi
        fi
    done
fi

# Paso 4: Ejecutar project-mapper por primera vez
echo "[4/4] Generando mapa inicial del proyecto..."
if [ -f "$PROJECT_ROOT/.agents/skills/project-mapper/scripts/generate_map.py" ]; then
    "$PYTHON_BIN" "$PROJECT_ROOT/.agents/skills/project-mapper/scripts/generate_map.py" \
        --project "$PROJECT_ROOT" \
        --output "$PROJECT_ROOT/.agents/skills/project-mapper/resources/project_map.json" \
        --force
    echo "  Mapa generado"
else
    echo "  WARN: project-mapper no encontrado, saltando"
fi

# Hacer ejecutable init.sh
if [ -f "$PROJECT_ROOT/.agents/init.sh" ]; then
    chmod +x "$PROJECT_ROOT/.agents/init.sh"
fi

echo ""
echo "=== Scaffolding completado para: $(basename "$PROJECT_ROOT") ==="
echo "  .opencode/config.json      → Configuración técnica"
echo "  .agents/rules/coding-rules.json → Reglas estructuradas"
echo "  AGENTS.md                  → Reglas de negocio"
echo "  .agents/rules/DESIGN.md    → Diseño y arquitectura"
echo "  .agents/skills/            → Skills locales (project-mapper, prompt-toolkit, agent-init)"
echo ""
echo "Personaliza AGENTS.md con la descripción y reglas específicas de tu proyecto."