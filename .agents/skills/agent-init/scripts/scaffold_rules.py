#!/usr/bin/env python3
"""Genera coding-rules.json y AGENTS.md skeleton a partir del stack detectado."""

import json
import os
import subprocess
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass


def generate_coding_rules(stack, project_root):
    framework = stack.get("framework", "unknown")
    styling = stack.get("styling", "unknown")
    ui_lib = stack.get("ui_library", "unknown")
    orm = stack.get("orm", None)
    auth = stack.get("auth", None)
    lang = stack.get("language", "typescript")

    rules = {
        "project": stack.get("project_name", os.path.basename(project_root)),
        "typescript": {
            "strict": lang == "typescript",
            "forbid_any": lang == "typescript",
            "forbid_deep_relative_imports": True,
            "prefer_path_alias": True
        },
        "nomenclature": {
            "components": "PascalCase.tsx",
            "services": "camelCase.ts",
            "pages": "page.tsx | layout.tsx | error.tsx" if framework == "nextjs" else "camelCase.tsx",
            "folders": "kebab-case",
            "code_language": "en",
            "ui_language": "es"
        },
        "styling": {
            "framework": styling,
            "forbid_css_in_js": styling == "tailwindcss",
            "forbid_inline_styles": True,
            "ui_library": ui_lib,
            "icon_library": "lucide-react" if ui_lib in ("radix-ui", "shadcn") else "unknown",
            "chart_library": "recharts" if ui_lib in ("radix-ui", "shadcn") else "unknown"
        },
        "architecture": {},
        "react": {},
        "security": {},
        "code_quality": {
            "lint_before_finish": True,
            "lint_command": "npm run lint",
            "no_new_deps_without_justification": True
        }
    }

    if framework == "nextjs":
        rules["architecture"]["prisma_only_in_services"] = orm == "prisma"
        rules["architecture"]["services_path"] = "src/services/<dominio>/" if os.path.exists(os.path.join(project_root, "src", "services")) else "services/"
        rules["architecture"]["models_path"] = "src/global/models/index.ts" if os.path.exists(os.path.join(project_root, "src", "global", "models")) else "src/types/index.ts"
        rules["architecture"]["validators_path"] = "src/helpers/validators/" if os.path.exists(os.path.join(project_root, "src", "helpers", "validators")) else "src/validators/"
        rules["architecture"]["global_state"] = "Context API"
        rules["architecture"]["forbid_new_state_libs"] = True
        rules["react"]["server_components_by_default"] = True
        rules["react"]["use_client_minimal"] = True
        rules["react"]["forms_library"] = "react-hook-form"
        rules["react"]["modals_library"] = "radix-ui" if ui_lib in ("radix-ui", "shadcn") else "unknown"
        rules["react"]["notifications_library"] = "sonner" if ui_lib in ("radix-ui", "shadcn") else "unknown"
    elif framework in ("react", "react-vite"):
        rules["architecture"]["services_path"] = "src/services/"
        rules["architecture"]["global_state"] = "Context API"
        rules["react"]["forms_library"] = "react-hook-form"
        rules["react"]["modals_library"] = "unknown"
        rules["react"]["notifications_library"] = "sonner"
    elif framework in ("dotnet-mvc", "aspnet-mvc"):
        rules["csharp"] = {
            "controllers": "Controllers/*Controller.cs",
            "models": "Models/*.cs",
            "views": "Views/{Controller}/{Action}.cshtml",
            "razor_encoding": "utf-8-sig"
        }
        rules["nomenclature"] = {
            "controllers": "*Controller.cs",
            "models": "*Model.cs | *ViewModel.cs",
            "views": "*.cshtml",
            "folders": "PascalCase",
            "code_language": "es",
            "ui_language": "es"
        }
        rules["styling"] = {
            "framework": "bootstrap",
            "version": "5.3",
            "ui_library": "bootstrap",
            "icon_library": "bootstrap-icons-1.11.3",
            "notifications_library": "sweetalert2"
        }
        rules["architecture"] = {
            "pattern": "MVC (.NET Framework 4.8)",
            "view_engine": "Razor",
            "orm": "EntityFramework 6",
            "controllers_path": "Controllers/",
            "views_path": "Views/",
            "models_path": "Models/",
            "scripts_path": "Scripts/",
            "content_path": "Content/"
        }
        rules["code_quality"] = {
            "razor_bom_mandatory": True,
            "lint_before_finish": False,
            "no_new_deps_without_justification": True
        }
        rules.pop("typescript", None)
        rules.pop("react", None)

    if auth:
        rules["security"]["auth_type"] = auth
        rules["security"]["forbid_secrets_in_code"] = True
        rules["security"]["forbid_passwords_in_logs"] = True
        rules["security"]["auth_required_pages"] = auth != "none"
        rules["security"]["validate_inputs_before_persist"] = True
    else:
        rules["security"]["forbid_secrets_in_code"] = True
        rules["security"]["validate_inputs_before_persist"] = True

    if orm == "prisma":
        rules["security"]["prisma_prevents_sql_injection"] = True

    return rules


