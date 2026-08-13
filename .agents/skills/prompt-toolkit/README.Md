# Prompt Toolkit - Skill para Agentes IA

## 📋 Qué es esto

Librería de **prompts reutilizables y validados** para tus agentes (OpenCode, AntiGravity).
Cada prompt es un "template" con variables que puedes llenar dinámicamente.

## 🏗️ Estructura

```
prompt-toolkit/
├── SKILL.md                          # Documentación principal
├── templates/                        # 🗂️ Biblioteca de prompts reutilizables
│   ├── index.json                    # Catálogo: nombre, descripción, tags, vars
│   ├── coding/
│   │   ├── refactor.md               # Refactorizar código
│   │   │                             # Vars: {{lang}}, {{code}}, {{objective}}
│   │   └── unit-test.json            # Generar tests
│   │                                 # Vars: {{lang}}, {{function}}, {{coverage}}
│   ├── review/
│   │   └── security-review.md        # Auditoría de seguridad
│   │                                 # Vars: {{code}}, {{framework}}
│   └── meta/
│       └── handoff.md                # Transferencia entre agentes
│                                     # Vars: {{context}}, {{agent_target}}
├── validator/                        # 🛡️ Validación de prompts
│   ├── rules.json                    # Configuración: límites, restricciones
│   └── scripts/
│       ├── check_length.py           # Valida longitud de prompt
│       ├── detect_injection.py       # Detecta jailbreaks/inyecciones
│       └── check_coherence.py        # Heurísticas semánticas
└── examples/
    └── usage.md                      # Cómo usar en tus agentes

## 🎯 Casos de uso

- **OpenCode**: Generar/refactorizar código automáticamente
- **AntiGravity**: Auditoría de seguridad y handoff entre agentes
- **Validación**: Garantizar que los prompts sean seguros y coherentes

## 🚀 Inicio rápido

1. Elige un template de `templates/`
2. Rellena las variables `{{variable}}`
3. Valida con `validator/` antes de enviar a OpenAI
4. Recibe respuesta estructurada del agente