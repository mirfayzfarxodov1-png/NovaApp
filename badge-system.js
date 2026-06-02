// ============================================
// NOVA GALICHKA TIZIMI (badge-system.js)
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0 ULTRA
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
        ANIMATION_INTERVAL: 1000,
        VERIFICATION_TIMEOUT: 86400000 // 24 soat
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
            price: 1,
            rarity: 'common'
        },
        ICE: {
            id: 'ice',
            name: 'Muzli galichka',
            icon: '❄️',
            animation: 'iceAnimation',
            color: '#00bfff',
            price: 1,
            rarity: 'common'
        },
        LIGHTNING: {
            id: 'lightning',
            name: 'Chaqmoqli galichka',
            icon: '⚡',
            animation: 'lightningAnimation',
            color: '#ffff00',
            price: 1,
            rarity: 'rare'
        },
        RAINBOW: {
            id: 'rainbow',
            name: 'Rainbow galichka',
            icon: '🌈',
            animation: 'rainbowAnimation',
            color: 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)',
            price: 5,
            rarity: 'epic'
        },
        NOVA_CROWN: {
            id: 'nova_crown',
            name: 'NOVA Crown',
            icon: '👑',
            animation: 'crownAnimation',
            color: '#ffd700',
            price: 10,
            rarity: 'legendary',
            creatorOnly: true
        }
    };
    
    // ============================================
    // GLOBAL STATE
    // ============================================
    let NovaBadgeState = {
        currentUser: {
            id: null,
            name: null,
            email: null,
            phone: null,
            hasBadge: false,
            badgeType: null,
            badgeExpiry: null,
            isCreator: false,
            isMirfayz: false
        },
        pendingVerifications: [],
        activeBadges: [],
        paymentHistory: [],
        animationInterval: null
    };
    
    // ============================================
    // ANIMATSIYALAR (CSS-in-JS)
    // ============================================
    const injectAnimations = () => {
        const style = document.createElement('style');
        style.id = 'nova-badge-animations';
        style.textContent = `
            /* Flame animation */
            @keyframes flameAnimation {
                0% {
                    text-shadow: 0 0 5px #ff0000, 0 0 10px #ff4500;
                    transform: scale(1);
                }
                25% {
                    text-shadow: 0 0 15px #ff4500, 0 0 25px #ff6600;
                    transform: scale(1.1);
                }
                50% {
                    text-shadow: 0 0 20px #ff0000, 0 0 35px #ff3300;
                    transform: scale(1.15);
                }
                75% {
                    text-shadow: 0 0 15px #ff6600, 0 0 25px #ff9900;
                    transform: scale(1.1);
                }
                100% {
                    text-shadow: 0 0 5px #ff0000, 0 0 10px #ff4500;
                    transform: scale(1);
                }
            }
            
            /* Ice animation */
            @keyframes iceAnimation {
                0% {
                    text-shadow: 0 0 5px #00bfff, 0 0 10px #87ceeb;
                    transform: rotate(0deg);
                }
                25% {
                    text-shadow: 0 0 15px #00ffff, 0 0 25px #87ceeb;
                    transform: rotate(5deg);
                }
                50% {
                    text-shadow: 0 0 20px #00bfff, 0 0 35px #00ffff;
                    transform: rotate(-5deg);
                }
                75% {
                    text-shadow: 0 0 15px #87ceeb, 0 0 25px #00bfff;
                    transform: rotate(3deg);
                }
                100% {
                    text-shadow: 0 0 5px #00bfff, 0 0 10px #87ceeb;
                    transform: rotate(0deg);
                }
            }
            
            /* Lightning animation */
            @keyframes lightningAnimation {
                0% {
                    text-shadow: 0 0 5px #ffff00, 0 0 10px #ffcc00;
                    opacity: 1;
                }
                10% {
                    text-shadow: 0 0 20px #ffff00, 0 0 40px #ffaa00;
                    opacity: 1;
                }
                20% {
                    text-shadow: 0 0 5px #ffff00, 0 0 10px #ffcc00;
                    opacity: 0.8;
                }
                30% {
                    text-shadow: 0 0 30px #ffff00, 0 0 50px #ffaa00;
                    opacity: 1;
                }
                100% {
                    text-shadow: 0 0 5px #ffff00, 0 0 10px #ffcc00;
                    opacity: 1;
                }
            }
            
            /* Rainbow animation */
            @keyframes rainbowAnimation {
                0% {
                    filter: hue-rotate(0deg);
                    transform: scale(1);
                }
                25% {
                    filter: hue-rotate(90deg);
                    transform: scale(1.1);
                }
                50% {
                    filter: hue-rotate(180deg);
                    transform: scale(1.15);
                }
                75% {
                    filter: hue-rotate(270deg);
                    transform: scale(1.1);
                }
                100% {
                    filter: hue-rotate(360deg);
                    transform: scale(1);
                }
            }
            
            /* Crown animation */
            @keyframes crownAnimation {
                0% {
                    transform: rotate(0deg) scale(1);
                    text-shadow: 0 0 5px #ffd700;
                }
                25% {
                    transform: rotate(10deg) scale(1.2);
                    text-shadow: 0 0 15px #ffd700, 0 0 25px #ffaa00;
                }
                50% {
                    transform: rotate(-10deg) scale(1.3);
                    text-shadow: 0 0 20px #ffd700, 0 0 35px #ffcc00;
                }
                75% {
                    transform: rotate(5deg) scale(1.2);
                    text-shadow: 0 0 15px #ffaa00, 0 0 25px #ffd700;
                }
                100% {
                    transform: rotate(0deg) scale(1);
                    text-shadow: 0 0 5px #ffd700;
                }
            }
            
            /* Badge container styles */
            .nova-badge-container {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-left: 8px;
                cursor: pointer;
                position: relative;
            }
            
            .nova-badge {
                display: inline-block;
                font-size: 18px;
                font-weight: bold;
                background: rgba(0,0,0,0.7);
                padding: 2px 8px;
                border-radius: 20px;
                transition: all 0.3s ease;
            }
            
            .nova-badge.flame {
                animation: flameAnimation 1s infinite;
                background: linear-gradient(135deg, #ff000020, #ff450020);
                border: 1px solid #ff4500;
            }
            
            .nova-badge.ice {
                animation: iceAnimation 1.5s infinite;
                background: linear-gradient(135deg, #00bfff20, #87ceeb20);
                border: 1px solid #00bfff;
            }
            
            .nova-badge.lightning {
                animation: lightningAnimation 0.8s infinite;
                background: linear-gradient(135deg, #ffff0020, #ffcc0020);
                border: 1px solid #ffff00;
            }
            
            .nova-badge.rainbow {
                animation: rainbowAnimation 2s infinite;
                background: linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet);
                background-size: 200% 200%;
                border: none;
                color: white;
                font-weight: bold;
            }
            
            .nova-badge.crown {
                animation: crownAnimation 1.5s infinite;
                background: linear-gradient(135deg, #ffd70020, #ffaa0020);
                border: 2px solid #ffd700;
                font-size: 22px;
            }
            
            /* Tooltip */
            .nova-badge-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #1a1a1a;
                border: 1px solid #ff0000;
                color: white;
                padding: 5px 10px;
                border-radius: 8px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1000;
                display: none;
                margin-bottom: 5px;
            }
            
            .nova-badge-container:hover .nova-badge-tooltip {
                display: block;
            }
            
            /* Payment Modal Styles */
            .nova-payment-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }
            
            .nova-payment-content {
                background: linear-gradient(135deg, #0a0a0a, #1a0000);
                border: 2px solid #ff0000;
                border-radius: 24px;
                max-width: 500px;
                width: 90%;
                padding: 30px;
                position: relative;
            }
            
            .nova-badge-selector {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin: 20px 0;
                flex-wrap: wrap;
            }
            
            .nova-badge-option {
                text-align: center;
                padding: 15px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 16px;
                cursor: pointer;
                transition: all 0.3s;
                min-width: 100px;
            }
            
            .nova-badge-option.selected {
                border-color: #ff0000;
                background: #ff000020;
                transform: scale(1.05);
            }
            
            .nova-badge-option .badge-icon {
                font-size: 40px;
                margin-bottom: 10px;
            }
            
            .nova-badge-option .badge-name {
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .nova-badge-option .badge-price {
                font-size: 12px;
                color: #ff0000;
            }
            
            .nova-payment-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-top: 20px;
            }
            
            .nova-payment-form input,
            .nova-payment-form select {
                background: #1a1a1a;
                border: 1px solid #ff0000;
                padding: 12px;
                border-radius: 8px;
                color: white;
            }
            
            .nova-payment-btn {
                background: #ff0000;
                color: white;
                border: none;
                padding: 14px;
                border-radius: 30px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .nova-payment-btn:hover {
                transform: scale(1.02);
            }
            
            /* Verification Panel (Mirfayz uchun) */
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
            
            .nova-reject-btn {
                background: #ff0000;
            }
            
            /* Toast notification */
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
                from {
                    transform: translateX(-50%) translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
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
    // CHEKNI MIRFAYZGA YUBORISH (SMS + EMAIL)
    // ============================================
    const sendChequeToMirfayz = async (paymentData) => {
        const chequeInfo = {
            userId: paymentData.userId,
            userName: paymentData.userName,
            userEmail: paymentData.userEmail,
            userPhone: paymentData.userPhone,
            badgeType: paymentData.badgeType,
            amount: CONFIG.BADGE_PRICE,
            currency: CONFIG.BADGE_PRICE_CURRENCY,
            timestamp: new Date().toISOString(),
            transactionId: 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8)
        };
        
        // Save to pending verifications
        NovaBadgeState.pendingVerifications.push({
            ...chequeInfo,
            status: 'pending'
        });
        
        // Simulate SMS to Mirfayz phone (in real app, this would be an API call)
        console.log(`
        ═══════════════════════════════════════
        📱 CHEK YUBORILDI!
        ───────────────────────────────────────
        📞 Mirfayz telefon: ${CONFIG.MIRFAYZ_PHONE}
        📧 Mirfayz email: ${CONFIG.MIRFAYZ_EMAIL}
        ───────────────────────────────────────
        💳 Transaction ID: ${chequeInfo.transactionId}
        👤 Foydalanuvchi: ${chequeInfo.userName}
        🎖️ Galichka turi: ${chequeInfo.badgeType}
        💰 Summa: ${chequeInfo.amount} ${chequeInfo.currency}
        ⏰ Vaqt: ${chequeInfo.timestamp}
        ═══════════════════════════════════════
        `);
        
        // Show notification to Mirfayz (if verification panel is open)
        updateVerificationPanel();
        
        // Also show a visual notification
        if (typeof showToast === 'function') {
            showToast(`💰 Chek yuborildi! Mirfayz tasdiqlashi kutilmoqda...`);
        }
        
        return chequeInfo;
    };
    
    // ============================================
    // VERIFICATION PANEL (MIRFAYZ UCHUN)
    // ============================================
    const createVerificationPanel = () => {
        const panel = document.createElement('div');
        panel.className = 'nova-verification-panel';
        panel.id = 'novaVerificationPanel';
        panel.innerHTML = `
            <div class="nova-verification-header" id="toggleVerificationPanel">
                👑 Mirfayz Verifikatsiya Paneli 
                <span style="float:right;" id="pendingCount">0</span>
            </div>
            <div id="verificationList" style="max-height: 400px; overflow-y: auto;"></div>
        `;
        document.body.appendChild(panel);
        
        // Toggle panel visibility
        const toggleBtn = document.getElementById('toggleVerificationPanel');
        const listDiv = document.getElementById('verificationList');
        let isOpen = true;
        toggleBtn.addEventListener('click', () => {
            isOpen = !isOpen;
            listDiv.style.display = isOpen ? 'block' : 'none';
        });
        
        return panel;
    };
    
    const updateVerificationPanel = () => {
        const listDiv = document.getElementById('verificationList');
        const pendingCountSpan = document.getElementById('pendingCount');
        
        if (!listDiv) return;
        
        const pending = NovaBadgeState.pendingVerifications.filter(v => v.status === 'pending');
        if (pendingCountSpan) pendingCountSpan.textContent = pending.length;
        
        if (pending.length === 0) {
            listDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">Yangi so‘rovlar yo‘q</div>';
            return;
        }
        
        listDiv.innerHTML = pending.map(v => `
            <div class="nova-verification-item" data-txn="${v.transactionId}">
                <div style="flex:1;">
                    <div><strong>${v.userName}</strong></div>
                    <div style="font-size: 11px; color: #888;">${v.badgeType} | ${v.amount}$</div>
                    <div style="font-size: 10px; color: #555;">${new Date(v.timestamp).toLocaleString()}</div>
                </div>
                <div>
                    <button class="nova-verify-btn" data-txn="${v.transactionId}" data-action="approve">✅</button>
                    <button class="nova-verify-btn nova-reject-btn" data-txn="${v.transactionId}" data-action="reject">❌</button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for approve/reject
        document.querySelectorAll('.nova-verify-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const txnId = btn.dataset.txn;
                const action = btn.dataset.action;
                
                if (action === 'approve') {
                    approveBadge(txnId);
                } else if (action === 'reject') {
                    rejectBadge(txnId);
                }
            });
        });
    };
    
    // ============================================
    // APPROVE / REJECT BADGE (MIRFAYZ)
    // ============================================
    const approveBadge = (transactionId) => {
        const verification = NovaBadgeState.pendingVerifications.find(v => v.transactionId === transactionId);
        if (!verification) return;
        
        verification.status = 'approved';
        
        // Assign badge to user
        const badgeType = verification.badgeType;
        const badgeConfig = Object.values(BADGE_TYPES).find(b => b.id === badgeType);
        
        if (badgeConfig) {
            // In real app, save to database
            NovaBadgeState.activeBadges.push({
                userId: verification.userId,
                userName: verification.userName,
                badgeType: badgeType,
                assignedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            });
            
            // If current user, update state
            if (NovaBadgeState.currentUser.id === verification.userId) {
                NovaBadgeState.currentUser.hasBadge = true;
                NovaBadgeState.currentUser.badgeType = badgeType;
                NovaBadgeState.currentUser.badgeExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                updateBadgeDisplay();
            }
        }
        
        // Remove from pending
        NovaBadgeState.pendingVerifications = NovaBadgeState.pendingVerifications.filter(v => v.transactionId !== transactionId);
        
        updateVerificationPanel();
        showToast(`✅ ${verification.userName} ga ${verification.badgeType} galichka berildi!`);
        
        // Send notification to user (in real app)
        console.log(`🎖️ Galichka tasdiqlandi! User: ${verification.userName}, Badge: ${verification.badgeType}`);
    };
    
    const rejectBadge = (transactionId) => {
        const verification = NovaBadgeState.pendingVerifications.find(v => v.transactionId === transactionId);
        if (!verification) return;
        
        verification.status = 'rejected';
        
        // Remove from pending
        NovaBadgeState.pendingVerifications = NovaBadgeState.pendingVerifications.filter(v => v.transactionId !== transactionId);
        
        updateVerificationPanel();
        showToast(`❌ ${verification.userName} ning galichkasi rad etildi. Pul qaytariladi.`);
        
        console.log(`❌ Galichka rad etildi: ${verification.userName}`);
    };
    
    // ============================================
    // BADGE DISPLAY UPDATE
    // ============================================
    const updateBadgeDisplay = () => {
        // Find all elements that should show badge
        const badgeContainers = document.querySelectorAll('[data-badge-container]');
        const userNames = document.querySelectorAll('.creator-details h4, .post-user-info h4, [data-user-name]');
        
        userNames.forEach(el => {
            const userName = el.textContent.trim();
            // Check if this user has a badge
            const activeBadge = NovaBadgeState.activeBadges.find(b => b.userName === userName);
            
            if (activeBadge && activeBadge.userId !== NovaBadgeState.currentUser.id) {
                // Remove existing badge
                const existingBadge = el.querySelector('.nova-badge-container');
                if (existingBadge) existingBadge.remove();
                
                // Add badge
                const badgeType = activeBadge.badgeType;
                const badgeConfig = BADGE_TYPES[badgeType.toUpperCase()] || BADGE_TYPES.FLAME;
                
                const badgeSpan = document.createElement('span');
                badgeSpan.className = 'nova-badge-container';
                badgeSpan.innerHTML = `
                    <span class="nova-badge ${badgeType}">
                        ${badgeConfig.icon} ✓
                    </span>
                    <span class="nova-badge-tooltip">${badgeConfig.name}</span>
                `;
                el.appendChild(badgeSpan);
            }
        });
        
        // Update current user's badge display
        if (NovaBadgeState.currentUser.hasBadge && NovaBadgeState.currentUser.badgeType) {
            const badgeConfig = BADGE_TYPES[NovaBadgeState.currentUser.badgeType.toUpperCase()] || BADGE_TYPES.FLAME;
            const userBadgeArea = document.querySelector('.creator-details h4');
            if (userBadgeArea && !userBadgeArea.querySelector('.nova-badge-container')) {
                const badgeSpan = document.createElement('span');
                badgeSpan.className = 'nova-badge-container';
                badgeSpan.innerHTML = `
                    <span class="nova-badge ${NovaBadgeState.currentUser.badgeType}">
                        ${badgeConfig.icon} ✓
                    </span>
                    <span class="nova-badge-tooltip">${badgeConfig.name} (${getRemainingDays()})</span>
                `;
                userBadgeArea.appendChild(badgeSpan);
            }
        }
    };
    
    const getRemainingDays = () => {
        if (!NovaBadgeState.currentUser.badgeExpiry) return '0 kun';
        const diff = new Date(NovaBadgeState.currentUser.badgeExpiry) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return `${days} kun qoldi`;
    };
    
    // ============================================
    // PAYMENT MODAL
    // ============================================
    const createPaymentModal = () => {
        const modal = document.createElement('div');
        modal.className = 'nova-payment-modal';
        modal.id = 'novaPaymentModal';
        modal.innerHTML = `
            <div class="nova-payment-content">
                <h2 style="text-align: center; color: #ff0000;">
                    <i class="fas fa-crown"></i> Animatsiyali Galichka
                </h2>
                
                <div class="nova-badge-selector" id="badgeSelector">
                    ${Object.values(BADGE_TYPES).filter(b => !b.creatorOnly).map(badge => `
                        <div class="nova-badge-option" data-badge="${badge.id}">
                            <div class="badge-icon">${badge.icon}</div>
                            <div class="badge-name">${badge.name}</div>
                            <div class="badge-price">${badge.price}$</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="nova-payment-form">
                    <input type="text" id="novaUserName" placeholder="Ismingiz" value="${NovaBadgeState.currentUser.name || ''}">
                    <input type="email" id="novaUserEmail" placeholder="Email">
                    <input type="tel" id="novaUserPhone" placeholder="Telefon raqam">
                    
                    <select id="novaPaymentMethod">
                        <option value="click">Click</option>
                        <option value="payme">Payme</option>
                        <option value="visa">Visa/Mastercard</option>
                        <option value="crypto">Nova Coin</option>
                    </select>
                    
                    <button class="nova-payment-btn" id="submitNovaPayment">
                        <i class="fas fa-shopping-cart"></i> 1$ to‘lov qilish
                    </button>
                </div>
                
                <div style="text-align: center; margin-top: 15px; font-size: 11px; color: #666;">
                    Chek Mirfayzga yuboriladi: ${CONFIG.MIRFAYZ_PHONE}
                </div>
                
                <button id="closeNovaPaymentModal" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal
        document.getElementById('closeNovaPaymentModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Badge selection
        let selectedBadge = 'flame';
        document.querySelectorAll('.nova-badge-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.nova-badge-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                selectedBadge = opt.dataset.badge;
            });
        });
        document.querySelector('.nova-badge-option')?.classList.add('selected');
        
        // Submit payment
        document.getElementById('submitNovaPayment')?.addEventListener('click', async () => {
            const userName = document.getElementById('novaUserName')?.value;
            const userEmail = document.getElementById('novaUserEmail')?.value;
            const userPhone = document.getElementById('novaUserPhone')?.value;
            const paymentMethod = document.getElementById('novaPaymentMethod')?.value;
            
            if (!userName || (!userEmail && !userPhone)) {
                showToast('Iltimos, ism va email/telefon kiriting!');
                return;
            }
            
            // Update current user
            NovaBadgeState.currentUser.name = userName;
            NovaBadgeState.currentUser.email = userEmail;
            NovaBadgeState.currentUser.phone = userPhone;
            NovaBadgeState.currentUser.id = NovaBadgeState.currentUser.id || 'user_' + Date.now();
            
            const paymentData = {
                userId: NovaBadgeState.currentUser.id,
                userName: userName,
                userEmail: userEmail,
                userPhone: userPhone,
                badgeType: selectedBadge,
                paymentMethod: paymentMethod,
                amount: CONFIG.BADGE_PRICE
            };
            
            // Send cheque to Mirfayz
            await sendChequeToMirfayz(paymentData);
            
            modal.style.display = 'none';
            showToast('💰 To‘lov qabul qilindi! Mirfayz tasdiqlashini kuting...');
        });
        
        return modal;
    };
    
    // ============================================
    // OPEN PAYMENT MODAL
    // ============================================
    const openPaymentModal = () => {
        const modal = document.getElementById('novaPaymentModal');
        if (modal) modal.style.display = 'flex';
    };
    
    // ============================================
    // CHECK FOR MIRFAYZ (Auto-show verification panel)
    // ============================================
    const checkForMirfayz = () => {
        // Check if current user is Mirfayz based on email or phone
        const isMirfayz = localStorage.getItem('nova_is_mirfayz') === 'true';
        
        if (isMirfayz) {
            NovaBadgeState.currentUser.isMirfayz = true;
            const panel = document.getElementById('novaVerificationPanel');
            if (panel) panel.style.display = 'block';
        }
    };
    
    // ============================================
    // INITIALIZE BADGE SYSTEM
    // ============================================
    const initBadgeSystem = () => {
        console.log('🎖️ Nova Badge System initializing...');
        
        // Inject animations
        injectAnimations();
        
        // Create UI components
        createVerificationPanel();
        createPaymentModal();
        
        // Set current user from localStorage or create new
        const savedUser = localStorage.getItem('nova_current_user');
        if (savedUser) {
            try {
                NovaBadgeState.currentUser = JSON.parse(savedUser);
            } catch(e) {}
        }
        
        if (!NovaBadgeState.currentUser.id) {
            NovaBadgeState.currentUser.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            NovaBadgeState.currentUser.name = localStorage.getItem('nova_user_name') || 'NovaUser';
        }
        
        // Add badge trigger buttons
        const addBadgeTriggers = () => {
            const buyButtons = document.querySelectorAll('.premium-btn, .buy-badge-btn, #buyBadgeBtn, #buyBadgeSidebarBtn, #buyBadgeRightBtn');
            buyButtons.forEach(btn => {
                if (!btn.hasAttribute('data-badge-listener')) {
                    btn.setAttribute('data-badge-listener', 'true');
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        openPaymentModal();
                    });
                }
            });
        };
        
        addBadgeTriggers();
        
        // Observe DOM for new buy buttons
        const observer = new MutationObserver(() => {
            addBadgeTriggers();
            updateBadgeDisplay();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Update badge display periodically
        setInterval(() => {
            updateBadgeDisplay();
        }, 5000);
        
        // Check for Mirfayz
        checkForMirfayz();
        
        console.log('✅ Nova Badge System ready!');
    };
    
    // ============================================
    // EXPORT FUNCTIONS (Global)
    // ============================================
    window.NovaBadge = {
        init: initBadgeSystem,
        openPayment: openPaymentModal,
        getBadgeState: () => NovaBadgeState,
        approveBadge: approveBadge,
        rejectBadge: rejectBadge,
        setMirfayzMode: (isMirfayz) => {
            localStorage.setItem('nova_is_mirfayz', isMirfayz);
            if (isMirfayz) {
                const panel = document.getElementById('novaVerificationPanel');
                if (panel) panel.style.display = 'block';
                NovaBadgeState.currentUser.isMirfayz = true;
            }
        }
    };
    
    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBadgeSystem);
    } else {
        initBadgeSystem();
    }
    
})();
