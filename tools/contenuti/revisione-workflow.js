export const meta = {
  name: 'patatino-revisione-contenuti',
  description: 'Patatino: revisione indipendente degli esercizi difficili e della versione inglese (moduli 2-6, frasi e mazzi)',
  phases: [{ title: 'Rivedi', detail: 'un revisore per lotto: correttezza olandese, traduzione, varianti di risposta' }],
}
// Rilancia solo le revisioni mancanti. Il modulo 1 è già stato rivisto (vedi revisioni-fatte.json).
// Uso (da Claude Code, nella cartella del repo): Workflow({scriptPath: "tools/contenuti/revisione-workflow.js"})
const DIR = '/home/user/patatino/tools/contenuti'
const JOBS = [2, 3, 4, 5, 6].map(m => ({ key: 'modulo-' + m, units: [1, 2, 3, 4, 5].map(k => 'u' + ((m - 1) * 5 + k)) }))
  .concat([{ key: 'frasi-mazzi', units: ['ordersets', 'decks'] }])
const REVIEW = {
  type: 'object',
  properties: { lotto: { type: 'string' }, fixes: { type: 'array', items: { type: 'string' } }, validator_errors: { type: 'number' }, concerns: { type: 'string' } },
  required: ['lotto', 'fixes', 'validator_errors', 'concerns'],
}
const isUnits = (j) => j.key !== 'frasi-mazzi'
const prompt = (j) => `Sei il revisore indipendente di un lotto di contenuti per Patatino, un'app per imparare il neerlandese delle Fiandre.
Leggi il brief: ${DIR}/BRIEF.md. Lavora nella cartella ${DIR}.
Lotto: ${isUnits(j) ? `unità ${j.units.join(', ')}: file out/<id>.json (confronta con src/<id>.json)` : 'out/ordersets.json e out/decks.json (confronta con src/ordersets.json e src/decks.json)'}.
Le note dell'autore di questo lotto sono in note-autori.json, chiave "${j.key}". Come esempio del livello di revisione atteso guarda revisioni-fatte.json (modulo-1).
${j.key === 'modulo-2' ? 'Attenzione: una revisione precedente di questo lotto si è interrotta a metà e potrebbe aver già modificato alcuni file: rivedi tutto da capo.\n' : ''}
Controlla con occhio critico, come un insegnante madrelingua di neerlandese e un editor inglese:
${isUnits(j) ? `1. ESERCIZI DIFFICILI ("hard" e "en.hard"): il neerlandese è corretto? La risposta indicata è davvero l'unica giusta tra le opzioni (mc)? Per fill/tr/order mancano varianti corrette (inversione, je/jij, we/wij, varianti belghe)? Una risposta giusta segnata come sbagliata è il difetto più grave: controlla anche che i distrattori "x" degli order non permettano un'altra frase corretta. Usano solo regole dell'unità e di quelle precedenti? Sono davvero più difficili degli esercizi esistenti, senza essere ambigui? Spiegazioni "e" corrette?
2. INGLESE ("en"): ogni frase inglese corrisponde alle risposte olandesi (soprattutto tr/order e la distinzione you/formal)? Le spiegazioni sono adattate per chi parla inglese (nessun confronto con l'italiano rimasto, nessuna parola italiana)? Inglese naturale? Struttura HTML intatta? Traduzioni di vocab/core/gloss corrette?` : `1. FRASI: ogni frase inglese corrisponde alla soluzione olandese (a/alt) della serie originale? Regole e spiegazioni corrette e adattate per anglofoni?
2. MAZZI: significati inglesi corretti, dettagli tradotti solo dove previsto, olandese intatto.`}
Nota sull'app: negli esercizi tr/order l'utente compone la risposta con tessere ricavate da a[0] (punteggiatura tolta), quindi varianti con parole diverse non sono componibili.
Correggi direttamente i file out/ dove trovi problemi (non toccare src/ né valida.mjs). Poi lancia il validatore (${isUnits(j) ? j.units.map(u => 'node valida.mjs ' + u).join('; ') : 'node valida.mjs ordersets; node valida.mjs decks'}) finché ha 0 errori.
Restituisci: il nome del lotto, l'elenco delle correzioni fatte (una riga ciascuna), errori finali del validatore, eventuali dubbi che restano.`
const results = await parallel(JOBS.map(j => () => agent(prompt(j), { label: 'rivedi:' + j.key, phase: 'Rivedi', schema: REVIEW, effort: 'high' })))
return results.map((r, i) => r || { lotto: JOBS[i].key, failed: true })
