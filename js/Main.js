document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkPreviousConnection();
    updateWelcomeTime();
});

function initializeApp() {
    updateDashboard();
    keyManager.updateDisplay();
}

function updateWelcomeTime() {
    const timeElement = document.getElementById('welcomeTime');
    if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString('pt-BR');
    }
}

function setupEventListeners() {
    // Mostrar/esconder credenciais API
    document.getElementById('connectionMethod')?.addEventListener('change', function() {
        const apiCredentials = document.getElementById('apiCredentials');
        if (this.value === 'api') {
            apiCredentials.style.display = 'block';
        } else {
            apiCredentials.style.display = 'none';
        }
    });

    // Enter para enviar mensagem
    document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// ==================== CONEXÃO WHATSAPP ====================

async function connectWhatsApp() {
    const phoneNumber = document.getElementById('phoneNumber').value.replace(/\D/g, '');
    const botName = document.getElementById('botName').value.trim();
    const method = document.getElementById('connectionMethod').value;
    
    if (!phoneNumber || !botName) {
        showToast('Preencha todos os campos!', 'error');
        return;
    }
    
    if (phoneNumber.length < 10 || phoneNumber.length > 13) {
        showToast('Número de telefone inválido!', 'error');
        return;
    }
    
    // Atualizar UI
    updateConnectionUI('connecting');
    
    try {
        let result;
        
        if (method === 'qrcode') {
            showQRCode();
            result = await api.connectViaQRCode(phoneNumber, botName);
        } else {
            result = await api.connectViaNumber(phoneNumber, botName);
        }
        
        if (result.success) {
            updateConnectionUI('connected', result);
            showToast('✅ WhatsApp conectado com sucesso!', 'success');
            updateDashboard();
        }
    } catch (error) {
        updateConnectionUI('error');
        showToast('Erro ao conectar: ' + error.message, 'error');
    }
}

function disconnectWhatsApp() {
    if (confirm('Tem certeza que deseja desconectar?')) {
        api.disconnect();
        updateConnectionUI('disconnected');
        hideQRCode();
        showToast('WhatsApp desconectado', 'info');
        updateDashboard();
    }
}

function updateConnectionUI(status, result = null) {
    const statusDiv = document.getElementById('connectionStatus');
    const connectBtn = document.querySelector('.btn-connect');
    const disconnectBtn = document.querySelector('.btn-disconnect');
    
    switch(status) {
        case 'connecting':
            statusDiv.innerHTML = `
                <div class="status-connecting">
                    <h4>🔄 Conectando...</h4>
                    <p>Aguarde enquanto estabelecemos a conexão.</p>
                </div>
            `;
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
            break;
            
        case 'connected':
            statusDiv.innerHTML = `
                <div class="status-connected">
                    <h4>✅ Conectado!</h4>
                    <p><strong>Número:</strong> ${result.phoneNumber}</p>
                    <p><strong>Bot:</strong> ${result.botName}</p>
                    <p><strong>Método:</strong> ${result.method === 'qr_code' ? 'QR Code' : 'Número Direto'}</p>
                    <p><strong>Sessão:</strong> ${result.sessionId}</p>
                </div>
            `;
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
            break;
            
        case 'error':
            statusDiv.innerHTML = `
                <div class="status-disconnected">
                    <h4>❌ Erro na conexão</h4>
                    <p>Tente novamente ou escolha outro método.</p>
                </div>
            `;
            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
            break;
            
        case 'disconnected':
            statusDiv.innerHTML = '';
            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
            break;
    }
}

function showQRCode() {
    const qrArea = document.getElementById('qrCodeArea');
    const qrDiv = document.getElementById('qrCode');
    
    qrArea.style.display = 'block';
    qrDiv.innerHTML = '<div style="font-size: 100px; padding: 20px;">📱</div><p>QR Code simulado</p>';
}

function hideQRCode() {
    document.getElementById('qrCodeArea').style.display = 'none';
}

function checkPreviousConnection() {
    const wasConnected = localStorage.getItem('whatsapp_connected');
    if (wasConnected === 'true') {
        const phone = localStorage.getItem('whatsapp_phone');
        const bot = localStorage.getItem('whatsapp_bot');
        
        if (phone && bot) {
            document.getElementById('phoneNumber').value = phone;
            document.getElementById('botName').value = bot;
            showToast('Dados carregados! Clique em Conectar', 'info');
        }
    }
}

// ==================== CHAVES API ====================

function generateAppKey() {
    const result = api.generateAppKey();
    keyManager.addKey('App Key', result.key);
    showToast('✅ App Key gerada com sucesso!', 'success');
    updateDashboard();
}

function generateAuthKey() {
    const result = api.generateAuthKey();
    keyManager.addKey('Auth Key', result.key);
    showToast('✅ Auth Key gerada com sucesso!', 'success');
    updateDashboard();
}

function generateAPIKey() {
    const result = api.generateAPIKey();
    keyManager.addKey('Chave API', result.key);
    showToast('✅ Chave API gerada com sucesso!', 'success');
    updateDashboard();
}

function copyKey(keyValue) {
    navigator.clipboard.writeText(keyValue).then(() => {
        showToast('📋 Chave copiada!', 'success');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = keyValue;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('📋 Chave copiada!', 'success');
    });
}

function useKey(keyId) {
    keyManager.markAsUsed(keyId);
    showToast('🔄 Chave marcada como usada!', 'info');
}

function renewKey(keyId) {
    if (keyManager.renewKey(keyId)) {
        showToast('✅ Chave renovada com sucesso!', 'success');
    }
}

function revokeKey(keyId) {
    if (confirm('Tem certeza que deseja revogar esta chave?')) {
        if (keyManager.revokeKey(keyId)) {
            showToast('🗑️ Chave revogada!', 'warning');
            updateDashboard();
        }
    }
}

function revokeAllKeys() {
    if (confirm('ATENÇÃO: Isso irá revogar TODAS as chaves. Continuar?')) {
        keyManager.revokeAll();
        api.revokeAllKeys();
        showToast('Todas as chaves foram revogadas!', 'warning');
        updateDashboard();
    }
}

function exportKeys() {
    keyManager.exportKeys();
    showToast('📥 Chaves exportadas com sucesso!', 'success');
}

function importKeysPrompt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.keys) {
                    data.keys.forEach(k => {
                        k.id = Date.now() + Math.random();
                        k.active = true;
                        keyManager.keys.push(k);
                    });
                    keyManager.saveKeys();
                    keyManager.updateDisplay();
                    showToast(`📤 ${data.keys.length} chaves importadas!`, 'success');
                    updateDashboard();
                }
            } catch (error) {
                showToast('Arquivo inválido!', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ==================== CHAT ====================

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!api.connected) {
        showToast('Conecte o WhatsApp primeiro!', 'error');
        return;
    }
    
    // Adicionar mensagem do usuário
    addMessageToChat('user', message);
    input.value = '';
    
    try {
        const phoneNumber = document.getElementById('phoneNumber').value;
        await api.sendMessage(phoneNumber, message);
        
        // Resposta do bot
        setTimeout(() => {
            const response = chatbot.processMessage(message);
            addMessageToChat('bot', response);
            updateDashboard();
        }, 1000);
        
    } catch (error) {
        showToast('Erro ao enviar: ' + error.message, 'error');
    }
}

function addMessageToChat(type, message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString('pt-BR')}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ==================== UTILITÁRIOS ====================

function updateDashboard() {
    const status = api.getStatus();
    document.getElementById('activeConnections').textContent = status.connected ? '1' : '0';
    document.getElementById('messagesToday').textContent = status.messagesSent;
    document.getElementById('keysGenerated').textContent = keyManager.getActiveKeys().length;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Atualizar dashboard periodicamente
setInterval(updateDashboard, 30000);
