// ==========================================
// SERVIDOR WHATSAPP REAL - BOTBOT
// ==========================================

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore } = require('@whiskeysockets/baileys');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Armazenar estado
let sock = null;
let isConnected = false;
let pairingCode = null;
let qrCode = null;

// ==========================================
// CONEXÃO WHATSAPP
// ==========================================
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['BotBot', 'Chrome', '1.0.0']
    });

    // Evento: QR Code gerado
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCode = qr;
            io.emit('whatsapp_qr', qr);
            console.log('📱 QR Code gerado! Escaneie no WhatsApp');
        }
        
        if (connection === 'open') {
            isConnected = true;
            io.emit('whatsapp_connected', { 
                status: 'connected',
                number: sock.user?.id?.split(':')[0] || 'Conectado'
            });
            console.log('✅ WhatsApp conectado!');
        }
        
        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            io.emit('whatsapp_disconnected');
            console.log('❌ WhatsApp desconectado. Reconectando...');
            
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 3000);
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
            const messageContent = msg.message.conversation || 
                                   msg.message.extendedTextMessage?.text || 
                                   '[Mídia]';
            
            console.log(`📩 Mensagem de ${from}: ${messageContent}`);
            
            // Enviar para o frontend
            io.emit('whatsapp_message', {
                from: from,
                message: messageContent,
                timestamp: new Date().toISOString()
            });
            
            // Auto-resposta simples
            await autoReply(from, messageContent);
        }
    });

    return sock;
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
    } else if (msg.includes('preço') || msg.includes('valor')) {
        reply = 'Nossos planos começam a partir de R$ 29,90/mês!';
    } else if (msg.includes('suporte')) {
        reply = 'Nossa equipe de suporte está disponível 24/7. Qual sua dúvida?';
    } else if (msg.includes('obrigado')) {
        reply = 'De nada! Estou sempre aqui para ajudar! 👋';
    } else {
        reply = 'Recebi sua mensagem! Um atendente responderá em breve.';
    }
    
    await sock.sendMessage(to, { text: reply });
    console.log(`📤 Resposta enviada para ${to}`);
    
    io.emit('whatsapp_sent', {
        to: to,
        message: reply
    });
}

// ==========================================
// API REST
// ==========================================

// Status
app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        number: sock?.user?.id?.split(':')[0] || null,
        uptime: process.uptime()
    });
});

// Enviar mensagem
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

// Gerar código de emparelhamento (Pairing Code)
app.post('/api/pairing-code', async (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Número não informado' });
    }
    
    // Código de 8 dígitos
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    pairingCode = code;
    
    // Salvar temporariamente
    setTimeout(() => {
        pairingCode = null;
    }, 300000); // Expira em 5 minutos
    
    console.log(`🔢 Código gerado: ${code} para ${phoneNumber}`);
    
    res.json({ 
        success: true, 
        code: code,
        expiresIn: '5 minutos'
    });
});

// Verificar código
app.post('/api/verify-code', (req, res) => {
    const { code } = req.body;
    
    if (code === pairingCode) {
        isConnected = true;
        pairingCode = null;
        res.json({ success: true, message: 'Código verificado!' });
    } else {
        res.json({ success: false, message: 'Código inválido ou expirado' });
    }
});

// Desconectar
app.post('/api/disconnect', async (req, res) => {
    if (sock) {
        await sock.logout();
        sock = null;
        isConnected = false;
    }
    res.json({ success: true });
});

// ==========================================
// SOCKET.IO - Tempo real
// ==========================================
io.on('connection', (socket) => {
    console.log('🟢 Cliente conectado');
    
    socket.emit('status', { connected: isConnected });
    
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
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    
    // Conectar WhatsApp automaticamente
    connectToWhatsApp();
});
