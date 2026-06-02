// ============================================
// NOVA PROFIL VA KANAL TIZIMI (profile-system.js)
// INDEX.HTML UCHUN MAXSUS MOSLANGAN
// Muallif: Mirfayz Nova Creator
// Versiya: 2.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('📺 NOVA Profil va Kanal tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        STORAGE_USERS: 'nova_users',
        STORAGE_SUBSCRIPTIONS: 'nova_subscriptions',
        STORAGE_ACHIEVEMENTS: 'nova_achievements',
        STORAGE_NOVA_COINS: 'nova_coins',
        MAX_VIDEO_SIZE: 20 * 1024 * 1024 * 1024, // 20GB
        COINS_PER_LIKE: 1,
        COINS_PER_VIEW: 0.5,
        COINS_PER_SUBSCRIBE: 10,
        LEVEL_UP_COINS: 100
    };
    
    // ============================================
    // STATE
    // ============================================
    let profileState = {
        currentUser: {
            id: null,
            name: 'Foydalanuvchi',
            bio: 'Nova da yangiman! 🚀',
            avatar: null,
            avatarUrl: 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=User',
            joinDate: new Date().toISOString(),
            level: 1,
            exp: 0,
            novaCoins: 0,
            totalViews: 0,
            totalLikes: 0,
            totalSubscribers: 0
        },
        users: {},
        subscriptions: [],
        achievements: [],
        notifications: []
    };
    
    // ============================================
    // STORAGE FUNKSIYALARI
    // ============================================
    const loadProfileData = () => {
        const savedUsers = localStorage.getItem(CONFIG.STORAGE_USERS);
        if (savedUsers) {
            try { profileState.users = JSON.parse(savedUsers); } catch(e) {}
        }
        
        const savedSubs = localStorage.getItem(CONFIG.STORAGE_SUBSCRIPTIONS);
        if (savedSubs) {
            try { profileState.subscriptions = JSON.parse(savedSubs); } catch(e) {}
        }
        
        const savedAchievements = localStorage.getItem(CONFIG.STORAGE_ACHIEVEMENTS);
        if (savedAchievements) {
            try { profileState.achievements = JSON.parse(savedAchievements); } catch(e) {}
        }
        
        const savedCoins = localStorage.getItem(CONFIG.STORAGE_NOVA_COINS);
        if (savedCoins) {
            try { profileState.currentUser.novaCoins = JSON.parse(savedCoins); } catch(e) {}
        }
        
        // Load current user from main index.html
        const savedUser = localStorage.getItem('nova_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                profileState.currentUser.id = user.id || profileState.currentUser.id;
                profileState.currentUser.name = user.name || profileState.currentUser.name;
                profileState.currentUser.avatarUrl = user.avatarUrl || profileState.currentUser.avatarUrl;
            } catch(e) {}
        }
        
        // Load user from users object
        if (profileState.currentUser.id && profileState.users[profileState.currentUser.id]) {
            profileState.currentUser = { ...profileState.currentUser, ...profileState.users[profileState.currentUser.id] };
        }
        
        updateProfileUI();
    };
    
    const saveProfileData = () => {
        localStorage.setItem(CONFIG.STORAGE_USERS, JSON.stringify(profileState.users));
        localStorage.setItem(CONFIG.STORAGE_SUBSCRIPTIONS, JSON.stringify(profileState.subscriptions));
        localStorage.setItem(CONFIG.STORAGE_ACHIEVEMENTS, JSON.stringify(profileState.achievements));
        localStorage.setItem(CONFIG.STORAGE_NOVA_COINS, JSON.stringify(profileState.currentUser.novaCoins));
        
        // Save current user to main storage
        localStorage.setItem('nova_user', JSON.stringify({
            id: profileState.currentUser.id,
            name: profileState.currentUser.name,
            avatarUrl: profileState.currentUser.avatarUrl,
            bio: profileState.currentUser.bio
        }));
    };
    
    // ============================================
    // NOVA COIN TIZIMI
    // ============================================
    const addNovaCoins = (amount, reason) => {
        profileState.currentUser.novaCoins += amount;
        saveProfileData();
        updateProfileUI();
        showCoinNotification(`+${amount} Nova Coin (${reason})`);
        
        // Check level up
        const newLevel = Math.floor(profileState.currentUser.novaCoins / CONFIG.LEVEL_UP_COINS) + 1;
        if (newLevel > profileState.currentUser.level) {
            profileState.currentUser.level = newLevel;
            unlockAchievement('level_' + newLevel, `${newLevel}-darajaga erishdingiz!`);
            showToast(`🎉 TABRIKLAYMIZ! Siz ${newLevel}-darajaga chiqdingiz!`);
        }
        
        // Update level display
        const levelEl = document.getElementById('userLevel');
        if (levelEl) levelEl.textContent = profileState.currentUser.level;
    };
    
    const showCoinNotification = (message) => {
        let coinToast = document.querySelector('.nova-coin-toast');
        if (!coinToast) {
            coinToast = document.createElement('div');
            coinToast.className = 'nova-coin-toast';
            coinToast.style.cssText = 'position: fixed; top: 80px; right: 20px; background: linear-gradient(135deg, #ffd700, #ffaa00); color: #000; padding: 10px 20px; border-radius: 40px; z-index: 10003; font-weight: bold; display: none; animation: slideInRight 0.3s ease;';
            document.body.appendChild(coinToast);
        }
        coinToast.textContent = message;
        coinToast.style.display = 'block';
        setTimeout(() => { coinToast.style.display = 'none'; }, 2000);
    };
    
    // ============================================
    // ACHIEVEMENTLAR (YUTUQLAR)
    // ============================================
    const achievementsList = {
        first_video: { name: 'Birinchi video', icon: '🎬', desc: 'Birinchi videongizni yuklang', coins: 50 },
        first_like: { name: 'Birinchi layk', icon: '❤️', desc: 'Birinchi laykni oling', coins: 10 },
        first_subscriber: { name: 'Birinchi obunachi', icon: '🔔', desc: 'Birinchi obunachiga ega bo\'ling', coins: 100 },
        popular: { name: 'Mashhur', icon: '⭐', desc: '100 ta layk to\'plang', coins: 200 },
        level_5: { name: 'Yulduz', icon: '🌟', desc: '5-darajaga chiqing', coins: 500 },
        level_10: { name: 'Legend', icon: '👑', desc: '10-darajaga chiqing', coins: 1000 }
    };
    
    const unlockAchievement = (achievementId, customMessage = null) => {
        if (profileState.achievements.includes(achievementId)) return;
        
        profileState.achievements.push(achievementId);
        const ach = achievementsList[achievementId];
        if (ach) {
            addNovaCoins(ach.coins, `Yutuq: ${ach.name}`);
            showToast(`🏆 YUTUQ! ${ach.name} (+${ach.coins} Nova Coin)`);
        }
        saveProfileData();
    };
    
    const checkAchievements = () => {
        // Get user's posts count from main page
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const userPosts = posts.filter(p => p.userId === profileState.currentUser.id);
        
        if (userPosts.length >= 1 && !profileState.achievements.includes('first_video')) {
            unlockAchievement('first_video');
        }
        
        const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
        if (totalLikes >= 1 && !profileState.achievements.includes('first_like')) {
            unlockAchievement('first_like');
        }
        
        if (totalLikes >= 100 && !profileState.achievements.includes('popular')) {
            unlockAchievement('popular');
        }
        
        if (profileState.currentUser.level >= 5 && !profileState.achievements.includes('level_5')) {
            unlockAchievement('level_5');
        }
        
        if (profileState.currentUser.level >= 10 && !profileState.achievements.includes('level_10')) {
            unlockAchievement('level_10');
        }
    };
    
    // ============================================
    // OBUNA TIZIMI
    // ============================================
    const subscribeToUser = (targetUserId) => {
        if (targetUserId === profileState.currentUser.id) {
            showToast("❌ O'zingizga obuna bo'la olmaysiz!");
            return false;
        }
        
        if (profileState.subscriptions.includes(targetUserId)) {
            // Unsubscribe
            profileState.subscriptions = profileState.subscriptions.filter(id => id !== targetUserId);
            
            // Remove from followers
            if (profileState.users[targetUserId] && profileState.users[targetUserId].followers) {
                profileState.users[targetUserId].followers = profileState.users[targetUserId].followers.filter(id => id !== profileState.currentUser.id);
            }
            saveProfileData();
            showToast(`❌ ${profileState.users[targetUserId]?.name || 'Kanal'} dan obunani bekor qildingiz`);
            return false;
        } else {
            // Subscribe
            profileState.subscriptions.push(targetUserId);
            
            // Add to followers
            if (!profileState.users[targetUserId]) {
                profileState.users[targetUserId] = { id: targetUserId, name: 'User', followers: [] };
            }
            if (!profileState.users[targetUserId].followers) {
                profileState.users[targetUserId].followers = [];
            }
            if (!profileState.users[targetUserId].followers.includes(profileState.currentUser.id)) {
                profileState.users[targetUserId].followers.push(profileState.currentUser.id);
            }
            
            saveProfileData();
            addNovaCoins(CONFIG.COINS_PER_SUBSCRIBE, `Obuna: ${profileState.users[targetUserId]?.name}`);
            showToast(`✅ ${profileState.users[targetUserId]?.name || 'Kanal'} ga obuna bo'ldingiz! (+${CONFIG.COINS_PER_SUBSCRIBE} Nova Coin)`);
            
            // Check first subscriber achievement
            if (profileState.users[targetUserId]?.followers?.length === 1 && targetUserId === profileState.currentUser.id) {
                unlockAchievement('first_subscriber');
            }
            
            return true;
        }
    };
    
    // ============================================
    // KANAL SAHIFASI
    // ============================================
    const showChannelPage = (userId) => {
        const user = profileState.users[userId] || { 
            id: userId, 
            name: userId === profileState.currentUser.id ? profileState.currentUser.name : 'Foydalanuvchi',
            avatar: null,
            bio: '',
            followers: [],
            joinDate: new Date().toISOString()
        };
        
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const userPosts = posts.filter(p => p.userId === userId);
        const totalViews = userPosts.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
        const isSubscribed = profileState.subscriptions.includes(userId);
        const isOwnChannel = userId === profileState.currentUser.id;
        
        // Create channel modal if not exists
        let channelModal = document.getElementById('channelModal');
        if (!channelModal) {
            channelModal = document.createElement('div');
            channelModal.id = 'channelModal';
            channelModal.className = 'modal';
            channelModal.style.display = 'flex';
            channelModal.style.alignItems = 'center';
            channelModal.style.justifyContent = 'center';
            document.body.appendChild(channelModal);
        }
        
        channelModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; width: 90%;">
                <div class="modal-header">
                    <h2><i class="fas fa-tv"></i> ${escapeHtml(user.name)} kanali</h2>
                    <button class="close-modal" id="closeChannelModal">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <img src="${user.avatar || 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=' + encodeURIComponent(user.name)}" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid #ff0000; margin-bottom: 15px;">
                    <h3>${escapeHtml(user.name)}</h3>
                    <p>${escapeHtml(user.bio || 'Bio mavjud emas')}</p>
                    <div style="display: flex; justify-content: center; gap: 30px; margin: 20px 0;">
                        <div><strong>${userPosts.length}</strong><br><span style="font-size: 12px; color: #888;">Videolar</span></div>
                        <div><strong>${totalLikes.toLocaleString()}</strong><br><span style="font-size: 12px; color: #888;">Layklar</span></div>
                        <div><strong>${totalViews.toLocaleString()}</strong><br><span style="font-size: 12px; color: #888;">Ko'rishlar</span></div>
                        <div><strong>${user.followers?.length || 0}</strong><br><span style="font-size: 12px; color: #888;">Obunachilar</span></div>
                    </div>
                    ${!isOwnChannel ? `
                        <button id="channelSubscribeBtn" style="background: ${isSubscribed ? '#333' : '#ff0000'}; color: white; border: none; padding: 12px 30px; border-radius: 30px; cursor: pointer; margin: 10px;">
                            <i class="fas fa-bell"></i> ${isSubscribed ? 'Obunada' : 'Obuna bo\'lish'}
                        </button>
                    ` : `
                        <button id="editChannelBtn" style="background: #333; color: white; border: none; padding: 12px 30px; border-radius: 30px; cursor: pointer; margin: 10px;">
                            <i class="fas fa-edit"></i> Kanalni tahrirlash
                        </button>
                    `}
                    <div id="channelVideos" style="margin-top: 20px; max-height: 300px; overflow-y: auto;">
                        <h4>Videolar (${userPosts.length})</h4>
                        ${userPosts.length === 0 ? '<p style="color:#888;">Hozircha videolar yo\'q</p>' : 
                            userPosts.map(post => `
                                <div style="display: flex; align-items: center; gap: 15px; padding: 10px; border-bottom: 1px solid #1a1a1a; cursor: pointer;" onclick="window.playVideoFromChannel('${post.id}')">
                                    ${post.mediaType === 'video' ? 
                                        `<video src="${post.mediaUrl}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px;"></video>` :
                                        `<img src="${post.mediaUrl}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px;">`
                                    }
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600;">${escapeHtml(post.caption || 'Videosiz')}</div>
                                        <div style="font-size: 12px; color: #888;">❤️ ${post.likes || 0} | 👁️ ${post.views || 0}</div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;
        
        channelModal.style.display = 'flex';
        
        document.getElementById('closeChannelModal')?.addEventListener('click', () => {
            channelModal.style.display = 'none';
        });
        
        if (!isOwnChannel) {
            document.getElementById('channelSubscribeBtn')?.addEventListener('click', () => {
                subscribeToUser(userId);
                showChannelPage(userId); // Refresh
            });
        } else {
            document.getElementById('editChannelBtn')?.addEventListener('click', () => {
                channelModal.style.display = 'none';
                document.getElementById('editProfileBtn')?.click();
            });
        }
    };
    
    // ============================================
    // PROFILNI TAHRIRLASH (KENGAYTIRILGAN)
    // ============================================
    const setupExtendedProfileEdit = () => {
        const originalEditBtn = document.getElementById('editProfileBtn');
        if (!originalEditBtn) return;
        
        // Enhanced profile modal
        const showEnhancedProfileModal = () => {
            let profileModal = document.getElementById('enhancedProfileModal');
            if (!profileModal) {
                profileModal = document.createElement('div');
                profileModal.id = 'enhancedProfileModal';
                profileModal.className = 'modal';
                document.body.appendChild(profileModal);
            }
            
            profileModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-user-edit"></i> Profil va Kanal sozlamalari</h2>
                        <button class="close-modal" id="closeEnhancedProfileModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center;">
                            <img id="enhancedProfilePreview" src="${profileState.currentUser.avatarUrl}" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid #ff0000; cursor: pointer; margin-bottom: 15px;">
                            <input type="file" id="enhancedAvatarInput" accept="image/*" style="display: none;">
                        </div>
                        
                        <div class="setting-group">
                            <h3>📝 Asosiy ma'lumotlar</h3>
                            <div class="setting-item"><span>Ism</span><input type="text" id="enhancedName" value="${escapeHtml(profileState.currentUser.name)}" style="flex:1; margin-left: 10px;"></div>
                            <div class="setting-item"><span>Bio</span><textarea id="enhancedBio" rows="3" style="flex:1; margin-left: 10px;">${escapeHtml(profileState.currentUser.bio || '')}</textarea></div>
                        </div>
                        
                        <div class="setting-group">
                            <h3>📊 Statistika</h3>
                            <div class="setting-item"><span>📹 Videolar</span><span>${JSON.parse(localStorage.getItem('nova_posts') || '[]').filter(p => p.userId === profileState.currentUser.id).length}</span></div>
                            <div class="setting-item"><span>👥 Obunachilar</span><span>${profileState.users[profileState.currentUser.id]?.followers?.length || 0}</span></div>
                            <div class="setting-item"><span>🔔 Obunalar</span><span>${profileState.subscriptions.length}</span></div>
                            <div class="setting-item"><span>💰 Nova Coin</span><span>${profileState.currentUser.novaCoins}</span></div>
                            <div class="setting-item"><span>⭐ Daraja</span><span>${profileState.currentUser.level}</span></div>
                        </div>
                        
                        <div class="setting-group">
                            <h3>🏆 Yutuqlar (${profileState.achievements.length}/${Object.keys(achievementsList).length})</h3>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                ${Object.entries(achievementsList).map(([id, ach]) => `
                                    <div style="background: ${profileState.achievements.includes(id) ? '#ff000020' : '#1a1a1a'}; padding: 10px; border-radius: 12px; text-align: center; min-width: 100px; border: 1px solid ${profileState.achievements.includes(id) ? '#ff0000' : '#333'};">
                                        <div style="font-size: 30px;">${ach.icon}</div>
                                        <div style="font-size: 12px; font-weight: 600;">${ach.name}</div>
                                        <div style="font-size: 10px; color: #888;">+${ach.coins} coin</div>
                                        ${profileState.achievements.includes(id) ? '<div style="color: #00cc00; font-size: 10px;">✅</div>' : '<div style="color: #666; font-size: 10px;">🔒</div>'}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <button id="saveEnhancedProfileBtn" style="background: #ff0000; color: white; border: none; padding: 14px; border-radius: 30px; width: 100%; margin-top: 20px; cursor: pointer;">Saqlash</button>
                    </div>
                </div>
            `;
            
            profileModal.style.display = 'flex';
            
            document.getElementById('closeEnhancedProfileModal')?.addEventListener('click', () => {
                profileModal.style.display = 'none';
            });
            
            document.getElementById('enhancedProfilePreview')?.addEventListener('click', () => {
                document.getElementById('enhancedAvatarInput')?.click();
            });
            
            document.getElementById('enhancedAvatarInput')?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        document.getElementById('enhancedProfilePreview').src = ev.target.result;
                        profileState.currentUser.avatarUrl = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            document.getElementById('saveEnhancedProfileBtn')?.addEventListener('click', () => {
                profileState.currentUser.name = document.getElementById('enhancedName')?.value || profileState.currentUser.name;
                profileState.currentUser.bio = document.getElementById('enhancedBio')?.value || '';
                
                profileState.users[profileState.currentUser.id] = {
                    ...profileState.currentUser,
                    followers: profileState.users[profileState.currentUser.id]?.followers || []
                };
                
                saveProfileData();
                updateProfileUI();
                profileModal.style.display = 'none';
                showToast('✅ Profil yangilandi!');
            });
        };
        
        // Replace original click handler
        originalEditBtn.removeEventListener('click', showEnhancedProfileModal);
        originalEditBtn.addEventListener('click', showEnhancedProfileModal);
    };
    
    // ============================================
    // VIDEO O'CHIRISH VA STATISTIKA
    // ============================================
    const deleteVideoWithStats = (postId) => {
        if (!confirm("Videoni o'chirmoqchimisiz? Bu amal qaytarilmaydi!")) return;
        
        let posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const postIndex = posts.findIndex(p => p.id === postId);
        
        if (postIndex !== -1 && posts[postIndex].userId === profileState.currentUser.id) {
            posts.splice(postIndex, 1);
            localStorage.setItem('nova_posts', JSON.stringify(posts));
            
            // Refresh feed
            if (window.renderFeed) window.renderFeed();
            showToast('🗑️ Video o\'chirildi!');
        }
    };
    
    const addVideoView = (postId) => {
        let posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== profileState.currentUser.id) {
            post.views = (post.views || 0) + 1;
            localStorage.setItem('nova_posts', JSON.stringify(posts));
            
            // Add coins for view
            addNovaCoins(CONFIG.COINS_PER_VIEW, `Ko'rish: ${post.caption || 'video'}`);
        }
    };
    
    // ============================================
    // KANALGA O'TISH QO'NG'IROG'I
    // ============================================
    const setupChannelButtons = () => {
        // Add channel buttons to all posts
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.post-user').forEach(el => {
                if (!el.querySelector('.channel-bell-btn')) {
                    const userId = el.querySelector('[data-user-id]')?.dataset.userId;
                    if (userId) {
                        const bellBtn = document.createElement('button');
                        bellBtn.className = 'channel-bell-btn';
                        bellBtn.innerHTML = '<i class="fas fa-bell"></i>';
                        bellBtn.style.cssText = 'background: none; border: none; color: #ff0000; cursor: pointer; margin-left: 8px; font-size: 14px;';
                        bellBtn.title = 'Kanalga o\'tish';
                        bellBtn.onclick = (e) => {
                            e.stopPropagation();
                            showChannelPage(userId);
                        };
                        el.querySelector('.post-user-info h4')?.appendChild(bellBtn);
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };
    
    // ============================================
    // PROFIL UI YANGILASH
    // ============================================
    const updateProfileUI = () => {
        const nameEl = document.getElementById('profileName');
        const avatarEl = document.getElementById('profileAvatar');
        const levelEl = document.getElementById('userLevel');
        const videosCountEl = document.getElementById('videosCount');
        const followersCountEl = document.getElementById('followersCount');
        
        if (nameEl) nameEl.innerHTML = escapeHtml(profileState.currentUser.name) + ' <span class="verified-badge creator-badge">✓</span>';
        if (avatarEl) avatarEl.src = profileState.currentUser.avatarUrl;
        if (levelEl) levelEl.textContent = profileState.currentUser.level;
        
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const userPosts = posts.filter(p => p.userId === profileState.currentUser.id);
        if (videosCountEl) videosCountEl.textContent = userPosts.length;
        if (followersCountEl) followersCountEl.textContent = profileState.users[profileState.currentUser.id]?.followers?.length || 0;
        
        // Update Nova Coin display
        let coinDisplay = document.querySelector('.nova-coin-display');
        if (!coinDisplay) {
            const rightPanel = document.querySelector('.right-panel');
            if (rightPanel) {
                coinDisplay = document.createElement('div');
                coinDisplay.className = 'nova-coin-display';
                coinDisplay.style.cssText = 'background: linear-gradient(135deg, #ffd70020, #ffaa0020); border: 1px solid #ffd700; border-radius: 16px; padding: 15px; margin-bottom: 20px; text-align: center;';
                rightPanel.insertBefore(coinDisplay, rightPanel.firstChild);
            }
        }
        if (coinDisplay) {
            coinDisplay.innerHTML = `
                <i class="fas fa-coins" style="color: #ffd700; font-size: 24px;"></i>
                <div style="font-size: 24px; font-weight: bold;">${profileState.currentUser.novaCoins}</div>
                <div style="font-size: 12px; color: #888;">Nova Coin</div>
                <div style="font-size: 11px;">⭐ Daraja ${profileState.currentUser.level}</div>
            `;
        }
    };
    
    // ============================================
    // VIDEO O'YNATISH (KANALDAN)
    // ============================================
    window.playVideoFromChannel = (postId) => {
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const post = posts.find(p => p.id === postId);
        if (post) {
            addVideoView(postId);
            // Scroll to video in feed
            const feedContainer = document.getElementById('feedContainer');
            if (feedContainer) {
                const postElement = document.querySelector(`.post-card[data-post-id="${postId}"]`);
                if (postElement) {
                    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    postElement.style.border = '2px solid #ff0000';
                    setTimeout(() => {
                        postElement.style.border = '';
                    }, 2000);
                }
            }
            const channelModal = document.getElementById('channelModal');
            if (channelModal) channelModal.style.display = 'none';
        }
    };
    
    // ============================================
    // YORDAMCHI FUNKSIYALAR
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
    // INIT
    // ============================================
    const init = () => {
        console.log('📺 Nova Profil va Kanal tizimi initializing...');
        loadProfileData();
        setupExtendedProfileEdit();
        setupChannelButtons();
        checkAchievements();
        updateProfileUI();
        
        // Override global deleteVideo
        if (window.deleteVideo) {
            window.deleteVideo = deleteVideoWithStats;
        }
        
        // Override global toggleSubscribe
        if (window.toggleSubscribe) {
            window.toggleSubscribe = subscribeToUser;
        }
        
        // Add global function
        window.showChannelPage = showChannelPage;
        window.addVideoView = addVideoView;
        window.subscribeToUser = subscribeToUser;
        
        console.log('✅ Nova Profil va Kanal tizimi ready!');
    };
    
    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
</script>
