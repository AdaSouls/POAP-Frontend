# Diseño — Wizard de creación categorizado (Evento / Suscripción / Credenciales)

Resultado del brainstorm (`/brainstorm`) iniciado a partir del pedido del usuario de reemplazar
`createEvent.jsx` genérico por un flujo guiado por rubro. Decisiones confirmadas por el usuario,
listas para pasar a plan/tasks de implementación.

## Alcance

- Frontend-only. No se modifica `../POAP-Midnight` (contrato/witnesses/indexer).
- **Reemplazo completo** de `createEvent.jsx`: no queda un formulario "genérico" de respaldo, las
  3 categorías son las únicas puertas de entrada para crear un evento/grupo.
- Se construyen **las 3 categorías juntas**, no de a una.
- Atado al deadline de Catalyst Hito 5 (2026-10-30).
- La categoría "Credenciales" depende de una pieza de trabajo separada y hoy incompleta: el
  push-mint (`mintPoap.jsx`) todavía no deja elegir imagen/metadata distinta por destinatario
  (`mintTo`'s `tokenMetadataURI` ya existe en el contrato desde 05d0e8f, pero el frontend siempre
  espeja el `metadataURI` del evento — ver `contract.service.ts` y memoria
  `project-poap-metadata-per-token-design`, Case 1). El wizard se diseña y construye igual, pero
  la promesa central de "Credenciales" (imagen individual por credencial) no queda 100% funcional
  hasta que esa pieza se termine.

## Estructura general (aplica a las 3 categorías)

- Step 0 nuevo: selector de categoría (Evento / Suscripción / Credenciales), tarjetas con
  explicación breve de qué es cada una y para qué sirve (texto explicativo tipo el que redactó el
  usuario: qué significa en la vida real, qué gana el organizador).
- Las 3 categorías reusan los mismos steps ya construidos (`EventDetailsFields`, `EventImageField`,
  supply/expiración, extra info, imagen de POAP distinta) — arquitectura config-driven en vez de
  triplicar `createEvent.jsx`: un objeto de configuración por categoría (labels, taxonomías,
  defaults) alimenta un wizard compartido.
- `isPublicMint` deja de ser un switch editable a mano: queda **fijo e implícito por categoría**.
  - Evento → público (self-claim)
  - Suscripción → público (self-claim)
  - Credenciales → invite-only (solo el organizador mintea, vía push-mint)
- La metadata (`metadataURI`, JSON libre en IPFS, sin impacto en el contrato) gana claves nuevas:
  `category`, `subcategory` (y sub-campos por categoría, ver taxonomías abajo). Eventos creados
  antes de este cambio no tendrán estas claves — la UI debe tolerar su ausencia (mostrar como "sin
  categorizar" o similar, no romper).

## Canales de información (nuevo step, las 3 categorías)

Lista repetible de `{ tipo, valor }` — cómo contactar/seguir al organizador más allá de
nombre/descripción/imagen:

- Email · Sitio web · Telegram · WhatsApp · Discord · Instagram/X (redes sociales) · Otro (etiqueta
  libre)

Público por defecto. Guardado como `channels: [{ type, value }]` en el JSON de metadata.

## Perfil de la entidad (nuevo, cuando el organizador no es "Individuo/Persona")

Distinto de "canales" (contacto digital) y distinto de "dirección del evento" (ver privacidad
abajo — esa es la ubicación específica de un evento presencial, privada). Este es el perfil público
de quién organiza: `dirección`, `localidad`, `provincia/estado`, `país`, `código postal`. Todos
opcionales, público por defecto (da legitimidad/confianza), sin toggle privado propio (evita
repetir la limitación de "todo o nada" del bundle privado existente). Guardado como
`organization: { addressLine, locality, region, country, postalCode }`.

## Taxonomías por categoría

Guardadas como constantes en el frontend (no hardcodeadas en cada paso), extensibles a futuro sin
tocar el contrato — agregar una opción nueva es editar un array. Cada select incluye "Otro" +
texto libre para no bloquear ningún caso no previsto.

**Evento**
- Tipo de organizador: Empresa · ONG/Sin fines de lucro · Institución educativa · Organismo
  público/Gobierno · Comunidad/Grupo informal · Profesional independiente · Otro
- Modalidad: Presencial · Virtual · Híbrido
- Finalidad: Premiar asistencia · Medir interés/participación · Certificar participación ·
  Networking/Conexión · Otro
- Tipo de evento: Conferencia/Charla · Curso/Workshop · Meetup social · Concierto/Show ·
  Feria/Exposición · Otro

**Suscripción**
- Tipo de entidad: Persona/Creador de contenido · Empresa/Marca · Organización/Comunidad · Medio
  de comunicación · Proyecto/Protocolo Web3 · Otro
- Rubro: Arte · Música · Tecnología · Finanzas · Gaming · Educación · Otro
- Naturaleza del vínculo: Seguimiento gratuito · Comunidad/Membresía · Otro (deja la puerta
  abierta a membresías pagas a futuro, sin construirlas ahora)

**Credenciales**
- Tipo de organización: Institución educativa · Empresa/Corporativo · Organismo público/Gobierno ·
  Organizador de eventos/Entretenimiento · Otro
- Tipo de credencial: Documento de identidad · Diploma/Certificado académico · Entrada a
  evento/Ticket · Documento legal/Contrato · Constancia laboral · Documentación privada
  (genérica) · Otro

## Privacidad — límite real del contrato, decisión tomada

`revealPrivateMetadata`/`revealPrivateTokenMetadata` no son selectivos: revelar = publicar para
cualquiera, no solo para quien reclamó el POAP. Además hay un solo commit privado por evento (todo
el "extra info privado" es un bundle único, revelado todo junto). Confirmado con `witnesses.ts`:
`holder_pk` es un hash (`persistentHash`), no un punto de curva elíptica — no sirve como clave
pública de cifrado, así que cifrado real dirigido a un holder específico requeriría una primitiva
nueva del lado del contrato (pedido al admin, mismo circuito que Case 1), no algo para construir
de forma segura solo en el frontend.

**Decisión (combo pragmático, sin tocar el contrato):**
- Info que solo necesita ocultarse un tiempo (ej. ganador de un sorteo hasta el evento): se usa el
  commit-reveal actual tal cual, pero comunicado en la UI como *"oculto hasta que el organizador lo
  publique"* — no como "privado para asistentes". Ya construido.
- Info que de verdad necesita restringirse a quien minteó (dirección física de un evento
  presencial, link de streaming): flujo fuera de cadena — el frontend consulta el indexer, confirma
  que la wallet tiene un token de ese evento, y solo ahí habilita un botón "Solicitar
  [dirección/link]" (notificación al organizador, o entrega directa si el organizador ya cargó el
  dato — protegido por el chequeo de posesión de token, no por criptografía; hay que ser honestos
  en la UI sobre esta limitación).
