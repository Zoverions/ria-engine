/**
 * Wallet Management Module
 * Handles wallet creation, import, export, and key management
 */

class WalletManager {
    constructor() {
        this.currentWallet = null;
        this.isWalletLoaded = false;
        this.initializeEventListeners();
        this.loadStoredWallet();
    }

    initializeEventListeners() {
        // Wallet creation
        document.getElementById('createWalletBtn')?.addEventListener('click', () => {
            this.showCreateWalletModal();
        });

        document.getElementById('confirmCreateWallet')?.addEventListener('click', () => {
            this.createNewWallet();
        });

        // Wallet import
        document.getElementById('importWalletBtn')?.addEventListener('click', () => {
            this.showImportWalletModal();
        });

        document.getElementById('confirmImportWallet')?.addEventListener('click', () => {
            this.importWallet();
        });

        // Wallet export
        document.getElementById('exportWalletBtn')?.addEventListener('click', () => {
            this.exportWallet();
        });

        // Copy functions
        document.getElementById('copyAddressBtn')?.addEventListener('click', () => {
            this.copyToClipboard('publicAddress');
        });

        document.getElementById('copyPrivateKeyBtn')?.addEventListener('click', () => {
            this.copyToClipboard('privateKey');
        });

        // Show/hide private key
        document.getElementById('showPrivateKeyBtn')?.addEventListener('click', () => {
            this.togglePrivateKeyVisibility();
        });

        // Delete wallet
        document.getElementById('deleteWalletBtn')?.addEventListener('click', () => {
            this.deleteWallet();
        });

        // Modal close handlers
        document.querySelectorAll('.modal-close, [data-modal]').forEach(element => {
            element.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal') || 
                              e.target.closest('.modal-close')?.parentElement?.parentElement?.parentElement?.id;
                if (modalId) {
                    this.closeModal(modalId);
                }
            });
        });
    }

    async loadStoredWallet() {
        try {
            const walletData = await window.electronAPI.getStoredData('wallet');
            if (walletData && walletData.address) {
                this.currentWallet = walletData;
                this.isWalletLoaded = true;
                this.displayWalletInfo();
                this.updateBalances();
                console.log('Wallet loaded from storage');
            }
        } catch (error) {
            console.error('Error loading stored wallet:', error);
        }
    }

    showCreateWalletModal() {
        document.getElementById('createWalletModal').classList.add('active');
    }

    showImportWalletModal() {
        document.getElementById('importWalletModal').classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        // Clear form data
        document.getElementById('walletPassword').value = '';
        document.getElementById('importPrivateKey').value = '';
        document.getElementById('importPassword').value = '';
    }

    async createNewWallet() {
        try {
            const password = document.getElementById('walletPassword').value;
            
            // Generate random wallet using ethers.js-like structure
            const wallet = this.generateRandomWallet();
            
            // Encrypt if password provided
            let encryptedWallet = wallet;
            if (password) {
                encryptedWallet = await this.encryptWallet(wallet, password);
            }

            // Store wallet
            await window.electronAPI.setStoredData('wallet', {
                address: wallet.address,
                privateKey: encryptedWallet.privateKey,
                encrypted: !!password,
                created: Date.now()
            });

            this.currentWallet = {
                address: wallet.address,
                privateKey: wallet.privateKey,
                encrypted: false
            };
            
            this.isWalletLoaded = true;
            this.displayWalletInfo();
            this.closeModal('createWalletModal');
            
            // Show success message
            await window.electronAPI.showMessageBox({
                type: 'info',
                title: 'Wallet Created',
                message: 'Your new wallet has been created successfully!',
                detail: 'Make sure to backup your private key securely.'
            });

            console.log('New wallet created:', wallet.address);
            
        } catch (error) {
            console.error('Error creating wallet:', error);
            await window.electronAPI.showMessageBox({
                type: 'error',
                title: 'Error',
                message: 'Failed to create wallet',
                detail: error.message
            });
        }
    }

    async importWallet() {
        try {
            const privateKey = document.getElementById('importPrivateKey').value.trim();
            const password = document.getElementById('importPassword').value;

            if (!privateKey) {
                throw new Error('Private key is required');
            }

            // Validate and create wallet from private key
            const wallet = this.createWalletFromPrivateKey(privateKey);
            
            // Store wallet
            await window.electronAPI.setStoredData('wallet', {
                address: wallet.address,
                privateKey: wallet.privateKey,
                encrypted: false,
                imported: true,
                created: Date.now()
            });

            this.currentWallet = wallet;
            this.isWalletLoaded = true;
            this.displayWalletInfo();
            this.closeModal('importWalletModal');
            
            // Show success message
            await window.electronAPI.showMessageBox({
                type: 'info',
                title: 'Wallet Imported',
                message: 'Your wallet has been imported successfully!',
                detail: `Address: ${wallet.address}`
            });

            console.log('Wallet imported:', wallet.address);
            
        } catch (error) {
            console.error('Error importing wallet:', error);
            await window.electronAPI.showMessageBox({
                type: 'error',
                title: 'Error',
                message: 'Failed to import wallet',
                detail: error.message
            });
        }
    }

    async exportWallet() {
        if (!this.currentWallet) {
            await window.electronAPI.showMessageBox({
                type: 'warning',
                title: 'No Wallet',
                message: 'No wallet to export',
                detail: 'Please create or import a wallet first.'
            });
            return;
        }

        try {
            const result = await window.electronAPI.showSaveDialog({
                title: 'Export Wallet Backup',
                defaultPath: `wallet-backup-${Date.now()}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                const walletBackup = {
                    address: this.currentWallet.address,
                    privateKey: this.currentWallet.privateKey,
                    exported: Date.now(),
                    version: '1.0.0'
                };

                // In a real implementation, you'd write to the file
                console.log('Wallet backup created:', result.filePath);
                
                await window.electronAPI.showMessageBox({
                    type: 'info',
                    title: 'Export Complete',
                    message: 'Wallet backup created successfully!',
                    detail: `Saved to: ${result.filePath}`
                });
            }
        } catch (error) {
            console.error('Error exporting wallet:', error);
            await window.electronAPI.showMessageBox({
                type: 'error',
                title: 'Export Failed',
                message: 'Failed to export wallet',
                detail: error.message
            });
        }
    }

    async deleteWallet() {
        const result = await window.electronAPI.showMessageBox({
            type: 'warning',
            title: 'Delete Wallet',
            message: 'Are you sure you want to delete this wallet?',
            detail: 'This action cannot be undone. Make sure you have backed up your private key!',
            buttons: ['Cancel', 'Delete'],
            defaultId: 0,
            cancelId: 0
        });

        if (result.response === 1) {
            try {
                await window.electronAPI.deleteStoredData('wallet');
                this.currentWallet = null;
                this.isWalletLoaded = false;
                this.hideWalletInfo();
                
                await window.electronAPI.showMessageBox({
                    type: 'info',
                    title: 'Wallet Deleted',
                    message: 'Wallet has been deleted successfully.'
                });
                
                console.log('Wallet deleted');
            } catch (error) {
                console.error('Error deleting wallet:', error);
            }
        }
    }

    displayWalletInfo() {
        if (!this.currentWallet) return;

        const walletInfo = document.getElementById('walletInfo');
        const publicAddress = document.getElementById('publicAddress');
        const privateKey = document.getElementById('privateKey');

        if (walletInfo && publicAddress && privateKey) {
            publicAddress.value = this.currentWallet.address;
            privateKey.value = this.currentWallet.privateKey;
            walletInfo.style.display = 'block';
        }

        // Update portfolio value in header
        this.updatePortfolioDisplay();
    }

    hideWalletInfo() {
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo) {
            walletInfo.style.display = 'none';
        }

        // Clear balance displays
        this.updateBalanceDisplay('usdcBalance', '0.00');
        this.updateBalanceDisplay('ethBalance', '0.0000');
        this.updatePortfolioDisplay(0);
    }

    async copyToClipboard(elementId) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                await navigator.clipboard.writeText(element.value);
                
                // Visual feedback
                const originalBg = element.style.backgroundColor;
                element.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    element.style.backgroundColor = originalBg;
                }, 200);
                
                console.log('Copied to clipboard:', elementId);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }

    togglePrivateKeyVisibility() {
        const privateKey = document.getElementById('privateKey');
        const showBtn = document.getElementById('showPrivateKeyBtn');
        
        if (privateKey && showBtn) {
            const isPassword = privateKey.type === 'password';
            privateKey.type = isPassword ? 'text' : 'password';
            showBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        }
    }

    async updateBalances() {
        if (!this.currentWallet) return;

        try {
            // In a real implementation, you'd fetch balances from blockchain
            // For demo purposes, using mock data
            const mockBalances = {
                USDC: 100000.00,
                ETH: 2.5
            };

            this.updateBalanceDisplay('usdcBalance', mockBalances.USDC.toFixed(2));
            this.updateBalanceDisplay('ethBalance', mockBalances.ETH.toFixed(4));
            
            // Calculate portfolio value
            const ethPrice = 2500; // Mock ETH price
            const portfolioValue = mockBalances.USDC + (mockBalances.ETH * ethPrice);
            this.updatePortfolioDisplay(portfolioValue);
            
        } catch (error) {
            console.error('Error updating balances:', error);
        }
    }

    updateBalanceDisplay(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updatePortfolioDisplay(value = 0) {
        const portfolioValue = document.getElementById('portfolioValue');
        if (portfolioValue) {
            portfolioValue.textContent = `$${value.toFixed(2)}`;
        }

        // Update dashboard values
        this.updateBalanceDisplay('totalValue', `$${value.toFixed(2)}`);
        this.updateBalanceDisplay('availableBalance', `$${(value * 0.8).toFixed(2)}`);
    }

    // Utility functions for wallet generation (simplified)
    generateRandomWallet() {
        // In a real implementation, use proper cryptographic libraries
        const privateKey = this.generateRandomHex(64);
        const address = this.generateAddressFromPrivateKey(privateKey);
        
        return {
            address: address,
            privateKey: privateKey
        };
    }

    createWalletFromPrivateKey(privateKey) {
        // Validate private key format
        if (!privateKey.startsWith('0x')) {
            privateKey = '0x' + privateKey;
        }
        
        if (privateKey.length !== 66) {
            throw new Error('Invalid private key format');
        }
        
        const address = this.generateAddressFromPrivateKey(privateKey);
        
        return {
            address: address,
            privateKey: privateKey
        };
    }

    generateRandomHex(length) {
        const chars = '0123456789abcdef';
        let result = '0x';
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    generateAddressFromPrivateKey(privateKey) {
        // Simplified address generation for demo
        // In reality, use proper elliptic curve cryptography
        const hash = this.simpleHash(privateKey);
        return '0x' + hash.substring(0, 40);
    }

    simpleHash(input) {
        // Very simple hash function for demo purposes
        let hash = '';
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash + char) & 0xffffffff;
        }
        return Math.abs(hash).toString(16).padStart(40, '0');
    }

    async encryptWallet(wallet, password) {
        // Simplified encryption for demo
        // In reality, use proper encryption like AES
        const encrypted = btoa(JSON.stringify(wallet) + password);
        return {
            ...wallet,
            privateKey: encrypted
        };
    }

    // Public API for other modules
    getCurrentWallet() {
        return this.currentWallet;
    }

    isWalletAvailable() {
        return this.isWalletLoaded && this.currentWallet !== null;
    }

    getWalletAddress() {
        return this.currentWallet?.address || null;
    }
}

// Initialize wallet manager when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
    console.log('Wallet Manager initialized');
});