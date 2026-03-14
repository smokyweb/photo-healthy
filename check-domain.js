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
  // Check domain configuration
  console.log('1. Domain info...');
  let out = await execSSH(`
    uapi DomainInfo list_domains 2>&1
    echo "==="
    # Check domain document root
    uapi DomainInfo single_domain_data domain=photoai.betaplanets.com 2>&1
    echo "==="
    # Check all domains and their roots
    uapi DomainInfo domains_data 2>&1 | head -50
  `);
  console.log(out);

  // Check Apache vhost configuration
  console.log('\n2. Checking Apache vhost...');
  out = await execSSH(`
    # Find vhost config for our domain
    grep -r "photoai.betaplanets.com" /etc/httpd/ 2>/dev/null | head -10
    grep -r "photoai.betaplanets.com" /etc/apache2/ 2>/dev/null | head -10
    grep -r "photoai.betaplanets.com" /usr/local/apache/ 2>/dev/null | head -10
    grep -r "photoai.betaplanets.com" /etc/litespeed/ 2>/dev/null | head -10
    echo "---"
    # Check for any redirects in the vhost or cPanel config
    ls -la /home3/photobai/etc/ 2>/dev/null
    ls -la /home3/photobai/etc/*/  2>/dev/null
  `);
  console.log(out);
}

main().catch(console.error);
