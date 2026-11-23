# digitalmovementuk.github.io

Ein Ordner pro Angebot. Was in `mueller-bau/index.html` liegt, ist unter
**https://digitalmovementuk.github.io/mueller-bau/** erreichbar, etwa eine
Minute nach dem Push auf `main`. Es braucht kein neues Repo pro Kunde.

## Neues Angebot

```bash
./neues-angebot.sh mueller-bau "Müller Bau GmbH"   # Ordner aus _vorlage/, robots.txt ergänzt
# mueller-bau/index.html gestalten, Vorschaubild als mueller-bau/share.jpg (1200 × 630)
git add mueller-bau robots.txt
git commit -m "Angebot mueller-bau"
git push origin main
./neues-angebot.sh --pruefen mueller-bau          # wartet, bis die Seite live ist
```

`--pruefen` meldet Erfolg erst, wenn unter der Adresse wirklich dieser Ordner
ausgeliefert wird. Außerdem prüft es noindex, das Vorschaubild und den
Eintrag in robots.txt.

## Regeln

1. **Ordnername:** nur `a–z`, `0–9` und Bindestriche, keine Umlaute
   (`ä → ae`, `ß → ss`). Die Adresse unterscheidet Groß- und Kleinschreibung:
   `/breuninger/` funktioniert, `/Breuninger/` liefert 404.
2. **Kein Name, den es schon als Repo gibt.** Ein Repo mit GitHub Pages belegt
   `/<reponame>/` und überdeckt einen gleichnamigen Ordner hier. Deshalb sind
   `success/` und `prototypes/` aus diesem Repo live nicht erreichbar
   (Stand 23.11.2026, alles darunter liefert 404). Im Zweifel `-angebot`
   anhängen.
3. **noindex bleibt.** Jede Seite trägt `<meta name="robots" content="noindex, nofollow">`.
   robots.txt sperrt alles. Nur die Vorschau-Crawler (WhatsApp, LinkedIn, Slack …)
   dürfen freigegebene Ordner lesen, damit ein geteilter Link eine Bildkarte
   zeigt. Das Skript trägt neue Ordner ein.
4. **Erkennungsmarke behalten:** `<meta name="dm-angebot" content="<ordner>">` im
   `<head>`. Daran erkennt `--pruefen` den richtigen Ordner.
5. **Pfade relativ zum Ordner** (`assets/bild.webp`, nicht `/assets/bild.webp`),
   weil die Seite unter `/<ordner>/` liegt. Nur `og:image` und `og:url`
   brauchen die volle Adresse. Gebaute Seiten (z. B. Vite): `base: './'`
   setzen und nur den Build-Ordner hierher kopieren.
6. **Fremde Ordner nicht anfassen.** Jeder Push auf `main` ist sofort öffentlich.
7. **Das Repo ist öffentlich.** Alles, was hier liegt, auch Preise, kann jeder
   auf GitHub lesen. Löschen entfernt es nicht aus der Git-Historie.

## Angebot entfernen

Ordner löschen und die Zeilen `Allow: /<ordner>/` aus robots.txt nehmen:

```bash
git rm -r mueller-bau && sed -i.bak '\#^Allow: /mueller-bau/$#d' robots.txt && rm robots.txt.bak
```

## Zugang

Wer selbst pushen will, braucht Schreibrecht auf dieses Repo: Settings →
Collaborators → Add people. Claude-Sitzungen, die mit dem Konto
`digitalmovementuk` verbunden sind, können ohne Einladung pushen.
