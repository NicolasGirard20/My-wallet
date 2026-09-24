#!/usr/bin/env python3
import json, sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

if sys.platform == "win32":
    try:
        sys.stdin.reconfigure(encoding="utf-8", errors="replace")
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def check(prompt: str, rules: dict):
    max_len = rules.get("max_length", 8000)
    issues = []
    if len(prompt) > max_len:
        issues.append(f"LONGITUD: {len(prompt)} > {max_len} chars")
    # Estimación simple de tokens (~4 chars/token)
    if len(prompt) // 4 > rules.get("max_tokens_estimate", 6000):
        issues.append("TOKEN_ESTIMATE: posible overflow de contexto")
    return issues

if __name__ == "__main__":
    data = json.load(sys.stdin)
    print(json.dumps(check(data["prompt"], data["rules"]), indent=2))