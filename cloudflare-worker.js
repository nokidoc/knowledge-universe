/**
 * Cloudflare Worker für Knowledge Universe Daily Sync
 *
 * Setup:
 * 1. https://dash.cloudflare.com → Workers & Pages → Create application
 * 2. Copy diesen Code in den Editor
 * 3. Settings → Environment Variables:
 *    - GITHUB_TOKEN = dein GitHub Personal Access Token (ghp_...)
 * 4. Triggers → Cron → Pattern: "0 4 * * *" (täglich 4:00 UTC)
 */

export default {
  async scheduled(event, env, ctx) {
    const SHEET_ID = '1R8m841BAAqUsmcH6taujbyh_0oj19PlaAGCpvQgCYMM';
    const REPO = 'nokidoc/knowledge-universe';
    const GID = '0';

    try {
      // 1. Fetch CSV from Google Sheets
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
      const csvResp = await fetch(csvUrl);
      const csv = await csvResp.text();

      // 2. Parse CSV
      const lines = csv.trim().split('\n');
      if (lines.length < 2) {
        return new Response('No data in sheet', { status: 400 });
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

      // 3. Fetch current HTML from GitHub
      const htmlResp = await fetch(`https://raw.githubusercontent.com/${REPO}/main/index.html`);
      let html = await htmlResp.text();

      // 4. Inject new data
      const dataScript = `let DATA = ${JSON.stringify({entries})};`;
      html = html.replace(/let DATA = \{[\s\S]*?\};/, dataScript);

      // 5. Get file SHA from GitHub API
      const fileResp = await fetch(`https://api.github.com/repos/${REPO}/contents/index.html`, {
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      const fileData = await fileResp.json();

      // 6. Push to GitHub
      const pushResp = await fetch(`https://api.github.com/repos/${REPO}/contents/index.html`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Auto: Daily sync - ${entries.length} entries`,
          content: btoa(html),
          sha: fileData.sha,
          branch: 'main'
        })
      });

      if (!pushResp.ok) {
        throw new Error(`GitHub push failed: ${pushResp.status}`);
      }

      return new Response(`OK: ${entries.length} entries synced`, { status: 200 });
    } catch (error) {
      console.error('Error:', error.message);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }
};
