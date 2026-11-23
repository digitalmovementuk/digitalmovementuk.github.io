#!/usr/bin/env bash
# Neues Angebot anlegen und nach dem Veröffentlichen prüfen.
#
#   ./neues-angebot.sh mueller-bau "Müller Bau GmbH"   Ordner aus _vorlage/ anlegen
#   ./neues-angebot.sh --pruefen mueller-bau           nach dem Push: ist es live?
#
# Läuft mit dem bash von macOS (3.2) und Linux. Braucht curl und perl.
set -euo pipefail

OWNER="digitalmovementuk"
HOST="https://${OWNER}.github.io"
cd "$(dirname "$0")"

rot()  { printf '\033[31m%s\033[0m\n' "$*"; }
gruen(){ printf '\033[32m%s\033[0m\n' "$*"; }
gelb() { printf '\033[33m%s\033[0m\n' "$*"; }
stopp(){ rot "Abbruch: $*" >&2; exit 1; }

http_code() {
  local c
  c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$1" 2>/dev/null) || true
  echo "${c:-000}"
}

slug_pruefen() {
  local slug="$1"
  [[ "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] \
    || stopp "\"$slug\" ist kein gültiger Ordnername. Nur a–z, 0–9 und einzelne Bindestriche, z. B. mueller-bau (ä → ae, ß → ss)."
  [ "${#slug}" -le 60 ] || stopp "Ordnername länger als 60 Zeichen."
}

# ---------------------------------------------------------------- prüfen ---
if [ "${1:-}" = "--pruefen" ]; then
  slug="${2:-}"; [ -n "$slug" ] || stopp "Aufruf: ./neues-angebot.sh --pruefen <ordner>"
  slug_pruefen "$slug"
  url="$HOST/$slug/"
  minuten="${PRUEF_MINUTEN:-5}"
  versuche=$(( minuten * 6 )); [ "$versuche" -ge 1 ] || versuche=1
  marke="name=\"dm-angebot\" content=\"$slug\""

  echo "Prüfe $url (bis zu $minuten Min., GitHub Pages braucht meist 30–90 Sek.) …"
  i=0; body=""; code=000
  while [ "$i" -lt "$versuche" ]; do
    i=$((i + 1))
    code=$(http_code "$url?pruefung=$(date +%s)")
    if [ "$code" = 200 ]; then
      body=$(curl -s --max-time 15 "$url?pruefung=$(date +%s)" || true)
      case "$body" in *"$marke"*) break ;; esac
    fi
    [ "$i" -lt "$versuche" ] && sleep 10
  done

  case "$body" in
    *"$marke"*) gruen "✓ Live: $url" ;;
    *)
      if [ "$code" = 200 ]; then
        rot "✗ $url antwortet, aber ohne <meta name=\"dm-angebot\" content=\"$slug\">."
        echo "  Entweder fehlt die Marke im <head>, oder unter dieser Adresse liefert ein"
        echo "  gleichnamiges Repo ($OWNER/$slug) seine eigene Seite aus — dann umbenennen."
      else
        rot "✗ $url antwortet mit HTTP $code."
        echo "  1. Ist der Commit auf main gepusht?  git log origin/main -1"
        echo "  2. Gibt es ein Repo $OWNER/$slug mit GitHub Pages? Das überdeckt den Ordner"
        echo "     (so sind /success/ und /prototypes/ aus diesem Repo nicht erreichbar)."
        echo "  3. Build-Status: github.com/$OWNER/$OWNER.github.io/actions"
      fi
      exit 1 ;;
  esac

  case "$body" in
    *noindex*) gruen "✓ noindex gesetzt" ;;
    *) rot "✗ noindex fehlt — Angebote dürfen nicht in Google landen."; exit 1 ;;
  esac

  share=$(printf '%s' "$body" | perl -ne 'print "$1\n" if /property="og:image" content="([^"]+)"/' | head -n 1)
  if [ -z "$share" ]; then
    gelb "! Kein og:image — Links in WhatsApp/LinkedIn zeigen keine Bildvorschau."
  elif [ "$(http_code "$share")" = 200 ]; then
    gruen "✓ Vorschaubild erreichbar: $share"
  else
    gelb "! Vorschaubild fehlt ($share) — 1200 × 630 als share.jpg in den Ordner legen."
  fi

  if curl -s --max-time 15 "$HOST/robots.txt?pruefung=$(date +%s)" | grep -qx "Allow: /$slug/"; then
    gruen "✓ robots.txt lässt Vorschau-Crawler auf /$slug/"
  else
    gelb "! /$slug/ fehlt live in robots.txt — Link-Vorschauen bleiben leer."
  fi
  exit 0
fi

# ---------------------------------------------------------------- anlegen ---
slug="${1:-}"; kunde="${2:-}"
if [ -z "$slug" ] || [ -z "$kunde" ]; then
  sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
fi
slug_pruefen "$slug"
[ -d _vorlage ] || stopp "_vorlage/ fehlt."
[ ! -e "$slug" ] || stopp "Ordner $slug/ gibt es schon."

# Ein Repo gleichen Namens mit GitHub Pages würde den Ordner überdecken.
code=$(http_code "https://api.github.com/repos/$OWNER/$slug")
case "$code" in
  200) stopp "Es gibt das Repo $OWNER/$slug. Dessen Pages-Seite liegt auf $HOST/$slug/ und überdeckt den Ordner. Anderen Namen wählen, z. B. $slug-angebot." ;;
  404) ;;
  *)   gelb "! Konnte nicht prüfen, ob ein Repo $OWNER/$slug existiert (HTTP $code). --pruefen nach dem Push zeigt es." ;;
esac
code=$(http_code "$HOST/$slug/")
[ "$code" != 200 ] || stopp "$HOST/$slug/ liefert schon eine Seite aus (vermutlich ein Repo gleichen Namens)."

cp -R _vorlage "$slug"
KUNDE="$kunde" SLUG="$slug" perl -pi -e '
  BEGIN { $k = $ENV{KUNDE}; $k =~ s/&/&amp;/g; $k =~ s/</&lt;/g; $k =~ s/>/&gt;/g; $k =~ s/"/&quot;/g; }
  s/__SLUG__/$ENV{SLUG}/g; s/__KUNDE__/$k/g;
' "$slug/index.html"

# Vorschau-Crawler (WhatsApp, LinkedIn, Slack …) dürfen die neue Adresse lesen:
# in jedem Block außer "User-agent: *" eine Allow-Zeile vor "Disallow: /".
if ! grep -qx "Allow: /$slug/" robots.txt; then
  awk -v pfad="/$slug/" '
    /^User-agent:/ { agent = $2 }
    $0 == "Disallow: /" && agent != "*" { print "Allow: " pfad }
    { print }
  ' robots.txt > robots.txt.neu && mv robots.txt.neu robots.txt
fi

gruen "✓ $slug/ angelegt, robots.txt ergänzt."
cat <<EOF

Nächste Schritte:
  1. $slug/index.html gestalten. Im <head> bleiben: noindex und <meta name="dm-angebot" …>.
  2. Vorschaubild als $slug/share.jpg ablegen (1200 × 630).
  3. Veröffentlichen:
       git add $slug robots.txt
       git commit -m "Angebot $slug"
       git push origin main
  4. Prüfen:  ./neues-angebot.sh --pruefen $slug
     Link für den Kunden:  $HOST/$slug/
EOF
