# Brainstorm — Selective disclosure respondida por el suscriptor + respaldo cifrado

Estado: **CONSTRUIDO, FALTA PROBAR EN VIVO (2026-09-24)**. Los pasos 1 a 4 del "Plan actualizado"
están implementados y subidos (`9cf1c075`): B6, B7 + entrega cifrada, pruebas anónimas y B8. La
prueba en vivo sigue `prueba_de_credenciales.md`. Al final: **"Análisis de producto"** (la app
evaluada como si ya estuviera en producción) y **"Mejoras propuestas"**.
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

**RESUELTO 2026-09-24** — Matías implementó la opción B (árbol de credenciales, ver "Plan
actualizado"). Se deja esta sección como historia de la decisión.

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

## Plan actualizado (2026-09-24)

### Qué trajo el backend (`../POAP-Midnight` `4614b96` + `7e65f40`)
- `proveTokenOwnership(requestId, tokenId)` — prueba de tenencia **pública** (revela el `tokenId`),
  atada a un `DisclosureRequest` publicado para el evento del token. Rechaza tokens quemados y a quien
  no es el dueño (`holder_pk(issuer)`). **Cierra el criterio 6 del Hito 5.**
- Árbol `credentials` (HistoricMerkleTree<20>, opción B / patrón zerocash): cada mint escribe
  `credential_leaf(eventId, holder_secret_pk, credAttrRoot)` en el índice `tokenId`.
- `proveEventAttendance(requestId, credAttrRoot, credPath)` — "tengo una credencial vigente de este
  evento" sin revelar cuál.
- `proveCredentialAttribute(requestId, value, rand, attributePath, setMembershipPath, credPath)` —
  lo mismo + predicado sobre un atributo privado **del holder** contra el conjunto del pedido.
- `mintTo(..., credentialAttributesRoot)` — nuevo último argumento (todo ceros = sin atributos);
  `claim()` mintea sin atributos. `burn` invalida la credencial y resetea el historial de raíces.
- Funciones puras `computeCredentialLeaf` / `computeCredentialAttrLeaf`.
- El indexer **no cambió**: no ve estas pruebas (no escriben ledger) ni guarda `credAttrRoot`.
  El `credPath` se saca del estado del contrato con `credentials.findPathForLeaf(leaf)`.

### Estado al cierre del 2026-09-24
- Artefactos resincronizados (contrato, 36 zkir, 36 claves verificadas por SHA256SUMS), `mintTo` del
  servicio con `credentialAttributesRoot` (ceros por defecto). Tests: 306/312, sin regresiones.
- Devnet local reseteada desde génesis → contrato **`44cd94ade4a21488c703e7139df25060ed4880e1a949d9cd852a92966f084ea2`**,
  evento demo en el bloque 73, las 2 wallets refondeadas y generando DUST.
- **Sin probar en vivo todavía**: el mint de credencial con la firma nueva, y la prueba manual de A1.

### Entrega de los datos privados al holder (acordado con Matías 2026-09-24)
Todo off-chain, lo resolvemos nosotros, sin cambios de contrato:
- "Get My Key" (`getHolderKey.jsx`) pasa a incluir una **clave pública de cifrado X25519** junto al
  `holder_pk`, en un solo código. La privada vive en el private state y entra en el backup (A1).
- Al emitir, el navegador del organizador arma el paquete (`value`/`rand`/hojas de cada atributo +
  `credAttrRoot`), lo cifra para esa clave y lo sube a Pinata indexado por `holder_pk` (mismo patrón
  que `/api/backup`).
- My Subscriptions lo busca por el `holder_pk` del holder, lo descifra y lo guarda.
- Respaldo si la clave de holder es vieja (sin clave de cifrado): link con la clave en el fragmento `#`.
- Sensibilidad: los datos revelan el valor, pero **no permiten probar en nombre del holder** (el
  circuito exige `holder_secret_pk`, derivado de su `local_sk`).

### Orden (reemplaza el del 23/09)
1. **B6 — "Prove I Own This POAP"** en la card expandida del POAP (`poapCard.jsx`):
   - `contract.service.ts`: wrapper `proveTokenOwnership(requestId, tokenId)`.
   - Flujo del holder (2 firmas, ya aceptado): `publishDisclosureRequest(label, eventId, 0, 0)` →
     `proveTokenOwnership(requestId, tokenId)`, dentro del popup de progreso único.
   - Flujo con pedido existente: si el organizador ya publicó un pedido, 1 sola firma.
   - Aclarar en la UI que esta prueba **revela qué token es** (para anonimato → paso 4).
   - B5 (detección de circuitos) ya no hace falta: los artefactos llegaron.
2. **B8 — Comprobante**: un solo componente para todas las pruebas (tenencia / asistencia / atributo),
   con tx hash + link a midnightexplorer. Verificación: el indexer propio no las ve → consultar el
   indexer de Midnight (GraphQL `contractAction` por tx, `entryPoint`). Confirmar el campo en vivo.
3. **Clave de cifrado en "Get My Key" + B7** (paso "Datos privados" en `mintPoap.jsx`: valores del
   destinatario sobre la plantilla del evento → `credentialAttributesRoot`) **+ entrega cifrada**.
4. **Pruebas anónimas del holder** desde su POAP: `proveEventAttendance` / `proveCredentialAttribute`
   (con `credentials.findPathForLeaf`), terminando en el comprobante de B8.
5. A3 + A4 (predicados y campos con tipo) — sirven tanto para atributos de evento como de credencial.
6. A2 (kit de atributos a nivel evento) — **reevaluar**: con atributos por credencial puede sobrar.

### Antes de empezar B6 — ✅ hecho 2026-09-24 (A1 y emisión de credencial con `mintTo` probados en vivo)
- Prueba manual rápida: conectar (paso de bienvenida + recovery code nuevo = prueba de A1), crear un
  evento Credential y emitir una credencial con `mintTo` (firma nueva).

### Estado al cierre del 2026-09-24 (noche)
Implementado, con tests (357/362, los 5 de siempre), commit `9cf1c075`, **sin probar en vivo**:
1. ✅ B6 — "Prove I Own This POAP" + "Ask for Proof of Ownership" del organizador (1 firma, sin
   exponer el `caller_pk` del holder).
2. ✅ B8 — comprobante único (`ProofReceipt.jsx`) + `/app/verify` sin wallet (GraphQL del indexer
   de Midnight).
3. ✅ Clave de cifrado en "Get My Key" + B7 + entrega cifrada. Decisiones tomadas:
   - En Credential, el paso de campos privados define solo nombres (`credentialAttributeFields`);
     los valores se cargan por persona en Mint POAP. Event/Follow siguen con valores por evento.
   - La clave X25519 se **deriva** de `local_sk` + organizador (no se guarda; la cubre el backup;
     distinta por organizador). Código: `<holderPk>.<clave>`.
   - Entrega por `server/` → `/api/credential-delivery`; respaldo con link `#fragmento`.
4. ✅ Pruebas anónimas desde el POAP (`proveEventAttendance` / `proveCredentialAttribute`), siempre
   contra pedidos ajenos. Los valores aceptados de cada pregunta se publican en `/api/disclosure-sets`.
5. Pendiente: A3 + A4 (predicados y campos con tipo).
6. A2 (kit a nivel evento): **descartado por ahora** — los campos por credencial cubren el caso.

---

## Análisis de producto (2026-09-24) — la app como si ya estuviera en producción

Supuesto: producto terminado y desplegado en mainnet. Frontend, proxy de Pinata e indexer POAP
alojados por nosotros; los usuarios solo tienen su navegador y su wallet. Lo que es propio del
entorno local (devnet, explorer que no abre, etc.) no cuenta.

### Qué ofrece que no ofrece un POAP en otra cadena
- **Seudónimo por organizador** (`holder_pk`): dos organizadores no pueden cruzar a sus asistentes.
  En un POAP de Ethereum la wallet queda públicamente atada a cada evento.
- **Pruebas anónimas**: "tengo una credencial de este evento" o "mi sector está en esta lista", sin
  decir cuál credencial ni qué wallet.
- **Datos privados por credencial**: la cadena guarda solo la raíz; los valores viajan cifrados y
  nuestro server no puede leerlos.
- **Verificación sin wallet**: quien recibe la prueba abre un link.
- **Revocación**: el emisor puede quemar una credencial y las pruebas dejan de pasar.

Es el argumento de "por qué Midnight" para el Hito 5: todo lo anterior depende de la dualidad
público/privado del contrato.

### Casos de uso reales por tipo de evento

**Event (cualquiera lo reclama: "Attend")**
- Meetups y conferencias como **reputación portable**: "fui a 5 town halls de Catalyst" para entrar
  a un canal de alumni o votar en un grant, con prueba anónima de asistencia. El seudónimo evita
  que se arme un historial de todos los eventos de una persona.
- Talleres y hackatones: "participé" como llave para la siguiente edición o un descuento.
- **No sirve** cuando el POAP da algo de valor (cupos, premios): cualquiera con el link reclama, y
  con varias wallets reclama varias veces (el propio contrato lo documenta).

**Subscription / Follow (membresía continua)**
- Clubes de fans, comunidades pagas, newsletters premium: "soy miembro de X" ante un sponsor, sin
  que el sponsor sepa quién es ni vea sus otras membresías. Es el caso más natural para la prueba
  anónima de asistencia.
- Membresías por temporada, usando el vencimiento del evento.
- **Falta**: niveles y renovaciones (hoy cada nivel sería otro evento).

**Credential (emitida a una persona, con datos privados)** — donde está el mayor valor
- **Entradas con asiento**: tenencia en la puerta, "sector ∈ {Campo}" para una zona, revocación
  por reventa o reembolso.
- **Títulos y certificados**: "me recibí en X" y "nota ∈ {A, B}" ante un empleador, sin mostrar
  nombre ni el resto del certificado; recursos humanos verifica con el link.
- **Matrículas y licencias profesionales**: "matrícula vigente" sin dar el número; si se revoca,
  las pruebas dejan de pasar.
- **Credenciales de empleado / control de acceso**: "área ∈ {Ingeniería, Operaciones}" para entrar
  a un piso sin registrar quién entró.
- **Edad o residencia** emitidas por alguien de confianza (club, municipio), hoy por categorías.
- En todos, la confianza está en el emisor: la prueba dice "X certificó esto", no que el dato sea
  cierto en el mundo. Para títulos, entradas y licencias es justo lo que se quiere.

**Atributos a nivel de evento (Event / Follow)**
- Prueban cosas del evento ("fue en la UE"), no de la persona. Sirven sobre todo para reportes a
  sponsors. Es lo primero que simplificaría si hay que recortar alcance.

### Límites del producto terminado (lo que vería un usuario real)
1. **Dónde se generan las pruebas — DECIDIDO 2026-09-24: proof server alojado por nosotros
   (con Matías).** No es local de cada usuario (Docker es imposible para el público y no existe en
   el celular). El proving "de la wallet" tampoco era alternativa: en agosto `getProvingProvider()`
   de Lace mandaba los datos al servidor remoto de Midnight (ver comentario en `providers.ts`).
   Consecuencia: **el operador del proof server ve en claro los datos privados de cada prueba** —
   la `local_sk` de cada usuario (con ella podría calcular sus seudónimos por organizador) y los
   valores de las credenciales que se prueban. La cadena y los demás usuarios siguen sin ver nada;
   la privacidad pasa a depender de confiar en AdaSouls. Requisitos para que sea aceptable:
   - sin registros de los cuerpos de los pedidos (solo métricas);
   - HTTPS y CORS limitado a nuestro dominio;
   - control de abuso (límite por IP o token de sesión): probar es caro en CPU;
   - capacidad para picos (cientos de pruebas a la vez en una puerta);
   - a futuro, correrlo en un entorno aislado (TEE / confidential computing) para que ni nosotros
     podamos leer los datos;
   - ajustar textos que prometen más de lo que se cumple frente al operador ("Only you can see
     these", "your wallet is not revealed") o explicarlo en la política de privacidad.
2. **Intercambio de claves a mano.** Para emitir una credencial, holder y organizador se pasan
   claves por fuera de la app (chat, mail). Con una persona se tolera; con cien entradas no.
3. **Pruebas sin momento.** Un pedido se puede reutilizar y la verificación no lee los argumentos,
   así que un comprobante viejo se puede volver a mostrar. En una puerta, alguien podría presentar
   la prueba de otro. Falta que el verificador genere un pedido nuevo en el momento.
4. **Nada se "consume".** No hay prueba de un solo uso para tenencia o asistencia: sirve para
   demostrar, no para validar una entrada una sola vez.
5. **Reclamo abierto en eventos públicos.** Sin códigos de reclamo, un Event o Follow no puede
   limitar quién lo obtiene.
6. **Solo "está en esta lista".** Sin rangos ni comparaciones (A3): "edad ≥ 18" se resuelve con
   categorías.
7. **El anonimato depende del tamaño del evento.** Con pocas credenciales emitidas, "alguien de
   este evento" identifica a la persona. La interfaz no lo advierte.
8. **Cada prueba es una transacción.** Cuesta DUST y tarda lo que tarde la red; el verificador
   espera la confirmación.
9. **Recuperación.** Si el usuario pierde el navegador y el recovery code, pierde su identidad en
   el contrato: sus POAPs siguen existiendo pero ya no puede probar que son suyos.
10. **Servicios propios en el medio.** Si el proxy de Pinata o el indexer POAP caen, la app no lista
    ni entrega nada (los tokens siguen en la cadena). El proxy ve metadatos: quién sube, cuándo y
    con qué `lookupId`, aunque no el contenido.
11. **Onboarding de wallet.** Instalar Lace o 1am, tener NIGHT, generar DUST y esperar la
    sincronización antes de la primera firma: es la barrera de entrada más alta para el público
    general, y no depende de nosotros.

---

## Mejoras propuestas (orden sugerido, después de la prueba en vivo)
1. **Proof server de producción** (límite 1; infraestructura con Matías). En el frontend alcanza con
   apuntar `REACT_APP_MIDNIGHT_PROOF_SERVER_URL` a la URL alojada; el trabajo está en el servidor
   (sin logs, CORS, límites, escala) y en ajustar los textos de privacidad. El local queda solo
   para desarrollo.
2. **QR para el intercambio de claves** (límite 2). El holder muestra un QR o un link con su código;
   Mint POAP lo lee y rellena el destinatario.
3. **Pedidos en el momento** (límites 3 y 4). Una pantalla de verificador: genera un pedido nuevo,
   muestra un QR, el holder responde a ese pedido y la pantalla se actualiza sola al confirmarse.
   Para "un solo uso" haría falta una variante de tenencia con nullifier en el contrato (pedido a
   Matías).
4. **A3 — rangos y comparaciones** (límite 6), y A4 — campos con tipo (fecha, número).
5. **Códigos de reclamo** para Event/Follow (límite 5): links de un solo uso generados por el
   organizador. Probablemente necesita soporte en el contrato.
6. **Aviso de anonimato** (límite 7): mostrar cuántas credenciales vivas tiene el evento antes de
   una prueba anónima.
7. **Resiliencia** (límite 10): varios gateways de IPFS y un modo de solo lectura cuando el indexer
   POAP no responde.

Para la demo del Hito 5 alcanza con el flujo de Credential (recital o título) tal como está; las
mejoras 1 a 3 son las que separan la demo de un piloto con usuarios reales.


---

## Ideas para más adelante (2026-09-24, conversadas, sin diseñar)

### Validez / vencimiento
Un campo opcional **"Validity"** en el evento (horas, días, meses, años o sin vencimiento) que el POAP
cruza con una fecha para mostrar **"Active until …"** o **"Expired"**. Según la categoría, el plazo
se cuenta desde una fecha distinta:

- **Subscription: desde la última prueba de tenencia.** Tener el POAP no te hace suscriptor activo;
  probarlo cada tanto sí. El suscriptor renueva cuando quiere, probando de nuevo (una transacción,
  con costo de DUST). Es una señal de confianza, no un control de pago. El organizador conserva el
  corte: si quema el POAP, ya no se puede volver a probar y queda vencido. Funciona también con la
  prueba anónima, porque la validez es del evento y no del token. Base ya hecha: el historial de
  pruebas (`proof-history.ts`).
- **Credential (matrícula médica por N años, licencia de conducir por 5): desde la emisión.** El
  holder no puede autorrenovarse: renueva el emisor, que emite una credencial nueva; puede revocar
  antes quemándola. La hora de emisión sale del `mintedBlock` del token y la hora del bloque del
  indexer de Midnight.

Piezas: campo en el asistente y la metadata; badge en el POAP; vigencia de cada prueba en el
historial; y en `/app/verify`, "valid until … / expired". Esto último necesita leer de la
transacción el pedido (`requestId`), que dice de qué evento es, para que no se pueda falsificar
pasando otro evento por la URL.

Relacionado: habilitar **"solo por invitación"** también en Event y Subscription (hoy solo existe en
Credential), para membresías pagas donde renueva el organizador. Y la ventana de N horas desde la
entrada a un evento, con renovación, necesita un check-in de un solo uso en el contrato (a
conversar con Matías).

### "Ask for Proof of Ownership" automático
Hoy es un paso manual del organizador. Si lo olvida, sus holders no tienen prueba anónima de
tenencia, y Prove Ownership les pide 2 firmas y vincula su wallet con el token. Opciones: publicarlo
automáticamente al crear el evento (una firma más en ese momento), o al menos un aviso en la tarjeta
del evento mientras no esté publicado.
