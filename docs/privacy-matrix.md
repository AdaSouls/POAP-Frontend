# Matriz público/privado — datos POAP en Midnight

Insumo para el brainstorm de UX/UI de privacidad. Generado a partir de una lectura directa
de `../POAP-Midnight/contracts/compact/poap.compact` y
`../POAP-Midnight/contracts/src/witnesses.ts` (y su espejo `src/midnight/witnesses.ts` en este
repo) — no de la documentación de producto, para asegurar que los campos sean los reales.

## Restricciones para este trabajo

- **Solo frontend.** No podemos modificar `../POAP-Midnight` (contrato, witnesses, indexer) —
  es un repo mantenido por otro desarrollador. Cualquier cambio de visibilidad de datos que
  requiera tocar el contrato o los witnesses queda fuera de alcance; solo podemos decidir
  **qué mostramos, cómo lo mostramos, y qué NO mostramos** con los datos que el contrato ya
  expone (público) o que el browser ya tiene en su private state.
- **Dirección visual: modo oscuro.** Cuando se plantee la UX/UI derivada de este análisis,
  la propuesta debe ir hacia una paleta oscura — comunica privacidad/seguridad, coherente con
  el pivot a Midnight (ZK privacy chain).

## Matriz (estado actual)

| Campo | Dónde vive | Público/Privado hoy | UI que lo usa | Nota |
|---|---|---|---|---|
| `totalSupply` | ledger público (Counter) | Público | — (no se muestra aún) | Cantidad total de tokens minteados en todo el sistema |
| `tokenOwner[tokenId]` | ledger público (Map) | Público | — | pk del owner, indexado por tokenId |
| `tokenFirstEvent[tokenId]` | ledger público (Map) | Público | — | el primer evento de cada token es público para siempre |
| `tokenIssuer[tokenId]` | ledger público (Map) | Público | `poapCard.jsx` (issuerPkHex) | — |
| `issuerHolderToken[hash(pk,issuerId)]` | ledger público (Map, índice) | Público (la key es un hash, no el pk crudo) | — | permite push-mint y reconciliación sin tocar el estado privado del holder |
| `events[eventId]` (maxSupply, minted, expiration, organizer, isActive, isPublicMint, metadataURI) | ledger público (Map) | Público | `poapEvent.jsx`, `eventCard.jsx` | listado de eventos, contador de minted/maxSupply; metadataURI es un puntero a JSON off-chain (name/description/image), no el JSON en sí |
| `issuers[issuerId]` (organizerPk, isActive) | ledger público (Map) | Público | `createIssuer.jsx` (indirecto) | — |
| `burnedTokens[tokenId]` | ledger público (Map) | Público | — | — |
| `isPaused`, `adminPk` | ledger público | Público | — | control admin |
| `secretKey` (`local_sk`) | witness / private state del browser | Privado, nunca sale del dispositivo | — | base de toda la identidad derivada |
| `tokens[issuerId].tokenId` | witness / private state | Privado (cache local del holder) | `poapCollection.jsx`, `poapCard.jsx` | el holder ve su propio dato; nadie más lo consulta desde aquí |
| `tokens[issuerId].attendance.eventIds[]` (2do evento en adelante) | witness / private state | Privado — no hay mapa on-chain equivalente | `poapCard.jsx` (`attendedEventIds`), `poapToken.jsx` | esto es lo que la doc de producto llama "private attendance history" |
| `tokens[issuerId].attendance.isSoulbound` | witness / private state | Privado, y además no enforced on-chain | `poapCard.jsx` (badge "Soulbound") | ver hallazgo 3 |

## Hallazgos no triviales

1. **El "primer evento" es más público de lo que sugiere "public token existence, private
   attendance history".** `tokenFirstEvent` es un mapa público — cualquiera puede ver que el
   pk `0xABC` reclamó el token `#42` en el evento `Z`. Solo las asistencias *siguientes* para
   ese mismo issuer quedan fuera de cualquier mapa on-chain.

2. **`caller_pk()` se discloses siempre, en cada llamada — no solo al mintear.**
   (`poap.compact:86-91`). `claimOrUpdate` también discloses el `eventId` como argumento de
   la transacción. Un observador de la cadena mirando transacciones en tiempo real (que es
   literalmente lo que hace el indexer) puede reconstruir la lista de asistencias igual,
   aunque no exista un mapa público que la acumule. La privacidad actual es "no hay un mapa
   consultable después del hecho", no "la transacción es anónima". Pendiente de confirmar
   contra un nodo real (mismo tipo de supuesto no verificado que ya se marca en
   `providers.ts`/`contract.service.ts`).

3. **`isSoulbound` no se aplica on-chain.** Solo vive en el private state del holder, usado
   únicamente para el badge en `poapCard.jsx`. No hay ningún circuito `transfer` en el
   contrato — no existe aún ningún mecanismo de transferencia — así que "soulbound" es
   cosmético por partida doble.

4. **No existe ninguna vista pública de "colección de otro holder".** Todo lo que lee el
   frontend hoy sale del private state del propio browser conectado. No hay perfil público,
   prueba selectiva ("asistí a X sin revelar el resto"), ni dashboard agregado para el
   organizador — son huecos de UX abiertos, no decisiones tomadas.

## Preguntas abiertas para el brainstorm

- Dado que no podemos tocar el contrato: ¿qué controles de disclosure podemos ofrecer
  puramente en el frontend (ej. el holder elige qué mostrar en una vista pública armada
  client-side, aunque el dato subyacente ya sea técnicamente reconstruible por un indexer)?
- ¿Vale la pena comunicar en la UI la diferencia real entre "privado" (no hay mapa on-chain)
  y "anónimo" (la transacción no revela quién ni qué evento) para no sobre-prometer privacidad
  al usuario?
- ¿Cómo se ve un dashboard de organizador que muestre métricas agregadas (minted/maxSupply,
  cantidad de holders) sin exponer identidades individuales más allá de lo que el contrato ya
  hace público?
- ¿El badge "Soulbound" debería comunicarse distinto en UI ahora que sabemos que no tiene
  enforcement on-chain (evitar que el usuario asuma una garantía que no existe)?
