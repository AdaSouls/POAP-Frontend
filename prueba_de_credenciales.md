# Prueba de credenciales — entrada para un recital

Guía para probar a mano, en la devnet local, todo el circuito de credenciales privadas: crear el
evento, emitir la entrada con datos privados, que el fan los reciba cifrados, y que en la puerta
demuestre cosas sobre su entrada sin revelarlas.

Sigue los pasos **en orden**: cada parte usa algo que se creó en la anterior.

Estado al 2026-09-24: contrato `44cd94ade4a21488c703e7139df25060ed4880e1a949d9cd852a92966f084ea2`.
Todo lo de esta guía está cubierto con tests (357/362; los 5 que fallan son los de siempre de
MyEvents/EventFilters), pero **nada se probó todavía contra el nodo**. Esta prueba es la primera
en vivo. La sección "Checklist" al final lista lo que más importa confirmar.

---

## Qué se prueba

| Funcionalidad | Dónde | Quién |
|---|---|---|
| Campos privados por credencial (plantilla) | Create Event → Credential → paso de campos privados | Productora |
| Clave con cifrado en "Get My Key" | My Subscriptions → Get My Key | Fan |
| Valores privados al emitir (B7) + entrega cifrada | Mint POAP → paso "Private details" | Productora |
| Ver los datos privados propios | Card expandida del POAP → "Private details" | Fan |
| Habilitar pruebas de tenencia | Card del evento → "Ask for Proof of Ownership" | Productora |
| Preguntar por un dato privado | Card del evento → "Ask for a Disclosure" | Productora |
| Prueba de tenencia (revela el token) (B6) | Card del POAP → "Prove Ownership" | Fan |
| Prueba anónima de tenencia | Card del POAP → "Prove Ownership Anonymously" | Fan |
| Prueba anónima sobre un dato privado | Card del POAP → "Prove a Private Detail" | Fan |
| Comprobante único + verificación sin wallet (B8) | Al final de cada prueba → link `/app/verify` | Cualquiera |

---

## Preparación

1. **Servicios** (los levanta Claude al empezar la sesión):
   - Devnet: `docker compose -f devnet.yml start` en `POAP-Midnight`.
   - Indexer POAP `:3001`, proxy de Pinata `:4000` y frontend `:3000`.
   - **El proxy de Pinata (`server/`) tiene endpoints nuevos.** Si lo levantaste antes de esta
     versión, reinícialo.
2. **Dos perfiles de Chrome**, cada uno con una de las dos wallets de la devnet:
   - **Perfil A = la productora** (rol Organizer).
   - **Perfil B = el fan** (rol Subscriber).
3. Abre cada wallet y espera a que termine de sincronizar antes de firmar nada (1am no deja
   aprobar mientras dice "Wallet is still syncing").
4. Un tercer lugar sin wallet para el final: una ventana de incógnito sirve.

---

## Parte 1 — La productora crea el evento (perfil A)

1. Rol **Organizer** → **My Events** → **Create Event**.
2. Categoría **Credential**.
3. Nombre: `Tributo a Soda Stereo — 25/10`. Imagen del recital, cupo `100`, vencimiento `25/10`.
4. En el paso de **campos privados** aparece "Add private field" y **solo pide nombres**, no
   valores. Agrega estos cuatro:
   - `Sector`
   - `Fila`
   - `Asiento`
   - `Titular`
5. Firma y espera a que aparezca la card.

**Qué comprobar:** el paso de campos no muestra casillas de valor (en Credential los valores se
cargan por persona al emitir).

## Parte 2 — El fan genera su clave (perfil B)

6. **A**: expande el evento → **View Blockchain Info** → copia la clave del **Organizer** y pásasela a B.
7. **B**: rol **Subscriber** → **My Subscriptions** → **Get My Key** → pega la clave → **Generate My Key**.
8. Copia el código y pásaselo a A.

**Qué comprobar:** el código ahora tiene **dos partes separadas por un punto** (129 caracteres).
La segunda parte es la clave con la que la productora le cifra los datos privados. Si lo generas
de nuevo, sale el mismo código.

## Parte 3 — La productora emite la entrada (perfil A)