def generate_agents_md(stack, project_root):
    framework = stack.get("framework", "unknown")
    styling = stack.get("styling", "unknown")
    ui_lib = stack.get("ui_library", "unknown")
    orm = stack.get("orm", None)
    auth = stack.get("auth", None)
    lang = stack.get("language", "typescript")
    project_name = stack.get("project_name", os.path.basename(project_root))

    if framework in ("dotnet-mvc", "aspnet-mvc"):
        return f"""# {project_name} — Reglas de Diseño y Arquitectura

> Este documento es la fuente de verdad para cualquier agente o desarrollador que trabaje en este proyecto. Toda regla aquí descrita debe respetarse sin excepción.

---

## 1. Arquitectura del Proyecto

El sistema está desarrollado sobre **ASP.NET MVC (.NET Framework 4.8)** utilizando el motor de vistas **Razor (`.cshtml`)**.

### Estructura de Carpetas
```
{_generate_folder_tree(project_root)}
```

### Capas y Responsabilidades
1. **Controladores (`Controllers/`)**: Manejan las peticiones HTTP, orquestan la lógica y devuelven vistas Razor o `JsonResult`.
2. **Modelos y ViewModels (`Models/`)**: Clases de dominio, entidades de Entity Framework y modelos fuertemente tipados para vistas.
3. **Vistas (`Views/`)**: Vistas Razor (`.cshtml`) organizadas por controlador y vistas parciales compartidas (`Views/Shared/`).
4. **Recursos Estáticos (`Content/`, `Scripts/`, `Images/`)**: Estilos CSS, scripts del cliente (jQuery, Bootstrap) e imágenes.

---

## 2. Reglas Críticas de Desarrollo

### Codificación Obligatoria: UTF-8 con BOM en Vistas Razor (.cshtml)
- **OBLIGATORIO**: Todo archivo `.cshtml` DEBE guardarse estrictamente con codificación **UTF-8 con BOM** (`utf-8-sig` / bytes `0xEF, 0xBB, 0xBF`).
- En .NET Framework sobre IIS, los archivos Razor sin BOM se interpretan por defecto como ANSI (Windows-1252), corrompiendo caracteres con tildes (`á`, `é`, `í`), la `ñ` y signos (`¿`, `¡`).
- Preferir entidades HTML (`&aacute;`, `&oacute;`, `&ntilde;`, etc.) para blindar textos fijos ante variaciones de encoding.

### Interfaz de Usuario y Componentes Visuales
- Utilizar exclusivamente **Bootstrap Icons 1.11.3** (`<i class="bi bi-[nombre]"></i>`).
- Tarjetas de Acción (`.action-card`): bordes redondeados (`border-radius: 16px`), elevación suave y contenedor de ícono con colores semánticos (`.icon-green`, `.icon-purple`, `.icon-amber`, `.icon-blue`).
- Notificaciones: Usar la función global `ShowAlert(mensaje, tipo)` basada en SweetAlert2.
- Indicadores de Carga: Usar `ShowLoading()` y `HideLoading()` integrados en `_Layout.cshtml`.

### Seguridad
- **Prohibido incluir secrets en código o Web.config**: Utilizar `secrets.config` (ignorado en git) referenciado desde `Web.config`: `<appSettings file="secrets.config">`.
- Usar siempre `@Html.AntiForgeryToken()` en formularios y `[ValidateAntiForgeryToken]` en acciones POST.

---

## 3. Integración con Agentes de IA

| Recurso | Función |
| :--- | :--- |
| `.opencode/config.json` | Configuración técnica del agente y triggers |
| `.agents/init.ps1` / `init.sh` | Inicialización y verificación de estado |
| `.agents/rules/DESIGN.md` | Guía de diseño visual y patrones de componentes |
| `.agents/rules/FRONTEND_ENCODING.md` | Regla obligatoria de UTF-8 con BOM |
| `.agents/rules/MAPPER.md` | Reglas operativas del Project Mapper nativo |
| `.agents/skills/project-mapper/` | Mapeo estructurado y filtrado de contexto |
"""

    md = f"""# {project_name} — Reglas de Diseño y Arquitectura

> Este documento es la fuente de verdad para cualquier agente o desarrollador que trabaje en este proyecto. Toda regla aquí descrita debe respetarse sin excepción. Nada de lo que no esté respaldado por el código debe suponerse ni inventarse.

---

## Integración con Agentes de IA

Este proyecto cuenta con un sistema de configuración para agentes de IA. Los siguientes archivos orquestan el comportamiento automático del agente:

| Archivo | Rol |
|---------|-----|
| `.opencode/config.json` | Configuración técnica del agente: skills, triggers, rutas de scripts |
| `.agents/init.sh` | Script de bootstrap que se ejecuta al iniciar cada sesión (genera mapa del proyecto, verifica dependencias) |
| `.agents/rules/coding-rules.json` | Reglas de estilo y arquitectura en formato estructurado para validación automática de prompts |
| `.agents/skills/project-mapper/` | Skill local que mapea la estructura completa del proyecto y filtra contexto relevante |
| `.agents/skills/prompt-toolkit/` | Skill local con templates de prompts parametrizables y validador de seguridad |

### Flujo de inicio de sesión
1. El agente lee `.opencode/config.json` para conocer las skills y reglas del proyecto.
2. Ejecuta `.agents/init.sh` que regenera el mapa del proyecto si es necesario.
3. Consulta `AGENTS.md` como fuente de verdad para reglas de negocio, stack y convenciones.
4. Usa `.agents/rules/coding-rules.json` para validar que los prompts generados respeten las reglas del proyecto.
5. Antes de enviar prompts críticos, los valida contra `.agents/skills/prompt-toolkit/validator/rules.json`.

---

## Arquitectura General

- **Proyecto**: `{project_name}` — descripción pendiente.
- **Stack detectado**:
  - **Framework**: {framework}
  - **Lenguaje**: {lang}
  - **Estilos**: {styling}
  - **UI Library**: {ui_lib}
  - **ORM**: {orm or "ninguno"}
  - **Auth**: {auth or "pendiente de definir"}
"""

    if framework == "nextjs":
        md += """  - **App Router**: Next.js App Router
"""

    md += f"""
### Estructura de carpetas
```
{_generate_folder_tree(project_root)}
```

### Capas
1. **Rutas/páginas**: componentes de página.
2. **Componentes**: UI de aplicación.
3. **Estado global**: Context API.
4. **Services**: capa de acceso a datos.
5. **Helpers**: utilidades, validadores, auth.

---

## Reglas de Diseño

### Nomenclatura
- Archivos de componentes: `PascalCase.tsx`
- Services y helpers: `camelCase.ts`
- Carpetas: `kebab-case`
- Código en inglés; **labels y mensajes al usuario en español**.

### Componentes
- Estilos: **solo clases de Tailwind CSS** (si aplica).
- Librería de iconos única.
- Composición sobre herencia.

### React / TypeScript
- TypeScript estricto: **prohibido `any`**.
- Server Components por defecto; `'use client'` solo donde haga falta.

---

## Seguridad (REGLA CRÍTICA)

- **Nunca exponer secrets** en código, logs, ni respuestas de API.
- **Validación de inputs** antes de persistir.
- Base de datos: acceso únicamente vía ORM (queries parametrizadas).

## Estilo de código

- Lint antes de considerar terminado un cambio.
- Imports con path alias; evitar imports relativos profundos.
- Sin comentarios obvios; comentarios solo para lógica no evidente.

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run start    # servidor de producción
npm run lint     # eslint
```

---

## Mantenimiento de este documento

- Actualizar `AGENTS.md` siempre que cambien: estructura de carpetas, stack, convenciones, reglas de seguridad o comandos.
- Reflejar cambios también en `.agents/rules/coding-rules.json`.
- Si cambian rutas de skills o triggers, actualizar `.opencode/config.json`.
- Fuente de verdad para cambios estructurales: ejecutar `.agents/init.sh` para regenerar el mapa antes de redactar.
"""

    return md


