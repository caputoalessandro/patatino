# Patatino — brief per gli agenti (esercizi difficili + versione inglese)

Patatino è una web app per imparare il **neerlandese delle Fiandre** (Belgio). Il corso è scritto per chi parla
italiano. Ora serve:

1. **8 esercizi di livello difficile per ogni unità** (in italiano, come il resto del corso), e
2. **la versione inglese completa** di ogni unità (per chi parla inglese), compresi gli esercizi difficili.

Cartella di lavoro: `/home/user/patatino/tools/contenuti/`

- `src/uN.json` — l'unità originale (SOLO LETTURA). Campi: `id`, `n` (numero), `module`, `nl` (titolo olandese),
  `it` (sottotitolo italiano), `note` (spiegazione HTML), `vlaams` (box "in Vlaanderen", HTML), `vocab` ([[nl, it]]),
  `core` ([[nl, it]] parole chiave della grammatica), `drills` (esercizi sulla regola), `items` (esercizi misti),
  `gloss` ({indice item: {g?: {opzione: traduzione}, t?: traduzione della frase}}).
- `src/units-index.json` — elenco di tutte le 30 unità (per sapere cosa è già stato studiato prima).
- `src/ordersets.json`, `src/decks.json` — esercizi "Costruisci la frase" e mazzi di flashcard (SOLO LETTURA).
- `out/` — dove scrivi i risultati.
- `node valida.mjs uN` (o `ordersets`, `decks`) — validatore automatico. **Deve finire con 0 errori.**
  Gli "avvisi" vanno guardati: spesso indicano italiano rimasto nel testo inglese.

## Formato degli esercizi (identico a quello esistente)

- `mc` scelta multipla: `{t:"mc", q, o:[3-4 opzioni], a:indice giusto, e, oit?:true, g:{opzione: traduzione}, tt?}`
  - `oit: true` se le opzioni NON sono olandese corretto da pronunciare (sono in italiano/inglese oppure sono
    forme volutamente sbagliate): così l'app non le legge ad alta voce.
- `fill` completa: `{t:"fill", q:"... ___ ...", h?:"suggerimento", a:["risposta", "variante"], e, tt?}`
  - la frase in `q` è olandese con `___`; `h` è un aiuto nella lingua dell'utente (es. "io" / "I").
- `tr` traduci con le tessere: `{t:"tr", q:"frase nella lingua dell'utente", a:["Frase olandese", "variante"], e}`
  - le risposte **senza punto finale**; elenca TUTTE le varianti corrette ragionevoli (inversione, sinonimi
    belgi/olandesi, je/jij, we/wij…): una risposta giusta segnata come sbagliata è il difetto peggiore.
  - l'app costruisce le tessere spezzando `a[0]` in parole e aggiunge distrattori dal lessico: tieni le frasi
    entro ~10 parole.
- `order` metti in ordine: `{t:"order", q:"frase nella lingua dell'utente", a:"Frase olandese a parole separate da spazi", alt:["altri ordini corretti"], x:["distrattore", ...], e}`
  - `alt` deve usare esattamente le stesse parole di `a`; i distrattori `x` (1-3) non devono comparire in `a`.
- `e` = spiegazione breve (1-2 frasi, HTML semplice: `<b>`, `<i>`), nella lingua dell'utente.
- `g` = traduzione di ogni opzione (chiavi = le opzioni esatte). `tt` = traduzione della frase intera.

## 1) Esercizi difficili (`hard`, in italiano)

Esattamente **8 per unità: 2 `mc`, 2 `fill`, 2 `tr`, 2 `order`**, in ordine dal meno al più difficile.
Cosa li rende "difficili", rispetto agli esercizi già presenti (leggili per non ripeterli):
- frasi più lunghe e naturali, contesti belgi realistici (Gent, Antwerpen, Brussel, de tram, het frietkot…);
- combinano la regola dell'unità con quelle delle **unità precedenti** (ordine delle parole, inversione,
  articoli, plurali…), mai con regole di unità successive;
