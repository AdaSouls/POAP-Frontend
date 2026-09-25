# Prueba de credenciales — entrada para un recital

Guía para probar a mano, en la devnet local, todo el circuito de credenciales privadas: crear el
evento, invitar al fan con un link, emitir la entrada con datos privados con tipo, que el fan los
reciba cifrados, y que en la puerta demuestre cosas sobre su entrada sin revelarlas. Incluye la
validez, el revocado y las pruebas por rango.

Sigue los pasos **en orden**: cada parte usa algo que se creó en la anterior.

Estado al 2026-09-24 (noche): contrato `073ec6615f85f72bbaf9285db6ba9718556731a0e9378284c57d84ee7c047356`.
Tests: 421 pasan; fallan los 5 de siempre (MyEvents/EventFilters). Las partes 1–6 del circuito
básico ya se probaron en vivo; **las mejoras del MVP (links + QR, campos con tipo y rangos, aviso de
anonimato, validez, revocar/burn) no se probaron nunca contra el nodo**. La sección "Checklist" al
final lista lo que más importa confirmar.

---

## Qué se prueba

| Funcionalidad | Dónde | Quién |
|---|---|---|
| Campos privados con tipo (Texto, Número, Fecha, Lista) | Create Event → Credential → campos privados | Productora |
| Validez (y el campo automático "Valid until") | Create Event → paso de cupo | Productora |
| Link de invitación + QR | Card del evento → "Invite Link" | Productora |
| Código del fan + link de emisión + QR | Abrir el link de invitación (`/app/key`) | Fan |
| Mint POAP con el destinatario ya cargado | Abrir el link de emisión (`/app/mint`) | Productora |
| Valores privados al emitir + entrega cifrada | Mint POAP → paso "Private details" | Productora |
| Ver los datos privados propios | Card expandida del POAP → "Private details" | Fan |
| Habilitar pruebas de tenencia | Card del evento → "Ask for Proof of Ownership" | Productora |
| Preguntas por un dato privado (lista, número, fecha, edad) | Card del evento → "Ask for a Disclosure" | Productora |
| Prueba de tenencia (revela el token) | Card del POAP → "Prove Ownership" | Fan |
| Prueba anónima de tenencia + aviso de anonimato | Card del POAP → "Prove Ownership Anonymously" | Fan |
| Prueba anónima sobre un dato privado (incluye rangos) | Card del POAP → "Prove a Private Detail" | Fan |
| Badge de validez ("Valid until" / "Expired" / "Not proven yet") | Card del POAP | Fan |
| Comprobante + verificación sin wallet (con validez) | Link `/app/verify` | Cualquiera |
| Revocar una entrada | Lista de suscriptores → "Revoke" | Productora |
| Quemar la propia entrada | Card del POAP → "Burn" | Fan |

---

## Preparación

1. **Servicios** (los levanta Claude al empezar la sesión):
   - Devnet: `docker compose -f devnet.yml start` en `POAP-Midnight`.
   - Indexer POAP `:3001`, proxy de Pinata `:4000` y frontend `:3000`.
   - **El proxy de Pinata (`server/`) cambió** (las preguntas ahora se guardan como regla). Si lo
     levantaste antes de esta versión, reinícialo.
   - **No hace falta reset:** el contrato no cambió. Los eventos y entradas de pruebas anteriores
     siguen en la cadena y no interfieren; todo se prueba sobre un evento nuevo (Parte 1). Solo
     conviene un reset (ver runbook) para grabar el video con la cadena vacía.
2. **Dos perfiles de Chrome**, cada uno con una de las dos wallets de la devnet:
   - **Perfil A = la productora** (rol Organizer).
   - **Perfil B = el fan** (rol Subscriber).
3. Abre cada wallet y espera a que termine de sincronizar antes de firmar nada (1am no deja
   aprobar mientras dice "Wallet is still syncing"; después de cada transacción puede pedir
   resincronizar).
