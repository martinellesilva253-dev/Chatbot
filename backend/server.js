// ==========================================
// BOTBOT - WHATSAPP BACKEND REAL
// ==========================================

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

let sock = null;
let isConnected = false;
let qrCodeString = null;

// ==========================================
// CONECTAR WHATSAPP
// ==========================================
async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['BotBot', 'Chrome', '1.0.0']
    });

    // QR Code gerado
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodeString = qr;
            io.emit('whatsapp_qr', qr);
            console.log('📱 QR Code gerado! Escaneie no WhatsApp');
        }
        
        if (connection === 'open') {
            isConnected = true;
            qrCodeString = null;
            const number = sock.user?.id?.split(':')[0] || 'Conectado';
            io.emit('whatsapp_connected', { 
                status: 'connected',
                number: number
            });
            console.log('✅ WhatsApp conectado! Número:', number);
        }
        
        if (connection === 'close') {
            isConnected = false;
            io.emit('whatsapp_disconnected');
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log('🔄 Reconectando...');
                setTimeout(() => connectWhatsApp(), 3000);
            } else {
                console.log('❌ Sessão encerrada. Gere novo QR Code.');
            }
        }
    });

    // Salvar credenciais
    sock.ev.on('creds.update', saveCreds);

    // Receber mensagens
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.fromMe && msg.message) {
            const from = msg.key.remoteJid;
            const content = msg.message.conversation || 
                           msg.message.extendedTextMessage?.text || 
                           '[Mídia]';
            
            console.log(`📩 Mensagem de ${from}: ${content}`);
            
            io.emit('whatsapp_message', {
                from: from,
                message: content,
                timestamp: new Date().toISOString()
            });
            
            // Auto-resposta
            await autoReply(from, content);
        }
    });
}

// ==========================================
// AUTO-RESPOSTA
// ==========================================
async function autoReply(to, message) {
    if (!sock || !isConnected) return;
    
    const msg = message.toLowerCase();
    let reply = '';
    
    if (msg.includes('olá') || msg.includes('oi')) {
        reply = 'Olá! Como posso ajudar? 😊';
    } else if (msg.includes('preço')) {
        reply = 'Nossos planos começam a partir de R$ 29,90/mês!';
    } else if (msg.includes('suporte')) {
        reply = 'Suporte 24/7 disponível! Qual sua dúvida?';
    } else {
        reply = 'Recebi sua mensagem! Responderemos em breve.';
    }
    
    await sock.sendMessage(to, { text: reply });
    io.emit('whatsapp_sent', { to, message: reply });
}

// ==========================================
// API REST
// ==========================================
app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        number: sock?.user?.id?.split(':')[0] || null,
        hasQR: !!qrCodeString
    });
});

app.post('/api/send', async (req, res) => {
    const { to, message } = req.body;
    
    if (!sock || !isConnected) {
        return res.status(400).json({ error: 'WhatsApp não conectado' });
    }
    
    try {
        const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
        const result = await sock.sendMessage(jid, { text: message });
        res.json({ success: true, messageId: result.key.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', async (req, res) => {
    if (sock) {
        await sock.logout();
        sock = null;
        isConnected = false;
        qrCodeString = null;
    }
    res.json({ success: true });
});

// ==========================================
// SOCKET.IO
// ==========================================
io.on('connection', (socket) => {
    console.log('🟢 Cliente conectado');
    
    socket.emit('status', { 
        connected: isConnected, 
        hasQR: !!qrCodeString 
    });
    
    if (qrCodeString) {
        socket.emit('whatsapp_qr', qrCodeString);
    }
    
    socket.on('send_message', async (data) => {
        if (sock && isConnected) {
            const jid = data.to.includes('@s.whatsapp.net') ? data.to : `${data.to}@s.whatsapp.net`;
            await sock.sendMessage(jid, { text: data.message });
            socket.emit('message_sent', { success: true });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔴 Cliente desconectado');
    });
});

// ==========================================
// INICIAR
// ==========================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    connectWhatsApp();
});
