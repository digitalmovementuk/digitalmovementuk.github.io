# Hinweise für Claude

Dieses Repo ist die GitHub-Pages-Seite `https://digitalmovementuk.github.io/`.
Jeder Ordner ist eine öffentliche Adresse, jeder Push auf `main` geht live.
Die Regeln stehen in README.md. Das Wichtigste:

- Neues Angebot immer mit `./neues-angebot.sh <ordner> "<Kunde>"` anlegen,
  nicht von Hand. Das Skript setzt noindex, die Erkennungsmarke und die
  robots.txt-Einträge.
- Vor der Wahl des Ordnernamens mit `list_repos` prüfen, ob es ein Repo
  `digitalmovementuk/<ordner>` gibt. Das Skript kann das in der Cloud-Sitzung
  nicht (api.github.com ist gesperrt), und ein gleichnamiges Repo überdeckt
  den Ordner (siehe `success/`, `prototypes/`).
- Auf `main` nur pushen, wenn der Nutzer das Veröffentlichen verlangt hat.
- Nach dem Push `./neues-angebot.sh --pruefen <ordner>` mit Timeout
  ≥ 360000 ms ausführen. Erst wenn es `✓ Live` meldet, den Link weitergeben.
- Andere Ordner, `index.html` im Wurzelverzeichnis und bestehende
  robots.txt-Zeilen nicht verändern.
- Qualität pro Angebot: mobil zuerst, keine horizontale Scrollbar bei
  390 px, Vorschaubild `share.jpg` 1200 × 630 mitliefern.
