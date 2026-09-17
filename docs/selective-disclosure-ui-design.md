# Selective Disclosure UI — Design

Status: designed 2026-09-17, **implemented same day** (see "Implementation notes" at the bottom for
what shipped and two decisions made during implementation that refine this doc). Target: Catalyst
Hito 5 (2026-10-30).

## Contexto

El service layer ya existe (`src/midnight/contract.service.ts`, `merkle.ts`,
`private-attribute-drafts.ts`, `indexer.service.ts`) pero no hay ninguna pantalla que lo use. El
contrato (`../POAP-Midnight/contracts/compact/poap.compact`) expone 4 circuitos para esto:
`publishDisclosureRequest`, `proveAttributeMembership`, `proveAttributeMembershipOnce`, y
`createEvent`'s `privateAttributesRoot` param.

**Hallazgo clave (de leer el contrato directamente):** `proveAttributeMembership` no verifica
identidad de ningún tipo — solo que el caller conoce un `(value, rand)` que abre un leaf del árbol
de atributos del evento. `private-attribute-drafts.ts` ya asume que ese conocimiento vive en el
**organizer** (guarda los drafts como "organizer's own private-ATTRIBUTE drafts"). No hay manera hoy
de que un asistente/holder individual tenga su propio atributo separado — los atributos son
propiedades del EVENTO, no del token/holder.

**Restricción del contrato:** `privateAttributesRoot` se fija una sola vez en `createEvent` — no
existe un circuito para agregarlo/editarlo después. Los atributos privados de un evento tienen que
definirse en el momento de crearlo, no después.

## Decisiones confirmadas (2026-09-17)

1. **Las pantallas de "responder" son del organizer**, no de un holder/asistente — coincide con cómo
   está implementado el contrato y el cache local.
2. **Soporte multi-atributo desde el día uno** (no limitar a 1 atributo por evento para el MVP).
3. **Cualquier wallet conectada puede publicar un disclosure request** (pantalla 2 abierta, fiel al
   contrato — no se restringe a organizer/admin en la UI).
4. **El link para compartir un disclosure request lleva `requestId` + la lista de miembros del set**
   en query params. No hace falta llevar `eventId`/`fieldId` — `getDisclosureRequest(requestId)` ya
   los devuelve desde el indexer.

## Pieza técnica nueva requerida: constructor de árbol Merkle real

`merkle.ts#buildMerklePath` hoy solo arma un path válido para **un leaf** con siblings default en
cero — no sirve para multi-atributo (decisión 2) ni para el set de membership del verifier (que el
propio contrato recomienda tener más de 1 miembro, si no la membership equivale a full disclosure).

Falta agregar a `merkle.ts`:
```
buildMerkleTree(leaves: Uint8Array[], depth: number): {
  root: Uint8Array;
  pathForLeaf(leaf: Uint8Array): MerkleTreePathEntryArg[]; // o pathForIndex(i)
}
```
Reutiliza las mismas primitivas ya presentes (`transientHash`, `degradeToTransient`,
`upgradeFromTransient`) — solo agrega la construcción bottom-up de árbol completo con padding (leaf
`0x00...00` para slots sin usar) hasta `depth` (8 para atributos, 16 para el set). Se usa dos veces:
- Organizer, al crear el evento: árbol de profundidad 8 sobre sus N atributos.
- Quien responde un disclosure request: árbol de profundidad 16 sobre los miembros del set que le
  llegaron por el link (decisión 4), para encontrar el path de SU `value` dentro de ese set.

Esta pieza es prerequisito de las 3 pantallas — no es solo UI.

## Pantallas

### 1. Organizer — definir atributos privados (parte del wizard de creación de evento)
- Nuevo paso en `createEvent.jsx` (o antes del paso final de submit) — no puede ser una edición
  posterior, el contrato no lo permite.
- N filas (label + valor). Por cada una: generar `rand` random, `fieldId` (derivado del label o
  random), calcular leaf vía `computeAttributeLeaf(eventId, fieldId, value, rand)`.
  `eventId` se computa antes de llamar `createEvent` (mismo patrón ya usado:
  `computeEventId(organizerPk, label)`).
- Construir el árbol (profundidad 8) con las N leaves → `privateAttributesRoot`, pasarlo a
  `createEvent`.
- Guardar cada draft con `savePrivateAttributeDraft(eventIdHex, fieldIdHex, {fieldName, valueHex, randHex})`
  — ya soporta múltiples `fieldId` por evento (`listPrivateAttributeFieldIds` ya escanea todos).