4. Un tercer lugar sin wallet para el final: una ventana de incógnito sirve.
5. Un celular con cámara, para escanear un QR (opcional).

---

## Parte 1 — La productora crea el evento (perfil A)

1. Rol **Organizer** → **My Events** → **Create Event**.
2. Categoría **Credential**.
3. Nombre: `Soda Stereo — Noche 2` (distinto del evento de la prueba anterior, que sigue en la
   cadena). Imagen del recital.
4. Paso de cupo:
   - Cupo `100`, vencimiento `25/10` (el hint dice que después de esa fecha no se emiten más).
   - **Validity**: al principio el número está desactivado. Elige unidad **Years** → el botón Next
     se desactiva hasta que pongas cantidad → pon `1`.
5. Paso de **campos privados**: cada campo tiene nombre y **tipo**. Agrega:
   - `Sector` — **List** — opciones `Campo, Platea, VIP`. (Con una sola opción aparece un error y
     no deja seguir: prueba escribir solo `Campo` primero.)
   - `Fila` — **Number** — min `1`, max `50`.
   - `Titular` — **Text**.
   - `Nacimiento` — **Date**.
6. Firma y espera a que aparezca la card.

**Qué comprobar:** en la metadata del evento queda también un campo **"Valid until"** que no
agregaste: lo suma la validez (Parte 3 lo muestra).

## Parte 2 — Invitación y clave del fan (perfiles A y B)

7. **A**: expande el evento → **Invite Link**. Se abre un popup con un **QR** y el link
   (`/app/key#organizer=…&event=…`). Cópialo (o escanéalo con el celular) y pásaselo a B.
8. **B**: abre el link con la wallet de B conectada. Página **Credential Invite**:
   - dice "You've been invited to receive a credential of Soda Stereo — Noche 2…";
   - genera la clave sola (sin pegar nada) y muestra el **link de emisión** con su QR
     (`/app/mint#to=<código>&event=…`).
9. B copia ese link y se lo pasa a A.

**Qué comprobar:**
- Sin wallet conectada, la página pide conectarla antes de generar nada.
- Get My Key (manual) sigue funcionando: pegando la clave del organizador, además del código
  aparece un link de emisión (sin evento).

## Parte 3 — La productora emite la entrada (perfil A)

10. **A** abre el link de emisión. Página **Issue a Credential**: se abre sola **Mint POAP** con el
    código de B ya cargado en "Recipient's Key".
11. Paso **Private details**: cada campo tiene el control de su tipo:
    - Sector: desplegable → `Campo`.
    - Fila (1 to 50): prueba `60` → error "Must be at most 50" y Next desactivado → pon `12`.
    - Titular: `Juan Perez`.
    - Nacimiento: selector de fecha → `2000-05-17`.
    - **Valid until**: ya viene con **hoy + 1 año**, con el texto "Set from the event's validity".
12. Paso 3: imagen de la entrada. Paso 4: ícono (opcional) → **Mint POAP** → firma.

**Qué comprobar:**
- Si abres el mismo link de emisión con la wallet de **B**, dice "This link is for the organizer of
  this event" y no abre nada.
- El mensaje final dice que los detalles se enviaron cifrados; la card del evento pasa a **1 minted**.

## Parte 4 — El fan ve su entrada (perfil B)

13. **My Subscriptions**: la entrada aparece en unos segundos, sin recargar.
14. En la tarjeta cerrada: badge **"Valid until <fecha de hoy + 1 año>"** (verde).
15. Expándela → **Private details** → **Show**: `Campo`, `12`, `Juan Perez`, `2000-05-17` y la fecha
    de Valid until.

## Parte 5 — La productora habilita las pruebas (perfil A)

