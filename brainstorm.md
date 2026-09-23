# Brainstorm — Selective disclosure respondida por el suscriptor + respaldo cifrado

Estado: **EN CURSO — construcción por etapas (2026-09-23)**. Se construye en el frontend lo que
funciona con el contrato actual y se deja preparado (detrás de detección de circuitos) lo que depende
del backend. Ver "Plan por etapas" al final.
Target: Catalyst Hito 5 (2026-10-30).

## Objetivo

- **Problema**: que el **holder** pueda demostrar un predicado sobre un dato privado de su POAP
  (ej. "Región ∈ {EU, US, LATAM}") **sin revelarlo** y sin depender de que el organizador responda
  por él. Hoy solo el organizador puede responder (es el único que tiene `value`/`rand`).
- **Caso de uso**: un tercero le pide al holder que demuestre la veracidad de un dato de su POAP.
  El tercero **no usa la app**: solo pide. El holder genera la prueba y se la **muestra** (pantalla o
  link a la transacción).
- **Respaldo**: los secretos (`value`/`rand` de cada campo) y la clave de identidad `local_sk` hoy
  viven solo en el navegador → respaldo cifrado en Pinata privado, para **ambos roles**.

## Alcance (decidido 2026-09-23)

- **Hasta que lleguen los cambios del backend, NO hay campos únicos por credencial.** Los campos
  privados son **del evento** — iguales para todos los holders, en todas las categorías (Event,
  Follow y Credential). Todo lo de este documento funciona **sin cambios de contrato**.
- **Solo el organizador publica pedidos** ("Ask for a Disclosure"), desde la card expandida de su
  propio evento. Se saca el botón de las cards de evento de Explore (rol subscriber).
- **El subscriber**, desde la card expandida de su POAP: **responde** los pedidos del organizador y
  puede **generar una prueba por iniciativa propia** ("Prove an Attribute").
- **Sin verificación por parte de terceros**: no hay página pública de verificación ni link de
  verificación. El comprobante es algo que el holder muestra.
- **Solo pedidos `Once`** (`proveAttributeMembershipOnce`). Se elimina la variante repetible y la
  elección en la UI.
- **Canal de respuesta = el comprobante (opción a)**: ni el organizador ni un tercero pueden ver
  respuestas on-chain; el holder les muestra/manda el comprobante.

## Lo que se sabe del sistema (verificado en `poap.compact` / indexer)

- `proveAttributeMembership[Once]` **no verifica identidad**: quien conoce la apertura
  `(value, rand)` puede probar. Si el holder tiene la apertura, responde él mismo.
- `publishDisclosureRequest` **no tiene gate**: cualquier wallet publica; el pedido guarda
  `verifier = caller_pk()`. → El holder puede publicar un pedido sobre el evento de su POAP para
  "Prove an Attribute".
- `privateAttributesRoot` se fija una sola vez en `createEvent` (profundidad 8 → máx. 256 hojas).
  **Los atributos son del evento, no del token.**
- **La variante sin `Once` no deja rastro** en el ledger (el indexer no la ve). **`Once` guarda un
  nullifier `hash(local_sk, requestId)`** en `usedDisclosures`, pero **no se puede asociar al
  `requestId`**: el indexer solo sabe que *alguien* respondió *algo*. → Nadie puede contar
  respuestas por pedido; por eso el canal es el comprobante.
- Nullifiers del mismo holder en pedidos distintos **no se pueden correlacionar** (dependen del
  `requestId`) → `Once` no cuesta privacidad.
- `Once` es "una vez por `local_sk` por pedido", no por persona: otra wallet (u otra `local_sk` tras
  perder la anterior) puede volver a responder el mismo pedido.
- `local_sk` vive en el private state del navegador (IndexedDB, `getOrCreatePrivateState`).
  Perderla = el organizador pierde control de sus eventos y el holder deja de ver sus POAPs.
- `private-attribute-drafts.ts`: los secretos del organizador viven solo en `localStorage`.
- `disclosure-response.ts` exige tener los drafts de **todos** los campos del evento para
  reconstruir el árbol → el kit tiene que incluir todas las aperturas del evento.
- `server/` ya tiene `upload-json-private` (Pinata `network: private`) y `private-signed-url`.
- `publishDisclosureRequest.jsx` acepta conjuntos de 1 solo valor (equivale a revelarlo).

