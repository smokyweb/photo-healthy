const { Client } = require('ssh2');
const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};

function execSSH(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return reject(err); }
        stream.on('close', () => { conn.end(); resolve(output); });
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', (data) => { output += '[ERR] ' + data.toString(); });
      });
    });
    conn.on('error', reject);
    conn.connect(CONFIG);
  });
}

async function main() {
  const out = await execSSH(`
    echo "HOME: $HOME"
    echo "PWD: $(pwd)"
    echo "WHOAMI: $(whoami)"
    echo "---"
    ls -la ~/
    echo "---"
    ls -la ~/public_html/ 2>/dev/null || echo "No public_html in home"
    echo "---"
    find / -name "public_html" -maxdepth 4 2>/dev/null | head -10
    echo "---"
    cat /etc/passwd | grep photobai
  `);
  console.log(out);
}
main().catch(console.error);
