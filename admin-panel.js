// ============================================
// NOVA ADMIN PANEL (admin-panel.js)
// FAQAT MIRFAYZ UCHUN
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('👑 NOVA Admin Panel ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        STORAGE_ADMIN: 'nova_admin',
        STORAGE_BANNED_USERS: 'nova_banned_users',
        STORAGE_REPORTS: 'nova_reports',
        STORAGE_ANNOUNCEMENTS: 'nova_announcements',
        MIRFAYZ_ID: 'mirfayz_creator_id',
        MIRFAYZ_EMAIL: 'mirfayzfarxodov1@gmail.com',
        MIRFAYZ_PHONE: '+998938138110'
    };
    
    // ============================================
    // STATE
    // ============================================
    let adminState = {
        isAdmin: false,
        stats: {
            totalUsers: 0,
            totalVideos: 0,
            totalLikes: 0,
            totalComments: 0,
            totalNovaCoins: 0,
            activeStreams: 0,
            reports: 0
        },
        bannedUsers: [],
        reports: [],
        announcements: [],
        pendingVerifications: []
    };
    
    // ============================================
    // ADMIN EKANLIGINI TEKSHIRISH
    // ============================================
    const checkIsAdmin = () => {
        const currentUser = localStorage.getItem('nova_user');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                // Mirfayz email yoki telefon orqali aniqlanadi
                const userEmail = user.email || '';
                const userPhone = user.phone || '';
                const isMirfayz = userEmail === CONFIG.MIRFAYZ_EMAIL || userPhone === CONFIG.MIRFAYZ_PHONE;
                
                if (isMirfayz) {
                    adminState.isAdmin = true;
                    localStorage.setItem('nova_is_admin', 'true');
                    console.log('👑 Mirfayz admin sifatida tizimga kirdi!');
                } else {
                    adminState.isAdmin = localStorage.getItem('nova_is_admin') === 'true';
                }
            } catch(e) {}
        }
        
        // Admin rejimini majburiy yoqish (testing uchun)
        if (localStorage.getItem('nova_force_admin') === 'true') {
            adminState.isAdmin = true;
        }
        
        return adminState.isAdmin;
    };
    
    // ============================================
    // ADMIN PANEL MODALI
    // ============================================
    const createAdminPanel = () => {
        if (!adminState.isAdmin) return;
        if (document.getElementById('adminPanel')) return;
        
        const adminBtn = document.createElement('div');
        adminBtn.id = 'adminPanelBtn';
        adminBtn.innerHTML = '<i class="fas fa-crown"></i>';
        adminBtn.title = 'Admin panel';
        adminBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #ff0000, #cc0000);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(255,0,0,0.3);
            font-size: 24px;
            color: white;
        `;
        document.body.appendChild(adminBtn);
        
        const modal = document.createElement('div');
        modal.id = 'adminPanel';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; width: 95%; max-height: 85vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-crown" style="color: #ffd700;"></i> Admin Panel - Mirfayz</h2>
                    <button class="close-modal" id="closeAdminPanel">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Tabs -->
                    <div style="display: flex; gap: 10px; border-bottom: 1px solid #ff000020; margin-bottom: 20px; flex-wrap: wrap;">
                        <button class="admin-tab active" data-tab="dashboard">📊 Dashboard</button>
                        <button class="admin-tab" data-tab="users">👥 Foydalanuvchilar</button>
                        <button class="admin-tab" data-tab="videos">📹 Videolar</button>
                        <button class="admin-tab" data-tab="badges">🎖️ Galichkalar</button>
                        <button class="admin-tab" data-tab="reports">⚠️ Shikoyatlar</button>
                        <button class="admin-tab" data-tab="announcements">📢 E'lonlar</button>
                        <button class="admin-tab" data-tab="settings">⚙️ Sozlamalar</button>
                    </div>
                    
                    <!-- Dashboard Tab -->
                    <div id="dashboardTab" class="admin-tab-content active">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div style="background: #1a1a1a; padding: 20px; border-radius: 16px; text-align: center;">
                                <div style="font-size: 32px; color: #ff0000;" id="statUsers">0</div>
                                <div>Foydalanuvchilar</div>
                            </div>
                            <div style="background: #1a1a1a; padding: 20px; border-radius: 16px; text-align: center;">
                                <div style="font-size: 32px; color: #ff0000;" id="statVideos">0</div>
                                <div>Videolar</div>
                            </div>
                            <div style="background: #1a1a1a; padding: 20px; border-radius: 16px; text-align: center;">
                                <div style="font-size: 32px; color: #ff0000;" id="statLikes">0</div>
                                <div>Layklar</div>
                            </div>
                            <div style="background: #1a1a1a; padding: 20px; border-radius: 16px; text-align: center;">
                                <div style="font-size: 32px; color: #ff0000;" id="statCoins">0</div>
                                <div>Nova Coin</div>
                            </div>
                        </div>
                        <div style="background: #1a1a1a; padding: 20px; border-radius: 16px;">
                            <h3>So'nggi faoliyat</h3>
                            <div id="recentActivity" style="max-height: 300px; overflow-y: auto;">
                                <!-- Recent activity will be inserted here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Users Tab -->
                    <div id="usersTab" class="admin-tab-content" style="display: none;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <input type="text" id="searchUser" placeholder="Foydalanuvchi qidirish..." style="flex: 1; padding: 10px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;">
                            <button id="refreshUsersBtn" style="background: #ff0000; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Yangilash</button>
                        </div>
                        <div id="usersList" style="max-height: 500px; overflow-y: auto;">
                            <!-- Users will be inserted here -->
                        </div>
                    </div>
                    
                    <!-- Videos Tab -->
                    <div id="videosTab" class="admin-tab-content" style="display: none;">
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <input type="text" id="searchVideo" placeholder="Video qidirish..." style="flex: 1; padding: 10px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;">
                            <button id="refreshVideosBtn" style="background: #ff0000; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Yangilash</button>
                        </div>
                        <div id="adminVideosList" style="max-height: 500px; overflow-y: auto;">
                            <!-- Videos will be inserted here -->
                        </div>
                    </div>
                    
                    <!-- Badges Tab -->
                    <div id="badgesTab" class="admin-tab-content" style="display: none;">
                        <div style="margin-bottom: 20px;">
                            <h3>Galichka berish</h3>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <input type="text" id="badgeUserName" placeholder="Foydalanuvchi nomi" style="flex: 2; padding: 10px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;">
                                <select id="badgeType" style="flex: 1; padding: 10px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;">
                                    <option value="flame">🔥 Olovli</option>
                                    <option value="ice">❄️ Muzli</option>
                                    <option value="lightning">⚡ Chaqmoqli</option>
                                    <option value="rainbow">🌈 Rainbow</option>
                                    <option value="crown">👑 Crown (Mirfayz)</option>
                                </select>
                                <button id="giveBadgeBtn" style="background: #00cc00; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Berish</button>
                            </div>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <h3>Kutilayotgan to'lovlar</h3>
                            <div id="pendingPaymentsList" style="max-height: 300px; overflow-y: auto;">
                                <!-- Pending payments from badge-system.js -->
                            </div>
                        </div>
                        <div>
                            <h3>Barcha galichkalar</h3>
                            <div id="allBadgesList" style="max-height: 300px; overflow-y: auto;">
                                <!-- All badges -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Reports Tab -->
                    <div id="reportsTab" class="admin-tab-content" style="display: none;">
                        <div id="reportsList" style="max-height: 500px; overflow-y: auto;">
                            <!-- Reports will be inserted here -->
                        </div>
                    </div>
                    
                    <!-- Announcements Tab -->
                    <div id="announcementsTab" class="admin-tab-content" style="display: none;">
                        <div style="margin-bottom: 20px;">
                            <textarea id="announcementText" placeholder="E'lon matnini yozing..." rows="3" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white; margin-bottom: 10px;"></textarea>
                            <button id="sendAnnouncementBtn" style="background: #ff0000; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">E'lon yuborish</button>
                        </div>
                        <div id="announcementsList" style="max-height: 400px; overflow-y: auto;">
                            <!-- Past announcements -->
                        </div>
                    </div>
                    
                    <!-- Settings Tab -->
                    <div id="settingsTab" class="admin-tab-content" style="display: none;">
                        <div class="setting-group">
                            <h3>⚙️ Tizim sozlamalari</h3>
                            <div class="setting-item"><span>Sayt nomi</span><input type="text" id="siteName" value="NOVA" style="background:#1a1a1a; border:1px solid #ff0000; padding:8px; border-radius:8px; color:#fff;"></div>
                            <div class="setting-item"><span>Maintenance rejimi</span><input type="checkbox" id="maintenanceMode"></div>
                            <div class="setting-item"><span>Ro'yxatdan o'tish</span><input type="checkbox" id="allowRegistration" checked></div>
                            <div class="setting-item"><span>Video yuklash</span><input type="checkbox" id="allowVideoUpload" checked></div>
                        </div>
                        <div class="setting-group">
                            <h3>🔧 Admin sozlamalari</h3>
                            <div class="setting-item"><span>Admin email</span><input type="email" id="adminEmail" value="${CONFIG.MIRFAYZ_EMAIL}" style="background:#1a1a1a; border:1px solid #ff0000; padding:8px; border-radius:8px; color:#fff;"></div>
                            <div class="setting-item"><span>Admin telefon</span><input type="text" id="adminPhone" value="${CONFIG.MIRFAYZ_PHONE}" style="background:#1a1a1a; border:1px solid #ff0000; padding:8px; border-radius:8px; color:#fff;"></div>
                        </div>
                        <button id="saveSettingsBtn" style="background: #ff0000; border: none; padding: 12px; border-radius: 8px; width: 100%; margin-top: 20px; cursor: pointer;">Sozlamalarni saqlash</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Admin button click
        adminBtn.addEventListener('click', () => {
            refreshAdminData();
            modal.style.display = 'flex';
        });
        
        // Close modal
        document.getElementById('closeAdminPanel')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabId = tab.dataset.tab;
                document.querySelectorAll('.admin-tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                document.getElementById(`${tabId}Tab`).style.display = 'block';
            });
        });
        
        // Event listeners
        document.getElementById('refreshUsersBtn')?.addEventListener('click', () => renderUsersList());
        document.getElementById('refreshVideosBtn')?.addEventListener('click', () => renderVideosList());
        document.getElementById('searchUser')?.addEventListener('input', (e) => renderUsersList(e.target.value));
        document.getElementById('searchVideo')?.addEventListener('input', (e) => renderVideosList(e.target.value));
        document.getElementById('giveBadgeBtn')?.addEventListener('click', giveBadgeToUser);
        document.getElementById('sendAnnouncementBtn')?.addEventListener('click', sendAnnouncement);
        document.getElementById('saveSettingsBtn')?.addEventListener('click', saveAdminSettings);
        
        return modal;
    };
    
    // ============================================
    // STATISTIKA YANGILASH
    // ============================================
    const refreshStats = () => {
        const users = getAllUsers();
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
        
        // Get Nova Coins from all users
        let totalCoins = 0;
        users.forEach(user => {
            const userCoins = localStorage.getItem(`nova_coins_${user.id}`);
            if (userCoins) totalCoins += parseInt(userCoins) || 0;
        });
        
        adminState.stats = {
            totalUsers: users.length,
            totalVideos: posts.length,
            totalLikes: totalLikes,
            totalComments: totalComments,
            totalNovaCoins: totalCoins,
            activeStreams: 0,
            reports: adminState.reports.length
        };
        
        document.getElementById('statUsers').textContent = adminState.stats.totalUsers;
        document.getElementById('statVideos').textContent = adminState.stats.totalVideos;
        document.getElementById('statLikes').textContent = adminState.stats.totalLikes.toLocaleString();
        document.getElementById('statCoins').textContent = adminState.stats.totalNovaCoins.toLocaleString();
    };
    
    // ============================================
    // FOYDALANUVCHILAR RO'YXATI
    // ============================================
    const getAllUsers = () => {
        const users = [];
        const savedUsers = localStorage.getItem('nova_users');
        if (savedUsers) {
            try {
                const usersObj = JSON.parse(savedUsers);
                Object.values(usersObj).forEach(user => {
                    users.push(user);
                });
            } catch(e) {}
        }
        
        // Add current user if not exists
        const currentUser = localStorage.getItem('nova_user');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                if (!users.find(u => u.id === user.id)) {
                    users.push(user);
                }
            } catch(e) {}
        }
        
        return users;
    };
    
    const renderUsersList = (searchTerm = '') => {
        const container = document.getElementById('usersList');
        if (!container) return;
        
        let users = getAllUsers();
        if (searchTerm) {
            users = users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        container.innerHTML = users.map(user => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border-bottom: 1px solid #1a1a1a;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${user.avatar || 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=' + encodeURIComponent(user.name)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <div style="font-weight: 600;">${escapeHtml(user.name)}</div>
                        <div style="font-size: 11px; color: #888;">ID: ${user.id}</div>
                        <div style="font-size: 11px; color: #888;">Qo'shilgan: ${new Date(user.joinDate).toLocaleDateString()}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="view-user-btn" data-user-id="${user.id}" style="background: #333; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Ko'rish</button>
                    <button class="ban-user-btn" data-user-id="${user.id}" style="background: #ff0000; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Bloklash</button>
                    ${!user.isAdmin ? '<button class="make-admin-btn" data-user-id="${user.id}" style="background: #00cc00; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Admin qilish</button>' : ''}
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.view-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.userId;
                if (window.showChannelPage) {
                    window.showChannelPage(userId);
                }
            });
        });
        
        document.querySelectorAll('.ban-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.userId;
                if (confirm('Bu foydalanuvchini bloklamoqchimisiz?')) {
                    banUser(userId);
                }
            });
        });
        
        document.querySelectorAll('.make-admin-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.userId;
                if (confirm('Bu foydalanuvchini admin qilish?')) {
                    makeAdmin(userId);
                }
            });
        });
    };
    
    const banUser = (userId) => {
        if (!adminState.bannedUsers.includes(userId)) {
            adminState.bannedUsers.push(userId);
            localStorage.setItem(CONFIG.STORAGE_BANNED_USERS, JSON.stringify(adminState.bannedUsers));
            showToast(`✅ Foydalanuvchi bloklandi!`);
            renderUsersList();
        }
    };
    
    const makeAdmin = (userId) => {
        const users = getAllUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.isAdmin = true;
            localStorage.setItem(CONFIG.STORAGE_USERS, JSON.stringify(users));
            showToast(`👑 ${user.name} admin qilindi!`);
            renderUsersList();
        }
    };
    
    // ============================================
    // VIDEOLAR RO'YXATI
    // ============================================
    const renderVideosList = (searchTerm = '') => {
        const container = document.getElementById('adminVideosList');
        if (!container) return;
        
        let posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        if (searchTerm) {
            posts = posts.filter(p => p.caption?.toLowerCase().includes(searchTerm.toLowerCase()) || p.userName?.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        container.innerHTML = posts.map(post => `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; border-bottom: 1px solid #1a1a1a;">
                ${post.mediaType === 'video' ? 
                    `<video src="${post.mediaUrl}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px;"></video>` :
                    `<img src="${post.mediaUrl}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px;">`
                }
                <div style="flex: 1;">
                    <div style="font-weight: 600;">${escapeHtml(post.caption || 'Videosiz')}</div>
                    <div style="font-size: 11px; color: #888;">${escapeHtml(post.userName)} | ❤️ ${post.likes || 0} | 👁️ ${post.views || 0}</div>
                    <div style="font-size: 10px; color: #666;">${new Date(post.time).toLocaleString()}</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="delete-video-btn" data-post-id="${post.id}" style="background: #ff0000; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">O'chirish</button>
                    <button class="pin-video-btn" data-post-id="${post.id}" style="background: #333; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Pin</button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.delete-video-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                if (confirm('Bu videoni o\'chirmoqchimisiz?')) {
                    deleteVideoAsAdmin(postId);
                }
            });
        });
        
        document.querySelectorAll('.pin-video-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                pinVideo(postId);
            });
        });
    };
    
    const deleteVideoAsAdmin = (postId) => {
        let posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem('nova_posts', JSON.stringify(posts));
        
        // Also delete from reels
        let reels = JSON.parse(localStorage.getItem('nova_reels') || '[]');
        reels = reels.filter(r => r.id !== postId);
        localStorage.setItem('nova_reels', JSON.stringify(reels));
        
        showToast('🗑️ Video o\'chirildi!');
        renderVideosList();
        refreshStats();
        
        if (window.renderFeed) window.renderFeed();
    };
    
    const pinVideo = (postId) => {
        showToast(`📌 Video pin qilindi! (Bu video bosh sahifada yuqorida ko'rinadi)`);
        // In real app, this would update database
    };
    
    // ============================================
    // GALICHKA BERISH
    // ============================================
    const giveBadgeToUser = () => {
        const userName = document.getElementById('badgeUserName')?.value;
        const badgeType = document.getElementById('badgeType')?.value;
        
        if (!userName) {
            showToast('❌ Foydalanuvchi nomini kiriting!');
            return;
        }
        
        const users = getAllUsers();
        const user = users.find(u => u.name?.toLowerCase() === userName.toLowerCase());
        
        if (!user) {
            showToast('❌ Foydalanuvchi topilmadi!');
            return;
        }
        
        // Add to active badges
        let activeBadges = JSON.parse(localStorage.getItem('nova_active_badges') || '[]');
        if (!activeBadges.find(b => b.userId === user.id)) {
            activeBadges.push({
                userId: user.id,
                userName: user.name,
                badgeType: badgeType,
                assignedAt: new Date().toISOString(),
                assignedBy: 'admin',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
            localStorage.setItem('nova_active_badges', JSON.stringify(activeBadges));
            showToast(`✅ ${user.name} ga ${badgeType} galichka berildi!`);
        } else {
            showToast(`⚠️ ${user.name} allaqachon galichkaga ega!`);
        }
        
        document.getElementById('badgeUserName').value = '';
    };
    
    // ============================================
    // E'LON YUBORISH
    // ============================================
    const sendAnnouncement = () => {
        const text = document.getElementById('announcementText')?.value;
        if (!text) {
            showToast('❌ E\'lon matnini yozing!');
            return;
        }
        
        const announcement = {
            id: Date.now(),
            text: text,
            date: new Date().toISOString(),
            sentBy: 'Mirfayz'
        };
        
        adminState.announcements.unshift(announcement);
        localStorage.setItem(CONFIG.STORAGE_ANNOUNCEMENTS, JSON.stringify(adminState.announcements));
        
        // Show to all users (store in localStorage)
        localStorage.setItem('nova_last_announcement', JSON.stringify(announcement));
        
        showToast(`📢 E'lon yuborildi: ${text}`);
        document.getElementById('announcementText').value = '';
        renderAnnouncements();
        
        // Show notification to current user
        if (window.showToast) {
            window.showToast(`📢 ${text}`);
        }
    };
    
    const renderAnnouncements = () => {
        const container = document.getElementById('announcementsList');
        if (!container) return;
        
        container.innerHTML = adminState.announcements.map(ann => `
            <div style="padding: 15px; border-bottom: 1px solid #1a1a1a;">
                <div style="font-weight: 600;">📢 ${escapeHtml(ann.text)}</div>
                <div style="font-size: 11px; color: #888;">${new Date(ann.date).toLocaleString()} | ${ann.sentBy}</div>
            </div>
        `).join('');
    };
    
    // ============================================
    // SOZLAMALARNI SAQLASH
    // ============================================
    const saveAdminSettings = () => {
        const settings = {
            siteName: document.getElementById('siteName')?.value,
            maintenanceMode: document.getElementById('maintenanceMode')?.checked,
            allowRegistration: document.getElementById('allowRegistration')?.checked,
            allowVideoUpload: document.getElementById('allowVideoUpload')?.checked,
            adminEmail: document.getElementById('adminEmail')?.value,
            adminPhone: document.getElementById('adminPhone')?.value
        };
        
        localStorage.setItem(CONFIG.STORAGE_ADMIN, JSON.stringify(settings));
        showToast('✅ Sozlamalar saqlandi!');
    };
    
    // ============================================
    // PENDING PAYMENTLARNI KO'RSATISH
    // ============================================
    const renderPendingPayments = () => {
        const container = document.getElementById('pendingPaymentsList');
        if (!container) return;
        
        const pendingVerifications = JSON.parse(localStorage.getItem('nova_badge_state') || '{}');
        const pending = pendingVerifications.pendingVerifications || [];
        
        container.innerHTML = pending.map(p => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #1a1a1a;">
                <div>
                    <div><strong>${escapeHtml(p.userName)}</strong></div>
                    <div style="font-size: 11px; color: #888;">${p.badgeType} | ${p.amount}$ | ${new Date(p.timestamp).toLocaleString()}</div>
                </div>
                <div>
                    <button class="approve-payment" data-id="${p.id}" style="background: #00cc00; border: none; padding: 5px 15px; border-radius: 6px; cursor: pointer;">✅ Tasdiqlash</button>
                    <button class="reject-payment" data-id="${p.id}" style="background: #ff0000; border: none; padding: 5px 15px; border-radius: 6px; cursor: pointer;">❌ Rad etish</button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.approve-payment').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (window.NovaBadge?.approveBadge) {
                    window.NovaBadge.approveBadge(id);
                    renderPendingPayments();
                }
            });
        });
        
        document.querySelectorAll('.reject-payment').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (window.NovaBadge?.rejectBadge) {
                    window.NovaBadge.rejectBadge(id);
                    renderPendingPayments();
                }
            });
        });
    };
    
    // ============================================
    // MA'LUMOTLARNI YANGILASH
    // ============================================
    const refreshAdminData = () => {
        refreshStats();
        renderUsersList();
        renderVideosList();
        renderPendingPayments();
        renderAnnouncements();
    };
    
    // ============================================
    // YUKLASH
    // ============================================
    const loadAdminData = () => {
        const savedBanned = localStorage.getItem(CONFIG.STORAGE_BANNED_USERS);
        if (savedBanned) {
            try { adminState.bannedUsers = JSON.parse(savedBanned); } catch(e) {}
        }
        
        const savedAnnouncements = localStorage.getItem(CONFIG.STORAGE_ANNOUNCEMENTS);
        if (savedAnnouncements) {
            try { adminState.announcements = JSON.parse(savedAnnouncements); } catch(e) {}
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
    // FORCE ADMIN MODE (TESTING)
    // ============================================
    window.enableAdminMode = () => {
        localStorage.setItem('nova_force_admin', 'true');
        localStorage.setItem('nova_is_admin', 'true');
        showToast('👑 Admin rejimi yoqildi! Sahifani yangilang.');
        setTimeout(() => location.reload(), 1000);
    };
    
    // ============================================
    // INIT
    // ============================================
    const init = () => {
        console.log('👑 Nova Admin Panel initializing...');
        loadAdminData();
        
        if (checkIsAdmin()) {
            createAdminPanel();
            console.log('✅ Nova Admin Panel ready!');
        } else {
            console.log('🔒 Admin panel faqat Mirfayz uchun');
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
</script>
