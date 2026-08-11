// Aplicação Principal
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes
    initializeApp();
    loadSavedData();
    setupEventListeners();
});

// Inicializar App
function initializeApp() {
    updateDashboard();
    keyManager.updateDisplay();
    updateConnectionStatus();
}

// Carregar dados salvos
function loadSavedData() {
    const messagesSent = localStorage.getItem('messagesSent') || '0';
    document.getElementById('messagesToday').textContent = messagesSent;
}

// Configurar eventos
function setupEventListeners() {
    // Form de WhatsApp
    document.getElementById('whatsappForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneNumber = document.getElementById('phoneNumber').value;
        const botName = document.getElementById('botName').value;
        
        try {
            const result = await api.connectWhatsApp(phoneNumber, botName);
            updateConnectionStatus(result);
            showNotification('WhatsApp conectado com sucesso!', 'success');
        } catch (error) {
            showNotification('Erro ao conectar: ' + error.message, 'error');
        }
    });

    // Input de mensagem
    document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Gerar App Key
function generateAppKey() {
    const result = api.generateAppKey();
    keyManager.addKey('App Key', result.appKey);
    showNotification('App Key gerada com sucesso!', 'success');
    copyToClipboard(result.appKey);
}

// Gerar Auth Key
function generateAuthKey() {
    const result = api.generateAuthKey();
    keyManager.addKey('Auth Key', result.authKey);
    showNotification('Auth Key gerada com sucesso!', 'success');
    copyToClipboard(result.authKey);
}

// Enviar mensagem
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addMessageToChat('user', message);
    input.value = '';
    
    try {
        // Processar resposta do chatbot
        const response = chatbot.processMessage(message);
        
        // Simular delay de digitação
        setTimeout(() => {
            addMessageToChat('bot', response);
            
            // Atualizar estatísticas
            const count = parseInt(localStorage.getItem('messagesSent') || '0') + 1;
            localStorage.setItem('messagesSent', count.toString());
            updateDashboard();
        }, 1000);
        
    } catch (error) {
        showNotification('Erro ao enviar mensagem', 'error');
    }
}

// Adicionar mensagem ao chat
function addMessageToChat(type, message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Atualizar Dashboard
function updateDashboard() {
    const status = api.getStatus();
    document.getElementById('activeConnections').textContent = status.connected ? '1' : '0';
    document.getElementById('messagesToday').textContent = status.messagesSent;
    document.getElementById('keysGenerated').textContent = keyManager.getKeys().length;
}

// Atualizar status de conexão
function updateConnectionStatus(result = null) {
    const statusDiv = document.getElementById('connectionStatus');
    if (result && result.success) {
        statusDiv.innerHTML = `
            <div class="status-connected">
                ✅ Conectado como ${result.botName}
                <br>Número: ${result.phoneNumber}
            </div>
        `;
    }
}

// Notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Copiar para clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiado para área de transferência!', 'success');
    });
}

// Atualizar dashboard periodicamente
setInterval(updateDashboard, 30000);
