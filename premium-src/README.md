# premium-src — contenuti dei moduli a pagamento

**Questa cartella NON va pubblicata sul sito.** Contiene i moduli 2–6 di Patatino in JSON:
il Worker Cloudflare li servirà su `GET /api/modules/<n>` solo a chi manda una chiave di licenza valida
(header `X-License-Key`).

- `_config.yml` la esclude dal sito di GitHub Pages, ma **il repository è pubblico**: chiunque può
  leggere questi file su github.com (e la cronologia git contiene già i contenuti, che prima erano in `index.html`).
  Prima del lancio sposta `premium-src/` in un repository privato o direttamente nello storage del Worker (KV/R2)
  e toglila da qui.
- Se pubblichi l'app su un altro hosting (Cloudflare Pages, Netlify…), escludi questa cartella anche lì.

Formato di ogni file (`module-N.json`):

```
{ "app": "patatino", "module": N, "version": 1, "title": "...",
  "units": [ { "id": "u6", "nl": "...", "it": "...", "note": "<html>", "vlaams": "<html>",
               "vocab": [[nl, it], ...], "core": { "words": [...], "drills": [...] },
               "items": [...], "gloss": { "0": {...}, ... } } ],
  "orderSets": [ { "id": "v2", "unit": "u10", "t": "...", "s": "...", "rule": "<html>", "items": [...] } ] }
```

In sviluppo (app aperta da `localhost` / `127.0.0.1` senza Worker) l'app legge direttamente questi file.