- Cifrado real por holder queda anotado como exploración futura, a coordinar con el admin — no
  entra en esta entrega.

## Riesgos

- Reemplazo completo es superficie grande sobre un componente con tests ya pasando — conviene ir
  con buena cobertura nueva antes de borrar el form actual.
- Credenciales no queda 100% funcional (imagen individual por credencial) hasta terminar el
  cableado pendiente de `mintPoap.jsx`/`mintTo` — se construye igual, pero hay que comunicar esa
  limitación mientras tanto.
- El flujo "fuera de cadena" para info restringida no es a prueba de un atacante que lea el código
  del cliente — es una restricción de UX, no una garantía criptográfica. No venderlo como tal.

## Próximos pasos

1. Plan mode para la implementación: wizard config-driven, las 3 categorías juntas.
2. En paralelo (no bloqueante): terminar de cablear `mintPoap.jsx` para que `mintTo` acepte
   imagen/metadata individual por destinatario (Case 1, ya soportado por el contrato).

## Actualización — SHIPPED (2026-08-20)

Todo lo de arriba está implementado y probado (wizard de 8 pasos, tests verdes salvo los 4
pre-existentes de `myEvents`/`my-events-flow`, no relacionados). Cambios posteriores al shipping
inicial, en la misma sesión de testing en vivo:

- **`mintPoap.jsx` (Case 1) cableado**: ya no es un form de una pantalla — es un wizard de 3 pasos
  (Recipient's Key → Credential Image → Icon), mismo patrón visual que `createEvent.jsx`. Cada
  push-mint sube una imagen de ícono opcional (`image`) y una imagen de documento obligatoria
  (`documentImage`) a IPFS, arma un `tokenMetadataURI` propio por token, y lo pasa a `mintTo`.
  `poapCard.jsx` muestra `documentImage` a tamaño completo en la vista expandida.
- **Imagen del documento sin crop**: la `documentImage` (la entrada/diploma/documento en sí) no
  pasa por el Cropper — mantiene su aspecto original (horizontal, vertical o cuadrado). Nueva prop
  `noCrop` en `EventImageField.jsx`, que cuando está activa muestra un preview simple
  (`object-fit: contain`) en vez del crop tool; `croppedAreaPixels` nunca se setea, así que el
  archivo se sube tal cual se eligió.
- **Nombre de organizador en la metadata**: `OrganizationProfileFields.jsx` (el step "Organization
  profile") ahora siempre incluye un campo `name` (persona o empresa), sin importar el tipo de
  organizador — antes el step entero se ocultaba para organizadores individuales. Solo los campos
  de dirección siguen condicionados por `organizationProfileGateField`/`ExcludeValues`. Guardado
  como `organization: { name, addressLine, ... }` en la metadata (evento) y espejado también en el
  `tokenMetadataURI` de cada credencial push-minteada (`mintPoap.jsx`), para que el nombre se vea
  ahí también. `eventCard.jsx`, `mintPoap.jsx` y `poapCard.jsx` muestran
  `metadata.organization.name` en los lugares "amigables" (tile colapsado, quick-facts), con
  fallback a la clave hex truncada si no hay nombre — el bloque de datos blockchain (hex completo)
  de las cards expandidas queda **sin tocar**, sigue mostrando siempre la clave cruda.
