#!/usr/bin/env python3
"""
Compresión de contexto con LLMLingua para Antigravity.
Reduce el tamaño del mapa del proyecto manteniendo la información esencial.
"""

import sys
import json
import argparse
from pathlib import Path

try:
    # pyrefly: ignore [missing-import]
    from llmlingua import PromptCompressor
    LLMLINGUA_AVAILABLE = True
except ImportError:
    LLMLINGUA_AVAILABLE = False
    print("⚠️  LLMLingua no instalado. Usando compresión alternativa.")
    print("   Instalar: pip install llmlingua")


class ContextCompressor:
    """Comprime mapas de proyecto usando LLMLingua o fallback."""
    
    def __init__(self, model_name: str = None, use_llmlingua2: bool = True):
        self.compressor = None
        
        if LLMLINGUA_AVAILABLE:
            try:
                self.compressor = PromptCompressor(
                    model_name=model_name or "microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank",
                    use_llmlingua2=use_llmlingua2
                )
                print("✅ LLMLingua-2 cargado correctamente")
            except Exception as e:
                print(f"⚠️  Error cargando LLMLingua: {e}")
                print("   Usando compresión alternativa")
    
    def compress_with_llmlingua(self, text: str, ratio: float = 0.4) -> str:
        """Comprime texto usando LLMLingua."""
        if not self.compressor:
            return self._fallback_compress(text, ratio)
        
        try:
            result = self.compressor.compress_prompt_llmlingua2(
                text,
                rate=ratio,
                force_tokens=['path', 'exports', 'dependencies', 'summary']
            )
            return result['compressed_prompt']
        except Exception as e:
            print(f"⚠️  Error en compresión LLMLingua: {e}")
            return self._fallback_compress(text, ratio)
    
    def _fallback_compress(self, text: str, ratio: float) -> str:
        """Compresión alternativa cuando LLMLingua no está disponible."""
        # Estrategia: eliminar campos menos críticos y resumir
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Si no es JSON, truncar
            target_len = int(len(text) * ratio)
            return text[:target_len] + "\n...[truncado]..."
        
        # Comprimir estructura del mapa
        if 'files' in data:
            compressed_files = []
            for f in data['files']:
                # Mantener solo campos esenciales
                compressed = {
                    'path': f.get('path'),
                    'summary': f.get('summary'),
                    'exports': f.get('exports', []),
                    'dependencies': f.get('dependencies', []),
                    'complexity': f.get('complexity'),
                }
                compressed_files.append(compressed)
            data['files'] = compressed_files
        
        # Eliminar metadatos verbose
        if 'metadata' in data:
            data['metadata']['compression_note'] = f"Fallback compression at {ratio*100:.0f}%"
        
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    def compress_map(self, input_path: Path, ratio: float = 0.4) -> dict:
        """Comprime un mapa de proyecto completo."""
        with open(input_path, 'r', encoding='utf-8') as f:
            original_data = json.load(f)
        
        original_text = json.dumps(original_data)
        original_tokens = len(original_text) // 4  # Estimación aproximada
        
        print(f"📊 Tokens originales estimados: ~{original_tokens}")
        print(f"🎯 Ratio de compresión objetivo: {ratio*100:.0f}%")
        
        # Comprimir el texto completo
        compressed_text = self.compress_with_llmlingua(original_text, ratio)
        
        # Intentar parsear de vuelta
        try:
            compressed_data = json.loads(compressed_text)
        except json.JSONDecodeError:
            # Si LLMLingua devuelve texto no-JSON, reconstruir
            compressed_data = self._reconstruct_from_compressed(original_data, ratio)
        
        compressed_tokens = len(json.dumps(compressed_data)) // 4
        actual_ratio = compressed_tokens / original_tokens if original_tokens > 0 else 0
        
        compressed_data['metadata'] = compressed_data.get('metadata', {})
        compressed_data['metadata']['compression'] = {
            'original_tokens_estimate': original_tokens,
            'compressed_tokens_estimate': compressed_tokens,
            'target_ratio': ratio,
            'actual_ratio': round(actual_ratio, 2),
            'method': 'llmlingua-2' if self.compressor else 'fallback',
        }
        
        return compressed_data
    
    def _reconstruct_from_compressed(self, original: dict, ratio: float) -> dict:
        """Reconstruye el mapa comprimido manteniendo estructura."""
        result = {
            'project_name': original.get('project_name'),
            'generated_at': original.get('generated_at'),
            'total_files': original.get('total_files'),
            'architecture': original.get('architecture', {}),
            'files': [],
            'dependency_graph': original.get('dependency_graph', {}),
            'metadata': original.get('metadata', {}),
        }
        
        # Seleccionar archivos más relevantes (entry points + complejidad alta)
        files = original.get('files', [])
        
        # Siempre incluir entry points
        entry_points = set(result['architecture'].get('entry_points', []))
        
        # Priorizar por complejidad y exports
        prioritized = sorted(files, key=lambda f: (
            f['path'] in entry_points,
            {'high': 3, 'medium': 2, 'low': 1}.get(f.get('complexity', 'low'), 0),
            len(f.get('exports', [])),
        ), reverse=True)
        
        # Tomar solo el ratio solicitado
        keep_count = max(1, int(len(prioritized) * ratio))
        result['files'] = prioritized[:keep_count]
        result['total_files'] = len(result['files'])
        
        # Filtrar grafo de dependencias
        kept_paths = {f['path'] for f in result['files']}
        result['dependency_graph'] = {
            k: [d for d in v if d in kept_paths]
            for k, v in result.get('dependency_graph', {}).items()
            if k in kept_paths
        }
        
        return result


def main():
    parser = argparse.ArgumentParser(description='Comprime mapas de proyecto con LLMLingua')
    parser.add_argument('--input', '-i', type=str, required=True, help='Mapa de entrada JSON')
    parser.add_argument('--output', '-o', type=str, required=True, help='Mapa comprimido de salida')
    parser.add_argument('--ratio', '-r', type=float, default=0.4, help='Ratio de compresión (0.1-0.9)')
    parser.add_argument('--model', '-m', type=str, default=None, help='Modelo LLMLingua alternativo')
    
    args = parser.parse_args()
    
    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    
    if not input_path.exists():
        print(f"❌ Error: No existe {input_path}")
        sys.exit(1)
    
    compressor = ContextCompressor(model_name=args.model)
    compressed = compressor.compress_map(input_path, ratio=args.ratio)
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(compressed, f, indent=2, ensure_ascii=False)
    
    meta = compressed['metadata']['compression']
    print(f"✅ Mapa comprimido guardado: {output_path}")
    print(f"   📉 Tokens: ~{meta['original_tokens_estimate']} → ~{meta['compressed_tokens_estimate']}")
    print(f"   📊 Ratio real: {meta['actual_ratio']*100:.1f}%")
    print(f"   🔧 Método: {meta['method']}")


if __name__ == '__main__':
    main()