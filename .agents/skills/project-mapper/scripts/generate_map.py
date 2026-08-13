#!/usr/bin/env python3
"""
Project Mapper - Generador de mapas estructurados para proyectos de código.
Integrado nativamente con el ecosistema Antigravity.
"""

import os
import sys
import json
import ast
import re
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Any, Optional


LANGUAGE_MAP = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'jsx',
    '.tsx': 'tsx',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.kt': 'kotlin',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
    '.swift': 'swift',
}


class PythonSymbolExtractor(ast.NodeVisitor):
    """Extrae símbolos de archivos Python."""
    
    def __init__(self):
        self.imports: List[str] = []
        self.classes: List[Dict] = []
        self.functions: List[Dict] = []
        self.exports: List[str] = []
        self.docstrings: Dict[str, str] = {}
    
    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node):
        module = node.module or ''
        for alias in node.names:
            self.imports.append(f"{module}.{alias.name}")
        self.generic_visit(node)
    
    def visit_ClassDef(self, node):
        docstring = ast.get_docstring(node)
        self.classes.append({
            'name': node.name,
            'line': node.lineno,
            'docstring': docstring[:200] if docstring else None,
            'methods': [n.name for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        })
        self.exports.append(node.name)
        self.generic_visit(node)
    
    def visit_FunctionDef(self, node):
        docstring = ast.get_docstring(node)
        self.functions.append({
            'name': node.name,
            'line': node.lineno,
            'docstring': docstring[:200] if docstring else None,
            'is_async': False,
            'args': [arg.arg for arg in node.args.args]
        })
        if not node.name.startswith('_'):
            self.exports.append(node.name)
        self.generic_visit(node)
    
    def visit_AsyncFunctionDef(self, node):
        docstring = ast.get_docstring(node)
        self.functions.append({
            'name': node.name,
            'line': node.lineno,
            'docstring': docstring[:200] if docstring else None,
            'is_async': True,
            'args': [arg.arg for arg in node.args.args]
        })
        if not node.name.startswith('_'):
            self.exports.append(node.name)
        self.generic_visit(node)


class JSSymbolExtractor:
    """Extrae símbolos de archivos JavaScript/TypeScript."""
    
    IMPORT_PATTERNS = [
        r"import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['\"]([^'\"]+)['\"]",
        r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",
        r"import\s+['\"]([^'\"]+)['\"]",
    ]
    
    EXPORT_PATTERNS = [
        r"export\s+(?:default\s+)?(?:function|class|const|let|var|async\s+function)?\s*(\w+)",
        r"module\.exports\s*=\s*\{([^}]*)\}",
        r"exports\.(\w+)",
    ]
    
    CLASS_PATTERN = r"(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?"
    FUNCTION_PATTERN = r"(?:export\s+)?(?:async\s+)?function\s+(\w+)"
    ARROW_FUNCTION_PATTERN = r"(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]*)\s*=>"
    METHOD_PATTERN = r"(\w+)\s*\([^)]*\)\s*\{"
    
    def __init__(self, content: str):
        self.content = content
        self.imports: List[str] = []
        self.classes: List[Dict] = []
        self.functions: List[Dict] = []
        self.exports: List[str] = []
    
    def extract(self):
        # Imports
        for pattern in self.IMPORT_PATTERNS:
            self.imports.extend(re.findall(pattern, self.content))
        
        # Clases
        for match in re.finditer(self.CLASS_PATTERN, self.content):
            self.classes.append({
                'name': match.group(1),
                'line': self.content[:match.start()].count('\n') + 1,
                'extends': match.group(2),
                'docstring': None
            })
        
        # Funciones
        for match in re.finditer(self.FUNCTION_PATTERN, self.content):
            self.functions.append({
                'name': match.group(1),
                'line': self.content[:match.start()].count('\n') + 1,
                'is_async': 'async' in match.group(0),
                'docstring': None
            })
        
        # Arrow functions exportadas
        for match in re.finditer(self.ARROW_FUNCTION_PATTERN, self.content):
            self.functions.append({
                'name': match.group(1),
                'line': self.content[:match.start()].count('\n') + 1,
                'is_async': 'async' in match.group(0),
                'docstring': None
            })
        
        # Exports
        for pattern in self.EXPORT_PATTERNS:
            matches = re.findall(pattern, self.content)
            for m in matches:
                if isinstance(m, str):
                    self.exports.append(m.strip())
                elif isinstance(m, tuple):
                    self.exports.extend([x.strip() for x in m[0].split(',') if x.strip()])
        
        return self


class ProjectMapper:
    """Mapea un proyecto completo generando un JSON estructurado."""
    
    IGNORE_DIRS = {
        '.git', '.venv', 'venv', 'node_modules', '__pycache__', '.pytest_cache',
        'dist', 'build', '.idea', '.vscode', '.agents', '.agent', 'coverage',
        '.tox', 'htmlcov', '.mypy_cache', '.ruff_cache', '.next', 'out',
        '.gitignore', '.dockerignore', '.env', '.env.local',
    }
    
    IGNORE_FILES = {
        '.pyc', '.pyo', '.pyd', '.so', '.dll', '.dylib', '.egg', '.whl',
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2',
        '.ttf', '.eot', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.zip',
        '.tar', '.gz', '.rar', '.7z', '.pdf', '.doc', '.docx', '.xls',
        '.lock', '.log', '.min.js', '.min.css',
    }
    
    def __init__(self, project_path: Path):
        self.project_path = project_path.resolve()
        self.files_data: List[Dict[str, Any]] = []
        self.dependency_graph: Dict[str, List[str]] = {}
        self.entry_points: List[str] = []
        self.total_symbols = 0
        self.all_imports: Dict[str, List[str]] = {}
    
    def should_ignore(self, path: Path) -> bool:
        if any(part in self.IGNORE_DIRS for part in path.parts):
            return True
        if path.suffix.lower() in self.IGNORE_FILES:
            return True
        if path.name.startswith('.') and path.is_file():
            return True
        return False
    
    def extract_python_symbols(self, content: str, file_path: Path) -> Dict[str, Any]:
        try:
            tree = ast.parse(content)
            extractor = PythonSymbolExtractor()
            extractor.visit(tree)
            
            self.total_symbols += len(extractor.classes) + len(extractor.functions)
            
            return {
                'imports': extractor.imports,
                'classes': extractor.classes,
                'functions': extractor.functions,
                'exports': extractor.exports,
                'summary': self._generate_summary(content, file_path, extractor),
            }
        except SyntaxError as e:
            return {
                'imports': [],
                'classes': [],
                'functions': [],
                'exports': [],
                'summary': f"Archivo Python (error de sintaxis: {e.msg})",
            }
    
    def extract_js_symbols(self, content: str, file_path: Path) -> Dict[str, Any]:
        extractor = JSSymbolExtractor(content)
        extractor.extract()
        
        self.total_symbols += len(extractor.classes) + len(extractor.functions)
        
        return {
            'imports': extractor.imports,
            'classes': extractor.classes,
            'functions': extractor.functions,
            'exports': extractor.exports,
            'summary': self._generate_summary(content, file_path, extractor),
        }
    
    def _generate_summary(self, content: str, file_path: Path, extractor) -> str:
        parts = []
        name = file_path.name.lower()
        stem = file_path.stem.lower()
        
        # Detectar patrón por nombre
        if any(x in name for x in ['test', 'spec', '__tests__']):
            parts.append("Archivo de tests")
        elif any(x in name for x in ['config', 'settings', '.env', 'rc']):
            parts.append("Configuración")
        elif any(x in stem for x in ['main', 'app', 'index', 'server', 'cli']):
            parts.append("Punto de entrada")
            self.entry_points.append(str(file_path.relative_to(self.project_path)))
        elif any(x in stem for x in ['route', 'controller', 'handler']):
            parts.append("Maneja rutas/endpoints")
        elif any(x in stem for x in ['model', 'schema', 'entity', 'dto']):
            parts.append("Define modelos de datos")
        elif any(x in stem for x in ['service', 'usecase', 'interactor']):
            parts.append("Lógica de negocio")
        elif any(x in stem for x in ['util', 'helper', 'common', 'shared']):
            parts.append("Utilidades")
        elif any(x in stem for x in ['middleware', 'guard', 'interceptor']):
            parts.append("Middleware/infraestructura")
        elif any(x in stem for x in ['repository', 'dao', 'db']):
            parts.append("Acceso a datos")
        
        # Detectar por contenido
        if extractor.classes:
            class_names = [c['name'] if isinstance(c, dict) else c for c in extractor.classes[:3]]
            parts.append(f"Clases: {', '.join(class_names)}")
        
        funcs = [f['name'] if isinstance(f, dict) else f for f in extractor.functions]
        public_funcs = [f for f in funcs if not f.startswith('_')]
        if public_funcs:
            parts.append(f"Funciones: {', '.join(public_funcs[:5])}")
        
        if not parts:
            if 'class ' in content:
                parts.append("Contiene clases")
            elif 'def ' in content or 'function ' in content:
                parts.append("Contiene funciones")
            else:
                parts.append(f"Archivo {file_path.suffix}")
        
        return " | ".join(parts)
    
    def calculate_complexity(self, content: str) -> str:
        lines = [l for l in content.split('\n') if l.strip()]
        if len(lines) < 30:
            return 'low'
        elif len(lines) < 100:
            return 'medium'
        else:
            return 'high'
    
    def process_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            return None
        
        rel_path = str(file_path.relative_to(self.project_path))
        suffix = file_path.suffix.lower()
        language = LANGUAGE_MAP.get(suffix, 'unknown')
        
        if language == 'python':
            symbols = self.extract_python_symbols(content, file_path)
        elif language in ('javascript', 'typescript', 'jsx', 'tsx'):
            symbols = self.extract_js_symbols(content, file_path)
        else:
            symbols = {
                'imports': [],
                'classes': [],
                'functions': [],
                'exports': [],
                'summary': f"Archivo {language}",
            }
        
        self.all_imports[rel_path] = symbols['imports']
        
        return {
            'path': rel_path,
            'language': language,
            'size_lines': len(content.split('\n')),
            'summary': symbols['summary'],
            'imports': symbols['imports'],
            'exports': symbols['exports'],
            'classes': symbols['classes'],
            'functions': symbols['functions'],
            'complexity': self.calculate_complexity(content),
        }
    
    def build_dependency_graph(self):
        """Construye el grafo de dependencias resolviendo imports a archivos locales."""
        file_map = {f['path']: f for f in self.files_data}
        
        for file_data in self.files_data:
            deps = set()
            imports = file_data.get('imports', [])
            
            for imp in imports:
                # Resolver import a archivo local
                imp_parts = imp.replace('.', '/').split('/')
                
                # Probar varias combinaciones
                candidates = []
                base = '/'.join(imp_parts)
                
                for ext in ['.py', '.js', '.ts', '.jsx', '.tsx', '']:
                    candidates.append(base + ext)
                    candidates.append(base + '/index' + ext)
                    candidates.append(base + '/__init__' + ext)
                
                for candidate in candidates:
                    if candidate in file_map and candidate != file_data['path']:
                        deps.add(candidate)
                        break
            
            self.dependency_graph[file_data['path']] = sorted(list(deps))
    
    def detect_architecture(self) -> Dict[str, Any]:
        dirs = set()
        for f in self.files_data:
            parts = Path(f['path']).parts
            if len(parts) > 1:
                dirs.add(parts[0])
        
        core, utils, tests, config, infra = [], [], [], [], []
        
        for d in dirs:
            dl = d.lower()
            if any(x in dl for x in ['src', 'app', 'lib', 'core', 'modules', 'components', 'packages']):
                core.append(d)
            elif any(x in dl for x in ['test', 'spec', 'tests', '__tests__', 'e2e']):
                tests.append(d)
            elif any(x in dl for x in ['util', 'helper', 'tools', 'scripts', 'shared', 'common']):
                utils.append(d)
            elif any(x in dl for x in ['config', 'settings', 'env', 'docker', 'k8s', '.github']):
                config.append(d)
            elif any(x in dl for x in ['infra', 'deploy', 'terraform', 'ansible']):
                infra.append(d)
        
        return {
            'entry_points': self.entry_points or ['(detectar manualmente)'],
            'core_modules': sorted(core),
            'utils': sorted(utils),
            'tests': sorted(tests),
            'config': sorted(config),
            'infrastructure': sorted(infra),
            'all_directories': sorted(dirs),
        }
    
    def estimate_compression(self) -> str:
        if not self.files_data:
            return "0%"
        total_lines = sum(f['size_lines'] for f in self.files_data)
        map_lines = len(self.files_data) * 12
        if total_lines == 0:
            return "0%"
        ratio = (1 - map_lines / total_lines) * 100
        return f"{min(ratio, 95):.1f}%"
    
    def generate_map(self) -> Dict[str, Any]:
        print(f"🔍 Escaneando proyecto: {self.project_path}")
        
        for root, dirs, files in os.walk(self.project_path):
            dirs[:] = [d for d in dirs if d not in self.IGNORE_DIRS and not d.startswith('.')]
            
            for file in files:
                file_path = Path(root) / file
                if self.should_ignore(file_path):
                    continue
                
                file_data = self.process_file(file_path)
                if file_data:
                    self.files_data.append(file_data)
        
        self.build_dependency_graph()
        architecture = self.detect_architecture()
        
        return {
            'project_name': self.project_path.name,
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'total_files': len(self.files_data),
            'total_symbols': self.total_symbols,
            'architecture': architecture,
            'files': sorted(self.files_data, key=lambda x: x['path']),
            'dependency_graph': self.dependency_graph,
            'metadata': {
                'mapper_version': '2.0.0',
                'languages_found': sorted(set(f['language'] for f in self.files_data)),
                'compression_ratio_estimate': self.estimate_compression(),
            }
        }


def main():
    parser = argparse.ArgumentParser(description='Project Mapper para Antigravity')
    parser.add_argument('--project', '-p', type=str, default='.', help='Ruta al proyecto')
    parser.add_argument('--output', '-o', type=str, required=True, help='Ruta de salida del JSON')
    parser.add_argument('--force', '-f', action='store_true', help='Forzar regeneración')
    
    args = parser.parse_args()
    
    project_path = Path(args.project).resolve()
    output_path = Path(args.output).resolve()
    
    # Verificar mapa existente
    if not args.force and output_path.exists():
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            generated = datetime.fromisoformat(existing['generated_at'].replace('Z', '+00:00'))
            age = (datetime.utcnow() - generated.replace(tzinfo=None)).total_seconds() / 3600
            
            if age < 2:
                print(f"✅ Mapa reciente ({age:.1f}h). Usando existente.")
                print(f"   Archivo: {output_path}")
                return
        except Exception:
            pass
    
    mapper = ProjectMapper(project_path)
    project_map = mapper.generate_map()
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(project_map, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Mapa generado: {output_path}")
    print(f"   📁 Archivos: {project_map['total_files']}")
    print(f"   🔣 Símbolos: {project_map['total_symbols']}")
    print(f"   🌐 Lenguajes: {', '.join(project_map['metadata']['languages_found'])}")
    print(f"   💰 Ahorro estimado: {project_map['metadata']['compression_ratio_estimate']}")


if __name__ == '__main__':
    main()