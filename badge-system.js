// ============================================
// NOVA GALICHKA TIZIMI (badge-system.js)
// INDEX.HTML UCHUN MAXSUS MOSLANGAN
// Muallif: Mirfayz Nova Creator
// Versiya: 2.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('👑 NOVA Galichka tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        MIRFAYZ_PHONE: '+998938138110',
        MIRFAYZ_EMAIL: 'mirfayzfarxodov1@gmail.com',
        BADGE_PRICE: 1,
        BADGE_PRICE_CURRENCY: 'USD',
        STORAGE_KEY: 'nova_badge_state'
    };
    
    // ============================================
    // GALICHKA TURLARI
    // ============================================
    const BADGE_TYPES = {
        FLAME: {
            id: 'flame',
            name: 'Olovli galichka',
            icon: '🔥',
            animation: 'flameAnimation',
            color: '#ff4500',
            price: 1
        },
        ICE: {
            id: 'ice',
            name: 'Muzli galichka',
            icon: '❄️',
            animation: 'iceAnimation',
            color: '#00bfff',
            price: 1
        },
        LIGHTNING: {
            id: 'lightning',
            name: 'Chaqmoqli galichka',
            icon: '⚡',
            animation: 'lightningAnimation',
            color: '#ffff00',
            price: 1
        },
        RAINBOW: {
            id: 'rainbow',
            name: 'Rainbow galichka',
            icon: '🌈',
            animation: 'rainbowAnimation',
            color: 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)',
            price: 5
        }
    };
    
    // ============================================
    // STATE
    // ============================================
    let badgeState = {
        currentUser: {
            id: null,
            name: null,
            hasBadge: false,
            badgeType: null,
            badgeExpiry: null
        },
        pendingVerifications: [],
        activeBadges: []
    };
    
    // ============================================
    // ANIMATSIYALARNI INYEKSIYA QILISH
    // ============================================
    const injectAnimations = () => {
        if (document.getElementById('nova-badge-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'nova-badge-animations';
        style.textContent = `
            @keyframes flameAnimation {
                0% { text-shadow: 0 0 5px #ff0000, 0 0 10px #ff4500; transform: scale(1); }
                50% { text-shadow: 0 0 20px #ff0000, 0 0 35px #ff3300; transform: scale(1.15); }
                100% { text-shadow: 0 0 5px #ff0000, 0 0 10px #ff4500; transform: scale(1); }
            }
            @keyframes iceAnimation {
                0% { text-shadow: 0 0 5px #00bfff; transform: rotate(0deg); }
                50% { text-shadow: 0 0 20px #00ffff; transform: rotate(5deg); }
                100% { text-shadow: 0 0 5px #00bfff; transform: rotate(0deg); }
            }
            @keyframes lightningAnimation {
                0% { text-shadow: 0 0 5px #ffff00; opacity: 1; }
                20% { text-shadow: 0 0 30px #ffff00; opacity: 0.8; }
                100% { text-shadow: 0 0 5px #ffff00; opacity: 1; }
            }
            @keyframes rainbowAnimation {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            .nova-badge {
                display: inline-block;
                font-size: 18px;
                font-weight: bold;
                padding: 2px 8px;
                border-radius: 20px;
                margin-left: 8px;
            }
            .nova-badge.flame { animation: flameAnimation 1s infinite; background: #ff000020; border: 1px solid #ff4500; }
            .nova-badge.ice { animation: iceAnimation 1.5s infinite; background: #00bfff20; border: 1px solid #00bfff; }
            .nova-badge.lightning { animation: lightningAnimation 0.8s infinite; background: #ffff0020; border: 1px solid #ffff00; }
            .nova-badge.rainbow { animation: rainbowAnimation 2s infinite; background: linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet); color: white; border: none; }
            
            .nova-verification-panel {
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 350px;
                background: #0a0a0a;
                border: 2px solid #ff0000;
                border-radius: 16px;
                z-index: 10001;
                display: none;
                max-height: 500px;
                overflow-y: auto;
            }
            .nova-verification-header {
                background: #ff0000;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                cursor: pointer;
            }
            .nova-verification-item {
                padding: 15px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .nova-verify-btn {
                background: #00cc00;
                color: white;
                border: none;
                padding: 5px 15px;
                border-radius: 20px;
                cursor: pointer;
                margin: 0 5px;
            }
            .nova-reject-btn { background: #ff0000; }
            .nova-toast {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: #1a1a1a;
                border: 1px solid #ff0000;
                color: white;
                padding: 12px 24px;
                border-radius: 40px;
                z-index: 10002;
                display: none;
                animation: slideUp 0.3s ease;
            }
            @keyframes slideUp {
                from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    };
    
    // ============================================
    // TOAST XABAR
    // ============================================
    const showToast = (message, duration = 3000) => {
        let toast = document.querySelector('.nova-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'nova-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    };
    
    // ============================================
    // YUKLASH VA SAQLASH
    // ============================================
    const loadBadgeState = () => {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                badgeState = { ...badgeState, ...parsed };
            } catch(e) {}
        }
    };
    
    const saveBadgeState = () => {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(badgeState));
    };
    
    // ============================================
    // CHEKNI MIRFAYZGA YUBORISH
    // ============================================
    const sendChequeToMirfayz = (paymentData) => {
        const chequeInfo = {
            id: 'chq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: paymentData.userId,
            userName: paymentData.userName,
            userEmail: paymentData.userEmail,
            userPhone: paymentData.userPhone,
            badgeType: paymentData.badgeType,
            amount: CONFIG.BADGE_PRICE,
            timestamp: new Date().toISOString()
        };
        
        badgeState.pendingVerifications.push({ ...chequeInfo, status: 'pending' });
        saveBadgeState();
        
        // Console log (real appda SMS/email yuboriladi)
        console.log(`
╔═══════════════════════════════════════╗
║ 💰 CHEK MIRFAYZGA YUBORILDI!          ║
╠═══════════════════════════════════════╣
║ 📞 Telefon: ${CONFIG.MIRFAYZ_PHONE}
║ 📧 Email: ${CONFIG.MIRFAYZ_EMAIL}
║ 👤 Foydalanuvchi: ${paymentData.userName}
║ 🎖️ Galichka: ${paymentData.badgeType}
║ 💵 Summa: ${CONFIG.BADGE_PRICE}$
║ ⏰ Vaqt: ${new Date().toLocaleString()}
╚═══════════════════════════════════════╝
        `);
        
        updateVerificationPanel();
        showToast(`💰 Chek Mirfayzga yuborildi! Tasdiqlanishi kutilmoqda...`);
        
        return chequeInfo;
    };
    
    // ============================================
    // VERIFICATION PANEL (MIRFAYZ UCHUN)
    // ============================================
    const createVerificationPanel = () => {
        if (document.getElementById('novaVerificationPanel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'novaVerificationPanel';
        panel.className = 'nova-verification-panel';
        panel.innerHTML = `
            <div class="nova-verification-header" id="toggleVerificationPanel">
                👑 Mirfayz Verifikatsiya Paneli <span id="pendingCount">0</span>
            </div>
            <div id="verificationList" style="max-height: 400px; overflow-y: auto;"></div>
        `;
        document.body.appendChild(panel);
        
        let isOpen = true;
        const listDiv = document.getElementById('verificationList');
        document.getElementById('toggleVerificationPanel')?.addEventListener('click', () => {
            isOpen = !isOpen;
            if (listDiv) listDiv.style.display = isOpen ? 'block' : 'none';
        });
        
        return panel;
    };
    
    const updateVerificationPanel = () => {
        const listDiv = document.getElementById('verificationList');
        const pendingCountSpan = document.getElementById('pendingCount');
        if (!listDiv) return;
        
        const pending = badgeState.pendingVerifications.filter(v => v.status === 'pending');
        if (pendingCountSpan) pendingCountSpan.textContent = pending.length;
        
        if (pending.length === 0) {
            listDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">Yangi so‘rovlar yo‘q</div>';
            return;
        }
        
        listDiv.innerHTML = pending.map(v => `
            <div class="nova-verification-item" data-id="${v.id}">
                <div style="flex:1;">
                    <div><strong>${escapeHtml(v.userName)}</strong></div>
                    <div style="font-size: 11px;">${v.badgeType} | ${v.amount}$</div>
                    <div style="font-size: 10px; color: #888;">${new Date(v.timestamp).toLocaleString()}</div>
                </div>
                <div>
                    <button class="nova-verify-btn" data-id="${v.id}" data-action="approve">✅</button>
                    <button class="nova-verify-btn nova-reject-btn" data-id="${v.id}" data-action="reject">❌</button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.nova-verify-btn').forEach(btn => {
            btn.removeEventListener('click', handleVerify);
            btn.addEventListener('click', handleVerify);
        });
    };
    
    const handleVerify = (e) => {
        const btn = e.currentTarget;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        
        if (action === 'approve') {
            approveBadge(id);
        } else if (action === 'reject') {
            rejectBadge(id);
        }
    };
    
    const approveBadge = (id) => {
        const verification = badgeState.pendingVerifications.find(v => v.id === id);
        if (!verification) return;
        
        verification.status = 'approved';
        
        // Assign badge to user
        badgeState.activeBadges.push({
            userId: verification.userId,
            userName: verification.userName,
            badgeType: verification.badgeType,
            assignedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
        // If current user, update state
        if (badgeState.currentUser.id === verification.userId) {
            badgeState.currentUser.hasBadge = true;
            badgeState.currentUser.badgeType = verification.badgeType;
            badgeState.currentUser.badgeExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            updateBadgeOnPage();
        }
        
        // Remove from pending
        badgeState.pendingVerifications = badgeState.pendingVerifications.filter(v => v.id !== id);
        saveBadgeState();
        updateVerificationPanel();
        showToast(`✅ ${verification.userName} ga ${verification.badgeType} galichka berildi!`);
    };
    
    const rejectBadge = (id) => {
        const verification = badgeState.pendingVerifications.find(v => v.id === id);
        if (!verification) return;
        
        badgeState.pendingVerifications = badgeState.pendingVerifications.filter(v => v.id !== id);
        saveBadgeState();
        updateVerificationPanel();
        showToast(`❌ ${verification.userName} ning galichkasi rad etildi. Pul qaytariladi.`);
    };
    
    // ============================================
    // BADGE DISPLAY
    // ============================================
    const updateBadgeOnPage = () => {
        // Update current user's badge in sidebar
        const creatorNameEl = document.getElementById('profileName');
        if (creatorNameEl && badgeState.currentUser.hasBadge && badgeState.currentUser.badgeType) {
            const existingBadge = creatorNameEl.querySelector('.nova-badge');
            if (!existingBadge) {
                const badgeConfig = BADGE_TYPES[badgeState.currentUser.badgeType.toUpperCase()] || BADGE_TYPES.FLAME;
                const badgeSpan = document.createElement('span');
                badgeSpan.className = `nova-badge ${badgeState.currentUser.badgeType}`;
                badgeSpan.innerHTML = `${badgeConfig.icon} ✓`;
                creatorNameEl.appendChild(badgeSpan);
            }
        }
        
        // Update badge preview in right panel
        const badgePreview = document.getElementById('badgePreviewDisplay');
        if (badgePreview && badgeState.currentUser.hasBadge && badgeState.currentUser.badgeType) {
            const badgeConfig = BADGE_TYPES[badgeState.currentUser.badgeType.toUpperCase()] || BADGE_TYPES.FLAME;
            badgePreview.innerHTML = `<div style="font-size:48px; animation: ${badgeState.currentUser.badgeType === 'flame' ? 'flameAnimation 1s infinite' : badgeState.currentUser.badgeType === 'ice' ? 'iceAnimation 1.5s infinite' : badgeState.currentUser.badgeType === 'lightning' ? 'lightningAnimation 0.8s infinite' : 'rainbowAnimation 2s infinite'}">${badgeConfig.icon} ✓</div>`;
        }
        
        // Update badge on posts
        document.querySelectorAll('.post-user-info h4').forEach(el => {
            const userName = el.textContent.trim();
            const activeBadge = badgeState.activeBadges.find(b => b.userName === userName);
            if (activeBadge && !el.querySelector('.nova-badge')) {
                const badgeConfig = BADGE_TYPES[activeBadge.badgeType.toUpperCase()] || BADGE_TYPES.FLAME;
                const badgeSpan = document.createElement('span');
                badgeSpan.className = `nova-badge ${activeBadge.badgeType}`;
                badgeSpan.innerHTML = `${badgeConfig.icon} ✓`;
                el.appendChild(badgeSpan);
            }
        });
    };
    
    // ============================================
    // PAYMENT MODAL (INDEX GA MOS)
    // ============================================
    const setupPaymentModal = () => {
        // Payment modal already exists in index.html, just hook up events
        const buyButtons = document.querySelectorAll('.premium-btn, .buy-badge-btn, #buyBadgeBtn, #buyBadgeSidebarBtn, #buyBadgeRightBtn');
        const paymentModal = document.getElementById('paymentModal');
        const closePaymentModal = document.getElementById('closePaymentModal');
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        
        if (!paymentModal) return;
        
        buyButtons.forEach(btn => {
            btn.removeEventListener('click', openPaymentHandler);
            btn.addEventListener('click', openPaymentHandler);
        });
        
        function openPaymentHandler(e) {
            e.preventDefault();
            paymentModal.style.display = 'flex';
        }
        
        if (closePaymentModal) {
            closePaymentModal.addEventListener('click', () => {
                paymentModal.style.display = 'none';
            });
        }
        
        if (confirmBtn) {
            confirmBtn.removeEventListener('click', paymentHandler);
            confirmBtn.addEventListener('click', paymentHandler);
        }
        
        function paymentHandler() {
            const contact = document.getElementById('paymentContact')?.value;
            if (!contact) {
                showToast('Iltimos, telefon raqam yoki email kiriting!');
                return;
            }
            
            // Get current user from index.html state
            let userName = 'NovaUser';
            let userId = 'user_' + Date.now();
            
            // Try to get from localStorage (index.html saves user)
            const savedUser = localStorage.getItem('nova_user');
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    userName = user.name || userName;
                    userId = user.id || userId;
                } catch(e) {}
            }
            
            // Update badge state
            badgeState.currentUser.id = userId;
            badgeState.currentUser.name = userName;
            saveBadgeState();
            
            const paymentData = {
                userId: userId,
                userName: userName,
                userEmail: contact,
                userPhone: contact,
                badgeType: 'flame' // Default, can be selected
            };
            
            sendChequeToMirfayz(paymentData);
            paymentModal.style.display = 'none';
            document.getElementById('paymentContact').value = '';
            
            // Show verify modal for Mirfayz demo
            const verifyModal = document.getElementById('verifyModal');
            if (verifyModal) {
                document.getElementById('chequeUserName').innerText = userName;
                verifyModal.style.display = 'flex';
            }
        }
    };
    
    const setupVerifyModal = () => {
        const verifyModal = document.getElementById('verifyModal');
        const closeVerifyModal = document.getElementById('closeVerifyModal');
        const approveBtn = document.getElementById('approvePaymentBtn');
        const rejectBtn = document.getElementById('rejectPaymentBtn');
        
        if (!verifyModal) return;
        
        if (closeVerifyModal) {
            closeVerifyModal.addEventListener('click', () => {
                verifyModal.style.display = 'none';
            });
        }
        
        if (approveBtn) {
            approveBtn.removeEventListener('click', approveHandler);
            approveBtn.addEventListener('click', approveHandler);
        }
        
        if (rejectBtn) {
            rejectBtn.removeEventListener('click', rejectHandler);
            rejectBtn.addEventListener('click', rejectHandler);
        }
        
        function approveHandler() {
            // Find pending verification and approve
            const pending = badgeState.pendingVerifications.find(v => v.status === 'pending');
            if (pending) {
                approveBadge(pending.id);
            }
            verifyModal.style.display = 'none';
        }
        
        function rejectHandler() {
            const pending = badgeState.pendingVerifications.find(v => v.status === 'pending');
            if (pending) {
                rejectBadge(pending.id);
            }
            verifyModal.style.display = 'none';
        }
    };
    
    // ============================================
    // MIRFAYZ MODENI YOQISH
    // ============================================
    const enableMirfayzMode = () => {
        const isMirfayz = localStorage.getItem('nova_is_mirfayz') === 'true';
        if (isMirfayz) {
            const panel = document.getElementById('novaVerificationPanel');
            if (panel) panel.style.display = 'block';
            badgeState.currentUser.isMirfayz = true;
            showToast('👑 Mirfayz rejimi yoqildi! Siz galichkalarni tasdiqlaysiz.');
        }
    };
    
    // ============================================
    // MUTATION OBSERVER (YANGI POSTLAR UCHUN)
    // ============================================
    const observeForBadges = () => {
        const observer = new MutationObserver(() => {
            updateBadgeOnPage();
            setupPaymentModal();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };
    
    // ============================================
    // ESCAPE HTML
    // ============================================
    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    // ============================================
    // INIT
    // ============================================
    const init = () => {
        console.log('🎖️ Nova Badge System initializing...');
        
        injectAnimations();
        loadBadgeState();
        createVerificationPanel();
        setupPaymentModal();
        setupVerifyModal();
        updateVerificationPanel();
        updateBadgeOnPage();
        observeForBadges();
        enableMirfayzMode();
        
        console.log('✅ Nova Badge System ready!');
    };
    
    // ============================================
    // GLOBAL EXPORT
    // ============================================
    window.NovaBadge = {
        init: init,
        approveBadge: approveBadge,
        rejectBadge: rejectBadge,
        enableMirfayzMode: () => {
            localStorage.setItem('nova_is_mirfayz', 'true');
            enableMirfayzMode();
        }
    };
    
    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
