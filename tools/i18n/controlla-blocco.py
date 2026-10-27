# controllo rapido di un blocco tradotto prima di unirlo: numero di voci, tag e segni ___ → ↔ — allineati
import json, re, sys
lang, f = sys.argv[1], sys.argv[2]
todo = json.load(open("tools/i18n/da-tradurre.json"))
frm = int(re.search(r"_b(\d+)", f).group(1)); arr = json.load(open(f))
tags = lambda s: re.findall(r"</?[a-z0-9]+", s.lower())
marks = lambda s: [s.count(m) for m in (["___", "→", "—", "(", ")"] if "___" in s else ["___"])]
bad = 0
for i, t in enumerate(arr):
    s = todo[frm + i]
    if tags(s) != tags(t) or marks(s) != marks(t) or not t.strip():
        bad += 1; print(frm + i, "|", s, "|", t)
print(f"{len(arr)} voci ({frm}–{frm+len(arr)-1}), {bad} da guardare")
