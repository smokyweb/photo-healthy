const { Client } = require('ssh2');
const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};
const REMOTE_DIR = '/home3/photobai/public_html';

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
  // Check Apache modules and error logs
  console.log('1. Checking Apache...');
  let out = await execSSH(`
    cat ${REMOTE_DIR}/.htaccess
    echo "==="
    tail -30 ~/logs/error.log 2>/dev/null
    echo "==="
    ls -la ${REMOTE_DIR}/dist-web/
  `);
  console.log(out);

  // Check if we can access the site via Apache
  console.log('\n2. Testing local access...');
  out = await execSSH(`
    curl -sI -H "Host: photoai.betaplanets.com" http://127.0.0.1/ 2>&1
    echo "==="
    curl -s -H "Host: photoai.betaplanets.com" http://127.0.0.1/dist-web/index.html 2>&1 | head -10
  `);
  console.log(out);
}

main().catch(console.error);
