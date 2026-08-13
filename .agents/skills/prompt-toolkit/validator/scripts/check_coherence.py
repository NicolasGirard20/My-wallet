#!/usr/bin/env python3
import json
import re
import sys


def _word_tokens(prompt: str):
    return re.findall(r"\b\w+\b", prompt.lower())


def _repetition_ratio(tokens):
    if not tokens:
        return 0.0
    repeated = len(tokens) - len(set(tokens))
    return repeated / len(tokens)


def _has_context(prompt: str):
    context_markers = (
        "contexto",
        "context",
        "archivo",
        "objetivo",
        "goal",
        "scope",
        "input",
        "variables",
    )
    lower_prompt = prompt.lower()
    return any(marker in lower_prompt for marker in context_markers)


def _has_contradiction(prompt: str):
    lower_prompt = prompt.lower()
    contradiction_pairs = (
        ("haz", "no hagas"),
        ("include", "do not include"),
        ("usa", "no uses"),
        ("agrega", "no agregues"),
        ("show", "do not show"),
    )
    return any(a in lower_prompt and b in lower_prompt for a, b in contradiction_pairs)


def check(prompt: str, rules: dict):
    coherence = rules.get("coherence", {})
    issues = []
    tokens = _word_tokens(prompt)

    if len(tokens) < coherence.get("min_words", 3):
        issues.append(f"COHERENCE: menos de {coherence.get('min_words', 3)} palabras")

    repetition_ratio = _repetition_ratio(tokens)
    if repetition_ratio > coherence.get("max_repetition_ratio", 0.4):
        issues.append(
            f"COHERENCE: repetición exacta {repetition_ratio:.2f} > {coherence.get('max_repetition_ratio', 0.4):.2f}"
        )

    if coherence.get("require_context", True) and not _has_context(prompt):
        issues.append("COHERENCE: falta contexto explícito")

    if _has_contradiction(prompt):
        issues.append("COHERENCE: instrucciones contradictorias detectadas")

    return issues


if __name__ == "__main__":
    data = json.load(sys.stdin)
    print(json.dumps(check(data["prompt"], data["rules"]), indent=2, ensure_ascii=False))