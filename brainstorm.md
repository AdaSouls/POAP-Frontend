# Brainstorm — Selective disclosure respondida por el suscriptor + respaldo cifrado

Estado: **PAUSADO (2026-09-23)**. Retomar desde "Próximo paso" al final.
Target: Catalyst Hito 5 (2026-10-30).

## Objetivo (Paso 1, confirmado)

- **Problema**: que el **suscriptor/holder** pueda probarle a un tercero un predicado sobre un dato
  privado (ej. "mi valor ∈ {EU, US, LATAM}") **sin revelarlo** y sin depender de que el organizador
  responda por él. Hoy solo el organizador puede responder (es el único que tiene `value`/`rand`).
- **Alcance por categoría**:
  - **Event / Follow (Subscription)**: campos privados **iguales para todos** los suscriptores
    (mint público).
  - **Credential**: campos privados **únicos por destinatario** (mint individual vía `mintTo`).
- **Respaldo**: los secretos (`value`/`rand` de cada campo) y la clave de identidad `local_sk` hoy
  viven solo en el navegador. Se quiere un respaldo cifrado en Pinata privado. Aplica a **ambos
  roles** (organizador y suscriptor).
- **Deadline**: entra en el Hito 5.

## Lo que se encontró explorando el sistema (Paso 2)

- `proveAttributeMembership` (`poap.compact`) no verifica identidad: quien conoce la apertura
  `(value, rand)` de una hoja puede probar. Si el suscriptor tiene la apertura, puede responder él
  mismo — sin cambios de contrato.
- `proveAttributeMembershipOnce`: el nullifier usa `local_sk()` de quien prueba + `requestId`, así
  que en un evento compartido **cada wallet puede responder una vez** por pedido.
- `privateAttributesRoot` se fija **una sola vez** en `createEvent` (profundidad 8 → máx. 256 hojas)
  y no hay circuito para modificarlo. **Los atributos son del evento, no del token.**
- La prueba **no queda atada a quién la genera**: el tercero no puede distinguir si respondió el
  holder, el organizador o cualquiera que tenga la apertura.
- Existe `tokenPrivateMetadataCommit` por token (en `mintTo`), pero solo tiene commit/reveal
  (`revealPrivateTokenMetadata` publica el valor para siempre) — no sirve para selective disclosure.
  El frontend hoy siempre manda ceros.
- `local_sk` vive en el private state del navegador (IndexedDB, `getOrCreatePrivateState` en
  `providers.ts`). Perderla = el organizador pierde control de sus eventos y el suscriptor deja de
  ver sus POAPs. **Riesgo mayor que perder los drafts de atributos.**
- `private-attribute-drafts.ts`: los secretos del organizador viven solo en `localStorage`.
- `disclosure-response.ts` exige tener los drafts de **todos** los campos del evento para
  reconstruir el árbol.
- `server/` (este repo) ya tiene `upload-json-private` (Pinata `network: private`) y
  `private-signed-url` (sin autenticación — cualquiera con el CID obtiene un link).
- Wallet: `signData` existe (dapp-connector-api v4, `keyType: 'unshielded'`) pero probablemente no
  es determinística → no sirve para derivar una clave de cifrado reproducible (sin verificar).
- Los eventos Credential (`isPublicMint: false`) no aparecen en Explore → un verificador externo no
  tiene hoy un punto de entrada para "Ask for a Disclosure" sobre una credencial.
- `publishDisclosureRequest.jsx:72` acepta conjuntos de 1 solo valor (equivale a revelarlo), aunque
  el texto de ayuda pide al menos un señuelo.

### Aclaración: qué significa "una vez por pedido" en la variante `Once`

No es una vez en la vida: es **una vez por pedido** (`requestId`), y cada pedido es independiente.

- Al responder con `proveAttributeMembershipOnce`, el contrato guarda un nullifier
  `hash(local_sk del que responde, requestId)` en `usedDisclosures`.
