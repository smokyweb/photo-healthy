#!/usr/bin/env node
/**
 * Deploy full build (dist-web + server) to photohealthy server via SFTP
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SFTP_HOST = 'server.bluestoneapps.com';
const SFTP_PORT = 22004;
const SFTP_USER = 'photobai';
const SFTP_PASS = '5J=G0)PKG%ybVK%d';
const REMOTE_PATH = '/home3/photobai/public_html';
const NODE_BIN = '/opt/alt/alt-nodejs16/root/bin/node';
const PM2_BIN = '/opt/alt/alt-nodejs16/root/bin/node /home3/photobai/node_modules/.bin/pm2';

console.log('📦 Building for production...');
execSync('npm run build:web', { stdio: 'inherit' });

console.log('🚀 Deploying to server...');

// Use sshpass + rsync if available, otherwise use sftp batch
const sshpassCmd = `sshpass -p "${SFTP_PASS}"`;
const sshFlags = `-o StrictHostKeyChecking=no -o Port=${SFTP_PORT}`;

try {
  // Deploy dist-web
  execSync(
    `${sshpassCmd} rsync -avz --delete -e "ssh ${sshFlags}" dist-web/ ${SFTP_USER}@${SFTP_HOST}:${REMOTE_PATH}/`,
    { stdio: 'inherit' }
  );
  // Deploy server
  execSync(
    `${sshpassCmd} rsync -avz -e "ssh ${sshFlags}" server/ ${SFTP_USER}@${SFTP_HOST}:${REMOTE_PATH}/server/`,
    { stdio: 'inherit' }
  );
  // Restart node server
  execSync(
    `${sshpassCmd} ssh ${sshFlags} ${SFTP_USER}@${SFTP_HOST} "${PM2_BIN} restart photohealthy || ${PM2_BIN} start ${REMOTE_PATH}/server/server.js --name photohealthy --interpreter ${NODE_BIN}"`,
    { stdio: 'inherit' }
  );
  console.log('✅ Deploy complete!');
} catch (e) {
  console.error('❌ Deploy failed:', e.message);
  console.log('\nTip: Make sure sshpass is installed: apt-get install sshpass');
  process.exit(1);
}
