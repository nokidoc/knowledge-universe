/**
 * Täglich laufen: Hole Daten von Google Sheets → Update index.html
 * Kann als Node.js Script laufen oder als Cloudflare Worker deployed werden
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1R8m841BAAqUsmcH6taujbyh_0oj19PlaAGCpvQgCYMM';
const SHEET_NAME = 'Archiv';
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || 'AIzaSyAO7lWlnGCe0eZLiQj_l6osfYPR1gPWYGo';

async function fetchSheetData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
  
  try {
    const response = await axios.get(url);
    const rows = response.data.values || [];
    
    if (rows.length < 2) {
      console.error('❌ Keine Daten im Sheet');
      return [];
    }
    
    const headers = rows[0];
    const entries = rows.slice(1)
      .filter(row => row && row.length > 0)
      .map(row => {
        const getCol = (name) => row[headers.indexOf(name)] || '';
        
        return {
          datum: getCol('Datum'),
          url: getCol('URL'),
          plattform: getCol('Plattform') || 'TikTok',
          autor: getCol('Autor'),
          titel: getCol('Titel'),
          hashtags: getCol('Hashtags').split(',').map(h => h.trim()).filter(h => h),
          transkript: getCol('Transkript'),
          zusammenfassung: getCol('Zusammenfassung'),
          bild_url: getCol('Bild_URL') || 'https://drive.google.com/uc?id=1uviY12BHSFPlkBkQK8WMXqFb_IuBkXtV',
          relevanz: parseInt(getCol('Relevanz')) || 5,
          views: parseInt(getCol('Views')?.replace(/\D/g, '') || 0) || 0,
          likes: parseInt(getCol('Likes')?.replace(/\D/g, '') || 0) || 0,
          cluster: getCol('Cluster') || 'Claude'
        };
      });
    
    console.log(`✅ ${entries.length} Einträge geladen`);
    return entries;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function updateHTML(entries) {
  const htmlPath = path.join(__dirname, 'index.html');
  
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const dataScript = `let DATA = ${JSON.stringify({entries})};`;
    
    // Ersetze alte DATA
    html = html.replace(/let DATA = \{[\s\S]*?\};/, dataScript);
    
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ index.html aktualisiert (${entries.length} Einträge)`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating HTML:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Starte Datensync...');
  const entries = await fetchSheetData();
  
  if (entries.length > 0) {
    await updateHTML(entries);
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchSheetData, updateHTML };
