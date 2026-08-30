#!/usr/bin/env python3
"""Detecta el stack tecnológico de un proyecto leyendo package.json y archivos de configuración."""

import json
import os
import sys


def read_json(path):
    with open(path) as f:
        return json.load(f)


def detect_stack(project_root):
    pkg_path = os.path.join(project_root, "package.json")
    if not os.path.exists(pkg_path):
        return {"error": "package.json no encontrado", "framework": "unknown"}

    pkg = read_json(pkg_path)
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    all_deps_lower = {k.lower(): v for k, v in deps.items()}

    stack = {
        "project_name": pkg.get("name", os.path.basename(project_root)),
        "language": "typescript" if any("typescript" in k for k in all_deps_lower) else "javascript",
        "framework": "unknown",
        "orm": None,
        "styling": None,
        "ui_library": None,
        "auth": None,
        "testing": None,
        "has_app_router": False,
        "has_pages_router": False,
    }

    if "next" in all_deps_lower:
        stack["framework"] = "nextjs"
        try:
            next_config = read_json(os.path.join(project_root, "next.config.json")) if os.path.exists(os.path.join(project_root, "next.config.json")) else {}
            if os.path.exists(os.path.join(project_root, "next.config.js")) or os.path.exists(os.path.join(project_root, "next.config.mjs")):
                pass
        except Exception:
            pass
        if os.path.exists(os.path.join(project_root, "src", "app")):
            stack["has_app_router"] = True
        if os.path.exists(os.path.join(project_root, "src", "pages")) or os.path.exists(os.path.join(project_root, "pages")):
            stack["has_pages_router"] = True
    elif "@remix-run" in str(all_deps_lower) or "remix" in all_deps_lower:
        stack["framework"] = "remix"
    elif "react" in all_deps_lower:
        if "vite" in all_deps_lower:
            stack["framework"] = "react-vite"
        else:
            stack["framework"] = "react"
    elif "@sveltejs/kit" in all_deps_lower or "sveltekit" in all_deps_lower:
        stack["framework"] = "svelte"
        stack["sveltekit"] = True
    elif "svelte" in all_deps_lower:
        stack["framework"] = "svelte"
    elif "astro" in all_deps_lower:
        stack["framework"] = "astro"
    elif "solid-start" in all_deps_lower or "@solidjs/start" in all_deps_lower:
        stack["framework"] = "solid"
    elif "solid" in all_deps_lower or "@solidjs/core" in all_deps_lower:
        stack["framework"] = "solid"
    elif "nuxt" in all_deps_lower or "@nuxt/core" in all_deps_lower:
        stack["framework"] = "nuxt"
    elif "vue" in all_deps_lower:
        if "nuxt" in all_deps_lower:
            stack["framework"] = "nuxt"
        else:
            stack["framework"] = "vue"
    elif "angular" in all_deps_lower or "@angular/core" in all_deps_lower:
        stack["framework"] = "angular"

    if "prisma" in all_deps_lower:
        stack["orm"] = "prisma"
        if os.path.exists(os.path.join(project_root, "prisma", "schema.prisma")):
            stack["prisma_schema"] = "prisma/schema.prisma"
    elif "drizzle-orm" in all_deps_lower:
        stack["orm"] = "drizzle"
    elif "typeorm" in all_deps_lower:
        stack["orm"] = "typeorm"

    if "tailwindcss" in all_deps_lower:
        stack["styling"] = "tailwindcss"
    elif "styled-components" in all_deps_lower:
        stack["styling"] = "styled-components"
    elif "@emotion/react" in all_deps_lower:
        stack["styling"] = "emotion"
    elif "sass" in all_deps_lower or "node-sass" in all_deps_lower:
        stack["styling"] = "sass"

    if "@radix-ui" in str(all_deps_lower) or "radix-ui" in str(all_deps_lower):
        stack["ui_library"] = "radix-ui"
    elif "@shadcn" in str(all_deps_lower) or "shadcn" in str(all_deps_lower):
        stack["ui_library"] = "shadcn"
    elif "antd" in all_deps_lower or "@ant-design" in str(all_deps_lower):
        stack["ui_library"] = "ant-design"
    elif "@mui" in str(all_deps_lower) or "@material-ui" in str(all_deps_lower):
        stack["ui_library"] = "material-ui"
    elif "chakra" in all_deps_lower or "@chakra-ui" in str(all_deps_lower):
        stack["ui_library"] = "chakra-ui"

    if "next-auth" in all_deps_lower or "next-auth" in str(all_deps_lower):
        stack["auth"] = "next-auth"
    elif "clerk" in str(all_deps_lower):
        stack["auth"] = "clerk"
    elif "jose" in all_deps_lower:
        stack["auth"] = "jwt-custom"
    elif "bcrypt" in all_deps_lower or "bcryptjs" in all_deps_lower:
        if not stack["auth"]:
            stack["auth"] = "custom-hashed"

    if "jest" in all_deps_lower:
        stack["testing"] = "jest"
    elif "vitest" in all_deps_lower:
        stack["testing"] = "vitest"
    elif "@testing-library" in str(all_deps_lower):
        stack["testing"] = "testing-library"

    return stack


if __name__ == "__main__":
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    stack = detect_stack(project_root)
    print(json.dumps(stack, indent=2))