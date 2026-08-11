class KeyManager {
    constructor() {
        this.keys = JSON.parse(localStorage.getItem('apiKeys') || '[]');
    }

    addKey(type, value) {
        const key = {
            id: Date.now(),
            type: type,
            value: value,
            createdAt: new Date().toISOString(),
            lastUsed: null,
            active: true,
            permissions: type === 'Chave API' ? ['read', 'write', 'delete', 'admin'] :
                        type === 'Auth Key' ? ['read', 'write', 'delete'] : ['read', 'write'],
            expiresIn: type === 'Chave API' ? '30 dias' : type === 'Auth Key' ? '90 dias' : '365 dias'
        };
        
        this.keys.push(key);
        this.saveKeys();
        this.updateDisplay();
        return key;
    }

    getActiveKeys() {
        return this.keys.filter(k => k.active);
    }

    getKey(id) {
        return this.keys.find(k => k.id === id);
    }

    revokeKey(id) {
        const key = this.keys.find(k => k.id === id);
        if (key) {
            key.active = false;
            key.revokedAt = new Date().toISOString();
            this.saveKeys();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    renewKey(id) {
        const key = this.keys.find(k => k.id === id);
        if (key) {
            key.createdAt = new Date().toISOString();
            key.lastUsed = null;
            this.saveKeys();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    markAsUsed(id) {
        const key = this.keys.find(k => k.id === id);
        if (key) {
            key.lastUsed = new Date().toISOString();
            this.saveKeys();
        }
    }

    revokeAll() {
        this.keys.forEach(k => k.active = false);
        this.saveKeys();
        this.updateDisplay();
    }

    saveKeys() {
        localStorage.setItem('apiKeys', JSON.stringify(this.keys));
        this.updateStats();
    }

    updateDisplay() {
        const display = document.getElementById('keysDisplay');
        if (!display) return;
        
        const activeKeys = this.getActiveKeys();
        
        if (activeKeys.length === 0) {
            display.innerHTML = `
                <div class="no-keys">
                    <p>🔐 Nenhuma chave gerada</p>
                    <small>Clique nos botões acima para gerar suas chaves</small>
                </div>
            `;
            return;
        }

        const typeColors = {
            'App Key': '#667eea',
            'Auth Key': '#11998e',
            'Chave API': '#f093fb'
        };

        display.innerHTML = `
            <div class="keys-container">
                ${activeKeys.map(key => `
                    <div class="key-card" style="border-left: 4px solid ${typeColors[key.type]}">
                        <div class="key-card-header">
                            <span class="key-type-badge" style="background: ${typeColors[key.type]}">
                                ${key.type}
                            </span>
                            <span style="color: #4CAF50; font-size: 12px;">🟢 Ativa</span>
                        </div>
                        
                        <div class="key-value-container">
                            <code class="key-value">${key.value}</code>
                            <button onclick="copyKey('${key.value}')" class="btn-copy">📋 Copiar</button>
                        </div>
                        
                        <div class="key-info">
                            <div>📅 ${new Date(key.createdAt).toLocaleDateString('pt-BR')}</div>
                            <div>⏳ ${key.expiresIn}</div>
                            ${key.lastUsed ? `<div>🕐 Último uso: ${new Date(key.lastUsed).toLocaleString('pt-BR')}</div>` : '<div>📌 Nunca usada</div>'}
                        </div>
                        
                        <div class="key-actions">
                            <button onclick="useKey(${key.id})" class="btn-key-action btn-use">🔄 Usar</button>
                            <button onclick="renewKey(${key.id})" class="btn-key-action btn-renew">🔄 Renovar</button>
                            <button onclick="revokeKey(${key.id})" class="btn-key-action btn-revoke">🗑️ Revogar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateStats() {
        const element = document.getElementById('keysGenerated');
        if (element) {
            element.textContent = this.getActiveKeys().length;
        }
    }

    exportKeys() {
        const data = {
            exportDate: new Date().toISOString(),
            keys: this.keys
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api-keys-backup-${Date.now()}.json`;
        a.click();
    }
}

const keyManager = new KeyManager();
