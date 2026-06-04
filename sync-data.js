const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1R8m841BAAqUsmcH6taujbyh_0oj19PlaAGCpvQgCYMM';
const GID = '0';

async function fetchSheetData() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    console.log('📥 Fetching CSV...');
    const response = await axios.get(url);
    const csv = response.data;

    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      console.error('No data');
      return [];
    }

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
          bild_url: getCol('Bild_URL') || 'https://drive.google.com/uc?id=1uviY12BHSFPlkBkQK8WMXqFb_IuBkXtV',
          relevanz: parseInt(getCol('Relevanz')) || 5,
          views: parseInt(getCol('Views')?.replace(/\D/g, '') || 0) || 0,
          likes: parseInt(getCol('Likes')?.replace(/\D/g, '') || 0) || 0,
          cluster: getCol('Cluster') || 'Claude'
        };
      });

    console.log('OK: ' + entries.length + ' entries');
    return entries;
  } catch (error) {
    console.error('Error: ' + error.message);
    return [];
  }
}

async function updateHTML(entries) {
  const htmlPath = path.join(__dirname, 'index.html');
  try {
    let html = fs.readFileSync(htmlPath, 'utf8');
    const dataScript = 'let DATA = ' + JSON.stringify({entries}) + ';';
    html = html.replace(/let DATA = \{[\s\S]*?\};/, dataScript);
    fs.writeFileSync(htmlPath, html);
    console.log('HTML updated');
    return true;
  } catch (error) {
    console.error('Update error: ' + error.message);
    return false;
  }
}

async function main() {
  console.log('Starting sync...');
  const entries = await fetchSheetData();
  if (entries.length > 0) {
    await updateHTML(entries);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchSheetData, updateHTML };
