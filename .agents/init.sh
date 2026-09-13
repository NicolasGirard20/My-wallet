#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME=$(basename "$PROJECT_ROOT")
MAPPER_RESOURCES="$PROJECT_ROOT/.agents/skills/project-mapper/resources"
MAP_FILE="$MAPPER_RESOURCES/project_map.json"

echo "=== Inicialización de Agente — $PROJECT_NAME ==="

# Auto-scaffolding si no existe config.json (primera vez en el proyecto)
if [ ! -f "$PROJECT_ROOT/.opencode/config.json" ]; then
    echo "Configuración no encontrada. Ejecutando scaffolding inicial..."
    if [ -f "$PROJECT_ROOT/.agents/skills/agent-init/scripts/init_project.sh" ]; then
        bash "$PROJECT_ROOT/.agents/skills/agent-init/scripts/init_project.sh"
    else
        echo "ERROR: agent-init no encontrado. Copia las skills primero."
        exit 1
    fi
fi

if [ ! -f "$PROJECT_ROOT/.agents/skills/project-mapper/scripts/generate_map.py" ]; then
    echo "ERROR: project-mapper no encontrado localmente"
    exit 1
fi

if [ ! -f "$MAP_FILE" ] || [ "$(find "$MAP_FILE" -mmin +120 2>/dev/null)" ]; then
    echo "Regenerando mapa del proyecto..."
    python3 "$PROJECT_ROOT/.agents/skills/project-mapper/scripts/generate_map.py" \
        --project "$PROJECT_ROOT" \
        --output "$MAP_FILE" \
        --force
    echo "Mapa generado: $MAP_FILE"
else
    echo "Mapa reciente encontrado. Saltando generación."
fi

if [ ! -f "$PROJECT_ROOT/.agents/skills/prompt-toolkit/validator/rules.json" ]; then
    echo "WARN: prompt-toolkit validator no encontrado"
fi

echo "=== Listo ==="