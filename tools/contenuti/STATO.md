# Contenuti nuovi: esercizi difficili + versione inglese — stato del lavoro

Ultimo aggiornamento: 21 ottobre 2026.

## Cosa c'è qui
| File | Cosa |
|---|---|
| `BRIEF.md` | Istruzioni complete per chi scrive/rivede (formato, regole, criteri) |
| `src/` | Contenuti originali in italiano, un file per unità + frasi + mazzi (solo lettura) |
| `out/` | **Prodotti**: per ogni unità 8 esercizi difficili (`hard`) e la versione inglese (`en`); `ordersets.json` e `decks.json` in inglese |
| `valida.mjs` | Validatore automatico: `node valida.mjs all` (oggi: 0 errori, 0 avvisi) |
| `note-autori.json` | Note e dubbi degli autori, per lotto |
| `revisioni-fatte.json` | Revisioni completate, con l'elenco delle correzioni |
| `revisione-workflow.js` | Rilancia le revisioni mancanti |
| `integra.mjs` | Inserisce `out/` nell'app (`index.html` + `premium-src/`) |

## Stato
- **Scrittura**: completa per tutti i lotti (30 unità, frasi, mazzi), validatore a 0 errori.
- **Revisione indipendente**:
  - modulo 1 (u1–u5): **fatta** (9 correzioni, vedi `revisioni-fatte.json`);
  - modulo 2 (u6–u10): **interrotta a metà** (alcuni file possono avere già correzioni parziali): da rifare;
  - moduli 3–6 (u11–u30), frasi e mazzi: **da fare**.
- **App**: il codice per lingua e livello difficile è già nel branch; i contenuti di `out/` **non sono ancora integrati**
  (una prova su una copia ha passato tutti i test).

## Come riprendere (in una nuova sessione di Claude Code su questo branch)
Chiedi: *"Riprendi la revisione dei contenuti in tools/contenuti: lancia revisione-workflow.js, poi integra e testa."*
I passi sono:
1. Workflow `tools/contenuti/revisione-workflow.js` (6 revisori in parallelo). Se il repo non è in `/home/user/patatino`,
   correggi `DIR` nello script e i percorsi in `BRIEF.md`.
2. `node tools/contenuti/valida.mjs all` → deve dare 0 errori.
3. `node tools/contenuti/integra.mjs .` (dalla cartella del repo) → aggiorna `index.html` e `premium-src/module-*.json`.
   Va eseguito **una volta sola** su un `index.html` non ancora integrato.
4. Test: `tools/test/` (vedi lì) — in particolare `en2.mjs` (contenuti inglesi e livello difficile).
5. Alzare `VERSION` in `sw.js`, commit e push.
