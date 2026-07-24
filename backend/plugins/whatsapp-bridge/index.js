const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let currentQR = null;
let isConnected = false;

async function startBaileys() {
    const { state, saveCreds } = await useMultiFileAuthState('whatsapp_auth_info');

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ["CreatorOS", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            currentQR = qr; // Save raw QR code
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(startBaileys, 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Connected');
            isConnected = true;
            currentQR = null; // Clear QR code on successful connection
        }
    });
}

// Start Baileys immediately
startBaileys();

// Express Endpoints
app.get('/status', (req, res) => {
    res.json({ connected: isConnected });
});

app.get('/qr', async (req, res) => {
    if (isConnected) {
        return res.json({ connected: true });
    }
    if (currentQR) {
        const qrcode = require('qrcode');
        try {
            const dataUrl = await qrcode.toDataURL(currentQR);
            res.json({ connected: false, qr: dataUrl });
        } catch (err) {
            res.status(500).json({ error: 'Failed to generate QR code' });
        }
    } else {
        res.json({ connected: false, qr: null, message: 'QR not ready yet' });
    }
});

app.post('/send', async (req, res) => {
    if (!isConnected || !sock) {
        return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ error: 'Number and message are required' });
    }

    // Format number for WhatsApp
    const jid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    try {
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to send message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`WhatsApp Bridge running on http://localhost:${PORT}`);
});
