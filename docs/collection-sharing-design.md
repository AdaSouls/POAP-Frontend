# Diseño — Compartir colección (holder) + dashboard de organizador

Resultado del brainstorm (`/brainstorm`) iniciado a partir de `docs/privacy-matrix.md`. Decisiones
confirmadas por el usuario, listas para pasar a plan/tasks de implementación.

## Alcance

- Frontend-only. No se modifica `../POAP-Midnight` (contrato/witnesses/indexer) ni el backend
  REST de Souls (no es un repo nuestro — ver "Backend Souls" abajo).
- El path Cardano-nativo (`viewToken.jsx`, `checkCollection.jsx`, `souls*`, `collections*`,
  `collection.service.ts`, `token.service.ts`) queda fuera de alcance: es la primera entrega del
  proyecto, sobre otra blockchain, no algo a limpiar ni a reutilizar aquí.
- Dirección visual: dark-first, con Framer Motion para animaciones (nueva dependencia a agregar).

## Backend Souls (por qué no lo usamos para esto)

`collection.service.ts` / `token.service.ts` pegan contra `REACT_APP_API_BASE_URL`, modelado
100% para el dominio Cardano-nativo (`/collections/:id/user/:owner/sign`, `/soulbounds/:tokenId`,
etc.). No es un repo del que tengamos código fuente — a diferencia de `POAP-Midnight`, del Souls
API solo vemos el contrato REST. Meterle un dominio nuevo (perfiles compartibles de POAP)
requeriría coordinar con quien sea que lo mantiene. Por eso el diseño de abajo no depende de él.

## Compartir colección (holder) — sin backend nuevo

Dos fuentes, combinadas 100% client-side:

1. **Dato público** (tokenId, issuer, `tokenFirstEvent`) — consultado en vivo contra el indexer
   de Midnight (`REACT_APP_MIDNIGHT_INDEXER_API_URL`) al abrir el link, no guardado por nosotros.
2. **Dato privado que el holder elige revelar** (subconjunto de `attendedEventIds`) — codificado
   directamente en la URL que se genera al compartir (ej. base64 de la lista elegida). Vive solo
   en el link, nunca en un servidor nuestro.

En la página de destino, distinguir visualmente:
- **"Verificado on-chain"** — tx hash real del último claim (`src/midnight/attendance-proof.ts`,
  ya existe).
- **"Declarado por el holder"** — lo que viene codificado en la URL (no es tamper-proof; hay que
  decirlo así en la UI, no vender esto como una prueba criptográfica).

**Granularidad**: por evento, no todo-o-nada. Toggle individual por evento asistido, default
"visible", guardado en `localStorage` para no tener que re-elegir cada vez.

**Badge "Soulbound"**: no hay ningún circuito `transfer` en el contrato hoy — nada es
transferible, sea soulbound o no. Re-etiquetar el tooltip: *"Marcado como no-transferible por vos
al reclamarlo — el contrato todavía no impone esta restricción on-chain"*, para no prometer una
garantía que no existe.

## Dashboard de organizador

Página nueva y separada (no una sección dentro de `events.jsx`), pensada para ser simple de
navegar y entender. Datos: solo lo que el ledger ya expone públicamente por evento (`minted`,
`maxSupply`, `isActive`, `expiration`) — sin identidades individuales de holders más allá de lo
que el contrato ya hace público. Reusa `apexcharts` (ya instalado) para los gráficos, no hace
falta librería nueva ahí.

## Riesgos

- El link de "declarado por el holder" no es tamper-proof — mitigado con el distingo visual
  público-verificado vs. declarado.
- Dark-first toca CSS global de la plantilla qash; puede afectar páginas de template no
  relacionadas a POAP si comparten estilos base.
- Este diseño se apoya en supuestos de `providers.ts`/`contract.service.ts` marcados como no
  verificados contra un nodo real (ver `docs/privacy-matrix.md`, hallazgo 2, sobre disclosure de
  `caller_pk()`/`eventId` en cada llamada). Antes de dar por buena la parte de "verificado
  on-chain", conviene correr el devnet local de `POAP-Midnight`
  (`docker compose -f docker-compose.devnet.yml up -d`, ver `docs/environment.md` en ese repo) y
  probar el flujo real de punta a punta, no solo contra mocks.

## Próximos pasos

1. Levantar el devnet local de `POAP-Midnight` para probar el flujo de claim → indexer → frontend
   de punta a punta antes de dar el diseño por validado en la práctica.
2. Pasar esto a un plan de implementación (tasks concretas por componente/página).
