# Patatino · Nederlands

Web app per imparare l'olandese delle Fiandre, con Patatino come mascotte.
Funziona nel browser, si installa sulla schermata Home e funziona anche offline.

## Contenuto

| File | A cosa serve |
|---|---|
| `index.html` | L'app intera: contenuti, esercizi, grafica |
| `manifest.webmanifest` | Nome, colori e icona per l'installazione |
| `sw.js` | Funzionamento offline |
| `icon-*.png` | Icone di Patatino |

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
