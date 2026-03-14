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
  // Clean up PHP proxy (not needed)
  console.log('1. Cleaning up...');
  let out = await execSSH(`
    rm -f ${REMOTE_DIR}/api.php 2>/dev/null
    echo "Cleaned up"
  `);
  console.log(out);

  // Final status check
  console.log('\n2. Final status...');
  out = await execSSH(`
    echo "=== Server Process ==="
    pgrep -a -f "node.*server.js"
    echo ""
    echo "=== Crontab ==="
    crontab -l
    echo ""
    echo "=== Files ==="
    ls -la ${REMOTE_DIR}/*.html ${REMOTE_DIR}/*.js ${REMOTE_DIR}/.htaccess
    echo ""
    echo "=== API Test ==="
    curl -s http://127.0.0.1:3001/api/challenges | python3 -m json.tool 2>/dev/null | head -10 || curl -s http://127.0.0.1:3001/api/challenges | head -3
    echo ""
    echo "=== External Test ==="
    curl -sI -H "Host: photoai.betaplanets.com" http://10.128.0.122/ | head -5
    echo "---"
    curl -sI -H "Host: photoai.betaplanets.com" http://10.128.0.122/api/challenges | head -5
    echo ""
    echo "=== DB Tables ==="
    mysql -u photobai_phuser -pPh0t0H3@lthy2026 photobai_photohealthy -e "SHOW TABLES" 2>&1 | grep -v Warning
    echo ""
    echo "=== DB Counts ==="
    mysql -u photobai_phuser -pPh0t0H3@lthy2026 photobai_photohealthy -e "SELECT 'users' as tbl, COUNT(*) as cnt FROM users UNION ALL SELECT 'challenges', COUNT(*) FROM challenges UNION ALL SELECT 'submissions', COUNT(*) FROM submissions" 2>&1 | grep -v Warning
  `);
  console.log(out);
}

main().catch(console.error);
