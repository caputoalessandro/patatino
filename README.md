# Patatino · Nederlands

Web app per imparare l'olandese delle Fiandre, con Patatino come mascotte.
Funziona nel browser, si installa sulla schermata Home e funziona anche offline.

## Contenuto

| File | A cosa serve |
|---|---|
| `index.html` | L'app intera: contenuti, esercizi, grafica |
| `manifest.webmanifest` | Nome, colori e icona per l'installazione |
| `sw.js` | Funzionamento offline |
| `icon-*.png` | Icone di Patatino (`icon-maskable-*` con margine per il ritaglio a cerchio di Android) |
| `screenshots/` | Schermate per il prompt di installazione e gli store |
| `tools/genera-asset.mjs` | Rigenera icone e schermate dalla mascotte (non serve all'app) |
| `premium-src/` | Contenuti sbloccabili (moduli 2–6 e mazzi): **da non pubblicare** (vedi `premium-src/README.md`) |
| `_config.yml` | Esclude `premium-src/` e `tools/` dal sito di GitHub Pages |

## Pubblicare un aggiornamento

1. Sostituisci `index.html` con la nuova versione.
2. In `sw.js` cambia `VERSION` (per esempio da `patatino-v1` a `patatino-v2`), così i telefoni scaricano la versione nuova.
3. Fai il commit: GitHub Pages aggiorna il sito in un paio di minuti.

I progressi restano salvati nel browser di ogni dispositivo e non vengono toccati dagli aggiornamenti.

## Backup dei dati

In **Impostazioni → I tuoi dati**:
- **Esporta i miei dati** scarica `patatino-backup-AAAA-MM-GG.json` con tutte le chiavi `localStorage` dell'app (quelle che iniziano con `goesting.`).
- **Importa backup** ripristina un file esportato, dopo una conferma. Accetta anche backup di versioni precedenti del formato (`schemaVersion`).

Se l'ultimo backup ha più di 30 giorni (o non ne hai mai fatto uno, ma hai già dei progressi), Patatino te lo ricorda in home; "Più tardi" rimanda di 7 giorni.
All'avvio l'app chiede al browser di conservare i dati in modo persistente.

## Pronuncia

L'app usa la voce olandese del dispositivo.
- iPhone: Impostazioni → Accessibilità → Contenuto letto ad alta voce → Voci → Olandese (Ellen è belga).
- Android: Impostazioni → Sistema → Lingue → Sintesi vocale → motore Google → Nederlands (België).

## Installazione

Il bottone **Installa l'app** (Impostazioni) e il banner che compare dopo la prima lezione superata si adattano al contesto:
- **Android** (Chrome, Edge, Samsung Internet): prompt di installazione vero; se il browser non lo offre, istruzioni dal menu.
- **iPhone con Safari**: guida animata in 3 passi (Condividi → Aggiungi alla schermata Home → Aggiungi), anche con la barra compatta e il menu «···».
- **iPhone con Chrome, Firefox, Edge…**: istruzioni per quel browser, oppure apri la pagina in Safari (c'è «Copia link»).
- **Browser interno di Instagram, Facebook, Messenger, WhatsApp, TikTok**: da lì non si installa; la guida spiega come aprire la pagina in Safari/Chrome e offre «Copia link» ed «Esporta i miei dati».
- **App già installata**: non compare nulla.

Il banner si chiude con la ×; dopo la chiusura torna fra 14 giorni.
Indirizzi diretti: `…/#installa` (guida) e `…/#privacy` (informativa, da usare come link privacy negli store).

## Cambio di indirizzo

Tutti i percorsi sono relativi: l'app funziona su GitHub Pages, su un dominio o in una sottocartella senza modifiche.
Per un trasloco imposta in `index.html` `OLD_HOST` (per esempio `caputoalessandro.github.io`) e `NEW_URL` nella copia pubblicata al vecchio indirizzo:
chi la apre da lì vede «L'app si è trasferita!» con «Esporta i miei dati» e il link al nuovo indirizzo. I dati non passano da un indirizzo all'altro da soli: si portano con esporta/importa.

## Privacy

L'informativa è in Impostazioni → Privacy. Prima di pubblicarla completa i segnaposti in `PRIVACY` dentro `index.html` (nome del titolare, email).

## Rigenerare icone e schermate

```
npm i playwright && npx playwright install chromium
node tools/genera-asset.mjs
```

## Sostieni Patatino (contenuti sbloccabili)

Il modulo 1 («Le basi», unità 1–5) e 7 mazzi di flashcard (De of het?, Numeri, Calendario, Famiglia, Cibo, Colori, Espressioni utili) sono liberi e stanno in `index.html`.
Chi fa una **donazione libera (da 1 €)** riceve per email un codice che sblocca i moduli 2–6, gli esercizi «Costruisci la frase» e gli altri 11 mazzi.
In `index.html` restano solo i titoli (con il lucchetto); i contenuti si scaricano dopo lo sblocco e restano sul dispositivo (IndexedDB), quindi funzionano offline.

Tutto si configura in `PREMIUM_CONFIG`, in cima allo script principale di `index.html` (moduli liberi, testo della donazione, link di donazione, indirizzo del Worker, email di assistenza, pagina ordini).
Sul provider il prodotto va creato a prezzo libero («paga quanto vuoi») con minimo 1 €.

Il Worker (fase successiva) deve rispondere a:

| Richiesta | Corpo | Risposta |
|---|---|---|
| `POST /api/license/activate` | `{ key, deviceName }` | `{ valid: true, instanceId }` oppure `{ valid: false, reason }` |
| `POST /api/license/validate` | `{ key, instanceId }` | `{ valid: true }` oppure `{ valid: false, reason }` |
| `POST /api/license/deactivate` | `{ key, instanceId }` | `{ ok: true }` |
| `GET /api/modules/<n>` | header `X-License-Key`, `X-Instance-Id` | il JSON del modulo (come in `premium-src/`), 401/403 se la chiave non vale |

Valori di `reason` riconosciuti: `not_found`, `wrong_product`, `limit_reached`, `refunded` / `disabled` / `expired` (licenza revocata).
L'app considera revocata la licenza solo con una risposta esplicita `{ valid: false }`; se il server è irraggiungibile o risponde con un errore 5xx, lo sblocco resta.

Lo stato della licenza (codice, instanceId, data dell'ultima verifica) è salvato in `goesting.license` ed entra nel backup.

**Modalità sviluppo**: aprendo l'app da `localhost`/`127.0.0.1` senza Worker, l'unico codice accettato è `TEST-PREMIUM-0000` e i moduli si leggono da `premium-src/`. Va rimossa prima della pubblicazione: in `index.html` cerca `MODALITÀ SVILUPPO`.
