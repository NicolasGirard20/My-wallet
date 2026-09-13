#!/usr/bin/env python3
"""Genera .opencode/config.json a partir del stack detectado."""

import json
import os
import sys


def generate_config(stack, project_root):
    config = {
        "project": stack.get("project_name", os.path.basename(project_root)),
        "agent": {
            "on_session_start": ".agents/init.sh",
            "rules_source": "AGENTS.md",
            "coding_rules": ".agents/rules/coding-rules.json"
        },
        "skills": {
            "project-mapper": {
                "type": "local",
                "path": ".agents/skills/project-mapper",
                "auto_trigger": {
                    "on_session_start": True,
                    "map_ttl_hours": 2,
                    "force_regenerate_if_missing": True
                },
                "scripts": {
                    "generate": ".agents/skills/project-mapper/scripts/generate_map.py",
                    "inject": ".agents/skills/project-mapper/scripts/inject_relevant.py",
                    "compress": ".agents/skills/project-mapper/scripts/compress_context.py"
                },
                "output": ".agents/skills/project-mapper/resources"
            },
            "prompt-toolkit": {
                "type": "local",
                "path": ".agents/skills/prompt-toolkit",
                "validate_critical_prompts": True,
                "validator_rules": ".agents/skills/prompt-toolkit/validator/rules.json",
                "project_rules_overlay": ".agents/rules/coding-rules.json"
            },
            "agent-init": {
                "type": "local",
                "path": ".agents/skills/agent-init",
                "auto_trigger": {
                    "on_first_session": True
                }
            }
        }
    }

    return config


if __name__ == "__main__":
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    stack_input = sys.stdin.read() if not sys.stdin.isatty() else "{}"
    stack = json.loads(stack_input) if stack_input.strip() else {}

    config = generate_config(stack, project_root)

    output_dir = os.path.join(project_root, ".opencode")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "config.json")

    with open(output_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"config.json generado en {output_path}")