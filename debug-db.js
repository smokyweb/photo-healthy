const { Client } = require('ssh2');
const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};
const NODE_BIN = '/opt/alt/alt-nodejs16/root/bin';
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
  // Test MySQL connection directly with Node
  console.log('Testing DB connection...');
  let out = await execSSH(`
    export PATH=${NODE_BIN}:$PATH
    cd ${REMOTE_DIR}
    node -e "
      require('dotenv').config();
      const mysql = require('mysql2/promise');
      async function test() {
        try {
          console.log('Connecting to:', process.env.DB_HOST, process.env.DB_USER, process.env.DB_NAME);
          const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          });
          const [rows] = await pool.query('SHOW TABLES');
          console.log('Tables:', JSON.stringify(rows));
          const [challenges] = await pool.query('SELECT * FROM challenges');
          console.log('Challenges:', JSON.stringify(challenges));
          await pool.end();
        } catch(e) {
          console.error('Error:', e.message);
          console.error('Code:', e.code);
        }
      }
      test();
    " 2>&1
  `);
  console.log(out);
}

main().catch(console.error);
