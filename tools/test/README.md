# Test end-to-end (Playwright + Chromium)

Dalla cartella del repo: `node tools/test/<nome>.mjs` (serve `playwright` installato; negli ambienti cloud Chromium è in `/opt/pw-browsers`).
Screenshot in `/tmp/patatino-test/`.

| Test | Cosa controlla |
|---|---|
| `e2e.mjs` | Backup: esporta, importa, migrazione, promemoria |
| `inst.mjs` | Installazione: rilevamento del contesto, guide, banner, privacy, trasloco |
| `chip.mjs` | Bottone Installa in home (360 e 430 px) |
| `prem.mjs` | Contenuti sbloccabili: codici, API simulate, riverifica, rimozione, mazzi |
| `en.mjs` | Interfaccia in inglese: nessun testo senza traduzione |
| `en2.mjs` | Contenuti inglesi ed esercizi difficili (dopo l'integrazione di tools/contenuti) |
| `libero.mjs` | Versione senza contenuti bloccati (quella pubblicata su main) |

`comune.mjs` viene dalla skill crea-app-pwa (server statico + avvio di Chromium).
