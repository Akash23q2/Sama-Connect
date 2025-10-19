// start-dev.js
import fs from 'fs';
import { exec } from 'child_process';
import os from 'os';
import path from 'path';

// --- Step 1: Detect local IP ---
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();
console.log(`Detected local IP: ${localIP}`);

// --- Step 2: Update .env file ---
const envPath = path.join(process.cwd(), '.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

envContent = envContent.replace(/VITE_BACKEND_HOST_IP=.*/g, `VITE_BACKEND_HOST_IP=${localIP}`);
envContent = envContent.replace(/VITE_PEERJS_HOST_IP=.*/g, `VITE_PEERJS_HOST_IP=${localIP}`);

// If the keys didn’t exist, append them
if (!/VITE_BACKEND_HOST_IP=/.test(envContent)) envContent += `\nVITE_BACKEND_HOST_IP=${localIP}`;
if (!/VITE_PEERJS_HOST_IP=/.test(envContent)) envContent += `\nVITE_PEERJS_HOST_IP=${localIP}`;

fs.writeFileSync(envPath, envContent);
console.log('.env updated with LAN IP!');

// --- Step 3: Launch PeerJS ---
const peerCommand = `npx peerjs --port 9000 --path / --key peerjs`;
const peerProcess = exec(peerCommand);

peerProcess.stdout.on('data', (data) => {
    process.stdout.write(`[PeerJS] ${data}`);
});
peerProcess.stderr.on('data', (data) => {
    process.stderr.write(`[PeerJS] ${data}`);
});

// --- Step 4: Launch Vite ---
const viteCommand = `npx vite --host ${localIP}`;
const viteProcess = exec(viteCommand);

viteProcess.stdout.on('data', (data) => {
    process.stdout.write(`[Vite] ${data}`);
});
viteProcess.stderr.on('data', (data) => {
    process.stderr.write(`[Vite] ${data}`);
});
