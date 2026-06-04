# 🧠 Knowledge Universe

Interaktives Dashboard für deine TikTok Archiv-Sammlung mit Live-Daten aus Google Sheets.

## 🚀 Live Demo
https://nokidoc.github.io/knowledge-universe

## ✨ Features
- **Bubble Physics**: Interaktive Visualisierung mit Kraft-gerichteter Simulation
- **Live Data**: Täglich aktualisiert aus Google Sheets
- **Auto-Clustering**: Automatische Gruppierung nach Claude, ChatGPT, Gemini, Video-KI
- **Detail Modal**: Transkripte, Zusammenfassungen, Stats für jeden Eintrag
- **Dark Design**: Minimalistisches, modernes Interface

## 📊 Setup

### 1. Lokal testen (jetzt sofort)
```bash
npm install
node sync-data.js
```

Die `index.html` wird sofort aktualisiert. Öffne sie im Browser.

### 2. Täglich automatisch synchen

#### Option A: Cloudflare Worker ⭐ EMPFOHLEN

Kostenlos, serverless, 100% automatisiert.

1. Gehe zu https://dash.cloudflare.com
2. Workers & Pages → Create application
3. Kopiere den Code aus `cloudflare-worker.js`
4. Settings → Environment Variables:
   - `GITHUB_TOKEN` = dein GitHub Token (mit `repo` Scope)
5. Triggers → Cron → Pattern: `0 4 * * *` (4:00 UTC täglich)

Fertig. Worker synct täglich automatisch.

#### Option B: Lokal mit Node.js Cron

```bash
npm install node-cron
```

`run.js`:
```javascript
const cron = require('node-cron');
const { fetchSheetData, updateHTML } = require('./sync-data.js');

cron.schedule('0 4 * * *', async () => {
  const entries = await fetchSheetData();
  if (entries.length > 0) await updateHTML(entries);
});

console.log('Scheduler running...');
```

Starte: `node run.js`

## 📝 Google Sheet Format

Dein "Archiv" Tab braucht diese Spalten (exakt diese Namen):

| Spalte | Typ | Beispiel |
|--------|-----|----------|
| Datum | Text | 4.6.2026 |
| URL | URL | https://vm.tiktok.com/ZGdHEYLb5/ |
| Plattform | Text | TikTok |
| Autor | Text | yourchatgptguide |
| Titel | Text | ChatGPT: 7 Social Media Prompts |
| Transkript | Text | STOP TELLING CHATGPT... |
| Zusammenfassung | Text | 7 Prompts für Social Media... |
| Bild_URL | URL | https://drive.google.com/uc?id=ABC123 |
| Hashtags | Text | ChatGPT, Prompt-Eng, Social-Media |
| Views | Zahl | 450000 |
| Likes | Zahl | 32000 |
| Relevanz | Zahl | 9 |
| Cluster | Text | ChatGPT |

## 📦 Dateien

- `index.html` - Dashboard mit Bubble Physics & Modal (das wird täglich aktualisiert)
- `sync-data.js` - Script zum Daten laden & HTML aktualisieren
- `cloudflare-worker.js` - Serverless Worker für tägliche Auto-Sync
- `SETUP.md` - Detaillierte Setup-Anleitung
- `README.md` - Diese Datei

## 🔧 Troubleshooting

**"Keine Einträge laden"**
- Prüfe: Ist dein Google Sheet Public freigegeben?
- Test CSV-URL direkt im Browser: `https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0`

**"sync-data.js funktioniert nicht"**
```bash
npm install
node sync-data.js
```

**"GitHub Push fehlgeschlagen"**
- Token braucht `repo` Scope: https://github.com/settings/tokens → Generate new token
- Token kopieren, in Cloudflare Worker Environment Variable setzen

## 🚀 Deployment

GitHub Pages ist bereits aktiv auf https://nokidoc.github.io/knowledge-universe

Nach `git push` wird die Seite automatisch deployed.

## 📋 Checkliste

- [x] Dashboard erstellt & designt
- [x] Google Sheets Sync Script fertig
- [x] Mit echten Daten gefüllt (9725 Einträge!)
- [x] GitHub Repository aktiv
- [x] Cloudflare Worker Setup ready
- [ ] Deine erste tägliche Sync einrichten

## 💡 Nächste Schritte

1. **Lokal testen**: `node sync-data.js` → Seite im Browser öffnen
2. **Cloudflare Worker einrichten** (oder Node.js Cron lokal)
3. **Fertig** - Dashboard updated sich täglich automatisch

---

**Fragen?** Alle Infos in `SETUP.md`
