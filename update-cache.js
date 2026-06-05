const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1R8m841BAAqUsmcH6taujbyh_0oj19PlaAGCpvQgCYMM';
const GID = '0';

async function main() {
  try {
    console.log('📥 Fetching 9700+ entries from Google Sheets...');
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    const response = await axios.get(url, { timeout: 30000 });
    const csv = response.data;

    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const entries = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const getCol = (name) => {
          const idx = headers.indexOf(name);
          return idx >= 0 ? cells[idx] || '' : '';
        };
        return {
          datum: getCol('Datum'),
          url: getCol('URL'),
          plattform: getCol('Plattform') || 'TikTok',
          autor: getCol('Autor'),
          titel: getCol('Titel'),
          hashtags: getCol('Hashtags').split(',').map(h => h.trim()).filter(h => h),
          transkript: getCol('Transkript'),
          zusammenfassung: getCol('Zusammenfassung'),
          bild_url: getCol('Bild_URL') || '',
          relevanz: parseInt(getCol('Relevanz')) || 5,
          views: parseInt(getCol('Views')?.replace(/\D/g, '') || 0) || 0,
          likes: parseInt(getCol('Likes')?.replace(/\D/g, '') || 0) || 0,
          cluster: getCol('Cluster') || 'Claude'
        };
      });

    // Group by cluster
    const byCluster = {};
    entries.forEach(e => {
      if (!byCluster[e.cluster]) byCluster[e.cluster] = [];
      byCluster[e.cluster].push(e);
    });

    // Sort by relevanz
    Object.keys(byCluster).forEach(c => {
      byCluster[c].sort((a, b) => b.relevanz - a.relevanz);
    });

    const data = { byCluster, total: entries.length };

    // Lese index.html
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

    // Ersetze DATA = {}
    const dataScript = `let DATA = ${JSON.stringify(data)};`;
    html = html.replace(/let DATA = \{.*?\};/, dataScript);

    // Schreibe zurück
    fs.writeFileSync(path.join(__dirname, 'index.html'), html);

    console.log(`✅ ${entries.length} entries loaded and injected into index.html`);
    Object.entries(byCluster).forEach(([c, items]) => {
      console.log(`   ${c}: ${items.length}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
