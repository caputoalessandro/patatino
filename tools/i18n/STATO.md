# Traduzioni di Patatino: a che punto siamo

- Interfaccia: `tr()` nel codice, caricatore `lang/xx.js` in fondo a `index.html`, scelta della lingua nelle Impostazioni.
- Inglese: interfaccia fatta (`en/ui.json`); contenuti tradotti 0–819 su 3417 (`en/contenuti.json`).
- Da fare: contenuti inglesi 820–3416, poi `node tools/i18n.mjs costruisci en`, aggiungere `./lang/en.js` ai FILES di `sw.js`, test; poi fr, es, de.

Come continuare: `node tools/i18n.mjs blocco 820 400` mostra i prossimi testi; la traduzione va in `tools/i18n/en/_b820.json`
(array nello stesso ordine), `python3 tools/i18n/controlla-blocco.py en tools/i18n/en/_b820.json`, poi `node tools/i18n.mjs unisci en`.
