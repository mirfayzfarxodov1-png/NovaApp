// ============================================
// NOVA LIVE STREAM TIZIMI (live-stream.js)
// JONLI EFIR VA CHAT TIZIMI
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('🔴 NOVA Live Stream tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        STORAGE_LIVE: 'nova_live_streams',
        STORAGE_LIVE_CHAT: 'nova_live_chat',
        MAX_LIVE_DURATION: 3600000, // 1 soat (millisekund)
        COINS_PER_LIVE_VIEW: 2,
        COINS_PER_LIVE_LIKE: 1
    };
    
    // ============================================
    // STATE
    // ============================================
    let liveState = {
        isLive: false,
        currentStream: null,
        streams: [],
        activeViewers: [],
        liveChat: [],
        mediaRecorder: null,
        recordedChunks: [],
        streamInterval: null
    };
    
    // ============================================
    // LIVE STREAM MODAL YARATISH
    // ============================================
    const createLiveModal = () => {
        if (document.getElementById('liveModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'liveModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; width: 90%;">
                <div class="modal-header">
                    <h2><i class="fas fa-video" style="color:#ff0000;"></i> Jonli efir</h2>
                    <button class="close-modal" id="closeLiveModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="livePreview" style="background: #000; border-radius: 16px; overflow: hidden; position: relative;">
                        <video id="liveVideo" autoplay playsinline muted style="width: 100%; max-height: 400px; background: #000;"></video>
                        <div id="liveStatus" style="position: absolute; top: 10px; left: 10px; background: #ff0000; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                            <i class="fas fa-circle" style="font-size: 10px; animation: pulse 1s infinite;"></i> TAYYOR
                        </div>
                        <div id="viewerCount" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 5px 12px; border-radius: 20px; font-size: 12px;">
                            👁️ 0
                        </div>
                    </div>
                    
                    <div id="liveControls" style="display: flex; gap: 15px; margin: 15px 0; justify-content: center;">
                        <button id="startLiveBtn" style="background: #ff0000; color: white; border: none; padding: 12px 24px; border-radius: 30px; cursor: pointer;">
                            <i class="fas fa-play"></i> Efirni boshlash
                        </button>
                        <button id="stopLiveBtn" style="background: #333; color: white; border: none; padding: 12px 24px; border-radius: 30px; cursor: pointer; display: none;">
                            <i class="fas fa-stop"></i> Efirni tugatish
                        </button>
                    </div>
                    
                    <div id="liveChatContainer" style="border-top: 1px solid #ff000020; margin-top: 15px; padding-top: 15px;">
                        <div id="liveChatMessages" style="height: 200px; overflow-y: auto; background: #0a0a0a; border-radius: 12px; padding: 10px; margin-bottom: 10px;">
                            <div style="text-align: center; color: #888;">Chat xabarlari shu yerda ko'rinadi</div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="liveChatInput" placeholder="Xabar yozing..." style="flex: 1; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 20px; padding: 10px 15px; color: white;">
                            <button id="liveChatSend" style="background: #ff0000; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="liveLikesContainer" style="position: fixed; bottom: 100px; right: 20px; pointer-events: none; z-index: 1000;">
                        <!-- Floating likes -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('closeLiveModal')?.addEventListener('click', () => {
            if (liveState.isLive) {
                if (confirm("Efir davom etmoqda. Tugatmoqchimisiz?")) {
                    stopLiveStream();
                }
                return;
            }
            modal.style.display = 'none';
        });
        
        document.getElementById('startLiveBtn')?.addEventListener('click', startLiveStream);
        document.getElementById('stopLiveBtn')?.addEventListener('click', stopLiveStream);
        document.getElementById('liveChatSend')?.addEventListener('click', sendLiveChatMessage);
        document.getElementById('liveChatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendLiveChatMessage();
        });
        
        return modal;
    };
    
    // ============================================
    // LIVE STREAM BOSHLASH
    // ============================================
    const startLiveStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const video = document.getElementById('liveVideo');
            if (video) {
                video.srcObject = stream;
            }
            
            // Setup MediaRecorder for recording
            const mediaRecorder = new MediaRecorder(stream);
            liveState.mediaRecorder = mediaRecorder;
            liveState.recordedChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    liveState.recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.start(1000); // Record in 1-second chunks
            
            // Update UI
            liveState.isLive = true;
            liveState.currentStream = {
                id: 'live_' + Date.now(),
                userId: getCurrentUserId(),
                userName: getCurrentUserName(),
                startTime: new Date().toISOString(),
                viewers: 0,
                likes: 0
            };
            
            document.getElementById('startLiveBtn').style.display = 'none';
            document.getElementById('stopLiveBtn').style.display = 'flex';
            document.getElementById('liveStatus').innerHTML = '<i class="fas fa-circle" style="font-size: 10px; animation: pulse 1s infinite;"></i> JONLI EFIR';
            document.getElementById('liveStatus').style.background = '#ff0000';
            
            showToast('🔴 Jonli efir boshlandi!');
            
            // Simulate viewers increasing
            liveState.streamInterval = setInterval(() => {
                if (liveState.currentStream) {
                    liveState.currentStream.viewers += Math.floor(Math.random() * 5) + 1;
                    document.getElementById('viewerCount').innerHTML = `👁️ ${liveState.currentStream.viewers}`;
                    
                    // Add coins for viewers
                    addLiveCoins(CONFIG.COINS_PER_LIVE_VIEW, 'Jonli efir ko\'rildi');
                }
            }, 5000);
            
            // Add to streams list
            liveState.streams.unshift(liveState.currentStream);
            saveLiveData();
            
        } catch (err) {
            console.error('Kamera ruxsati olmadi:', err);
            showToast('❌ Kamera va mikrofon ruxsatini bering!');
        }
    };
    
    // ============================================
    // LIVE STREAM TUGATISH
    // ============================================
    const stopLiveStream = () => {
        if (!liveState.isLive) return;
        
        // Stop all tracks
        const video = document.getElementById('liveVideo');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
        
        // Stop recording
        if (liveState.mediaRecorder && liveState.mediaRecorder.state === 'recording') {
            liveState.mediaRecorder.stop();
            
            // Save recorded video
            liveState.mediaRecorder.onstop = () => {
                const blob = new Blob(liveState.recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                // Save as post
                saveLiveAsPost(url);
            };
        }
        
        // Clear interval
        if (liveState.streamInterval) {
            clearInterval(liveState.streamInterval);
        }
        
        // Update current stream
        if (liveState.currentStream) {
            liveState.currentStream.endTime = new Date().toISOString();
            liveState.currentStream.duration = Date.now() - new Date(liveState.currentStream.startTime).getTime();
        }
        
        // Reset UI
        liveState.isLive = false;
        document.getElementById('startLiveBtn').style.display = 'flex';
        document.getElementById('stopLiveBtn').style.display = 'none';
        document.getElementById('liveStatus').innerHTML = '<i class="fas fa-circle" style="font-size: 10px;"></i> EFIR TUGADI';
        document.getElementById('liveStatus').style.background = '#333';
        
        showToast('📹 Jonli efir tugadi! Video saqlandi.');
        saveLiveData();
    };
    
    // ============================================
    // EFIRNI VIDEO SIFATIDA SAQLASH
    // ============================================
    const saveLiveAsPost = (videoUrl) => {
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const newPost = {
            id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            userId: getCurrentUserId(),
            userName: getCurrentUserName(),
            userAvatar: getCurrentUserAvatar(),
            caption: `🔴 JONLI EFIR | ${new Date().toLocaleString()}`,
            description: `Jonli efir davomiyligi: ${Math.floor(liveState.currentStream.duration / 60000)} daqiqa`,
            mediaUrl: videoUrl,
            mediaType: 'video',
            likes: 0,
            comments: [],
            views: liveState.currentStream.viewers,
            time: 'hoziroq',
            liked: false,
            isLiveReplay: true
        };
        
        posts.unshift(newPost);
        localStorage.setItem('nova_posts', JSON.stringify(posts));
        
        // Refresh feed
        if (window.renderFeed) window.renderFeed();
    };
    
    // ============================================
    // LIVE CHAT XABAR YUBORISH
    // ============================================
    const sendLiveChatMessage = () => {
        const input = document.getElementById('liveChatInput');
        const message = input?.value.trim();
        if (!message) return;
        
        const chatMessage = {
            id: Date.now(),
            userId: getCurrentUserId(),
            userName: getCurrentUserName(),
            userAvatar: getCurrentUserAvatar(),
            message: message,
            timestamp: new Date().toISOString(),
            isLive: true
        };
        
        liveState.liveChat.push(chatMessage);
        displayLiveChatMessage(chatMessage);
        
        // Save to storage
        saveLiveChat();
        input.value = '';
        
        // Scroll to bottom
        const container = document.getElementById('liveChatMessages');
        if (container) container.scrollTop = container.scrollHeight;
    };
    
    const displayLiveChatMessage = (msg) => {
        const container = document.getElementById('liveChatMessages');
        if (!container) return;
        
        // Remove placeholder if exists
        if (container.innerHTML.includes('Chat xabarlari shu yerda ko\'rinadi')) {
            container.innerHTML = '';
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'padding: 8px; border-bottom: 1px solid #1a1a1a; display: flex; gap: 10px; align-items: flex-start;';
        messageDiv.innerHTML = `
            <img src="${msg.userAvatar}" style="width: 30px; height: 30px; border-radius: 50%;">
            <div style="flex: 1;">
                <div><strong>${escapeHtml(msg.userName)}</strong> <span style="font-size: 10px; color: #888;">${new Date(msg.timestamp).toLocaleTimeString()}</span></div>
                <div style="font-size: 14px;">${escapeHtml(msg.message)}</div>
            </div>
        `;
        container.appendChild(messageDiv);
    };
    
    // ============================================
    // LIVE LAYK (YURAKLAR)
    // ============================================
    const addLiveLike = () => {
        if (!liveState.isLive) return;
        
        if (liveState.currentStream) {
            liveState.currentStream.likes++;
            addLiveCoins(CONFIG.COINS_PER_LIVE_LIKE, 'Jonli efirda layk');
        }
        
        // Create floating heart
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.cssText = `
            position: absolute;
            font-size: 30px;
            animation: floatUp 1s ease-out forwards;
            pointer-events: none;
        `;
        
        const container = document.getElementById('liveLikesContainer');
        if (container) {
            heart.style.left = Math.random() * 100 + 'px';
            container.appendChild(heart);
            setTimeout(() => heart.remove(), 1000);
        }
        
        // Update like count display
        updateLiveStats();
    };
    
    const updateLiveStats = () => {
        const likeCount = document.getElementById('liveLikeCount');
        if (likeCount && liveState.currentStream) {
            likeCount.textContent = liveState.currentStream.likes;
        }
    };
    
    // ============================================
    // ACTIVE LIVE STREAMS RO'YXATI
    // ============================================
    const showActiveLiveStreams = () => {
        const activeStreams = liveState.streams.filter(s => !s.endTime);
        
        let liveModal = document.getElementById('activeLiveModal');
        if (!liveModal) {
            liveModal = document.createElement('div');
            liveModal.id = 'activeLiveModal';
            liveModal.className = 'modal';
            document.body.appendChild(liveModal);
        }
        
        liveModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-circle" style="color: #ff0000; font-size: 14px;"></i> Jonli efirlar</h2>
                    <button class="close-modal" id="closeActiveLiveModal">&times;</button>
                </div>
                <div class="modal-body">
                    ${activeStreams.length === 0 ? 
                        '<p style="text-align: center; color: #888;">Hozircha jonli efirlar yo\'q</p>' :
                        activeStreams.map(stream => `
                            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; border-bottom: 1px solid #1a1a1a; cursor: pointer;" onclick="window.joinLiveStream('${stream.id}')">
                                <div style="background: #ff0000; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-video"></i>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600;">${escapeHtml(stream.userName)}</div>
                                    <div style="font-size: 12px; color: #888;">👁️ ${stream.viewers} | ❤️ ${stream.likes}</div>
                                </div>
                                <button style="background: #ff0000; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer;">Qo'shilish</button>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        liveModal.style.display = 'flex';
        document.getElementById('closeActiveLiveModal')?.addEventListener('click', () => {
            liveModal.style.display = 'none';
        });
    };
    
    // ============================================
    // LIVE STREAMGA QO'SHILISH
    // ============================================
    window.joinLiveStream = (streamId) => {
        const stream = liveState.streams.find(s => s.id === streamId);
        if (!stream || stream.endTime) {
            showToast('❌ Bu efir tugagan!');
            return;
        }
        
        showToast(`🔴 ${stream.userName} ning jonli efiriga qo'shildingiz!`);
        // In real app, this would connect to WebRTC stream
    };
    
    // ============================================
    // YORDAMCHI FUNKSIYALAR
    // ============================================
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
    
    const getCurrentUserAvatar = () => {
        const savedUser = localStorage.getItem('nova_user');
        if (savedUser) {
            try { return JSON.parse(savedUser).avatarUrl || 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=User'; } catch(e) {}
        }
        return 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=User';
    };
    
    const addLiveCoins = (amount, reason) => {
        // Call Nova Coin system if available
        if (window.addNovaCoins) {
            window.addNovaCoins(amount, reason);
        }
    };
    
    const saveLiveData = () => {
        localStorage.setItem(CONFIG.STORAGE_LIVE, JSON.stringify(liveState.streams));
    };
    
    const saveLiveChat = () => {
        localStorage.setItem(CONFIG.STORAGE_LIVE_CHAT, JSON.stringify(liveState.liveChat.slice(-100)));
    };
    
    const loadLiveData = () => {
        const savedStreams = localStorage.getItem(CONFIG.STORAGE_LIVE);
        if (savedStreams) {
            try { liveState.streams = JSON.parse(savedStreams); } catch(e) {}
        }
        
        const savedChat = localStorage.getItem(CONFIG.STORAGE_LIVE_CHAT);
        if (savedChat) {
            try { liveState.liveChat = JSON.parse(savedChat); } catch(e) {}
        }
    };
    
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
    // LIVE TUGMASINI QO'SHISH
    // ============================================
    const addLiveButton = () => {
        const topIcons = document.querySelector('.top-icons');
        if (topIcons && !document.getElementById('liveIcon')) {
            const liveIcon = document.createElement('i');
            liveIcon.id = 'liveIcon';
            liveIcon.className = 'fas fa-circle';
            liveIcon.style.cssText = 'color: #ff0000; cursor: pointer; font-size: 22px; text-shadow: 0 0 5px #ff0000; animation: pulse 1.5s infinite;';
            liveIcon.title = 'Jonli efir';
            liveIcon.addEventListener('click', () => {
                createLiveModal();
                document.getElementById('liveModal').style.display = 'flex';
            });
            topIcons.appendChild(liveIcon);
        }
        
        // Add CSS animation if not exists
        if (!document.querySelector('#liveAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'liveAnimationStyle';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // ============================================
    // SIDEBARGA LIVE QO'SHISH
    // ============================================
    const addLiveToSidebar = () => {
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav && !document.querySelector('[data-page="live"]')) {
            const liveNav = document.createElement('div');
            liveNav.className = 'nav-item';
            liveNav.setAttribute('data-page', 'live');
            liveNav.innerHTML = '<i class="fas fa-circle" style="color: #ff0000;"></i><span>Jonli efirlar</span>';
            liveNav.addEventListener('click', () => {
                showActiveLiveStreams();
            });
            sidebarNav.appendChild(liveNav);
        }
    };
    
    // ============================================
    // INIT
    // ============================================
    const init = () => {
        console.log('🔴 Nova Live Stream tizimi initializing...');
        loadLiveData();
        addLiveButton();
        addLiveToSidebar();
        
        // Add floating heart click on video area
        const liveVideo = document.getElementById('liveVideo');
        if (liveVideo) {
            liveVideo.addEventListener('dblclick', addLiveLike);
        }
        
        window.addLiveLike = addLiveLike;
        window.joinLiveStream = joinLiveStream;
        
        console.log('✅ Nova Live Stream tizimi ready!');
    };
    
    // Observer for dynamic content
    const observer = new MutationObserver(() => {
        if (!document.getElementById('liveIcon')) {
            addLiveButton();
        }
        if (!document.querySelector('[data-page="live"]')) {
            addLiveToSidebar();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
</script>
