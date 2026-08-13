#!/usr/bin/env python3
import json, sys, re

def scan(prompt: str, rules: dict):
    issues = []
    for pattern in rules.get("forbidden_patterns", []):
        if re.search(pattern, prompt, re.IGNORECASE):
            issues.append(f"INJECTION_DETECTED: coincidencia con '{pattern}'")
    for pattern in rules.get("dangerous_instructions", []):
        if re.search(pattern, prompt, re.IGNORECASE):
            issues.append(f"DANGEROUS: posible instrucción dañina '{pattern}'")
    return issues

if __name__ == "__main__":
    data = json.load(sys.stdin)
    print(json.dumps(scan(data["prompt"], data["rules"]), indent=2))