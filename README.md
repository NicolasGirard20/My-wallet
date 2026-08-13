# My Wallet

Aplicación para gestionar ingresos, gastos, ahorros e inversiones de forma simple y visual.

## Objetivo

Centralizar el control del dinero personal con una interfaz moderna, métricas claras y una base de datos sólida para futuras extensiones.

## Propuestas a realizar

### 1) Gestión de usuarios

Agregar una capa de usuarios con autenticación real y perfiles independientes.

Propuesta:
- Registro y login por usuario
- Cada usuario tiene sus propios movimientos, categorías y metas
- Roles básicos: usuario normal y administrador
- Seguridad de sesión y manejo correcto de permisos

### 2) Carga automática de transferencias

Conectar la aplicación con APIs de bancos o servicios como Mercado Pago para importar movimientos automáticamente.

Propuesta:
- Conexión con API externa para traer transferencias y pagos
- Importación automática o manual por periodo
- Normalización de datos para que entren en el formato del sistema
- Validación para evitar duplicados o movimientos inconsistentes

> Si no es simple integrar directamente con un banco, se puede empezar por una integración genérica con Mercado Pago y luego escalar a otras instituciones.

### 3) Panel de administración

Agregar un área administrativa para gestionar configuraciones y funcionalidades avanzadas.

Propuesta:
- Sección de admin para configurar API keys
- Guardado seguro de claves de servicios externos
- Control de integraciones y conexiones activas
- Historial o logs de uso de servicios externos

### 4) IA para resumen y asesoramiento financiero

Usar una API key del administrador para habilitar funciones de IA dentro del sistema.

Propuesta:
- Resumen automático de gastos e ingresos por período
- Recomendaciones sobre ahorro o reducción de gastos
- Asesor financiero simple basado en los datos del usuario
- Alertas o tips para mejorar hábitos de consumo

Ejemplos de uso:
- "¿En qué gasté más este mes?"
- "¿Qué tan saludable está mi presupuesto?"
- "¿Dónde puedo recortar gastos sin afectar mucho?"

## Roadmap sugerido

1. Gestión de usuarios y permisos
2. Integración con Mercado Pago o API bancaria
3. Panel admin con configuración de API keys
4. Funcionalidades de IA para resumen y asesoramiento
5. Mejoras de UX y reportes avanzados

## Nota

Estas ideas sirven como base para evolucionar la app desde un MVP personal hacia una herramienta más completa, útil y escalable.
