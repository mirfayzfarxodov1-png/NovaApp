// ============================================
// NOVA REELS TIZIMI (reels-system.js)
// QISQA VIDEOLAR - MAKSIMAL 5 DAKIKA
// TikTok style cheksiz skroll
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('📱 NOVA Reels tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        MAX_REEL_DURATION: 300, // 5 daqiqa = 300 sekund
        MAX_REEL_SIZE: 500 * 1024 * 1024, // 500 MB
        STORAGE_REELS: 'nova_reels',
        COINS_PER_REEL_LIKE: 1,
        COINS_PER_REEL_VIEW: 0.3
    };
    
    // ============================================
    // STATE
    // ============================================
    let reelsState = {
        reels: [],
        currentReelIndex: 0,
        isPlaying: true,
        muted: false,
        volume: 1
    };
    
    // ============================================
    // REELS MODAL YARATISH
    // ============================================
    const createReelsModal = () => {
        if (document.getElementById('reelsModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'reelsModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = '#000';
        modal.innerHTML = `
            <div style="position: relative; width: 100%; max-width: 400px; height: 100vh; max-height: 800px; background: #000; overflow: hidden;">
                <!-- Video Container -->
                <div id="reelsContainer" style="height: 100%; overflow-y: scroll; scroll-snap-type: y mandatory;">
                    <!-- Reels will be inserted here -->
                </div>
                
                <!-- Close Button -->
                <button id="closeReelsBtn" style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.5); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 100;">
                    <i class="fas fa-arrow-left"></i>
                </button>
                
                <!-- Upload Button -->
                <button id="uploadReelBtn" style="position: absolute; bottom: 20px; right: 20px; background: #ff0000; border: none; color: white; font-size: 20px; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; z-index: 100; box-shadow: 0 4px 15px rgba(255,0,0,0.3);">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close button
        document.getElementById('closeReelsBtn')?.addEventListener('click', () => {
            stopAllVideos();
            modal.style.display = 'none';
        });
        
        // Upload button
        document.getElementById('uploadReelBtn')?.addEventListener('click', () => {
            showReelUploadModal();
        });
        
        return modal;
    };
    
    // ============================================
    // REELS UPLOAD MODAL
    // ============================================
    const showReelUploadModal = () => {
        let uploadModal = document.getElementById('reelUploadModal');
        if (!uploadModal) {
            uploadModal = document.createElement('div');
            uploadModal.id = 'reelUploadModal';
            uploadModal.className = 'modal';
            document.body.appendChild(uploadModal);
        }
        
        uploadModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fab fa-tiktok"></i> Reels yuklash</h2>
                    <button class="close-modal" id="closeReelUploadModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="border: 2px dashed #ff0000; border-radius: 16px; padding: 40px; text-align: center; cursor: pointer;" id="reelUploadArea">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #ff0000;"></i>
                        <p>Video yuklash (maksimal 5 daqiqa / 500MB)</p>
                        <p style="font-size: 12px; color: #888;">Vertikal video (9:16) tavsiya etiladi</p>
                        <input type="file" id="reelFileInput" accept="video/*" hidden>
                    </div>
                    
                    <div id="reelPreview" style="display: none; margin-top: 15px;">
                        <video id="reelPreviewVideo" controls style="width: 100%; border-radius: 12px; max-height: 300px;"></video>
                        <div id="durationWarning" style="color: #ff0000; font-size: 12px; margin-top: 5px; display: none;"></div>
                    </div>
                    
                    <input type="text" id="reelCaption" placeholder="Reels matni..." style="width: 100%; margin-top: 15px; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;">
                    
                    <input type="text" id="reelMusic" placeholder="Musiqa nomi (ixtiyoriy)..." style="width: 100%; margin-top: 10px; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;">
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <select id="reelPrivacy" style="flex: 1; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;">
                            <option value="public">Hamma ko'rishi mumkin</option>
                            <option value="subscribers">Obunachilar uchun</option>
                            <option value="private">Faqat men</option>
                        </select>
                        <button id="publishReelBtn" style="background: #ff0000; color: white; border: none; padding: 12px 24px; border-radius: 30px; cursor: pointer;">
                            <i class="fas fa-paper-plane"></i> Yuklash
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        uploadModal.style.display = 'flex';
        
        // Close button
        document.getElementById('closeReelUploadModal')?.addEventListener('click', () => {
            uploadModal.style.display = 'none';
            resetUploadForm();
        });
        
        // Upload area click
        const uploadArea = document.getElementById('reelUploadArea');
        const fileInput = document.getElementById('reelFileInput');
        
        uploadArea?.addEventListener('click', () => {
            fileInput?.click();
        });
        
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                validateAndPreviewReel(file);
            }
        });
        
        // Publish button
        document.getElementById('publishReelBtn')?.addEventListener('click', () => {
            const file = fileInput?.files[0];
            if (file) {
                publishReel(file);
            } else {
                showToast('❌ Videoni tanlang!');
            }
        });
    };
    
    // ============================================
    // REEL VALIDATION VA PREVIEW
    // ============================================
    const validateAndPreviewReel = (file) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            const duration = video.duration;
            const warningDiv = document.getElementById('durationWarning');
            const previewDiv = document.getElementById('reelPreview');
            const previewVideo = document.getElementById('reelPreviewVideo');
            
            if (duration > CONFIG.MAX_REEL_DURATION) {
                if (warningDiv) {
                    warningDiv.style.display = 'block';
                    warningDiv.innerHTML = `⚠️ Video juda uzun! Maksimal ${CONFIG.MAX_REEL_DURATION / 60} daqiqa. Sizning videongiz: ${Math.floor(duration / 60)}:${Math.floor(duration % 60)}`;
                }
                document.getElementById('publishReelBtn')?.setAttribute('disabled', 'disabled');
                document.getElementById('publishReelBtn')?.style.setProperty('opacity', '0.5');
            } else {
                if (warningDiv) warningDiv.style.display = 'none';
                document.getElementById('publishReelBtn')?.removeAttribute('disabled');
                document.getElementById('publishReelBtn')?.style.setProperty('opacity', '1');
            }
            
            if (file.size > CONFIG.MAX_REEL_SIZE) {
                if (warningDiv) {
                    warningDiv.style.display = 'block';
                    warningDiv.innerHTML += `<br>⚠️ Video hajmi juda katta! Maksimal ${CONFIG.MAX_REEL_SIZE / (1024 * 1024)} MB`;
                }
                document.getElementById('publishReelBtn')?.setAttribute('disabled', 'disabled');
            }
            
            if (previewDiv && previewVideo) {
                previewDiv.style.display = 'block';
                const url = URL.createObjectURL(file);
                previewVideo.src = url;
                previewVideo.load();
            }
        };
        video.src = URL.createObjectURL(file);
    };
    
    // ============================================
    // REEL PUBLISH QILISH
    // ============================================
    const publishReel = (file) => {
        const caption = document.getElementById('reelCaption')?.value || '';
        const music = document.getElementById('reelMusic')?.value || '';
        const privacy = document.getElementById('reelPrivacy')?.value || 'public';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newReel = {
                id: 'reel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                userId: getCurrentUserId(),
                userName: getCurrentUserName(),
                userAvatar: getCurrentUserAvatar(),
                videoUrl: e.target.result,
                caption: caption,
                music: music,
                privacy: privacy,
                likes: 0,
                comments: [],
                shares: 0,
                views: 0,
                createdAt: new Date().toISOString(),
                duration: 0,
                liked: false,
                saved: false
            };
            
            // Get duration
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                newReel.duration = video.duration;
                reelsState.reels.unshift(newReel);
                saveReelsData();
                
                // Also save as regular post for feed
                saveAsPost(newReel);
                
                showToast('✅ Reels yuklandi!');
                document.getElementById('reelUploadModal')?.style.display = 'none';
                resetUploadForm();
                renderReels();
            };
            video.src = newReel.videoUrl;
        };
        reader.readAsDataURL(file);
    };
    
    const saveAsPost = (reel) => {
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const newPost = {
            id: reel.id,
            userId: reel.userId,
            userName: reel.userName,
            userAvatar: reel.userAvatar,
            caption: `📱 REELS | ${reel.caption || 'Video'}`,
            mediaUrl: reel.videoUrl,
            mediaType: 'video',
            likes: 0,
            comments: [],
            shares: 0,
            views: 0,
            time: 'hoziroq',
            liked: false,
            isReel: true
        };
        posts.unshift(newPost);
        localStorage.setItem('nova_posts', JSON.stringify(posts));
        if (window.renderFeed) window.renderFeed();
    };
    
    // ============================================
    // REELS RENDER QILISH
    // ============================================
    const renderReels = () => {
        const container = document.getElementById('reelsContainer');
        if (!container) return;
        
        // Filter reels by privacy
        let visibleReels = reelsState.reels.filter(r => {
            if (r.privacy === 'public') return true;
            if (r.privacy === 'subscribers' && window.isSubscribed?.(r.userId)) return true;
            if (r.privacy === 'private' && r.userId === getCurrentUserId()) return true;
            if (r.userId === getCurrentUserId()) return true;
            return false;
        });
        
        if (visibleReels.length === 0) {
            container.innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #888; text-align: center; padding: 20px;">
                    <i class="fas fa-film" style="font-size: 64px; margin-bottom: 20px;"></i>
                    <p>Hozircha reelslar yo'q</p>
                    <p style="font-size: 12px;">Birinchi reelsni yuklang!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = visibleReels.map((reel, index) => `
            <div class="reel-item" data-reel-id="${reel.id}" data-index="${index}" style="height: 100%; scroll-snap-align: start; position: relative; background: #000;">
                <video class="reel-video" src="${reel.videoUrl}" preload="metadata" playsinline style="width: 100%; height: 100%; object-fit: contain;"></video>
                
                <!-- Overlay -->
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <img src="${reel.userAvatar}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #ff0000; cursor: pointer;" onclick="window.showChannelPage('${reel.userId}')">
                        <div>
                            <div style="font-weight: 600; cursor: pointer;" onclick="window.showChannelPage('${reel.userId}')">${escapeHtml(reel.userName)}</div>
                            ${reel.music ? `<div style="font-size: 11px; color: #ff0000;"><i class="fas fa-music"></i> ${escapeHtml(reel.music)}</div>` : ''}
                        </div>
                        <button class="subscribe-reel-btn" data-user-id="${reel.userId}" style="background: none; border: 1px solid #ff0000; color: #ff0000; padding: 5px 15px; border-radius: 20px; font-size: 12px; cursor: pointer; margin-left: auto;">
                            ${window.isSubscribed?.(reel.userId) ? 'Obunada' : 'Obuna'}
                        </button>
                    </div>
                    <p style="font-size: 14px; margin-bottom: 10px;">${escapeHtml(reel.caption)}</p>
                </div>
                
                <!-- Right side actions -->
                <div style="position: absolute; right: 10px; bottom: 100px; display: flex; flex-direction: column; gap: 20px;">
                    <div style="text-align: center;">
                        <button class="reel-like-btn" data-reel-id="${reel.id}" style="background: none; border: none; color: ${reel.liked ? '#ff0000' : 'white'}; font-size: 28px; cursor: pointer;">
                            <i class="fas fa-heart"></i>
                        </button>
                        <div style="font-size: 12px;">${reel.likes}</div>
                    </div>
                    <div style="text-align: center;">
                        <button class="reel-comment-btn" data-reel-id="${reel.id}" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer;">
                            <i class="fas fa-comment"></i>
                        </button>
                        <div style="font-size: 12px;">${reel.comments?.length || 0}</div>
                    </div>
                    <div style="text-align: center;">
                        <button class="reel-share-btn" data-reel-id="${reel.id}" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer;">
                            <i class="fas fa-share"></i>
                        </button>
                        <div style="font-size: 12px;">${reel.shares || 0}</div>
                    </div>
                    <div style="text-align: center;">
                        <button class="reel-save-btn" data-reel-id="${reel.id}" style="background: none; border: none; color: ${reel.saved ? '#ffd700' : 'white'}; font-size: 28px; cursor: pointer;">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Duration badge -->
                <div style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                    ${formatDuration(reel.duration)}
                </div>
            </div>
        `).join('');
        
        attachReelEvents();
    };
    
    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // ============================================
    // REEL EVENTLARI
    // ============================================
    const attachReelEvents = () => {
        // Video scroll observer
        const container = document.getElementById('reelsContainer');
        if (!container) return;
        
        // Observe which video is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const reelDiv = entry.target.closest('.reel-item');
                if (!reelDiv) return;
                
                const video = reelDiv.querySelector('.reel-video');
                if (!video) return;
                
                if (entry.isIntersecting) {
                    // Play video
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                    // Add view
                    const reelId = reelDiv.dataset.reelId;
                    addReelView(reelId);
                } else {
                    // Pause video
                    video.pause();
                }
            });
        }, { threshold: 0.5 });
        
        document.querySelectorAll('.reel-item').forEach(item => {
            observer.observe(item);
        });
        
        // Like buttons
        document.querySelectorAll('.reel-like-btn').forEach(btn => {
            btn.removeEventListener('click', likeHandler);
            btn.addEventListener('click', likeHandler);
        });
        
        // Subscribe buttons
        document.querySelectorAll('.subscribe-reel-btn').forEach(btn => {
            btn.removeEventListener('click', subscribeHandler);
            btn.addEventListener('click', subscribeHandler);
        });
        
        // Comment buttons
        document.querySelectorAll('.reel-comment-btn').forEach(btn => {
            btn.removeEventListener('click', commentHandler);
            btn.addEventListener('click', commentHandler);
        });
        
        // Share buttons
        document.querySelectorAll('.reel-share-btn').forEach(btn => {
            btn.removeEventListener('click', shareHandler);
            btn.addEventListener('click', shareHandler);
        });
        
        // Save buttons
        document.querySelectorAll('.reel-save-btn').forEach(btn => {
            btn.removeEventListener('click', saveHandler);
            btn.addEventListener('click', saveHandler);
        });
    };
    
    const likeHandler = (e) => {
        e.stopPropagation();
        const reelId = this.dataset.reelId;
        const reel = reelsState.reels.find(r => r.id === reelId);
        if (reel) {
            reel.liked = !reel.liked;
            reel.likes += reel.liked ? 1 : -1;
            this.style.color = reel.liked ? '#ff0000' : 'white';
            this.querySelector('.like-count')?.remove();
            this.innerHTML = `<i class="fas fa-heart"></i>`;
            
            // Add floating animation
            createFloatingHeart(this);
            
            // Add coins
            if (reel.liked && window.addNovaCoins) {
                window.addNovaCoins(CONFIG.COINS_PER_REEL_LIKE, `Reels like: ${reel.caption || 'video'}`);
            }
            
            saveReelsData();
        }
    };
    
    const subscribeHandler = (e) => {
        e.stopPropagation();
        const userId = this.dataset.userId;
        if (window.toggleSubscribe) {
            window.toggleSubscribe(userId);
            // Update button text
            setTimeout(() => {
                const isSubscribed = window.isSubscribed?.(userId);
                this.textContent = isSubscribed ? 'Obunada' : 'Obuna';
                this.style.borderColor = isSubscribed ? '#ff0000' : '#ff0000';
                this.style.color = isSubscribed ? '#ff0000' : '#ff0000';
            }, 100);
        }
    };
    
    const commentHandler = (e) => {
        e.stopPropagation();
        const reelId = this.dataset.reelId;
        showReelCommentModal(reelId);
    };
    
    const shareHandler = (e) => {
        e.stopPropagation();
        const reelId = this.dataset.reelId;
        const reel = reelsState.reels.find(r => r.id === reelId);
        if (reel) {
            // Copy link to clipboard
            const link = `${window.location.origin}?reel=${reelId}`;
            navigator.clipboard.writeText(link);
            showToast('🔗 Reels havolasi nusxalandi!');
            
            reel.shares = (reel.shares || 0) + 1;
            saveReelsData();
        }
    };
    
    const saveHandler = (e) => {
        e.stopPropagation();
        const reelId = this.dataset.reelId;
        const reel = reelsState.reels.find(r => r.id === reelId);
        if (reel) {
            reel.saved = !reel.saved;
            this.style.color = reel.saved ? '#ffd700' : 'white';
            showToast(reel.saved ? '✅ Saqlandi!' : '❌ Saqlashdan olib tashlandi');
            saveReelsData();
        }
    };
    
    const createFloatingHeart = (btn) => {
        const rect = btn.getBoundingClientRect();
        const heart = document.createElement('div');
        heart.innerHTML = '❤️';
        heart.style.cssText = `
            position: fixed;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            font-size: 40px;
            animation: floatUpReel 1s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
    };
    
    // ============================================
    // REEL COMMENT MODAL
    // ============================================
    const showReelCommentModal = (reelId) => {
        const reel = reelsState.reels.find(r => r.id === reelId);
        if (!reel) return;
        
        let modal = document.getElementById('reelCommentModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'reelCommentModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-comments"></i> Kommentlar (${reel.comments?.length || 0})</h2>
                    <button class="close-modal" id="closeReelCommentModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="reelCommentsList" style="max-height: 400px; overflow-y: auto; margin-bottom: 15px;">
                        ${reel.comments?.length === 0 ? 
                            '<p style="text-align: center; color: #888;">Hozircha kommentlar yo\'q</p>' :
                            reel.comments.map(c => `
                                <div style="display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid #1a1a1a;">
                                    <img src="${c.userAvatar}" style="width: 35px; height: 35px; border-radius: 50%;">
                                    <div style="flex: 1;">
                                        <div><strong>${escapeHtml(c.userName)}</strong> <span style="font-size: 10px; color: #888;">${new Date(c.timestamp).toLocaleString()}</span></div>
                                        <div style="font-size: 14px;">${escapeHtml(c.text)}</div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="reelCommentInput" placeholder="Komment yozing..." style="flex: 1; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 20px; padding: 12px; color: white;">
                        <button id="sendReelCommentBtn" data-reel-id="${reelId}" style="background: #ff0000; border: none; padding: 12px 20px; border-radius: 20px; cursor: pointer;">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('closeReelCommentModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('sendReelCommentBtn')?.addEventListener('click', () => {
            const input = document.getElementById('reelCommentInput');
            const comment = input?.value.trim();
            if (comment) {
                addReelComment(reelId, comment);
                input.value = '';
                showReelCommentModal(reelId); // Refresh
            }
        });
    };
    
    const addReelComment = (reelId, commentText) => {
        const reel = reelsState.reels.find(r => r.id === reelId);
        if (!reel) return;
        
        if (!reel.comments) reel.comments = [];
        reel.comments.push({
            id: Date.now(),
            userId: getCurrentUserId(),
            userName: getCurrentUserName(),
            userAvatar: getCurrentUserAvatar(),
            text: commentText,
            timestamp: new Date().toISOString()
        });
        
        saveReelsData();
        showToast('💬 Komment qoldirildi!');
        
        // Add coins for commenting
        if (window.addNovaCoins) {
            window.addNovaCoins(2, `Reels komment: ${reel.caption || 'video'}`);
        }
    };
    
    const addReelView = (reelId) => {
        const reel = reelsState.reels.find(r => r.id === reelId);
        if (reel && reel.userId !== getCurrentUserId()) {
            reel.views = (reel.views || 0) + 1;
            saveReelsData();
            
            // Add coins for view
            if (window.addNovaCoins) {
                window.addNovaCoins(CONFIG.COINS_PER_REEL_VIEW, `Reels ko'rilgan: ${reel.caption || 'video'}`);
            }
        }
    };
    
    const stopAllVideos = () => {
        document.querySelectorAll('.reel-video').forEach(video => {
            video.pause();
        });
    };
    
    // ============================================
    // STORAGE FUNKSIYALARI
    // ============================================
    const loadReelsData = () => {
        const saved = localStorage.getItem(CONFIG.STORAGE_REELS);
        if (saved) {
            try {
                reelsState.reels = JSON.parse(saved);
            } catch(e) {}
        }
        
        // Also load reels from posts
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const reelPosts = posts.filter(p => p.isReel);
        reelPosts.forEach(post => {
            if (!reelsState.reels.find(r => r.id === post.id)) {
                reelsState.reels.unshift({
                    id: post.id,
                    userId: post.userId,
                    userName: post.userName,
                    userAvatar: post.userAvatar,
                    videoUrl: post.mediaUrl,
                    caption: post.caption?.replace('📱 REELS | ', '') || '',
                    music: '',
                    privacy: 'public',
                    likes: post.likes || 0,
                    comments: post.comments || [],
                    shares: post.shares || 0,
                    views: post.views || 0,
                    createdAt: new Date().toISOString(),
                    duration: 0,
                    liked: post.liked || false,
                    saved: false
                });
            }
        });
    };
    
    const saveReelsData = () => {
        localStorage.setItem(CONFIG.STORAGE_REELS, JSON.stringify(reelsState.reels));
        
        // Sync with posts
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        reelsState.reels.forEach(reel => {
            const postIndex = posts.findIndex(p => p.id === reel.id);
            if (postIndex !== -1) {
                posts[postIndex].likes = reel.likes;
                posts[postIndex].comments = reel.comments;
                posts[postIndex].shares = reel.shares;
                posts[postIndex].views = reel.views;
                posts[postIndex].liked = reel.liked;
            }
        });
        localStorage.setItem('nova_posts', JSON.stringify(posts));
        
        if (window.renderFeed) window.renderFeed();
    };
    
    const resetUploadForm = () => {
        const fileInput = document.getElementById('reelFileInput');
        const previewDiv = document.getElementById('reelPreview');
        const caption = document.getElementById('reelCaption');
        const music = document.getElementById('reelMusic');
        
        if (fileInput) fileInput.value = '';
        if (previewDiv) previewDiv.style.display = 'none';
        if (caption) caption.value = '';
        if (music) music.value = '';
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
    
    window.isSubscribed = (userId) => {
        const subs = JSON.parse(localStorage.getItem('nova_subscriptions') || '[]');
        return subs.includes(userId);
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
    // REELS TUGMASINI QO'SHISH
    // ============================================
    const addReelsButton = () => {
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav && !document.querySelector('[data-page="reels-page"]')) {
            const reelsNav = document.createElement('div');
            reelsNav.className = 'nav-item';
            reelsNav.setAttribute('data-page', 'reels-page');
            reelsNav.innerHTML = '<i class="fas fa-clapperboard"></i><span>Reels</span>';
            reelsNav.addEventListener('click', () => {
                createReelsModal();
                renderReels();
                document.getElementById('reelsModal').style.display = 'flex';
            });
            
            // Insert after explore
            const exploreNav = document.querySelector('[data-page="explore"]');
            if (exploreNav && exploreNav.parentNode) {
                exploreNav.parentNode.insertBefore(reelsNav, exploreNav.nextSibling);
            } else {
                sidebarNav.appendChild(reelsNav);
            }
        }
    };
    
    // ============================================
    // INIT
    // ============================================
    const init = () => {
        console.log('📱 Nova Reels tizimi initializing...');
        loadReelsData();
        addReelsButton();
        
        // Add CSS animation for floating heart
        if (!document.querySelector('#reelsAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'reelsAnimationStyle';
            style.textContent = `
                @keyframes floatUpReel {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
                .reel-item {
                    scroll-snap-align: start;
                    scroll-snap-stop: always;
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('✅ Nova Reels tizimi ready!');
    };
    
    const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-page="reels-page"]')) {
            addReelsButton();
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