def _generate_folder_tree(project_root, max_depth=2):
    lines = []
    prefixes = []
    try:
        entries = sorted(os.listdir(project_root))
    except Exception:
        return "  (pendiente de escanear)"

    for i, entry in enumerate(entries):
        if entry.startswith(".") or entry in ("node_modules", ".git"):
            continue
        full = os.path.join(project_root, entry)
        is_last = i == len(entries) - 1
        prefix = "└── " if is_last else "├── "
        lines.append(f"{prefix}{entry}/" if os.path.isdir(full) else f"{prefix}{entry}")
    return "\n".join(lines[:20]) if lines else "  (pendiente de escanear)"


def generate_design_file(stack, project_root):
    """Genera DESIGN.md sin sobrescribir decisiones del usuario."""
    design_script = os.path.join(os.path.dirname(__file__), "generate_design.py")
    subprocess.run(
        [sys.executable, design_script, project_root],
        input=json.dumps(stack),
        text=True,
        check=True,
    )


if __name__ == "__main__":
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    stack_input = sys.stdin.read() if not sys.stdin.isatty() else "{}"
    stack = json.loads(stack_input) if stack_input.strip() else {}

    rules = generate_coding_rules(stack, project_root)
    agents_md = generate_agents_md(stack, project_root)

    rules_dir = os.path.join(project_root, ".agents", "rules")
    os.makedirs(rules_dir, exist_ok=True)

    with open(os.path.join(rules_dir, "coding-rules.json"), "w", encoding="utf-8") as f:
        json.dump(rules, f, indent=2, ensure_ascii=False)
    print("coding-rules.json generado")

    agents_path = os.path.join(project_root, "AGENTS.md")
    if os.path.exists(agents_path):
        print(f"AGENTS.md ya existe; se conserva: {agents_path}")
    else:
        with open(agents_path, "w", encoding="utf-8") as f:
            f.write(agents_md)
        print("AGENTS.md generado")

    generate_design_file(stack, project_root)