9. En el evento expandido → **Mint POAP**.
10. Paso 1: pega el código de B → Next.
11. Paso 2, **Private details**: completa
    - Sector: `Campo`
    - Fila: `12`
    - Asiento: `34`
    - Titular: `Juan Perez` (sin acento; cada valor tiene como máximo 32 bytes)
12. Paso 3: imagen de la entrada (el "documento"). Paso 4: ícono (opcional) → **Mint POAP** → firma.

**Qué comprobar:**
- El mensaje final dice que los detalles privados se enviaron cifrados, y muestra el hash real de
  la transacción (ya no "undefined").
- La card del evento pasa sola a **1 minted**.

## Parte 4 — El fan ve su entrada (perfil B)

13. **My Subscriptions**: la entrada aparece en unos segundos, sin recargar.
14. Expándela. Arriba de los botones hay un bloque **Private details** con los cuatro nombres y
    los valores tapados (`••••••`).
15. Toca **Show**: aparecen `Campo`, `12`, `34`, `Juan Perez`. **Hide** los vuelve a tapar.

**Qué comprobar:** los valores llegaron sin que nadie te los mande a mano. Solo este navegador
puede leerlos: van cifrados con una clave que se deriva de tu identidad.

## Parte 5 — La productora habilita las pruebas (perfil A)

16. En el evento expandido → **Ask for Proof of Ownership** → firma → debe quedar
    **"Proof of Ownership Enabled"**. Este pedido sirve para Prove Ownership y para Prove
    Ownership Anonymously.
17. **Ask for a Disclosure** → en "Attribute" elige **`Sector (each credential)`** → valores
    aceptados `Campo` y `Platea` → **Publish Request** → firma.

**Qué comprobar:** el mensaje dice que los holders ya pueden responder desde su POAP (Prove a
Private Detail). Ya no hace falta mandar ningún link.

## Parte 6 — En la puerta, el fan prueba (perfil B)

Expande la entrada en My Subscriptions. Hay tres pruebas posibles; haz las tres.

**6a. Prueba de tenencia (revela qué entrada es)**
18. **Prove Ownership** → debe decir "the organizer published: **1 signature**" →
    **Generate Proof** → firma.
19. Aparece el **comprobante**: "Ownership proof", "Owns POAP #N", el evento, la hora, el hash
    y un **link de verificación**. Cópialo.

**6b. Prueba anónima de tenencia (no revela la entrada ni la wallet)**
20. **Prove Ownership Anonymously** → aparece "Holds a valid POAP of this event · Asked by the organizer" →
    **Prove** → firma.
21. Comprobante: "Anonymous ownership proof". **No** muestra número de token.

**6c. Prueba anónima sobre un dato privado**
22. **Prove a Private Detail** (solo aparece en credenciales con datos privados) → aparece "Sector is one of: Campo, Platea" → **Prove** → firma.
23. Comprobante: "Private detail proof". Demuestra que el sector está en esa
    lista **sin decir cuál** ni qué entrada es.

**6d. Historial de pruebas en la entrada**
24. Cierra el popup. La entrada muestra el badge **"Proven · <fecha de hoy>"**: en la tarjeta
    cerrada, junto a Soulbound, y en la expandida. Pasando el mouse, dice qué prueba fue y a qué hora.
25. Expandida, aparece **Proof history** con las tres pruebas (la más nueva arriba), cada una con
    su botón **Verify**, que abre la página de verificación de esa transacción.
26. Solo lo ve el fan: la productora (perfil A) y la página pública de colección no lo muestran.

## Parte 7 — Seguridad verifica sin wallet (incógnito)

27. Abre cada link de verificación en una ventana de incógnito, sin conectar nada.
28. Debe decir **"Valid: …"** con el tipo de prueba correcto, el bloque y la hora.
29. Prueba también pegar el hash de la transacción de **creación del evento**: debe decir
    **"Not a proof"**.

---

## Variantes

**A. Valor que no está en la lista**
- **A**: Ask for a Disclosure → `Sector (each credential)` → valores `Platea` y `VIP`.
- **B**: en Prove a Private Detail esa pregunta aparece con "Your value isn't one of the accepted ones"
  y el botón **Prove desactivado**. No se envía nada a la cadena.