- distrattori plausibili, cioè gli errori tipici veri, non opzioni assurde; trabocchetti ed eccezioni;
- lessico: quello dell'unità e delle unità precedenti, più parole molto comuni.
Correttezza prima di tutto: neerlandese standard corretto (con varianti fiamminghe accettate dove ha senso).
Mai frasi copiate da libri. Ogni `mc` ha `g`; metti `tt` quando c'è una frase.

## 2) Versione inglese (`en`)

Per chi parla inglese e impara il neerlandese delle Fiandre. Regole:
- **Tutto ciò che è olandese resta identico**: risposte (`a`, `alt`, `x`), opzioni olandesi, parole olandesi
  in `vocab`/`core`, esempi olandesi dentro le spiegazioni. Il validatore lo controlla.
- Traduci domande, suggerimenti, spiegazioni, traduzioni (`g`, `tt`, `gloss`), significati del lessico.
- **Adatta, non tradurre alla lettera**: dove il testo confronta con l'italiano ("in italiano diciamo…",
  "errori tipici di chi parla italiano"), riscrivi il confronto per chi parla **inglese** (es. "As in English…",
  "Unlike English…", errori tipici degli anglofoni). Se un paragrafo spiega una difficoltà che per un anglofono
  non esiste, accorcialo; se ne esiste una tipica degli anglofoni, aggiungila in breve.
- Esercizi di traduzione (`tr`, `order`, e `mc`/`fill` con frase italiana): la frase inglese deve corrispondere
  alle stesse risposte olandesi (attenzione a tu/Lei → you: se `a` contiene sia "jij" sia "u", va bene "you";
  se contiene solo "u", scrivi "(formal)"). Se la traduzione inglese renderebbe corretta un'altra risposta
  olandese non elencata, scegli una frase inglese più precisa — non cambiare `a`.
- `mc` con `oit:true` e opzioni in italiano: traduci le opzioni in inglese, stesso ordine, stesso `a`.
- Mantieni la struttura HTML di `note` e `vlaams` (stessi `<h3>`, tabelle, elenchi); testo inglese naturale,
  amichevole e chiaro, stesso tono del corso. Inglese britannico o americano, ma coerente (usa americano).
- `en.it` = sottotitolo inglese dell'unità (es. "Subject pronouns").

## File di output per unità: `out/uN.json`

```json
{
  "id": "u6",
  "hard": [ 8 esercizi in italiano ],
  "en": {
    "it": "The plural",
    "note": "<h3>...</h3>...", "vlaams": "...",
    "vocab": [["de man", "the man"], ...],      // stesso ordine e stesse parole olandesi di src
    "core":  [["ik", "I"], ...],
    "items":  [ stesso numero e ordine di src.items, ogni esercizio completo in inglese ],
    "drills": [ stesso numero e ordine di src.drills ],
    "gloss":  { "0": {"g": {...}, "t": "..."}, ... },   // stesse chiavi di src.gloss
    "hard":   [ gli stessi 8 esercizi difficili, in inglese ]
  }
}
```
Scrivi JSON valido (UTF-8, virgolette doppie). Lavora un'unità alla volta: scrivi il file, lancia il
validatore, correggi finché ha 0 errori, poi passa alla successiva.

## Frasi e mazzi (solo per l'agente "frasi-mazzi")

`out/ordersets.json`: `{ "v2": { "t", "s", "rule", "items": [ {"it": "frase inglese", "e": "spiegazione"} ] }, ... }`
— stesse serie e stesso ordine delle frasi di `src/ordersets.json`; le parti olandesi non si toccano (non vanno
ripetute: servono solo `it` ed `e` per ogni frase). La frase inglese deve corrispondere alla soluzione olandese
`a` (e alle `alt`) dell'originale.

`out/decks.json`: `{ "irr1": { "t", "s", "cards": [ [nl, en, dettaglio?] ] }, ... }` — stesse carte, stesso
ordine. Colonna 0 (olandese) identica. Mazzo `dehet` (kind "dehet"): carte [nome, articolo, significato] →
cambia solo il significato. Se il mazzo ha `sayExtra: true` il dettaglio (colonna 2) è olandese e resta
identico; altrimenti il dettaglio va tradotto.
