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
