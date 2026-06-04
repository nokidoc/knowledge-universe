# Knowledge Universe - Setup & Betrieb

## 🚀 Live Dashboard
**URL:** https://nokidoc.github.io/knowledge-universe

## 📊 Daten synchronisieren

### Option 1: Manuell (jetzt sofort testen)
```bash
node sync-data.js
```

### Option 2: Täglich automatisch

#### A) Cloudflare Workers ⭐ EMPFOHLEN (kostenlos, serverless)

Gehe zu https://dash.cloudflare.com → Workers → Create Service

Wähle "Hello World" template, ersetze mit diesem Code:

```javascript
export default {
  async scheduled(event, env, ctx) {
    const SHEET_ID = '1R8m841BAAqUsmcH6taujbyh_0oj19PlaAGCpvQgCYMM';
    const API_KEY = 'AIzaSyAO7lWlnGCe0eZLiQj_l6osfYPR1gPWYGo';
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO = 'nokidoc/knowledge-universe';
    
    try {
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Archiv?key=${API_KEY}`;
      const sheetResp = await fetch(sheetUrl);
      const sheetData = await sheetResp.json();
      const rows = sheetData.values || [];
      
      if (rows.length < 2) throw new Error('No data');
      
      const headers = rows[0];
      const entries = rows.slice(1).map(row => ({
        datum: row[headers.indexOf('Datum')] || '',
        url: row[headers.indexOf('URL')] || '',
        plattform: row[headers.indexOf('Plattform')] || 'TikTok',
        autor: row[headers.indexOf('Autor')] || '',
        titel: row[headers.indexOf('Titel')] || '',
        hashtags: (row[headers.indexOf('Hashtags')] || '').split(',').map(h => h.trim()).filter(h => h),
        transkript: row[headers.indexOf('Transkript')] || '',
        zusammenfassung: row[headers.indexOf('Zusammenfassung')] || '',
        bild_url: row[headers.indexOf('Bild_URL')] || 'https://drive.google.com/uc?id=1uviY12BHSFPlkBkQK8WMXqFb_IuBkXtV',
        relevanz: parseInt(row[headers.indexOf('Relevanz')] || '5'),
        views: parseInt((row[headers.indexOf('Views')] || '0').toString().replace(/\D/g, '')) || 0,
        likes: parseInt((row[headers.indexOf('Likes')] || '0').toString().replace(/\D/g, '')) || 0,
        cluster: row[headers.indexOf('Cluster')] || 'Claude'
      }));
      
      const htmlResp = await fetch(`https://raw.githubusercontent.com/${REPO}/main/index.html`);
      let html = await htmlResp.text();
      
      const dataScript = `let DATA = ${JSON.stringify({entries})};`;
      html = html.replace(/let DATA = \{[\s\S]*?\};/, dataScript);
      
      const fileResp = await fetch(`https://api.github.com/repos/${REPO}/contents/index.html`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const fileData = await fileResp.json();
      
      const pushResp = await fetch(`https://api.github.com/repos/${REPO}/contents/index.html`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Auto: Daily sync - ${entries.length} entries`,
          content: btoa(html),
          sha: fileData.sha,
          branch: 'main'
        })
      });
      
      return new Response(`OK: ${entries.length} synced`, { status: 200 });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
};
```

Setup:
1. Settings → Environment Variables → `GITHUB_TOKEN` = dein GitHub Token
2. Triggers → Cron → Pattern: `0 4 * * *` (täglich 4:00 UTC)

#### B) Lokal mit Node.js Cron

```bash
npm init -y
npm install axios node-cron
```

`run.js`:
```javascript
const cron = require('node-cron');
const { fetchSheetData, updateHTML } = require('./sync-data.js');

cron.schedule('0 4 * * *', async () => {
  const entries = await fetchSheetData();
  if (entries.length > 0) {
    await updateHTML(entries);
    console.log('✅ Synced');
  }
});

console.log('Scheduler running. Daily sync at 04:00 UTC.');
```

Starte: `node run.js`

## 📝 Google Sheet Spalten

| Spalte | Beispiel |
|--------|----------|
| Datum | 4.6.2026 |
| URL | https://vm.tiktok.com/ZGdHEYLb5/ |
| Plattform | TikTok |
| Autor | yourchatgptguide |
| Titel | ChatGPT: 7 Social Media Prompts |
| Transkript | STOP TELLING CHATGPT... |
| Zusammenfassung | 7 Prompts für Social Media |
| Bild_URL | https://drive.google.com/uc?id=ABC123 |
| Hashtags | ChatGPT, Prompt-Eng, Social-Media |
| Views | 450000 |
| Likes | 32000 |
| Relevanz | 9 |
| Cluster | ChatGPT |

## ✅ Start

1. Test: `node sync-data.js`
2. Wenn OK → Automatisierung einrichten (Cloudflare Worker oder lokal)
3. Dashboard: https://nokidoc.github.io/knowledge-universe