**B. Código viejo, sin clave de cifrado (link de respaldo)**
- Emite otra entrada, en otro evento Credential con campos, pegando **solo la primera mitad** del
  código de B (los 64 caracteres antes del punto).
- En el paso Private details aparece un aviso ámbar. Al terminar, en vez de cerrarse, el popup
  muestra un **link privado** para copiar.
- **B**: abre ese link con la wallet conectada → "Saved in this browser" con los valores → en My
  Subscriptions la entrada muestra sus datos privados.
- Con **otra** wallet conectada, el mismo link debe decir que la credencial es de otra wallet.

**C. Sin pedido del organizador**
- En un evento donde la productora **no** tocó "Ask for Proof of Ownership":
  - **Prove Ownership** pide **2 firmas** y muestra el aviso ámbar (tu ID queda ligado a esa
    entrada). La segunda vez pide 1 sola.
  - **Prove Ownership Anonymously** dice que el organizador todavía no habilitó las pruebas. El fan nunca publica pedidos
    propios para las pruebas anónimas, así que no hay costo de privacidad.

**D. Backup**
- Después de la Parte 4, en el perfil B: Backup & Restore → "Back up to cloud".
- En un perfil nuevo, con la misma wallet, restaura con el recovery code → la entrada debe
  mostrar sus datos privados (o volver a bajarlos cifrados: la clave se deriva de la identidad
  restaurada).
- Si ya hiciste la Parte 6, la entrada restaurada también debe traer el badge **"Proven"** y el
  **Proof history** (viajan en el backup).

**E. Atributos del evento (el flujo anterior, para Event/Follow)**
- En eventos Event o Follow, el paso de atributos sigue pidiendo **nombre y valor**, iguales para
  todos. Las preguntas sobre esos atributos las responde el navegador del organizador con el link
  de "Ask for a Disclosure" (ya no los holders).

**F. Pruebas de tenencia en un Event o Subscription (sin credencial)**
- **A**: crea un evento **Event** o **Subscription** (sin datos privados) → expandido → **Ask for
  Proof of Ownership** → firma.
- **B**: reclámalo (Subscribe/Attend) → en My Subscriptions, expandido, aparecen **Prove Ownership**
  y **Prove Ownership Anonymously**, y **no** aparece Prove a Private Detail.
- Haz las dos pruebas: cada una firma una vez, muestra su comprobante ("Ownership proof" /
  "Anonymous ownership proof") y queda en el **Proof history** con el badge "Proven".
- Abre los dos links de verificación en incógnito: deben decir **"Valid: …"** con el nombre correcto.

---

## Checklist en vivo

Lo que los tests no pueden cubrir y hay que confirmar acá:

- [ ] **Parte 2:** Get My Key genera el código con punto. Si falla con "could not derive an X25519
      public key", el navegador no soporta X25519 en WebCrypto (Chrome ≥ 133 sí).
- [ ] **Parte 3:** el mint con raíz de atributos pasa (el contrato acepta el `credentialAttributesRoot`).
- [ ] **Parte 4:** los datos privados aparecen solos (entrega cifrada vía Pinata).
- [ ] **Parte 5:** los dos pedidos se publican; el `requestId` sale directo de la transacción.
- [ ] **Parte 6b y 6c:** las pruebas anónimas pasan. Es la primera vez que la app lee el árbol
      `credentials` del estado del contrato para armar la prueba. Si falla con "don't match its
      record on-chain", el problema está ahí; avísame con el error de la consola.
- [ ] **Parte 7:** el link de verificación encuentra la transacción. Si dice que no existe, el hash
      que guarda el comprobante no coincide con el que usa el indexer de Midnight.
- [ ] **Parte 6d:** el badge "Proven" aparece al cerrar el popup, sin recargar la página.
- [ ] **Variante D:** el historial de pruebas vuelve con la restauración.
- [ ] **Variante F:** las dos pruebas de tenencia funcionan en un POAP reclamado (Event/Subscription),
      no solo en credenciales.