- **Mismo suscriptor, mismo pedido, segunda vez** → misma marca → rechazado ("Disclosure already
  redeemed for this request").
- **Otro pedido** (del mismo verificador o de otro, aunque pregunte lo mismo) → otro `requestId` →
  puede responder.
- **Otro suscriptor, mismo pedido** → otra `local_sk` → otra marca → puede responder.
- `Once` es **opcional**: `proveAttributeMembership` (sin `Once`) no guarda nada y se puede responder
  ilimitadamente. `Once` es para casos tipo "canjear un beneficio una vez por persona". Hoy quien
  **responde** elige la variante en la UI, no el verificador → **decisión abierta 6**: si el
  verificador necesita "una sola vez", cómo se le exige (ej. que el pedido indique que espera `Once`
  y la UI de respuesta no ofrezca la otra variante; el contrato en sí no lo impone).
- La marca depende de `local_sk`, **no de la persona**: otra wallet, o una `local_sk` nueva tras
  perder la anterior, genera otra marca y podría responder de nuevo el mismo pedido. El respaldo
  cifrado ayuda acá: restaurar recupera la misma `local_sk`.

## Diseño preliminar presentado (Paso 3) — parcialmente descartado

### Event / Follow (vigente)
- El organizador reparte un **kit de atributos**: link/QR con las aperturas del evento en el
  fragmento `#` (nunca llega a un servidor). Tenerlo = poder probar (secreto compartido).
- Página nueva "Importar kit" → guarda las aperturas localmente → `disclosureRespond.jsx` funciona
  para el suscriptor sin más cambios de lógica (solo copy: "responder" deja de ser exclusivo del
  organizador).
- Botón "Compartir kit de atributos" en la tarjeta expandida del evento (organizador).

### Credential (DESCARTADO por el usuario)
- Se propuso **un evento on-chain por credencial** (maxSupply 1, root con los valores del
  destinatario) + `mintTo`, con dos firmas por credencial, agrupadas bajo un evento "serie".
- **Decisión del usuario (2026-09-23): NO.** La idea es mantener el modelo actual — **un evento
  Credential dentro del cual se emiten las credenciales individuales** — pero con información
  privada única por cada credencial. Eso no es posible con el contrato actual → requiere cambio de
  contrato (ver análisis abajo).

### Respaldo cifrado (vigente, sin confirmar detalles)
- Contenido: `local_sk` (private state) + todas las aperturas (drafts del organizador y kits
  recibidos por el suscriptor).
- Cifrado en el navegador: contraseña → PBKDF2 → AES-GCM (WebCrypto). Nunca texto plano en Pinata
  (privado en Pinata ≠ cifrado de punta a punta).
- Guardado vía `upload-json-private` con una etiqueta de búsqueda; endpoint nuevo en `server/` para
  obtener el respaldo más reciente por etiqueta. Etiqueta derivada de wallet **+** contraseña (quien
  solo conoce la wallet no puede ni descargar el cifrado para atacarlo offline).
- Settings: crear/actualizar/restaurar; auto-respaldo al guardar un secreto nuevo si ya hay
  contraseña; opción de descargar el archivo cifrado.

### Decisiones abiertas
1. ~~Agrupación de credenciales (serie + hijas vs. eventos sueltos)~~ — superada por la decisión de
   arriba.
2. Kit de Event/Follow: ¿lo recibe cualquiera o solo quien reclamó? (propuesta: el organizador
   decide a quién mandarlo; con mint público restringirlo no agrega protección real).
3. ~~Dos firmas por credencial~~ — superada.
4. Respaldo: ¿contraseña obligatoria para usar atributos privados, u opcional con advertencia?
5. ¿Endurecer el tamaño mínimo del conjunto en "Ask for a Disclosure"?
6. `Once` vs. repetible: ¿lo elige el verificador al publicar el pedido (y la UI de respuesta lo
   respeta) en vez de quien responde? Ver la aclaración sobre `Once` más arriba.

### Riesgos
- Sin vínculo prueba ↔ holder con el contrato actual (hay que comunicarlo en la UI).
- Respaldo: la contraseña da acceso a la identidad completa; si se olvida no hay recuperación.
- Corrección criptográfica real solo verificable en vivo contra el devnet (Jest usa el hash
  simulado). La prueba en vivo del flujo actual de selective disclosure también sigue pendiente.

## Análisis: cambios de contrato para credenciales con atributos privados por token

(Fuera del alcance de este repo — sería un pedido a Matías para `../POAP-Midnight`.)

### Qué falta hoy
El árbol de atributos cuelga del **evento** (`EventRecord.privateAttributesRoot`, fijado en
`createEvent`). Para un evento Credential con N credenciales distintas hace falta un árbol **por
token**, fijado en el momento del `mintTo`.

### Opción A — mínima: raíz por token + pedidos dirigidos a un token
- Ledger nuevo: `tokenPrivateAttributesRoot: Map<Uint<64>, Bytes<32>>`.
- `mintTo(..., tokenPrivateAttributesRoot)`: parámetro nuevo (o reutilizar el slot
  `tokenPrivateMetadataCommit`, que el frontend hoy manda en cero — más barato, pero rompe la
  semántica de `revealPrivateTokenMetadata`; mejor un campo nuevo).
- Hoja con dominio propio que incluya `tokenId`:
  `H("adasouls:token-attr-leaf:v1:", tokenId, fieldId, commit(value, rand))` — evita reusar una
  apertura entre tokens.
- `publishTokenDisclosureRequest(label, tokenId, fieldId, setRoot)` (o agregar un campo
  `tokenId` opcional a `DisclosureRequest`).
- `proveTokenAttributeMembership(requestId, value, rand, attrPath, setPath)` (+ variante `Once`),
  que además exija **ser el dueño del token**:
  `assert(tokenOwner.lookup(tId) == holder_pk(tokenIssuer.lookup(tId)))` y `!burnedTokens`.
- **Gana**: vínculo prueba ↔ holder (solo el dueño puede responder, ni siquiera el organizador).
- **Costo en privacidad**: el pedido nombra el `tokenId`, así que el verificador sabe qué token es
  y ve su pseudónimo `holder_pk` (ya público en `tokenOwner`) → puede ver las otras credenciales
  del mismo holder con ese mismo organizador.

### Opción B — privada: árbol de compromisos (patrón zerocash)
- Ledger nuevo: `credentialCommitments: HistoricMerkleTree<D, Bytes<32>>`.
- En `mintTo`, insertar `leaf = H(eventId, recipientHolderPk, tokenAttributesRoot)`.
- El pedido apunta al **evento** (como hoy); el holder prueba, sin revelar cuál es su hoja:
  1. conoce `local_sk` que deriva `holderPk` (sin `disclose`),
  2. `H(eventId, holderPk, attrRoot)` está en `credentialCommitments` (`checkRoot`),
  3. su atributo está en `attrRoot` y su valor en el conjunto del pedido.
- Revocación: `burn` debería agregar un nullifier de la credencial a un set de revocadas, y la
  prueba verificar que no está revocada.
- **Gana**: vínculo con el holder **y** anonimato dentro del conjunto de holders del evento (el
  verificador sabe "alguien con una credencial válida de este evento cumple X", no cuál).
- **Costo**: más complejo; las lecturas de ledger por clave son públicas en la transcripción de
  Midnight, por eso hace falta el árbol en vez de leer `tokenOwner[tokenId]`.

### Impacto común a ambas opciones
- **Tamaño del contrato**: el deploy ya chocó con el límite de peso de bloque con 15 circuitos
  (se resolvió con deploy por etapas) — cada circuito nuevo empeora eso.
- **Indexer**: exponer el nuevo campo por token / el nuevo tipo de pedido.
- **Frontend después del cambio**: el wizard de Credential define solo los **nombres** de los campos
  (plantilla, en el `metadataURI` del evento); "Emitir credencial" (`mintPoap.jsx`) pide los valores
  del destinatario, arma la raíz por token, llama `mintTo` (una sola firma) y muestra el kit para el
  destinatario; el suscriptor responde desde su propio navegador.
- Event/Follow no cambian (siguen usando la raíz del evento + kit compartido).

### Requisito de UX (agregado 2026-09-23): no romper la UI actual ni hacerlo engorroso

El flujo "un evento Credential → muchas credenciales, cada una con datos privados propios" tiene que
**encajar en la UI que ya existe**, y el organizador **no debe tener que crear ni configurar el
evento de nuevo** cada vez que emite una credencial del mismo evento. A pensar al retomar:

- **Se crea una sola vez**: el wizard de Credential (`createEvent.jsx`) sigue siendo el mismo; el
  paso de atributos privados pasa a definir solo la **plantilla** (nombres de campos, sin valores),
  que queda guardada en el `metadataURI` del evento.
- **Emitir se repite desde el mismo lugar de hoy**: tarjeta expandida del evento → "Mint"
  (`mintPoap.jsx`). El wizard suma un paso "Datos privados" con los campos de la plantilla ya
  cargados — el organizador solo completa los **valores** de ese destinatario. Nada de volver a
  elegir categoría, imagen del evento, taxonomía, etc.
- **Mismos lugares, mismos componentes**: My Events sigue mostrando un solo evento por credencial
  (con su contador de emitidas); el holder ve su credencial en My Subscriptions como hoy
  (`poapCard.jsx`), con una indicación de que tiene campos privados y su kit importado.
- **Kit al destinatario sin pasos extra**: al terminar el mint, el mismo popup de éxito muestra el
  link/QR del kit para mandárselo — simétrico al "Get My Key" que el destinatario ya le mandó antes.
- **Emisión en lote (a evaluar)**: si hay muchos destinatarios, cargar varios de una vez (ej. CSV
  con clave del destinatario + valores) en vez de repetir el wizard N veces. Cada mint sigue siendo
  una transacción aparte.
- **Si el cambio de contrato no llega a tiempo para el Hito 5**: cualquier alternativa provisional
  (ej. eventos por credencial creados automáticamente por debajo) tiene que ser **invisible** para
  el organizador — el botón "Emitir" crea lo que haga falta sin que tenga que repetir el wizard de
  creación, y la UI la agrupa bajo el evento original. El usuario ya descartó exponer "un evento
  por credencial" como modelo; esto sería solo un detalle de implementación temporal, a decidir.

### Aclaración: qué pasa por detrás al emitir una credencial

**Crear el evento Credential**: igual que hoy, una sola transacción. Única diferencia: en el paso
de atributos privados se cargan solo los **nombres** de los campos (plantilla en el `metadataURI`),
sin valores.

**Emitir una credencial**: para el organizador la UI es la misma en ambos casos (tarjeta del evento
→ "Mint" → destinatario, imagen y **valores** de los campos para esa persona). Lo que cambia es qué
pasa por detrás:

- **Con cambio de contrato (A o B) — el camino elegido**: no se crea ningún evento extra.
  `mintTo` recibe la raíz de los datos privados de ese token. Un evento con N credenciales, cada
  una con sus propios datos privados. Una sola firma por credencial.
- **Sin cambio de contrato — solo plan B temporal si no llega al Hito 5**: por detrás se crearía un
  evento oculto (maxSupply 1, con los datos privados de esa persona) y se le mintearía la
  credencial ahí. Dos firmas por credencial; la UI tendría que agrupar/ocultar esos eventos y sumar
  el contador; on-chain y en el indexer siguen siendo eventos separados (la credencial pertenece al
  evento oculto, no al original); y al llegar el cambio de contrato, lo emitido así quedaría con el
  modelo viejo. Es un parche, no el diseño.

**Decisión del usuario (2026-09-23): se va a intentar modificar el contrato para hacerlo bien**
(opción A o B), en vez de apoyarse en el plan B. A resolver al retomar:
- Coordinación con Matías (mantiene `../POAP-Midnight`): ¿propuesta/PR para que él la revise, o
  cambio hecho por él? Hasta ahora ese repo no se edita desde este lado.
- En este Windows no hay `compactc` — compilar el contrato y regenerar keys/zkir depende de él (o de
  instalarlo en otro entorno, ej. WSL).
- Redeploy obligatorio: nueva dirección de contrato → hay que re-sincronizar artefactos del
  frontend (`src/midnight/contract/managed/poap/`, `public/midnight/poap/{zkir,keys}/`) y los
  eventos/tokens existentes en el devnet no se migran.

### Recomendación preliminar
Opción B si el objetivo es la historia de privacidad de Midnight para el Hito 5; Opción A si prima
el tiempo y alcanza con "solo el dueño puede responder". A confirmar con Matías: soporte de
`HistoricMerkleTree`/`checkRoot` en la versión de Compact que usa, y el margen de tamaño del
contrato.

## Próximo paso
1. **Cambio de contrato (decidido intentarlo)**: elegir Opción A o B, acordar con Matías cómo se
   hace (PR/propuesta vs. lo implementa él) y resolver cómo compilar sin `compactc` en Windows.
2. Mientras tanto, se puede avanzar sin tocar contrato con: kit de Event/Follow + respaldo cifrado.
3. Cerrar las decisiones abiertas 2, 4, 5 y 6.
4. Validar el requisito de UX de Credential (sin re-crear el evento por credencial): plantilla en
   la creación, valores en cada emisión, emisión en lote, y qué hacer si el contrato no llega.
