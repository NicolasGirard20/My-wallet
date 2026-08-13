#!/usr/bin/env python3
"""
Inyección selectiva de contexto para Antigravity.
Extrae solo los archivos/símbolos relevantes para una tarea específica.
"""

import sys
import json
import re
import argparse
from pathlib import Path
from typing import List, Dict, Any, Set


class RelevantContextInjector:
    """Inyecta solo el contexto relevante para una tarea dada."""
    
    def __init__(self, map_path: Path):
        with open(map_path, 'r', encoding='utf-8') as f:
            self.project_map = json.load(f)
        
        self.files = {f['path']: f for f in self.project_map.get('files', [])}
        self.dependency_graph = self.project_map.get('dependency_graph', {})
    
    def score_relevance(self, file_data: Dict, query: str) -> float:
        """Puntúa qué tan relevante es un archivo para la query."""
        query_lower = query.lower()
        query_terms = set(query_lower.split())
        
        score = 0.0
        
        # 1. Match en nombre de archivo
        path_lower = file_data['path'].lower()
        if any(term in path_lower for term in query_terms):
            score += 3.0
        
        # 2. Match en summary
        summary = file_data.get('summary', '').lower()
        if any(term in summary for term in query_terms):
            score += 2.5
        
        # 3. Match en exports
        exports = [e.lower() for e in file_data.get('exports', [])]
        for exp in exports:
            if any(term in exp for term in query_terms):
                score += 2.0
        
        # 4. Match en funciones/clases
        functions = [f['name'].lower() if isinstance(f, dict) else f.lower() 
                    for f in file_data.get('functions', [])]
        for func in functions:
            if any(term in func for term in query_terms):
                score += 1.5
        
        # 5. Match en imports (dependencias)
        imports = [i.lower() for i in file_data.get('imports', [])]
        for imp in imports:
            if any(term in imp for term in query_terms):
                score += 1.0
        
        # 6. Bonus por complejidad si hay match
        if score > 0 and file_data.get('complexity') == 'high':
            score += 0.5
        
        # 7. Bonus para entry points
        if file_data['path'] in self.project_map.get('architecture', {}).get('entry_points', []):
            score += 0.3
        
        return score
    
    def get_relevant_files(self, query: str, top_k: int = 10) -> List[Dict]:
        """Obtiene los archivos más relevantes para la query."""
        scored = []
        
        for path, file_data in self.files.items():
            score = self.score_relevance(file_data, query)
            if score > 0:
                scored.append((score, file_data))
        
        # Ordenar por relevancia
        scored.sort(key=lambda x: x[0], reverse=True)
        
        # Tomar top_k
        return [f for _, f in scored[:top_k]]
    
    def get_dependency_chain(self, file_paths: List[str], depth: int = 2) -> Set[str]:
        """Obtiene la cadena de dependencias hasta cierta profundidad."""
        result = set(file_paths)
        current = set(file_paths)
        
        for _ in range(depth):
            next_level = set()
            for path in current:
                deps = self.dependency_graph.get(path, [])
                for dep in deps:
                    if dep in self.files and dep not in result:
                        next_level.add(dep)
                        result.add(dep)
            current = next_level
            if not current:
                break
        
        return result
    
    def build_context(self, query: str, include_dependencies: bool = True, 
                     dep_depth: int = 2, max_files: int = 15) -> Dict[str, Any]:
        """Construye el contexto relevante para la tarea."""
        
        # 1. Archivos directamente relevantes
        relevant = self.get_relevant_files(query, top_k=max_files)
        relevant_paths = [f['path'] for f in relevant]
        
        # 2. Agregar dependencias si se solicita
        if include_dependencies:
            dep_paths = self.get_dependency_chain(relevant_paths, depth=dep_depth)
            all_paths = dep_paths
        else:
            all_paths = set(relevant_paths)
        
        # 3. Construir resultado
        context_files = []
        for path in sorted(all_paths):
            if path in self.files:
                f = self.files[path]
                # Simplificar para inyección de contexto
                context_files.append({
                    'path': f['path'],
                    'summary': f['summary'],
                    'exports': f.get('exports', []),
                    'dependencies': self.dependency_graph.get(f['path'], []),
                    'complexity': f.get('complexity'),
                    'language': f.get('language'),
                })
        
        # 4. Detectar patrones de arquitectura relevantes
        arch = self.project_map.get('architecture', {})
        relevant_dirs = set()
        for f in context_files:
            parts = Path(f['path']).parts
            if len(parts) > 1:
                relevant_dirs.add(parts[0])
        
        return {
            'query': query,
            'generated_at': self.project_map.get('generated_at'),
            'project_name': self.project_map.get('project_name'),
            'relevant_architecture': {
                'entry_points': [ep for ep in arch.get('entry_points', []) 
                               if any(ep.startswith(d) for d in relevant_dirs)],
                'core_modules': [m for m in arch.get('core_modules', []) 
                              if m in relevant_dirs],
            },
            'files': context_files,
            'total_relevant_files': len(context_files),
            'direct_matches': len(relevant_paths),
            'dependency_includes': len(all_paths) - len(relevant_paths),
            'injection_strategy': 'selective',
        }


def main():
    parser = argparse.ArgumentParser(description='Inyecta contexto relevante para una tarea')
    parser.add_argument('--map', '-m', type=str, required=True, help='Ruta al mapa del proyecto')
    parser.add_argument('--query', '-q', type=str, required=True, help='Descripción de la tarea')
    parser.add_argument('--output', '-o', type=str, required=True, help='Archivo de salida JSON')
    parser.add_argument('--max-files', type=int, default=15, help='Máximo de archivos relevantes')
    parser.add_argument('--dep-depth', type=int, default=2, help='Profundidad de dependencias')
    parser.add_argument('--no-deps', action='store_true', help='No incluir dependencias')
    
    args = parser.parse_args()
    
    map_path = Path(args.map).resolve()
    output_path = Path(args.output).resolve()
    
    if not map_path.exists():
        print(f"❌ Error: No existe el mapa {map_path}")
        print(f"   Generá uno primero con generate_map.py")
        sys.exit(1)
    
    injector = RelevantContextInjector(map_path)
    context = injector.build_context(
        query=args.query,
        include_dependencies=not args.no_deps,
        dep_depth=args.dep_depth,
        max_files=args.max_files
    )
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(context, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Contexto relevante generado: {output_path}")
    print(f"   🎯 Query: '{args.query}'")
    print(f"   📁 Archivos directos: {context['direct_matches']}")
    print(f"   🔗 Dependencias incluidas: {context['dependency_includes']}")
    print(f"   📊 Total archivos en contexto: {context['total_relevant_files']}")
    print(f"   💡 Estrategia: {context['injection_strategy']}")


if __name__ == '__main__':
    main()