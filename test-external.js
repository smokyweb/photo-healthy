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
  // Try LiteSpeed restart for this vhost
  console.log('1. Trying to restart LiteSpeed vhost...');
  let out = await execSSH(`
    # Touch htaccess and files to invalidate cache
    touch ${REMOTE_DIR}/.htaccess
    touch ${REMOTE_DIR}/index.html

    # Clear ALL caches
    rm -rf ~/lscache/* 2>/dev/null
    rm -rf ~/tmp/* 2>/dev/null
    rm -rf ${REMOTE_DIR}/.litespeed 2>/dev/null

    # Try restarting web server for this user
    /usr/local/lsws/bin/lswsctrl restart 2>/dev/null || echo "Can't restart lsws"
    killall lsphp 2>/dev/null || echo "No lsphp"

    echo "Cache cleared"
  `);
  console.log(out);

  // Try accessing with the correct IP
  console.log('\n2. Testing with internal IP...');
  out = await execSSH(`
    curl -sI -H "Host: photoai.betaplanets.com" http://10.128.0.122/ 2>&1
    echo "==="
    curl -s -H "Host: photoai.betaplanets.com" http://10.128.0.122/ 2>&1 | head -15
    echo "==="
    # Also try https
    curl -skI https://photoai.betaplanets.com/ 2>&1
  `);
  console.log(out);

  // Double check our files
  console.log('\n3. File verification...');
  out = await execSSH(`
    md5sum ${REMOTE_DIR}/index.html
    echo "---"
    stat ${REMOTE_DIR}/index.html
    echo "---"
    cat ${REMOTE_DIR}/index.html
  `);
  console.log(out);
}

main().catch(console.error);
