const SftpClient = require('C:/Users/kevin/AppData/Roaming/npm/node_modules/ssh2-sftp-client');
const { Client } = require('C:/Users/kevin/AppData/Roaming/npm/node_modules/ssh2');
const fs = require('fs');
const path = require('path');

const CONFIG = { host: 'server.bluestoneapps.com', port: 22004, username: 'photobai', password: '5J=G0)PKG%ybVK%d' };
const REMOTE = '/home3/photobai/public_html';

function execSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    conn.on('ready', () => { conn.exec(cmd, (err, stream) => { if (err) { conn.end(); return reject(err); } stream.on('close', () => { conn.end(); resolve(output); }); stream.on('data', d => output += d); stream.stderr.on('data', d => output += d); }); });
    conn.on('error', reject);
    conn.connect(CONFIG);
  });
}

async function main() {
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);

  // Upload server.js
  await sftp.put('C:/Temp/photohealthy/server/server.js', REMOTE + '/server.js');
  console.log('server.js uploaded');

  // Upload dist-web bundle and index.html
  const distFiles = fs.readdirSync('C:/Temp/photohealthy/dist-web');
  for (const f of distFiles) {
    await sftp.put(`C:/Temp/photohealthy/dist-web/${f}`, `${REMOTE}/dist-web/${f}`);
    console.log(`dist-web/${f}`);
  }

  // Copy index.html to root
  await sftp.put('C:/Temp/photohealthy/dist-web/index.html', REMOTE + '/index.html');
  console.log('index.html → root');

  await sftp.end();

  // Restart server
  await execSSH(`pkill -f "node server.js" || true`).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  await execSSH(`cd ${REMOTE} && /opt/alt/alt-nodejs16/root/bin/node server.js >> server.log 2>&1 &`);
  await new Promise(r => setTimeout(r, 3000));
  const status = await execSSH(`curl -s http://127.0.0.1:3001/api/challenges | head -c 20`);
  console.log('Server:', status.includes('[') || status.includes('{') ? 'ALIVE' : 'CHECK LOGS');

  // Auto-commit and push to GitHub on every deploy
  const { execSync } = require('child_process');
  try {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    execSync('git add -A', { cwd: __dirname, stdio: 'pipe' });
    execSync(`git commit -m "Auto-deploy: ${timestamp}" --allow-empty`, { cwd: __dirname, stdio: 'pipe' });
    execSync('git push origin master', { cwd: __dirname, stdio: 'pipe' });
    console.log('GitHub: pushed to smokyweb/photo-healthy master');
  } catch (e) {
    console.log('GitHub push skipped (no changes or auth issue):', e.message.substring(0, 80));
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
