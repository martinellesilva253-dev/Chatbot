// API Configuration com WhatsApp
class WhatsAppAPI {
    constructor() {
        this.baseURL = 'https://graph.facebook.com/v18.0';
        this.appKey = localStorage.getItem('appKey') || '';
        this.authKey = localStorage.getItem('authKey') || '';
        this.apiKey = localStorage.getItem('apiKey') || '';
        this.connected = false;
        this.connectionMethod = 'direct';
        this.phoneNumber = '';
        this.botName = '';
    }

    // Gerar App Key
    generateAppKey() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = this.generateRandomString(8);
        const checksum = this.generateChecksum();
        const appKey = `AK_${timestamp}_${random}_${checksum}`;
        
        localStorage.setItem('appKey', appKey);
        this.appKey = appKey;
        
        return {
            success: true,
            type: 'App Key',
            key: appKey,
            createdAt: new Date().toISOString()
        };
    }

    // Gerar Auth Key
    generateAuthKey() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = this.generateRandomString(16);
        const signature = this.generateSignature();
        const authKey = `AUTH_${timestamp}_${random}_${signature}`;
        
        localStorage.setItem('authKey', authKey);
        this.authKey = authKey;
        
        return {
            success: true,
            type: 'Auth Key',
            key: authKey,
            createdAt: new Date().toISOString()
        };
    }

    // Gerar Chave API
    generateAPIKey() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = this.generateRandomString(24);
        const hash = this.generateHash();
        const apiKey = `API_${timestamp}_${random}_${hash}`;
        
        localStorage.setItem('apiKey', apiKey);
        this.apiKey = apiKey;
        
        return {
            success: true,
            type: 'Chave API',
            key: apiKey,
            createdAt: new Date().toISOString()
        };
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateChecksum() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    generateSignature() {
        return btoa(Date.now().toString()).substring(0, 8).toUpperCase();
    }

    generateHash() {
        const data = Date.now().toString() + Math.random().toString();
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).toUpperCase().substring(0, 12);
    }

    // Conectar WhatsApp via número
    async connectViaNumber(phoneNumber, botName) {
        this.connectionMethod = 'direct';
        this.phoneNumber = phoneNumber;
        this.botName = botName;
        
        // Simular processo de conexão
        return new Promise((resolve) => {
            // Fase 1: Validando número
            setTimeout(() => {
                // Fase 2: Conectando
                setTimeout(() => {
                    this.connected = true;
                    localStorage.setItem('whatsapp_connected', 'true');
                    localStorage.setItem('whatsapp_phone', phoneNumber);
                    localStorage.setItem('whatsapp_bot', botName);
                    
                    resolve({
                        success: true,
                        phoneNumber: phoneNumber,
                        botName: botName,
                        status: 'connected',
                        method: 'direct_number',
                        sessionId: 'WA_' + Date.now().toString(36)
                    });
                }, 2000);
            }, 1500);
        });
    }

    // Conectar via QR Code
    async connectViaQRCode(phoneNumber, botName) {
        this.connectionMethod = 'qrcode';
        this.phoneNumber = phoneNumber;
        this.botName = botName;
        
        return new Promise((resolve) => {
            setTimeout(() => {
                this.connected = true;
                localStorage.setItem('whatsapp_connected', 'true');
                localStorage.setItem('whatsapp_phone', phoneNumber);
                localStorage.setItem('whatsapp_bot', botName);
                
                resolve({
                    success: true,
                    phoneNumber: phoneNumber,
                    botName: botName,
                    status: 'connected',
                    method: 'qr_code',
                    sessionId: 'WA_' + Date.now().toString(36)
                });
            }, 4000);
        });
    }

    // Desconectar
    disconnect() {
        this.connected = false;
        localStorage.removeItem('whatsapp_connected');
        return { success: true, message: 'Desconectado com sucesso' };
    }

    // Enviar mensagem
    async sendMessage(to, message) {
        if (!this.connected) {
            throw new Error('WhatsApp não está conectado');
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                const count = parseInt(localStorage.getItem('messagesSent') || '0') + 1;
                localStorage.setItem('messagesSent', count.toString());
                
                resolve({
                    success: true,
                    messageId: 'MSG_' + Date.now(),
                    to: to,
                    message: message,
                    status: 'sent',
                    timestamp: new Date().toISOString()
                });
            }, 500);
        });
    }

    // Verificar Status
    getStatus() {
        return {
            connected: this.connected,
            appKey: this.appKey ? '✓' : '✗',
            authKey: this.authKey ? '✓' : '✗',
            apiKey: this.apiKey ? '✓' : '✗',
            messagesSent: parseInt(localStorage.getItem('messagesSent') || '0'),
            connectionMethod: this.connectionMethod
        };
    }

    // Revogar todas as chaves
    revokeAllKeys() {
        localStorage.removeItem('appKey');
        localStorage.removeItem('authKey');
        localStorage.removeItem('apiKey');
        this.appKey = '';
        this.authKey = '';
        this.apiKey = '';
        return { success: true };
    }
}

const api = new WhatsAppAPI();
