const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  host: 'server.bluestoneapps.com',
  port: 22004,
  username: 'photobai',
  password: '5J=G0)PKG%ybVK%d',
};
const REMOTE_DIR = '/home3/photobai/public_html';

function getAllFiles(dir, baseDir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      const rel = path.relative(baseDir, fullPath).split(path.sep).join('/');
      results.push({ local: fullPath, relative: rel });
    }
  }
  return results;
}

async function main() {
  const sftp = new SftpClient();
  await sftp.connect(CONFIG);
  console.log('Connected to server');

  // Upload all dist-web files to public_html root
  const distDir = path.join(__dirname, 'dist-web');
  const distFiles = getAllFiles(distDir, distDir);
  console.log('Uploading ' + distFiles.length + ' files from dist-web...');
  for (const f of distFiles) {
    const remotePath = REMOTE_DIR + '/' + f.relative;
    console.log('  -> ' + f.relative);
    await sftp.put(f.local, remotePath);
  }

  // Also upload original PNGs from public/ to public_html root
  const publicDir = path.join(__dirname, 'public');
  const pngFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.png'));
  console.log('Uploading ' + pngFiles.length + ' PNGs from public/...');
  for (const f of pngFiles) {
    const localPath = path.join(publicDir, f);
    const remotePath = REMOTE_DIR + '/' + f;
    console.log('  -> ' + f);
    await sftp.put(localPath, remotePath);
  }

  await sftp.end();
  console.log('Deploy complete!');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