16. En el evento expandido → **Ask for Proof of Ownership** → firma → **"Proof of Ownership Enabled"**.
17. **Ask for a Disclosure**, tres preguntas (una firma cada una):
    - **Sector** → casillas → marca `Campo` y `Platea` → Publish.
    - **Nacimiento** → "is at least N years ago" → Years `18` → el campo "From" se completa solo
      (100 años antes) → debe decir "Accepts ~36,500 values. Holders' browsers take a few seconds…"
      → Publish. Tarda unos segundos en "Building the … accepted values".
    - **Valid until** → "is on or after" → hoy → "Up to" se completa con hoy + 30 años → Publish.

**Qué comprobar:** cada publicación termina con 'Published: "…"' y la pregunta en palabras
("Sector is one of: Campo, Platea", "Nacimiento on or before <hoy − 18 años>", "Valid until on or
after <hoy>").

## Parte 6 — En la puerta, el fan prueba (perfil B)

Expande la entrada en My Subscriptions.

**6a. Prueba de tenencia (revela qué entrada es)**
18. **Prove Ownership** → "1 signature" → **Generate Proof** → firma → comprobante "Ownership
    proof", "Owns POAP #N". Copia el link de verificación.

**6b. Prueba anónima de tenencia + aviso de anonimato**
19. **Prove Ownership Anonymously** → arriba aparece el aviso ámbar **"You're the only holder of
    this event so far, so this proof points straight at you."** El botón **Prove** sigue activo.
20. **Prove** → firma → comprobante "Anonymous ownership proof", sin número de token.

**6c. Pruebas sobre datos privados**
21. **Prove a Private Detail** → aparecen las tres preguntas en palabras, con el mismo aviso de
    anonimato arriba.
22. Prueba las tres (una firma cada una). La de Nacimiento y la de Valid until muestran primero
    "Building the … accepted values…" (unos segundos) y después siguen como siempre.

**6d. Historial y badges**
23. Cierra el popup: badge **"Proven · <hoy>"** y el de validez. **Proof history** con todas las
    pruebas, cada una con **Verify**.

## Parte 7 — Seguridad verifica sin wallet (incógnito)

24. Abre cada link de verificación en incógnito, sin conectar nada.
25. Debe decir **"Valid: …"** con el tipo de prueba, el bloque y la hora, y en "Proven" la pregunta
    en palabras. La de **Prove Ownership** muestra además **"Validity: Valid until … · 1 year from
    when it was issued"**.
26. La de Nacimiento puede tardar unos segundos: la página arma la lista para confirmar que la
    pregunta publicada coincide con la de la cadena.
27. Pega el hash de la transacción de **creación del evento**: debe decir **"Not a proof"**.

## Parte 8 — Revocar (perfil A) y quemar (perfil B)

28. **A**: evento expandido → **View Recipients** → la entrada de B tiene **Revoke** → popup "Revoke
    POAP" con "This can't be undone" → **Revoke** → firma.
29. La lista y el gráfico del evento marcan la entrada como **Burned** enseguida, sin recargar.
30. **B**: en My Subscriptions la entrada pasa a **Burned** (en pocos segundos) y desaparecen los
    botones de prueba, Burn y el badge de validez.
31. Abre de nuevo el link de verificación de la Parte 6a: ahora dice **"revoked since block …"**.

---

## Variantes

**A. Valor que no está en la lista**
- **A**: Ask for a Disclosure → `Sector` → marca solo `Platea` y `VIP`.
- **B**: en Prove a Private Detail esa pregunta aparece con "Your value isn't one of the accepted
  ones" y el botón **Prove desactivado**. No se envía nada a la cadena.
- Lo mismo con un rango: `Fila` → "is at least (≥)" `20` (el tope sale del max del campo: 50) →
  la fila 12 no califica.

**B. Código viejo, sin clave de cifrado (link de respaldo)**
- Emite otra entrada pegando **solo la primera mitad** del código de B (los 64 caracteres antes
  del punto).
- En Private details aparece un aviso ámbar. Al terminar, el popup muestra un **link privado**.
- **B**: abre ese link → "Saved in this browser" con los valores. Con **otra** wallet, el mismo
  link dice que la credencial es de otra wallet.

**C. Sin pedido del organizador**
- En un evento sin "Ask for Proof of Ownership": **Prove Ownership** pide **2 firmas** con el aviso
  ámbar; **Prove Ownership Anonymously** dice que el organizador todavía no habilitó las pruebas.

**D. Backup**
- En el perfil B: Backup & Restore → "Back up to cloud". En un perfil nuevo, misma wallet,
  restaura con el recovery code → vuelven los datos privados, el badge **"Proven"** y el **Proof
  history**.

**E. Event y Subscription no tienen campos privados**
- Al crear un **Event** o **Subscription** el asistente **no** muestra el paso de campos privados,
  y la card no muestra "Ask for a Disclosure" ni "Invite Link".

**F. Validez de una Subscription**
- **A**: crea una **Subscription** con Validity `2` **Days** (el hint dice "counted from the
  holder's last proof of ownership") → **Ask for Proof of Ownership**.
- **B**: suscríbete → la tarjeta muestra **"Not proven yet"** (gris).
- **B**: **Prove Ownership Anonymously** → firma → el badge pasa a **"Active until <en 2 días, con
  hora>"**. En Proof history, la prueba dice "· valid until …".
- Link de verificación en incógnito: **"Validity: Valid until … · 2 days from this proof"**.

**G. El fan quema su entrada**
- **B**: en una entrada propia → **Burn** → popup "Burn POAP" → **Burn** → firma → la tarjeta
  pasa a **Burned** al instante.

**H. Link de emisión sin evento**
- **B**: Get My Key manual (pegando la clave de A) → copia el link de emisión (no trae evento).
- **A**: ábrelo → "Pick the event" con la lista de sus eventos Credential activos → **Mint POAP**
  en uno → abre Mint POAP con el código de B cargado.

**I. Aviso de anonimato con más holders**
- En un evento con 5 entradas vivas o más, el aviso ámbar desaparece y queda la línea "Anonymous
  among N holders of this event". Lo más fácil: un Event público reclamado por varias wallets.

---

## Checklist en vivo

Lo que los tests no pueden cubrir y hay que confirmar acá:

- [ ] **Parte 2:** el link de invitación genera el código solo; el QR se escanea con el celular.
- [ ] **Parte 3:** el link de emisión abre Mint POAP con el destinatario cargado; el mint con raíz
      de atributos pasa.
- [ ] **Parte 4:** los datos privados llegan solos (entrega cifrada vía Pinata), con los valores
      canónicos (fecha `YYYY-MM-DD`, número sin ceros adelante).
- [ ] **Parte 5:** las preguntas de rango se publican; la regla llega a Pinata (proxy nuevo).
- [ ] **Parte 6c:** **las pruebas por rango pasan** (es la primera vez que un conjunto de miles de
      valores llega al circuito). Si falla con "don't match it on-chain", la regla publicada no
      reconstruye la raíz: avísame con el error de la consola.
- [ ] **Parte 6c:** el tiempo de "Building the … accepted values" es tolerable y la página no se
      congela.
- [ ] **Parte 7:** la verificación muestra la pregunta de rango en palabras y la validez.
- [ ] **Parte 8:** Revoke y Burn pasan con la wallet correcta (el contrato acepta al organizador y
      al dueño) y la UI se actualiza sin recargar.
- [ ] **Variante F:** "Not proven yet" → "Active until" después de probar.
- [ ] **Variante D:** el historial de pruebas vuelve con la restauración.

## Límites que vas a notar

- **Los links al explorer no abren en la devnet local.** midnightexplorer.com solo muestra
  preprod y mainnet. La verificación propia (`/app/verify`) sí funciona en local.
- **Una prueba se puede repetir.** Sirve para demostrar que tienes la entrada, no para
  "consumirla" en la puerta: no hay variante de un solo uso.
- **Las pruebas anónimas son tan anónimas como grande sea el evento.** Ahora la app lo avisa.
- **Las preguntas son públicas** (la regla se guarda en Pinata para que el fan pueda responder).
  La respuesta del fan, no.
- **Los rangos grandes tardan.** Un rango de fechas de 100 años son ~36.500 valores: unos segundos
  para publicar la pregunta, para probarla y para verificarla.
- **La validez no la conoce el contrato.** Es una señal que calcula la app. Una prueba anónima de
  una Credential no dice qué credencial es, así que no puede saber si venció: para eso está la
  pregunta "Valid until on or after hoy".

---

## Cómo funciona por dentro (resumen)

- **Plantilla:** en Credential, `createEvent` guarda en la metadata pública del evento
  `credentialAttributeFields`: `fieldId` aleatorio, nombre, tipo y sus límites u opciones
  (`attribute-types.ts`). Con validez, además `validity` y un campo automático "Valid until"
  (`validity.ts`).
- **Links:** `invite-links.ts` arma y lee los dos links; todo va después del `#`.
- **Emisión:** Mint POAP pasa cada valor a su forma canónica, genera un `rand` por campo, arma el
  árbol de atributos (profundidad 8) y pasa la raíz a `mintTo`.
- **Entrega:** el paquete se cifra con X25519 + AES-GCM para la clave del código del fan y se sube
  a Pinata privado (`/api/credential-delivery`).
- **Preguntas:** una pregunta es una **regla** (lista, rango de números o de fechas). Se publica la
  regla en `/api/disclosure-sets`; on-chain queda solo la raíz del conjunto que la regla expande
  (hasta 65.536 valores). El árbol se arma por partes para no congelar la página.
- **Pruebas anónimas:** la app expande la regla, comprueba que su raíz coincide con la del pedido,
  y llama a `proveEventAttendance` o `proveCredentialAttribute`.
- **Validez:** Subscription desde la última prueba de tenencia del historial local; Event y
  Credential desde la hora del bloque de minteo (indexer de Midnight), o el "Valid until" privado.
- **Revocar/Burn:** `burn(tokenId)`; el contrato acepta al dueño, al organizador del evento o al admin.
- **Verificación:** `/app/verify` busca la transacción en el indexer de Midnight (GraphQL), lee del
  transcript qué pedido, evento y token fueron, y muestra la pregunta y la validez.

## Archivos (mejoras del MVP, 2026-09-24)

- Nuevos:
  - `src/midnight/attribute-types.ts` (tipos, valores canónicos, reglas y rangos)
  - `src/midnight/validity.ts` (validez)
  - `src/midnight/invite-links.ts` (links de invitación y emisión)
  - `src/midnight/token-events.ts` (aviso de token quemado)
  - `src/jsx/components/QuestionBuilder.jsx`, `src/jsx/components/LinkQrCard.jsx`
  - `src/jsx/drawer/views/burnToken.jsx`, `src/jsx/drawer/views/linkQrPopup.jsx`
  - `src/jsx/pages/keyInvite.jsx` (`/app/key`), `src/jsx/pages/mintLink.jsx` (`/app/mint`)
- Modificados: `server/index.js` (`/api/disclosure-sets` con reglas), `merkle.ts`,
  `holder-proofs.ts`, `disclosure-sets.ts`, `proof-verification.ts` (hora de un bloque),
  `createEvent.jsx`, `PrivateAttributesStepFields.jsx`, `mintPoap.jsx`, `getHolderKey.jsx`,
  `publishDisclosureRequest.jsx`, `holderProofs.jsx`, `subscribersList.jsx`, `eventCard.jsx`,
  `poapCard.jsx`, `verifyProof.jsx`, `router.jsx`, reducer y drawer, CSS, `package.json`
  (`qrcode.react`), y sus tests.
- Quitados: atributos privados a nivel evento (`disclosureRespond.jsx`, `disclosure-response.ts`,
  `private-attribute-drafts.ts`).
