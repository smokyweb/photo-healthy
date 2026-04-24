const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');
const path = require('path');

const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};
const REMOTE_DIR = '/home3/photobai/public_html';
const NODE_BIN = '/opt/alt/alt-nodejs16/root/bin';

function execSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        stream.on('close', () => { conn.end(); resolve(output); });
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', (data) => { output += data.toString(); });
      });
    });
    conn.on('error', reject);
    conn.connect(CONFIG);
  });
}

async function main() {
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);

  console.log('Uploading server.js...');
  await sftp.put(path.join(__dirname, 'server', 'server.js'), REMOTE_DIR + '/server.js');
  console.log('Uploaded.');

  await sftp.end();

  console.log('Force-killing old server...');
  await execSSH(`pkill -f "${NODE_BIN}/node server.js" || true`).catch(() => {});

  console.log('Starting server...');
  await execSSH(`cd ${REMOTE_DIR} && ${NODE_BIN}/node server.js >> server.log 2>&1 &`);
  await new Promise(r => setTimeout(r, 3000));

  const status = await execSSH(`curl -s http://127.0.0.1:3001/api/challenges | head -c 20`);
  console.log('Restart: ' + (status.includes('[') ? '(ok)' : '(check logs)'));

  const apiCheck = await execSSH(`curl -s -o /dev/null -w "%{http_code}" https://photoai.betaplanets.com/api/challenges`);
  console.log('Server status: ' + (apiCheck.trim() === '200' ? 'ALIVE' : 'DEAD'));
  console.log('API check: ' + apiCheck.trim());
}

main().catch(e => { console.error(e.message); process.exit(1); });