## Diseño

### Datos: qué garantiza la prueba y qué no
- Prueba que **quien conoce las aperturas del evento** sabe que el valor ∈ conjunto. **No prueba que
  quien responde tenga el POAP** — eso lo muestra la card del POAP (sello verificado + tx de mint).
  El comprobante muestra las dos cosas juntas.
- Como los campos son iguales para todos, lo que se prueba es un **atributo del evento** ("el evento
  fue en EU"), no un dato personal. El copy de la UI no debe prometer "tu dato personal".

### Organizer — card expandida de su evento (`eventCard.jsx`, `variant="manage"`)
- **"Ask for a Disclosure"** queda solo acá. El pedido siempre es `Once` (sin selector).
- **"Share Attribute Kit"** (nuevo): link con **todas** las aperturas del evento en el fragmento `#`
  (nunca llega a un servidor) para mandar a los holders.
- My Events: la sección "Pending Disclosure Requests" (hoy: el organizador responde) pasa a ser
  **"My Requests"** — listado de las preguntas publicadas, sin conteo de respuestas.

### Subscriber — card expandida del POAP (`poapCard.jsx`)
- **"Disclosure Requests"**: pedidos del organizador sobre ese evento, cada uno con "Respond".
  Si no hay kit importado → "Import kit".
- **"Prove an Attribute"** (nuevo): elegir campo + conjunto de valores → por debajo
  `publishDisclosureRequest` + `proveAttributeMembershipOnce` (**dos firmas**) → comprobante.
- **Comprobante** (al terminar responder o probar, en el mismo popup): la pregunta
  ("Región ∈ {EU, US, LATAM}"), el resultado, el POAP que respalda (evento, sello, tx de mint) y el
  link a la transacción en midnightexplorer.com. Es lo que el holder muestra.
- **Importar kit**: abrir el link del organizador guarda las aperturas en este navegador; la card
  del POAP muestra "Kit imported".
- Se quita "Ask for a Disclosure" de las cards de evento en Explore.

### Respaldo cifrado (ambos roles)
- Contenido: `local_sk` (private state) + drafts del organizador + kits importados.
- Cifrado en el navegador: contraseña → PBKDF2 → AES-GCM (WebCrypto). Nunca texto plano en Pinata
  (privado en Pinata ≠ cifrado de punta a punta).
- Guardado vía `upload-json-private` con etiqueta derivada de wallet **+** contraseña; endpoint nuevo
  en `server/` para obtener el respaldo más reciente por etiqueta.
- Settings: crear / actualizar / restaurar; auto-respaldo al guardar un secreto nuevo si ya hay
  contraseña; descargar el archivo cifrado.

### Visual
- Dark-first, reutilizando los popups centrados (`.drawer-modal`), las cards y el popup único de
  progreso de transacciones (22f3df78). Nada de drawers laterales.

## Decisiones

### Cerradas
- Alcance sin campos únicos por credencial hasta el cambio de backend.
- Solo el organizador pide; subscriber responde + "Prove an Attribute" desde su POAP.
- Sin verificación de terceros; el comprobante es el canal (opción a).
- Solo `Once`.
- ~~Un evento on-chain por credencial~~ — descartado por el usuario.
- **Kit**: el organizador lo comparte manualmente a quien quiera (un link por evento).
- **Respaldo**: contraseña opcional, con aviso persistente mientras no esté configurada.
- **Conjunto**: mínimo 2 valores al pedir / probar.
- **"Prove an Attribute"**: dos firmas aceptadas; el popup de progreso muestra "paso 1 de 2 / 2 de 2".

## Riesgos
- La prueba no queda atada al holder (contrato actual) → comunicarlo en la UI; se resuelve con el
  cambio de backend (ver "Estacionado").
- Respaldo: la contraseña da acceso a la identidad completa; si se olvida, no hay recuperación.
- Corrección criptográfica real solo verificable en vivo contra el devnet (Jest usa hash simulado);
  la prueba en vivo del flujo actual de selective disclosure sigue pendiente.
- `Once` cuesta algo más de DUST que la variante sin rastro (escribe en el ledger).

## Estacionado: campos privados únicos por credencial (espera cambio de backend)

Pedido enviado a Matías (`../POAP-Midnight`); sin respuesta al 2026-09-23. Se retoma cuando llegue.

- **Qué falta**: el árbol de atributos cuelga del evento; para N credenciales distintas hace falta
  un árbol **por token**, fijado en `mintTo`.
- **Opción A** — raíz por token (`tokenPrivateAttributesRoot`) + pedidos dirigidos a un `tokenId` +
  prueba que exige ser el dueño del token. Gana vínculo prueba ↔ holder; el verificador ve qué
  token es.
- **Opción B** — árbol de compromisos (patrón zerocash): el holder prueba sin revelar cuál es su
  credencial. Gana vínculo + anonimato dentro del evento; más complejo, requiere revocación por
  nullifier.
- **Impacto común**: tamaño del contrato (ya hubo deploy por etapas), indexer, redeploy (nueva
  dirección, re-sync de artefactos), `compactc` no disponible en este Windows.
- **UX requerida cuando llegue**: el evento Credential se crea una vez (wizard define solo la
  plantilla de campos); cada emisión desde "Mint" (`mintPoap.jsx`) agrega un paso "Datos privados"
  con los valores del destinatario, una sola firma, y el popup de éxito muestra el kit para el
  destinatario. Evaluar emisión en lote (CSV).
- Recomendación preliminar: B por la historia de privacidad del Hito 5; A si prima el tiempo.

## Encaje con el Hito 5 (evaluado 2026-09-23)
- El criterio 6 pide *"basic proof that caller owns a token"*. Este mecanismo **no** lo cumple (no
  verifica identidad) y **ningún circuito del contrato actual prueba tenencia**. Se le pidió a Matías
  un `proveTokenOwnership(tokenId)` (o equivalente) con prioridad sobre los campos por credencial.
- Este mecanismo, si se construye, se presenta como "selective disclosure de atributos de evento",
  no como prueba de asistencia.

## Qué necesita el backend (irreducible) — pedido a Matías 2026-09-23
El frontend no puede fabricar una prueba de tenencia (está atada a `holder_pk`, derivada de
`local_sk`; ningún circuito actual la verifica sin destruir el token). Hace falta, idealmente en un
solo cambio (≈ opción A):
1. `proveTokenOwnership(tokenId)` → criterio 6 del Hito 5.
2. Raíz de atributos por token en `mintTo` + `proveTokenAttributeMembership` con chequeo de dueño →
   casos por persona.

**Timing**: todo cambio de contrato = redeploy (nueva dirección, nada se migra). Tiene que entrar
**antes del deploy a Mainnet** del Hito 5, o se pierde la evidencia de las 3 wallets.

## Plan por etapas (acordado 2026-09-23)

### A. Operativo hoy (contrato actual)
- **A1. Respaldo cifrado** de `local_sk` + secretos (drafts, kits), y reemplazar la contraseña fija
  del private state (`'AdaSouls-Local-Dev-2026!'` en `providers.ts`). Imprescindible para Mainnet.
- **A2. Flujo de disclosure del holder** con campos a nivel evento (diseño de arriba).
- **A3. Predicados**: ≥, ≤, entre, uno de → se convierten a conjunto (profundidad 16 → hasta 65.536
  valores). Habilita edad / nota / horas CPD sin cambio de contrato.
- **A4. Campos con tipo en la plantilla**: lista, número con mín./máx., fecha/año.

### B. Preparado para el backend (detrás de detección de circuitos)
- **B5. Detección**: `contract.service.ts` consulta `impureCircuits` del módulo compilado; la UI se
  habilita sola cuando llegan los artefactos nuevos.
- **B6. "Prove I Own This POAP"** en la card del POAP, completo salvo la llamada al circuito.
- **B7. Paso "Datos privados" en `mintPoap.jsx`**: valores por destinatario sobre la plantilla del
  evento → raíz por token para `mintTo`.
- **B8. Un solo componente de comprobante** para tenencia / atributo de evento / atributo de token.

### No hacer
- Guardar datos "por persona" anclados al contrato actual (se pierden con el redeploy).
- Presentar A como cumplimiento del criterio 6.

### Orden
1. A1 (respaldo + contraseña del private state) ← **implementado 2026-09-23** (tests + build OK;
   falta prueba manual en devnet, empezando por la migración con una wallet de prueba)
2. B5 + B6 + B8
3. A3 + A4
4. A2 + B7