- **Pendiente de resolver en la implementación:** cómo un verifier externo (pantalla 2) se entera de
  qué `fieldId`s existen para un evento y qué significan — propuesta: incluir en el `metadataURI` del
  evento (JSON ya existente en IPFS) un listado público `{ fieldId, label }[]` — nunca el valor. No
  requiere cambios de contrato ni de indexer.

### 2. Cualquier wallet — publicar un disclosure request
- Formulario: elegir evento (de los que tienen `privateAttributesRoot` ≠ 0 — filtrable vía
  `indexer.service.ts`'s `IndexedEvent.privateAttributesRoot`), elegir `fieldId` (del listado en
  metadata, ver arriba), definir el set de valores contra el que se pregunta.
- Construye el árbol del set (profundidad 16, mismo `buildMerkleTree`) → `setRoot`, llama
  `publishDisclosureRequest(label, eventId, fieldId, setRoot)`.
- Genera el link para compartir: `/disclosure/respond?requestId=<hex>&members=<hex,hex,...>`.
- Advertencia visible en la UI (el contrato no lo puede impedir): sets de pocos miembros equivalen a
  divulgación total — sugerir un mínimo razonable antes de publicar.

### 3. Organizer — responder un disclosure request pendiente
- Vista de "requests pendientes sobre mis eventos": `GET /api/disclosure-requests` (sin filtro,
  devuelve todos — confirmado en `indexer/src/api/routes/disclosures.ts`) filtrado en frontend por
  `eventId ∈ (mis eventos)`. No requiere cambios de backend.
- Al entrar por el link de la pantalla 2: leer `requestId` de la URL, `getDisclosureRequest(requestId)`
  para obtener `eventId`/`fieldId`/`setRoot`, buscar el draft local propio
  (`getPrivateAttributeDraft(eventId, fieldId)`), reconstruir `attributePath` (árbol propio, profundidad
  8) y `setMembershipPath` (árbol de los `members` que llegaron por la URL, profundidad 16, ubicando
  la posición de `valueHex` dentro de esa lista).
- Botón para elegir `proveAttributeMembership` (repetible) vs `proveAttributeMembershipOnce`
  (nulifica, un solo uso) — copy debe explicar la diferencia en términos simples ("puede responderse
  una sola vez" vs "puede responderse las veces que quieras").

## Tema visual
Dark-first, popups centrados (`.drawer-modal`) — nada de drawer lateral, consistente con el resto del
portal desde Ronda 10.

## Fuera de alcance (requeriría tocar `../POAP-Midnight`)
- Nada de lo anterior requiere cambios de contrato o de indexer — el único "pedido" fue el listado de
  `fieldId`/label, resuelto vía `metadataURI` (ya en nuestro control).

## Implementation notes (2026-09-17)

Shipped: `src/midnight/attribute-value-codec.ts`, `merkle.ts#buildMerkleTree`,
`indexer.service.ts#getAllDisclosureRequests`, `createEvent.jsx`'s private-attributes step +
`PrivateAttributesStepFields.jsx`, `publishDisclosureRequest.jsx` (+ drawer wiring + `eventCard.jsx`
trigger button), `disclosure-response.ts` (shared proof-building helper), `myEvents.jsx`'s pending-
requests section, `/app/disclosure/respond` + `disclosureRespond.jsx`. Full test coverage for every
new module; `npm run build` verified clean.

Two things resolved during implementation that this doc didn't anticipate:

1. **`myEvents.jsx`'s pending-requests section is informational only, no inline "Respond" button.**
   The indexer only ever exposes a request's `setRoot` (the commitment), never the actual candidate
   member *values* — those only exist in a share link's query params. So an organizer discovering a
   pending request purely through the indexer (not via a link) has no way to build the set-membership
   path. The section lists what's pending ("someone is asking about Region on event X") and tells
   them to get the link from the verifier; the actual response only happens through
   `/app/disclosure/respond`.
2. **The share link carries raw candidate values (URI-encoded, comma-joined), not pre-encoded hex.**
   `encodeAttributeValue` runs exactly once, in `disclosure-response.ts`, on whichever side needs
   32-byte leaves — this keeps the URL's wire format simple and avoids a hex round-trip that would've
   needed reversing zero-padding to recover human text.

Also: `@midnight-ntwrk/compact-runtime` (real WASM Poseidon hash `merkle.ts` depends on) cannot run
under this project's Jest 27 setup — package.json "exports"-only resolution and an `import.meta.url`
loader in its WASM dependency both broke under Jest's CJS transform, with no clean fix found. Every
new test exercises real `merkle.ts` tree-construction logic with the three WASM-backed primitives
mocked to simple deterministic stand-ins — genuine cryptographic correctness against the on-chain
hash is only verified by the live end-to-end pass against a real deployed contract, not by `npm
test`.