- [ ] **Variante A:** el botón queda desactivado y no se firma nada.
- [ ] **Variante B:** el link de respaldo guarda los datos solo en la wallet correcta.

## Límites que vas a notar

- **Los links al explorer no abren en la devnet local.** midnightexplorer.com solo muestra
  preprod y mainnet. La verificación propia (`/app/verify`) sí funciona en local.
- **La verificación no lee los argumentos de la prueba.** Confirma que es una prueba válida del
  contrato POAP, de qué tipo y cuándo; no qué pedido respondió ni qué token. Por eso el comprobante
  muestra la pregunta y la hora, y seguridad compara la hora con cuando preguntó.
- **Una prueba se puede repetir.** Sirve para demostrar que tienes la entrada, no para
  "consumirla" en la puerta: no hay variante de un solo uso para tenencia ni asistencia.
- **Las pruebas anónimas son tan anónimas como grande sea el evento.** Con 1 entrada emitida,
  "alguien de este evento" es obviamente esa persona.
- **Los valores aceptados de una pregunta son públicos** (se guardan en Pinata para que el fan
  pueda responder). La respuesta del fan, no.

---

## Cómo funciona por dentro (resumen)

- **Plantilla:** en Credential, `createEvent` guarda en la metadata pública del evento la lista
  `credentialAttributeFields` (`fieldId` aleatorio + nombre). Sin valores, sin raíz de evento.
- **Emisión:** Mint POAP genera un `rand` por campo, calcula cada hoja con
  `computeCredentialAttrLeaf`, arma el árbol (profundidad 8) y pasa la raíz a `mintTo`. El
  contrato guarda la hoja de la credencial en el árbol `credentials` (índice = tokenId).
- **Entrega:** el paquete (valores, `rand`, raíz) se cifra con X25519 + AES-GCM para la clave del
  código del fan y se sube a Pinata privado (`/api/credential-delivery`), indexado por un hash de
  (holder_pk, evento). La clave del fan se deriva de su `local_sk` y del organizador: no hay que
  guardarla aparte y es distinta para cada organizador.
- **Recepción:** la card del POAP baja los sobres, abre el que descifra, comprueba que los valores
  reconstruyan la raíz y lo guarda localmente (entra en el backup).
- **Pruebas anónimas:** la app pide al contrato el camino de la credencial en el árbol
  `credentials`, comprueba que coincide, y llama a `proveEventAttendance` o
  `proveCredentialAttribute` contra un pedido que publicó la productora.
- **Verificación:** `/app/verify` busca la transacción en el indexer de Midnight (GraphQL) y mira
  qué circuito del contrato llamó.

## Archivos

- Nuevos:
  - `src/midnight/credential-crypto.ts` (claves y cifrado)
  - `src/midnight/credential-delivery.ts` (paquete, entrega, link de respaldo, chequeo on-chain)
  - `src/midnight/credential-store.ts` (copia local, entra en el backup)
  - `src/midnight/holder-proofs.ts` (pruebas anónimas)
  - `src/midnight/disclosure-sets.ts` (valores aceptados de cada pregunta)
  - `src/midnight/proof-verification.ts` (verificación B8)
  - `src/midnight/ownership-proof.ts` y `src/midnight/tx-result.ts`
  - `src/jsx/drawer/views/holderProofs.jsx`, `src/jsx/drawer/views/proveOwnership.jsx`
  - `src/jsx/components/ProofReceipt.jsx`
  - `src/jsx/pages/credentialImport.jsx` (`/app/credential`), `src/jsx/pages/verifyProof.jsx` (`/app/verify`)
- Modificados: `server/index.js` (endpoints `/api/credential-delivery` y `/api/disclosure-sets`),
  `contract.service.ts`, `merkle.ts`, `backup.ts`, `createEvent.jsx`,
  `PrivateAttributesStepFields.jsx`, `mintPoap.jsx`, `getHolderKey.jsx`,
  `publishDisclosureRequest.jsx`, `eventCard.jsx`, `poapCard.jsx`, reducer y drawer, CSS,
  `.env.example` (`REACT_APP_MIDNIGHT_INDEXER_GRAPHQL_URL`), y sus tests.
