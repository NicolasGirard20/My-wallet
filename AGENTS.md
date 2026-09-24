# Flujo actual de agentes


```mermaid
flowchart TD
    IN([Solicitud del usuario]) --> ROUTE{Ruta de trabajo}

    ROUTE -->|Flujo especializado| PO[product-owner\nDefine alcance y requisitos]
    ROUTE -->|Tarea general| DEF[default\nAnaliza, busca, implementa o delega]

    PO --> PO_STATUS{Estado de requisitos}
    PO_STATUS -->|NEEDS_CLARIFICATION| ASK[Orquestador muestra preguntas]
    ASK --> ANSWER([Respuesta del usuario])
    ANSWER --> PO
    PO_STATUS -->|READY| PDR{Persistir PDR?}
    PDR -->|Sí, con aprobación| PO_PERSIST[product-owner\nActualiza PRODUCT_REQUIREMENTS.md]
    PDR -->|No| PLAN
    PO_PERSIST --> PLAN[planificador\nEjecuta project-mapper y analiza]

    DEF --> DEF_GIT{Necesita Git?}
    DEF_GIT -->|Solo lectura\nsegún default.md actual| DEF_READ[Ejecuta Git de lectura]
    DEF_GIT -->|Escritura, remoto o historial| ORCH_GIT[Informa al orquestador]
    DEF -->|No| DEF_WORK[Resuelve la tarea general]
    DEF_READ --> DEF_WORK
    DEF_WORK --> OUT([Resultado])

    PLAN --> PLAN_OUT[Diagnóstico + plan + contexto]
    PLAN_OUT --> APPROVE{¿Usuario aprueba el plan?}
    APPROVE -->|No: pide cambios| PLAN
    APPROVE -->|Sí| ARCH_DEC{Decisión arquitectónica}

    ARCH_DEC -->|ARQUITECTO: NECESARIO| ARCH[arquitecto\nValida diseño y riesgos]
    ARCH_DEC -->|ARQUITECTO: NO_NECESARIO| SEARCH_DEC
    ARCH --> SEARCH_DEC{¿Hace falta investigación externa?}

    SEARCH_DEC -->|Sí: API, librería, best practices o trade-off actual| WEB[buscador\nInvestiga fuentes externas]
    SEARCH_DEC -->|No| BUILD
    WEB --> BUILD[constructor\nImplementa y ejecuta verificaciones]

    BUILD --> TEST[tester\nPrueba e informa riesgos]
    TEST --> TEST_STATUS{Resultado del tester}
    TEST_STATUS -->|FALLA| FIX[constructor\nCorrige la implementación]
    FIX --> TEST
    TEST_STATUS -->|APROBADO o APROBADO CON RIESGOS| GIT_DEC{¿Se solicitó una acción Git?}

    GIT_DEC -->|Sí, o un agente la necesita| GIT[control-versiones\nInspecciona y ejecuta Git]
    GIT --> GIT_RISK{¿Comando Git riesgoso?}
    GIT_RISK -->|Sí| CONF[Consulta al usuario con comando y efecto]
    CONF -->|Confirma| GIT_EXEC[Ejecuta comando]
    CONF -->|No confirma| GIT_STOP[Detiene la operación]
    GIT_RISK -->|No| GIT_EXEC
    GIT_EXEC --> GIT_VERIFY[Verifica resultado con Git de lectura]
    GIT_VERIFY --> SYNTH
    GIT_STOP --> SYNTH
    GIT_DEC -->|No| SYNTH[Sintetiza resultado para el usuario]

    ORCH_GIT --> GIT
    SYNTH --> OUT

    classDef agent fill:#e8f1fb,stroke:#2563eb,color:#111827;
    classDef decision fill:#fff7ed,stroke:#ea580c,color:#111827;
    class PO,DEF,PLAN,ARCH,WEB,BUILD,TEST,GIT,PO_PERSIST agent;
    class ROUTE,PO_STATUS,PDR,DEF_GIT,APPROVE,ARCH_DEC,SEARCH_DEC,TEST_STATUS,GIT_DEC,GIT_RISK decision;
```

## Lectura fiel del flujo

- `orquestador` coordina siete subagentes y no ejecuta comandos directamente.
- `product-owner` siempre precede a `planificador` en el flujo especializado.
- `planificador` exige `project-mapper` antes del análisis.
- El usuario debe aprobar el plan antes de arquitectura, búsqueda o construcción.
- `arquitecto` solo participa cuando el planificador marca
  `ARQUITECTO: NECESARIO`.
- `buscador` solo participa cuando se necesita información externa.
- `constructor` implementa y verifica, pero no gestiona Git.
- `tester` siempre ocurre después de `constructor`; si falla, el orquestador
  devuelve el trabajo a `constructor`.
- `control-versiones` es el agente que puede ejecutar Git. Consulta al usuario
  antes de comandos que cambien índice, historial, ramas, archivos o remotos.
- El `default` tiene una ruta independiente. En su contenido actual todavía
  permite Git de lectura y bloquea Git de escritura; esto se muestra como una
  excepción explícita para no confundir el diagrama con una política futura.
