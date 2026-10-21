# premium-src — contenuti dei moduli a pagamento

**Questa cartella NON va pubblicata sul sito.** Contiene i moduli 2–6 di Patatino in JSON (con gli esercizi «Costruisci la frase» e i mazzi di flashcard bloccati):
il Worker Cloudflare li servirà su `GET /api/modules/<n>` solo a chi manda una chiave di licenza valida
(header `X-License-Key`).

- `_config.yml` la esclude dal sito di GitHub Pages, ma **il repository è pubblico**: chiunque può
  leggere questi file su github.com (e la cronologia git contiene già i contenuti, che prima erano in `index.html`).
  Prima del lancio sposta `premium-src/` in un repository privato o direttamente nello storage del Worker (KV/R2)
  e toglila da qui.
- Se pubblichi l'app su un altro hosting (Cloudflare Pages, Netlify…), escludi questa cartella anche lì.

Formato di ogni file (`module-N.json`):

```
{ "app": "patatino", "module": N, "version": 2, "title": "...",
  "units": [ { "id": "u6", "nl": "...", "it": "...", "note": "<html>", "vlaams": "<html>",
               "vocab": [[nl, it], ...], "core": { "words": [...], "drills": [...] },
               "items": [...], "gloss": { "0": {...}, ... },
               "hard": [ 8 esercizi difficili ],
               "en": { "it": "titolo inglese", "note", "vlaams", "vocab", "core", "items", "drills", "gloss", "hard" } } ],
  "orderSets": [ { "id": "v2", "unit": "u10", "t": "...", "s": "...", "rule": "<html>", "items": [...],
                   "en": { "t", "s", "rule", "items": [ { "it": "frase inglese", "e": "spiegazione" } ] } } ],
  "decks": [ { "id": "irr1", "g": "Grammatica", "t": "...", "s": "...", "cards": [[nl, it, dettaglio], ...],
               "en": { "t", "s", "cards": [[nl, en, dettaglio], ...] } } ] }
```

In sviluppo (app aperta da `localhost` / `127.0.0.1` senza Worker) l'app legge direttamente questi file.

Mazzi bloccati e modulo in cui viaggiano: `city`, `home`, `weather` → 2 · `opp`, `body`, `work` → 3 · `irr1`, `irr2`, `sep` → 4 · `prep` → 5 · `vlaams` → 6.
Per renderne libero uno, rimetti la sua voce in `DECKS` dentro `index.html` e toglila da qui e da `PREMIUM_DECKS`.

`version` deve essere almeno 2 (con inglese ed esercizi difficili): l'app riscarica da sola i moduli più vecchi rimasti in cache.
