// ============================================
// NOVA MONETIZATSIYA TIZIMI (monetization-system.js)
// REKLAMA, DONORLIK, PULLIK OBUNALAR
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('💰 NOVA Monetizatsiya tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        STORAGE_MONETIZATION: 'nova_monetization',
        STORAGE_DONATIONS: 'nova_donations',
        STORAGE_SUBSCRIPTIONS: 'nova_paid_subscriptions',
        STORAGE_WITHDRAWALS: 'nova_withdrawals',
        
        // Coin paketlari
        COIN_PACKAGES: [
            { id: 'small', coins: 100, price: 1, priceUSD: 1, icon: '☕', name: 'Kichik' },
            { id: 'medium', coins: 550, price: 5, priceUSD: 5, icon: '🍕', name: 'O\'rta' },
            { id: 'large', coins: 1200, price: 10, priceUSD: 10, icon: '🎁', name: 'Katta' },
            { id: 'xlarge', coins: 2500, price: 20, priceUSD: 20, icon: '💎', name: 'VIP' },
            { id: 'ultra', coins: 6500, price: 50, priceUSD: 50, icon: '👑', name: 'ULTRA' }
        ],
        
        // Premium obunalar
        PREMIUM_PLANS: [
            { id: 'monthly', name: 'Premium', price: 4.99, priceUSD: 4.99, period: 'month', icon: '⭐', features: ['Reklamasiz', 'HD video', 'Eksklyuziv kontent', 'Tez yuklash'] },
            { id: 'yearly', name: 'Premium+', price: 49.99, priceUSD: 49.99, period: 'year', icon: '👑', features: ['Reklamasiz', '4K video', 'Eksklyuziv kontent', 'Tez yuklash', 'Maxsus galichka', '20% chegirma'] }
        ],
        
        // Reklama sozlamalari
        ADS: {
            videoAdDuration: 15, // sekund
            videoAdReward: 10, // coin
            bannerAdInterval: 60000, // 1 daqiqa
            adRevenueShare: 0.7 // Creator 70% oladi
        }
    };
    
    // ============================================
    // STATE
    // ============================================
    let monetizationState = {
        isPremium: false,
        premiumExpiry: null,
        premiumPlan: null,
        totalCoinsSpent: 0,
        totalDonationsReceived: 0,
        totalDonationsSent: 0,
        totalAdRevenue: 0,
        withdrawalHistory: [],
        donationHistory: []
    };
    
    // ============================================
    // COIN PAKETLARI MODALI
    // ============================================
    const createCoinShopModal = () => {
        if (document.getElementById('coinShopModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'coinShopModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-coins" style="color: #ffd700;"></i> Nova Coin sotib olish</h2>
                    <button class="close-modal" id="closeCoinShopModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; color: #ffd700;">💰</div>
                        <p>Nova Coin bilan kanallarga yordam bering va maxsus imkoniyatlarga ega bo'ling!</p>
                    </div>
                    
                    <div id="coinPackagesContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        ${CONFIG.COIN_PACKAGES.map(pkg => `
                            <div class="coin-package" data-package="${pkg.id}" style="background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border: 1px solid #ffd700; border-radius: 16px; padding: 20px; text-align: center; cursor: pointer; transition: transform 0.3s;">
                                <div style="font-size: 36px;">${pkg.icon}</div>
                                <div style="font-size: 28px; font-weight: bold; color: #ffd700;">${pkg.coins}</div>
                                <div style="font-size: 12px; color: #888;">Nova Coin</div>
                                <div style="font-size: 20px; font-weight: bold; margin-top: 10px;">$${pkg.price}</div>
                                <div style="font-size: 11px; color: #888;">${pkg.name}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 12px;">
                        <h3>💳 To'lov usullari</h3>
                        <div style="display: flex; gap: 15px; margin-top: 10px; flex-wrap: wrap;">
                            <button class="payment-method-btn" data-method="click" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 10px 20px; border-radius: 8px; cursor: pointer;"><i class="fas fa-credit-card"></i> Click</button>
                            <button class="payment-method-btn" data-method="payme" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 10px 20px; border-radius: 8px; cursor: pointer;"><i class="fas fa-mobile-alt"></i> Payme</button>
                            <button class="payment-method-btn" data-method="visa" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 10px 20px; border-radius: 8px; cursor: pointer;"><i class="fab fa-cc-visa"></i> Visa</button>
                            <button class="payment-method-btn" data-method="crypto" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 10px 20px; border-radius: 8px; cursor: pointer;"><i class="fab fa-bitcoin"></i> Crypto</button>
                        </div>
                    </div>
                    
                    <div id="paymentStatus" style="margin-top: 15px; text-align: center; display: none;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closeCoinShopModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.querySelectorAll('.coin-package').forEach(pkg => {
            pkg.addEventListener('click', () => {
                const packageId = pkg.dataset.package;
                selectCoinPackage(packageId);
            });
        });
        
        return modal;
    };
    
    let selectedPackage = null;
    let selectedPaymentMethod = null;
    
    const selectCoinPackage = (packageId) => {
        selectedPackage = CONFIG.COIN_PACKAGES.find(p => p.id === packageId);
        if (selectedPackage) {
            showToast(`💰 ${selectedPackage.coins} Nova Coin - $${selectedPackage.price} tanlandi`);
            document.querySelectorAll('.coin-package').forEach(p => p.style.borderColor = '#ffd700');
            document.querySelector(`[data-package="${packageId}"]`).style.borderColor = '#00ff00';
        }
    };
    
    const processCoinPurchase = () => {
        if (!selectedPackage) {
            showToast('❌ Avval coin paketini tanlang!');
            return;
        }
        if (!selectedPaymentMethod) {
            showToast('❌ To\'lov usulini tanlang!');
            return;
        }
        
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> To\'lov amalga oshirilmoqda...';
        
        setTimeout(() => {
            // Add coins to user
            if (window.addNovaCoins) {
                window.addNovaCoins(selectedPackage.coins, `Coin sotib olindi: ${selectedPackage.name} paketi`);
            }
            
            // Save transaction
            const transaction = {
                id: 'txn_' + Date.now(),
                type: 'coin_purchase',
                package: selectedPackage,
                coins: selectedPackage.coins,
                amount: selectedPackage.price,
                method: selectedPaymentMethod,
                timestamp: new Date().toISOString()
            };
            
            const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_MONETIZATION) || '[]');
            history.unshift(transaction);
            localStorage.setItem(CONFIG.STORAGE_MONETIZATION, JSON.stringify(history));
            
            statusDiv.innerHTML = '<span style="color: #00ff00;">✅ To\'lov muvaffaqiyatli amalga oshirildi!</span>';
            setTimeout(() => {
                document.getElementById('coinShopModal').style.display = 'none';
                statusDiv.style.display = 'none';
                selectedPackage = null;
                selectedPaymentMethod = null;
            }, 2000);
        }, 1500);
    };
    
    // ============================================
    // PREMIUM OBUNA MODALI
    // ============================================
    const createPremiumModal = () => {
        if (document.getElementById('premiumModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'premiumModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-crown" style="color: #ffd700;"></i> Premium obuna</h2>
                    <button class="close-modal" id="closePremiumModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px;">👑</div>
                        <p>Premium obuna bilan NOVA dan to'liq foydalaning!</p>
                    </div>
                    
                    <div id="premiumPlansContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                        ${CONFIG.PREMIUM_PLANS.map(plan => `
                            <div class="premium-plan" data-plan="${plan.id}" style="background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border: 2px solid #ffd700; border-radius: 20px; padding: 25px; text-align: center; cursor: pointer; transition: transform 0.3s;">
                                <div style="font-size: 48px;">${plan.icon}</div>
                                <div style="font-size: 24px; font-weight: bold; margin-top: 10px;">${plan.name}</div>
                                <div style="font-size: 28px; font-weight: bold; color: #ffd700; margin: 10px 0;">$${plan.price}</div>
                                <div style="font-size: 12px; color: #888;">/${plan.period}</div>
                                <div style="margin-top: 15px; text-align: left;">
                                    ${plan.features.map(f => `<div style="padding: 5px 0;"><i class="fas fa-check" style="color: #00ff00;"></i> ${f}</div>`).join('')}
                                </div>
                                <button class="subscribe-premium-btn" data-plan="${plan.id}" style="background: #ffd700; color: #000; border: none; padding: 10px 20px; border-radius: 30px; margin-top: 15px; cursor: pointer; font-weight: bold;">Obuna bo'lish</button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 12px;">
                        <h3>💳 To'lov usullari</h3>
                        <div style="display: flex; gap: 15px; margin-top: 10px; flex-wrap: wrap;">
                            <button class="premium-payment-method" data-method="click" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 10px 20px; border-radius: 8px; cursor: pointer;"><i class="fas fa-credit-card"></i> Click</button>
                            <button class="premium-payment-method" data-method="payme" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 10px 20px; border-radius: 8px; cursor: pointer;"><i class="fas fa-mobile-alt"></i> Payme</button>
                            <button class="premium-payment-method" data-method="visa" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 10px 20px; border-radius: 8px; cursor: pointer;"><i class="fab fa-cc-visa"></i> Visa</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closePremiumModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        let selectedPlan = null;
        let selectedMethod = null;
        
        document.querySelectorAll('.subscribe-premium-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const planId = btn.dataset.plan;
                selectedPlan = CONFIG.PREMIUM_PLANS.find(p => p.id === planId);
                showToast(`💰 ${selectedPlan.name} obuna tanlandi - $${selectedPlan.price}`);
            });
        });
        
        document.querySelectorAll('.premium-payment-method').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedMethod = btn.dataset.method;
                showToast(`💳 To'lov usuli: ${selectedMethod}`);
            });
        });
        
        // Add subscribe logic
        const processPremiumSubscribe = () => {
            if (!selectedPlan) {
                showToast('❌ Avval obuna rejasini tanlang!');
                return;
            }
            if (!selectedMethod) {
                showToast('❌ To\'lov usulini tanlang!');
                return;
            }
            
            // Process payment
            monetizationState.isPremium = true;
            monetizationState.premiumPlan = selectedPlan.id;
            monetizationState.premiumExpiry = new Date(Date.now() + (selectedPlan.period === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
            
            localStorage.setItem(CONFIG.STORAGE_SUBSCRIPTIONS, JSON.stringify({
                isPremium: monetizationState.isPremium,
                premiumPlan: monetizationState.premiumPlan,
                premiumExpiry: monetizationState.premiumExpiry
            }));
            
            showToast(`✅ ${selectedPlan.name} obunasiga xush kelibsiz!`);
            modal.style.display = 'none';
            updatePremiumStatus();
        };
        
        // You can add a confirm button or process directly
        return modal;
    };
    
    // ============================================
    // DONORLIK MODALI
    // ============================================
    const createDonationModal = (creatorId, creatorName) => {
        let modal = document.getElementById('donationModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'donationModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2><i class="fas fa-gift"></i> ${creatorName} ga yordam</h2>
                    <button class="close-modal" id="closeDonationModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px;">🎁</div>
                        <p>Kreatorni qo'llab-quvvatlang va u sizga maxsus galichka yuboradi!</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                        <button class="donation-amount" data-amount="1" style="background: #1a1a1a; border: 1px solid #ffd700; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <div style="font-size: 24px;">☕</div>
                            <div>1$</div>
                            <div style="font-size: 11px;">100 coin</div>
                        </button>
                        <button class="donation-amount" data-amount="5" style="background: #1a1a1a; border: 1px solid #ffd700; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <div style="font-size: 24px;">🍕</div>
                            <div>5$</div>
                            <div style="font-size: 11px;">550 coin</div>
                        </button>
                        <button class="donation-amount" data-amount="10" style="background: #1a1a1a; border: 1px solid #ffd700; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <div style="font-size: 24px;">🎁</div>
                            <div>10$</div>
                            <div style="font-size: 11px;">1200 coin</div>
                        </button>
                        <button class="donation-amount" data-amount="20" style="background: #1a1a1a; border: 1px solid #ffd700; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <div style="font-size: 24px;">💎</div>
                            <div>20$</div>
                            <div style="font-size: 11px;">2500 coin</div>
                        </button>
                        <button class="donation-amount" data-amount="50" style="background: #1a1a1a; border: 1px solid #ffd700; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <div style="font-size: 24px;">👑</div>
                            <div>50$</div>
                            <div style="font-size: 11px;">6500 coin</div>
                        </button>
                        <button class="donation-amount" data-amount="100" style="background: #1a1a1a; border: 1px solid #ffd700; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <div style="font-size: 24px;">🌟</div>
                            <div>100$</div>
                            <div style="font-size: 11px;">13000 coin</div>
                        </button>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <input type="text" id="donationMessage" placeholder="Xabar yozing (ixtiyoriy)..." style="flex: 1; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; padding: 12px; color: white;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="anonymousDonation"> Anonim donor
                        </label>
                    </div>
                    
                    <button id="confirmDonationBtn" style="background: #ffd700; color: #000; border: none; padding: 14px; border-radius: 30px; width: 100%; font-weight: bold; cursor: pointer;">
                        Yordam berish
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        let selectedAmount = null;
        
        document.querySelectorAll('.donation-amount').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.donation-amount').forEach(b => b.style.borderColor = '#ffd700');
                btn.style.borderColor = '#00ff00';
                selectedAmount = parseInt(btn.dataset.amount);
            });
        });
        
        document.getElementById('closeDonationModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('confirmDonationBtn')?.addEventListener('click', () => {
            if (!selectedAmount) {
                showToast('❌ Summani tanlang!');
                return;
            }
            
            const message = document.getElementById('donationMessage')?.value || '';
            const isAnonymous = document.getElementById('anonymousDonation')?.checked || false;
            
            processDonation(creatorId, creatorName, selectedAmount, message, isAnonymous);
            modal.style.display = 'none';
        });
    };
    
    const processDonation = (creatorId, creatorName, amount, message, isAnonymous) => {
        const currentUserName = getCurrentUserName();
        const displayName = isAnonymous ? 'Anonim donor' : currentUserName;
        
        const donation = {
            id: 'don_' + Date.now(),
            donorId: getCurrentUserId(),
            donorName: displayName,
            donorRealName: isAnonymous ? null : currentUserName,
            creatorId: creatorId,
            creatorName: creatorName,
            amount: amount,
            coins: amount * 100,
            message: message,
            timestamp: new Date().toISOString(),
            isAnonymous: isAnonymous
        };
        
        // Save donation
        const donations = JSON.parse(localStorage.getItem(CONFIG.STORAGE_DONATIONS) || '[]');
        donations.unshift(donation);
        localStorage.setItem(CONFIG.STORAGE_DONATIONS, JSON.stringify(donations));
        
        // Add coins to creator
        if (creatorId === getCurrentUserId()) {
            if (window.addNovaCoins) {
                window.addNovaCoins(amount * 100, `Donatsiya: ${creatorName}`);
            }
        }
        
        showToast(`✅ ${creatorName} ga ${amount}$ yordam berildi! Rahmat!`);
        
        // Add notification to creator
        if (window.addNotification) {
            window.addNotification(creatorId, `${displayName} sizga ${amount}$ donorlik qildi! ${message ? `Xabar: ${message}` : ''}`, 'donation');
        }
    };
    
    // ============================================
    // REKLAMA TIZIMI
    // ============================================
    let adInterval = null;
    let currentVideoAd = null;
    
    const showVideoAd = (rewardCallback) => {
        const adModal = document.createElement('div');
        adModal.id = 'videoAdModal';
        adModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 20000; display: flex; align-items: center; justify-content: center; flex-direction: column;';
        adModal.innerHTML = `
            <div style="background: #0a0a0a; padding: 20px; border-radius: 20px; text-align: center; max-width: 400px; width: 90%;">
                <div style="font-size: 48px; margin-bottom: 10px;">📺</div>
                <h3>Video reklama</h3>
                <p id="adTimer">${CONFIG.ADS.videoAdDuration} soniya</p>
                <div style="width: 100%; height: 4px; background: #333; border-radius: 4px; margin: 15px 0;">
                    <div id="adProgress" style="width: 0%; height: 100%; background: #ff0000; border-radius: 4px;"></div>
                </div>
                <button id="skipAdBtn" style="background: #333; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;" disabled>O'tkazib yubor (${CONFIG.ADS.videoAdDuration}s)</button>
            </div>
        `;
        document.body.appendChild(adModal);
        
        let timeLeft = CONFIG.ADS.videoAdDuration;
        const timerEl = document.getElementById('adTimer');
        const progressEl = document.getElementById('adProgress');
        const skipBtn = document.getElementById('skipAdBtn');
        
        const interval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `${timeLeft} soniya`;
            progressEl.style.width = `${((CONFIG.ADS.videoAdDuration - timeLeft) / CONFIG.ADS.videoAdDuration) * 100}%`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                skipBtn.disabled = false;
                skipBtn.textContent = '✅ Davom etish';
                skipBtn.style.background = '#ff0000';
                skipBtn.onclick = () => {
                    adModal.remove();
                    if (rewardCallback) rewardCallback();
                    if (window.addNovaCoins) {
                        window.addNovaCoins(CONFIG.ADS.videoAdReward, 'Video reklama ko\'rildi');
                    }
                    showToast(`+${CONFIG.ADS.videoAdReward} Nova Coin`);
                };
            }
        }, 1000);
    };
    
    const startBannerAds = () => {
        if (adInterval) clearInterval(adInterval);
        
        adInterval = setInterval(() => {
            if (!monetizationState.isPremium) {
                showBannerAd();
            }
        }, CONFIG.ADS.bannerAdInterval);
    };
    
    const showBannerAd = () => {
        let banner = document.querySelector('.nova-banner-ad');
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'nova-banner-ad';
            banner.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border-top: 1px solid #ff0000; padding: 10px; text-align: center; z-index: 9999; cursor: pointer;';
            banner.onclick = () => {
                if (window.addNovaCoins) {
                    window.addNovaCoins(1, 'Banner reklama bosildi');
                }
            };
            document.body.appendChild(banner);
        }
        
        const ads = [
            { text: '🔥 Nova Coin sotib oling! 50% chegirma', link: '#' },
            { text: '📱 NOVA Premium - Reklamasiz video!', link: '#' },
            { text: '🎁 Donorlik qiling va maxsus galichka oling!', link: '#' }
        ];
        const ad = ads[Math.floor(Math.random() * ads.length)];
        banner.innerHTML = `<span style="color: #ffd700;">📢 REKLAMA:</span> ${ad.text} <span style="color: #ff0000;">👉 Bosish</span>`;
        
        setTimeout(() => {
            if (banner) banner.style.opacity = '0.5';
        }, 10000);
    };
    
    // ============================================
    // YECHIB OLISH (WITHDRAWAL)
    // ============================================
    const createWithdrawalModal = () => {
        let modal = document.getElementById('withdrawalModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'withdrawalModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        const currentCoins = getCurrentNovaCoins();
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2><i class="fas fa-money-bill-wave"></i> Pul yechib olish</h2>
                    <button class="close-modal" id="closeWithdrawalModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px;">💰</div>
                        <div style="font-size: 24px; color: #ffd700;">${currentCoins} Nova Coin</div>
                        <div style="font-size: 12px; color: #888;">≈ $${Math.floor(currentCoins / 100)}</div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>Summa (Nova Coin)</label>
                        <input type="number" id="withdrawAmount" placeholder="Minimal 1000 coin" style="width: 100%; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; padding: 12px; color: white; margin-top: 5px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>To'lov usuli</label>
                        <select id="withdrawMethod" style="width: 100%; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; padding: 12px; color: white; margin-top: 5px;">
                            <option value="click">Click</option>
                            <option value="payme">Payme</option>
                            <option value="visa">Visa</option>
                            <option value="crypto">Crypto (USDT)</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>Hisob raqam / Wallet</label>
                        <input type="text" id="withdrawAccount" placeholder="Hisob raqamingiz" style="width: 100%; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; padding: 12px; color: white; margin-top: 5px;">
                    </div>
                    
                    <button id="confirmWithdrawBtn" style="background: #ff0000; color: white; border: none; padding: 14px; border-radius: 30px; width: 100%; cursor: pointer;">Yechib olish</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('closeWithdrawalModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('confirmWithdrawBtn')?.addEventListener('click', () => {
            const amount = parseInt(document.getElementById('withdrawAmount')?.value);
            const method = document.getElementById('withdrawMethod')?.value;
            const account = document.getElementById('withdrawAccount')?.value;
            
            if (!amount || amount < 1000) {
                showToast('❌ Minimal yechib olish: 1000 Nova Coin');
                return;
            }
            if (!account) {
                showToast('❌ Hisob raqamni kiriting!');
                return;
            }
            if (amount > currentCoins) {
                showToast('❌ Yetarli Nova Coin mavjud emas!');
                return;
            }
            
            // Process withdrawal
            const withdrawal = {
                id: 'wd_' + Date.now(),
                amount: amount,
                usdAmount: amount / 100,
                method: method,
                account: account,
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            
            const withdrawals = JSON.parse(localStorage.getItem(CONFIG.STORAGE_WITHDRAWALS) || '[]');
            withdrawals.unshift(withdrawal);
            localStorage.setItem(CONFIG.STORAGE_WITHDRAWALS, JSON.stringify(withdrawals));
            
            // Deduct coins
            if (window.deductNovaCoins) {
                window.deductNovaCoins(amount, 'Pul yechib olish');
            }
            
            showToast(`✅ ${amount} Nova Coin ($${amount/100}) yechib olish uchun ariza yuborildi!`);
            modal.style.display = 'none';
        });
    };
    
    // ============================================
    // YORDAMCHI FUNKSIYALAR
    // ============================================
    const getCurrentNovaCoins = () => {
        const coins = localStorage.getItem('nova_coins');
        return coins ? parseInt(coins) : 0;
    };
    
    const updatePremiumStatus = () => {
        const premiumInfo = localStorage.getItem(CONFIG.STORAGE_SUBSCRIPTIONS);
        if (premiumInfo) {
            try {
                const data = JSON.parse(premiumInfo);
                monetizationState.isPremium = data.isPremium;
                monetizationState.premiumPlan = data.premiumPlan;
                monetizationState.premiumExpiry = data.premiumExpiry;
                
                // Check if expired
                if (monetizationState.premiumExpiry && new Date(monetizationState.premiumExpiry) < new Date()) {
                    monetizationState.isPremium = false;
                    localStorage.setItem(CONFIG.STORAGE_SUBSCRIPTIONS, JSON.stringify({ isPremium: false }));
                }
            } catch(e) {}
        }
        
        // Remove ads if premium
        if (monetizationState.isPremium) {
            const banner = document.querySelector('.nova-banner-ad');
            if (banner) banner.remove();
            if (adInterval) clearInterval(adInterval);
        }
    };
    
    const getCurrentUserId = () => {
        const savedUser = localStorage.getItem('nova_user');
        if (savedUser) {
            try { return JSON.parse(savedUser).id; } catch(e) {}
        }
        return 'user_' + Date.now();
    };
    
    const getCurrentUserName = () => {
        const savedUser = localStorage.getItem('nova_user');
        if (savedUser) {
            try { return JSON.parse(savedUser).name || 'Foydalanuvchi'; } catch(e) {}
        }
        return 'Foydalanuvchi';
    };
    
    const showToast = (message, duration = 3000) => {
        let toast = document.querySelector('.nova-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'nova-toast';
            toast.style.cssText = 'position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #1a1a1a; border: 1px solid #ff0000; color: white; padding: 12px 24px; border-radius: 40px; z-index: 10002; display: none;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, duration);
    };
    
    // ============================================
    // TUGMALARNI QO'SHISH
    // ============================================
    const addMonetizationButtons = () => {
        // Add coin shop button to sidebar
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter && !document.querySelector('.coin-shop-btn')) {
            const coinBtn = document.createElement('button');
            coinBtn.className = 'premium-btn coin-shop-btn';
            coinBtn.style.marginTop = '10px';
            coinBtn.style.background = 'linear-gradient(135deg, #ffd700, #ffaa00)';
            coinBtn.innerHTML = '<i class="fas fa-coins"></i> Nova Coin (${getCurrentNovaCoins()})';
            coinBtn.onclick = () => {
                createCoinShopModal();
                document.getElementById('coinShopModal').style.display = 'flex';
                
                document.querySelectorAll('.payment-method-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        selectedPaymentMethod = btn.dataset.method;
                        document.querySelectorAll('.payment-method-btn').forEach(b => b.style.borderColor = '#ff0000');
                        btn.style.borderColor = '#00ff00';
                        processCoinPurchase();
                    });
                });
            };
            sidebarFooter.appendChild(coinBtn);
        }
        
        // Add premium button
        if (sidebarFooter && !document.querySelector('.premium-subscribe-btn')) {
            const premiumBtn = document.createElement('button');
            premiumBtn.className = 'premium-btn premium-subscribe-btn';
            premiumBtn.style.marginTop = '10px';
            premiumBtn.style.background = 'linear-gradient(135deg, #ffd700, #cc9900)';
            premiumBtn.innerHTML = '<i class="fas fa-crown"></i> Premium obuna';
            premiumBtn.onclick = () => {
                createPremiumModal();
                document.getElementById('premiumModal').style.display = 'flex';
            };
            sidebarFooter.appendChild(premiumBtn);
        }
        
        // Add withdraw button to profile
        const profileSection = document.querySelector('.creator-info');
        if (profileSection && !document.querySelector('.withdraw-btn')) {
            const withdrawBtn = document.createElement('button');
            withdrawBtn.className = 'withdraw-btn';
            withdrawBtn.style.cssText = 'background: #333; border: none; padding: 5px 10px; border-radius: 20px; font-size: 11px; margin-top: 5px; cursor: pointer;';
            withdrawBtn.innerHTML = '<i class="fas fa-money-bill-wave"></i> Pul yechish';
            withdrawBtn.onclick = () => {
                createWithdrawalModal();
            };
            document.querySelector('.creator-details')?.appendChild(withdrawBtn);
        }
    };
    
    // Update coin display periodically
    const updateCoinDisplay = () => {
        const coinBtn = document.querySelector('.coin-shop-btn');
        if (coinBtn) {
            coinBtn.innerHTML = `<i class="fas fa-coins"></i> Nova Coin (${getCurrentNovaCoins()})`;
        }
    };
    
    // ============================================
    // INIT
    // ============================================
    const init = () => {
        console.log('💰 Nova Monetizatsiya tizimi initializing...');
        
        updatePremiumStatus();
        addMonetizationButtons();
        startBannerAds();
        
        // Update coin display every 5 seconds
        setInterval(updateCoinDisplay, 5000);
        
        // Add donation option to channel pages
        if (window.showChannelPage) {
            const originalShowChannel = window.showChannelPage;
            window.showChannelPage = function(userId) {
                originalShowChannel(userId);
                setTimeout(() => {
                    const donateBtn = document.createElement('button');
                    donateBtn.innerHTML = '<i class="fas fa-gift"></i> Yordam berish';
                    donateBtn.style.cssText = 'background: #ffd700; color: #000; border: none; padding: 8px 20px; border-radius: 30px; margin-top: 10px; cursor: pointer; font-weight: bold;';
                    donateBtn.onclick = () => {
                        const user = JSON.parse(localStorage.getItem('nova_users') || '{}')[userId];
                        createDonationModal(userId, user?.name || 'Creator');
                    };
                    const channelModal = document.getElementById('channelModal');
                    if (channelModal && !channelModal.querySelector('.donate-btn-added')) {
                        donateBtn.classList.add('donate-btn-added');
                        channelModal.querySelector('.modal-body')?.appendChild(donateBtn);
                    }
                }, 500);
            };
        }
        
        console.log('✅ Nova Monetizatsiya tizimi ready!');
    };
    
    const observer = new MutationObserver(() => {
        addMonetizationButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
</script>
