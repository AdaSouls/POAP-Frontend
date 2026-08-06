# Análisis estratégico del proyecto — 2026-08-03

Resultado de una revisión completa del estado del proyecto (código real + docs + repo hermano
`../POAP-Midnight` en modo lectura + búsqueda pública sobre el grant Catalyst), hecha para
responder: ¿estamos bien encaminados?, ¿qué hay que solucionar?, ¿qué falta?, ¿qué agrega valor?

## Resumen

En lo que depende de este repo, el proyecto está bien encaminado: la integración Midnight
(`src/midnight/providers.ts`, `contract.service.ts`, `src/jsx/contexts/drawer/useMidnight.js`)
está escrita con criterio — los supuestos no verificados contra un nodo real están comentados
explícitamente en el código, no escondidos. Las features nuevas (`collection-share.ts`,
`organizerDashboard.jsx`, `sharedCollection.jsx`) están completas y testeadas. 97/97 tests pasan,
18/18 suites, build sano.

Pero el proyecto completo (frontend + backend `POAP-Midnight`) tiene un bloqueo real en la ruta
crítica del grant: nunca se validó el flujo de claim/mint contra un contrato Midnight desplegado.
Todo lo Midnight-crítico está probado solo con mocks.

## El milestone de Catalyst (Fund 11, proyecto #1100234)

`docs/CHANGE-REQUEST.md` fija el cierre del **Hito 5 para el 2026-10-30**, con criterios de
aceptación literales:
1. Contrato desplegado en Mainnet.
2. Indexer en vivo, sincronizado.
3. 3 wallets distintas reclamando SPOAPs.
4. Prueba ZK básica funcionando (esto ya lo cubre el flujo normal de claim/mint de Midnight —
   cada transacción en Compact genera una prueba ZK vía el proof server; no requiere un circuito
   nuevo).
5. Video demo.

Fuentes públicas confirmadas: [POAP in Cardano — Fund 11](https://projectcatalyst.io/funds/11/cardano-open-developers/poap-in-cardano),
[Open Source POAP in Cardano — Fund 10](https://projectcatalyst.io/funds/10/products-and-integrations/open-source-poap-in-cardano).
No aportan detalle técnico nuevo, solo validan que el proyecto y el pivot a Midnight son reales
ante Catalyst.

## Bloqueo crítico — desfasaje de SDK en `POAP-Midnight`

Ver `docs/backend-handoff-sdk-mismatch.md` (ya redactado para pasarle al mantenedor de ese repo)
para el detalle técnico completo: `contracts/`+`scripts/` están en una generación de SDK de
Midnight distinta (y más nueva, ESM) que `indexer/` y la copia que tenemos en este frontend
(vieja, CommonJS). Además `scripts/deploy.ts` no coincide con sus propias dependencias declaradas
(`createBalancedTx` no existe en la versión instalada).

**Hallazgo nuevo (2026-08-03)**: `../POAP-Midnight/docs/product-roadmap.md` (documento interno del
backend) marca TASK-015 ("Deploy POAP contract a devnet") y TASK-022 ("Test indexer integration
end-to-end") como **completadas**, con estado global "22/42 tareas, Fase 3 en curso". Esto
contradice directamente nuestro propio hallazgo: el deploy crashea apenas arranca. O el roadmap
del backend está desactualizado/optimista, o existe una vía de deploy no versionada que no vimos
desde este lado.

**Por qué importa**: los 5 criterios de aceptación del Hito 5 dependen de un contrato desplegado +
indexer sincronizado funcionando de punta a punta. Con ~12 semanas hasta el vencimiento al momento
de este análisis, esto es la ruta crítica del grant entero — no un hallazgo técnico lateral.
Corresponde escalarlo al mantenedor de `POAP-Midnight` con esa urgencia, y confirmar si el roadmap
refleja la realidad o si hay una rama/entorno donde el deploy sí funcionó.

## Qué falta (más allá del bloqueo de deploy)

- **Validación end-to-end real**: cero corridas contra contrato/indexer real; toda la cobertura de
  test (`src/__tests__/`) es unitaria con mocks (`jest.mock()`, `mockDrawerContext`). No hay
  herramientas de e2e (Cypress/Playwright) ni de accesibilidad (axe/jest-axe) en `package.json`.
- **README desactualizado por completo**: sigue describiendo la arquitectura Ethereum/MetaMask/
  WalletConnect (`cd App`, ethers.js 6.13.1, Web3 1.2.2) — cero mención a Midnight o Lace. Es la
  primera impresión para cualquier revisor de Catalyst.
- **Documentación de usuario final** (no de desarrollador) para organizador/holder: no existe.

## Recomendaciones de valor — ¿son imprescindibles para Catalyst?

**No.** Los 5 criterios de aceptación del Hito 5 son literales y no incluyen ninguna de estas
mejoras. Lo único imprescindible para cumplir el grant tal como está definido es **destrabar el
deploy y validar los 5 criterios**. Estas recomendaciones son valor agregado de producto —
recomendadas, no gating:

1. `docs/e2e-test-results.md` con capturas reales apenas se destrabe el deploy — pesa más ante
   Catalyst que cualquier feature nueva porque documenta directamente el criterio de aceptación.
2. Open Graph tags dinámicos en `sharedCollection.jsx` — costo bajo, impacto alto en adopción
   social (los POAPs son inherentemente compartibles).
3. Export CSV de holders en `organizerDashboard.jsx` (dato ya público en el ledger).
4. A mediano plazo, el diferencial de producto más fuerte: una prueba de asistencia selectiva real
   ("asistí a X sin revelar el resto"), aprovechando que Midnight es ZK-privacy de verdad. Hoy
   fuera de alcance porque requeriría un circuito nuevo en el contrato — vale plantearlo como
   pedido formal al mantenedor de `POAP-Midnight`, no construirlo unilateralmente desde acá.

## Conclusión práctica

Estamos bien como estamos en términos de alcance del grant: no falta sumar features para cumplir
el Hito 5. Lo que sí falta, y es urgente, es desbloquear el deploy del contrato para poder
demostrar los 5 criterios de aceptación antes del 2026-10-30. Las recomendaciones de valor son para
después de eso, o en paralelo si hay ancho de banda, pero no deben competir por prioridad con
destrabar el bloqueo del backend.
