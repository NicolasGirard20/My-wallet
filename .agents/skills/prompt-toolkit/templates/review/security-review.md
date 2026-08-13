## Contexto
Archivo: {{file_path}}

## Código a revisar
```text
{{code_snippet}}
```

## Instrucciones
Actúa como revisor de seguridad de código.

Evalúa el contenido buscando, como mínimo:
- inyección de comandos, SQL, LDAP o plantillas
- autenticación y autorización débiles
- exposición de secretos, tokens o credenciales
- validación insuficiente de entradas
- manejo inseguro de archivos, rutas o deserialización
- uso inseguro de dependencias, APIs o configuraciones por defecto
- errores de control de acceso, SSRF, XSS, CSRF o fuga de datos si aplican

## Respuesta esperada
Entrega la revisión en este formato:

1. Riesgos críticos
2. Riesgos altos o medios
3. Riesgos bajos o hallazgos menores
4. Recomendaciones concretas de mitigación
5. Si no encuentras problemas, explica brevemente por qué el código parece seguro bajo este contexto

## Reglas
- Sé específico y cita la parte del código que motiva cada hallazgo.
- Prioriza impacto real sobre observaciones teóricas.
- Si faltan datos del entorno, indícalo y marca el hallazgo como condicional.
- No reescribas el código completo; enfócate en hallazgos y cambios mínimos sugeridos.