// ============================================
// NOVA STORIES TIZIMI (stories-system.js)
// 24 SOATLIK HIKOYALAR
// Video: 5 min (oddiy) / 10 min (galichkali)
// Reaksiyalar: 10+ xil
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('📸 NOVA Stories tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        STORAGE_STORIES: 'nova_stories',
        STORAGE_HIGHLIGHTS: 'nova_highlights',
        STORY_DURATION: 24 * 60 * 60 * 1000, // 24 soat
        MAX_STORY_VIDEO_NORMAL: 300, // 5 daqiqa = 300 sekund
        MAX_STORY_VIDEO_BADGE: 600, // 10 daqiqa = 600 sekund
        MAX_STORY_SIZE: 100 * 1024 * 1024, // 100 MB
        STORIES_PER_USER: 10,
        AUTO_DELETE_INTERVAL: 3600000 // 1 soat
    };
    
    // ============================================
    // STATE
    // ============================================
    let storiesState = {
        stories: [],           // All active stories
        highlights: [],        // Saved highlights
        viewedStories: [],     // Which stories user has viewed
        currentStoryIndex: 0,
        currentStoryUserId: null,
        storyInterval: null
    };
    
    // ============================================
    // REAKSIYALAR RO'YXATI
    // ============================================
    const REACTIONS = [
        { id: 'like', emoji: '❤️', name: 'Layk', color: '#ff0000' },
        { id: 'love', emoji: '😍', name: 'Muhabbat', color: '#ff69b4' },
        { id: 'laugh', emoji: '😂', name: 'Kulgi', color: '#ffcc00' },
        { id: 'wow', emoji: '😮', name: 'Ajablanib', color: '#ff9900' },
        { id: 'sad', emoji: '😢', name: 'Qayg'u', color: '#3399ff' },
        { id: 'angry', emoji: '😡', name: 'Jahl', color: '#ff3300' },
        { id: 'clap', emoji: '👏', name: 'Qarsak', color: '#ffcc00' },
        { id: 'fire', emoji: '🔥', name: 'Olov', color: '#ff6600' },
        { id: 'cool', emoji: '😎', name: 'Zo'r', color: '#00ccff' },
        { id: 'heart', emoji: '💖', name: 'Yurak', color: '#ff1493' },
        { id: 'star', emoji: '⭐', name: 'Yulduz', color: '#ffd700' },
        { id: 'pray', emoji: '🙏', name: 'Dua', color: '#66cc66' }
    ];
    
    // ============================================
    // FOYDALANUVCHINING MAXSUS HUQUQLARI
    // ============================================
    const getUserMaxDuration = () => {
        // Check if user has badge
        const badgeState = localStorage.getItem('nova_badge_state');
        if (badgeState) {
            try {
                const state = JSON.parse(badgeState);
                if (state.currentUser?.hasBadge) {
                    return CONFIG.MAX_STORY_VIDEO_BADGE;
                }
            } catch(e) {}
        }
        return CONFIG.MAX_STORY_VIDEO_NORMAL;
    };
    
    // ============================================
    // STORIES MODAL YARATISH
    // ============================================
    const createStoriesModal = () => {
        if (document.getElementById('storiesModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'storiesModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.style.background = '#000';
        modal.innerHTML = `
            <div style="position: relative; width: 100%; max-width: 450px; height: 100vh; max-height: 800px; background: #000; margin: auto; overflow: hidden;">
                <!-- Progress bars -->
                <div id="storyProgressContainer" style="position: absolute; top: 10px; left: 10px; right: 10px; display: flex; gap: 4px; z-index: 20;">
                    <!-- Progress bars will be inserted here -->
                </div>
                
                <!-- Story content -->
                <div id="storyContent" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <!-- Story media will be inserted here -->
                </div>
                
                <!-- Left/Right navigation -->
                <div style="position: absolute; top: 0; left: 0; width: 20%; height: 100%; z-index: 15; cursor: pointer;" id="prevStoryBtn"></div>
                <div style="position: absolute; top: 0; right: 0; width: 20%; height: 100%; z-index: 15; cursor: pointer;" id="nextStoryBtn"></div>
                
                <!-- Close button -->
                <button id="closeStoriesBtn" style="position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.6); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; z-index: 20;">
                    <i class="fas fa-times"></i>
                </button>
                
                <!-- Reactions panel -->
                <div id="reactionsPanel" style="position: absolute; bottom: 80px; right: 20px; z-index: 20;">
                    <button id="showReactionsBtn" style="background: rgba(0,0,0,0.6); border: none; color: white; font-size: 28px; width: 50px; height: 50px; border-radius: 50%; cursor: pointer;">
                        😍
                    </button>
                    <div id="reactionsList" style="position: absolute; bottom: 60px; right: 0; background: #1a1a1a; border-radius: 30px; padding: 10px; display: none; flex-direction: row; gap: 12px;">
                        ${REACTIONS.map(r => `
                            <div class="reaction-emoji" data-reaction="${r.id}" style="font-size: 28px; cursor: pointer; transition: transform 0.2s;">${r.emoji}</div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Reply input -->
                <div style="position: absolute; bottom: 20px; left: 20px; right: 80px; background: rgba(0,0,0,0.6); border-radius: 30px; padding: 10px 15px; display: flex; gap: 10px; z-index: 20;">
                    <input type="text" id="storyReplyInput" placeholder="Javob yozing..." style="flex: 1; background: none; border: none; color: white; outline: none;">
                    <button id="sendStoryReply" style="background: #ff0000; border: none; padding: 5px 15px; border-radius: 20px; color: white; cursor: pointer;">Yuborish</button>
                </div>
                
                <!-- Viewer info -->
                <div id="viewerInfo" style="position: absolute; top: 60px; left: 20px; background: rgba(0,0,0,0.6); padding: 5px 12px; border-radius: 20px; font-size: 11px; z-index: 20; display: none;">
                    <i class="fas fa-eye"></i> <span id="viewerCount">0</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('closeStoriesBtn')?.addEventListener('click', () => {
            stopStoryTimer();
            modal.style.display = 'none';
        });
        
        document.getElementById('prevStoryBtn')?.addEventListener('click', () => {
            prevStory();
        });
        
        document.getElementById('nextStoryBtn')?.addEventListener('click', () => {
            nextStory();
        });
        
        document.getElementById('showReactionsBtn')?.addEventListener('click', () => {
            const panel = document.getElementById('reactionsList');
            panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
        });
        
        document.querySelectorAll('.reaction-emoji').forEach(emoji => {
            emoji.addEventListener('click', () => {
                const reaction = emoji.dataset.reaction;
                sendStoryReaction(reaction);
                document.getElementById('reactionsList').style.display = 'none';
            });
        });
        
        document.getElementById('sendStoryReply')?.addEventListener('click', () => {
            sendStoryReply();
        });
        
        document.getElementById('storyReplyInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendStoryReply();
        });
        
        return modal;
    };
    
    // ============================================
    // STORY YUKLASH MODALI
    // ============================================
    const createStoryUploadModal = () => {
        if (document.getElementById('storyUploadModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'storyUploadModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-camera"></i> Story yuklash</h2>
                    <button class="close-modal" id="closeStoryUploadModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="storyUploadArea" style="border: 2px dashed #ff0000; border-radius: 16px; padding: 40px; text-align: center; cursor: pointer;">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #ff0000;"></i>
                        <p>Rasm yoki video yuklang</p>
                        <p id="uploadLimitInfo" style="font-size: 12px; color: #888;"></p>
                        <input type="file" id="storyFileInput" accept="image/*,video/*" hidden>
                    </div>
                    <div id="storyPreview" style="display: none; margin-top: 15px;">
                        <div id="storyPreviewMedia" style="width: 100%; border-radius: 12px; overflow: hidden;"></div>
                        <div id="durationWarning" style="color: #ff0000; font-size: 12px; margin-top: 5px; display: none;"></div>
                    </div>
                    <textarea id="storyCaption" placeholder="Story matni..." rows="2" style="width: 100%; margin-top: 15px; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white;"></textarea>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <label style="flex: 1; display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="addToHighlight"> Highlightga qo'shish
                        </label>
                        <button id="publishStoryBtn" style="background: #ff0000; color: white; border: none; padding: 12px 24px; border-radius: 30px; cursor: pointer;">Yuklash</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Update limit info
        const maxDuration = getUserMaxDuration();
        const limitInfo = document.getElementById('uploadLimitInfo');
        if (limitInfo) {
            limitInfo.innerHTML = `Maksimal video uzunligi: ${Math.floor(maxDuration / 60)} daqiqa | Maksimal hajm: 100 MB`;
        }
        
        // Close button
        document.getElementById('closeStoryUploadModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
            resetStoryUploadForm();
        });
        
        // Upload area
        const uploadArea = document.getElementById('storyUploadArea');
        const fileInput = document.getElementById('storyFileInput');
        
        uploadArea?.addEventListener('click', () => fileInput?.click());
        
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) validateAndPreviewStory(file);
        });
        
        // Publish button
        document.getElementById('publishStoryBtn')?.addEventListener('click', () => {
            const file = fileInput?.files[0];
            if (file) publishStory(file);
            else showToast('❌ Fayl tanlang!');
        });
        
        return modal;
    };
    
    // ============================================
    // STORY VALIDATION
    // ============================================
    const validateAndPreviewStory = (file) => {
        const maxDuration = getUserMaxDuration();
        const isVideo = file.type.startsWith('video/');
        const previewDiv = document.getElementById('storyPreview');
        const previewMedia = document.getElementById('storyPreviewMedia');
        const warningDiv = document.getElementById('durationWarning');
        
        if (file.size > CONFIG.MAX_STORY_SIZE) {
            warningDiv.style.display = 'block';
            warningDiv.innerHTML = `⚠️ Fayl hajmi juda katta! Maksimal: ${CONFIG.MAX_STORY_SIZE / (1024 * 1024)} MB`;
            document.getElementById('publishStoryBtn').disabled = true;
            return;
        }
        
        if (isVideo) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                const duration = video.duration;
                if (duration > maxDuration) {
                    warningDiv.style.display = 'block';
                    warningDiv.innerHTML = `⚠️ Video juda uzun! Maksimal: ${Math.floor(maxDuration / 60)} daqiqa (${Math.floor(duration / 60)}:${Math.floor(duration % 60)})`;
                    document.getElementById('publishStoryBtn').disabled = true;
                } else {
                    warningDiv.style.display = 'none';
                    document.getElementById('publishStoryBtn').disabled = false;
                }
                
                previewDiv.style.display = 'block';
                const url = URL.createObjectURL(file);
                previewMedia.innerHTML = `<video src="${url}" controls style="width: 100%; max-height: 300px;"></video>`;
            };
            video.src = URL.createObjectURL(file);
        } else {
            previewDiv.style.display = 'block';
            const url = URL.createObjectURL(file);
            previewMedia.innerHTML = `<img src="${url}" style="width: 100%; border-radius: 12px;">`;
            document.getElementById('publishStoryBtn').disabled = false;
        }
    };
    
    // ============================================
    // STORY PUBLISH QILISH
    // ============================================
    const publishStory = (file) => {
        const caption = document.getElementById('storyCaption')?.value || '';
        const addToHighlight = document.getElementById('addToHighlight')?.checked || false;
        
        // Check if user has too many stories
        const userStories = storiesState.stories.filter(s => s.userId === getCurrentUserId());
        if (userStories.length >= CONFIG.STORIES_PER_USER) {
            // Remove oldest story
            const oldest = userStories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
            storiesState.stories = storiesState.stories.filter(s => s.id !== oldest.id);
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const isVideo = file.type.startsWith('video/');
            const newStory = {
                id: 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                userId: getCurrentUserId(),
                userName: getCurrentUserName(),
                userAvatar: getCurrentUserAvatar(),
                mediaUrl: e.target.result,
                mediaType: isVideo ? 'video' : 'image',
                caption: caption,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + CONFIG.STORY_DURATION).toISOString(),
                views: [],
                reactions: [],
                replies: [],
                highlightId: addToHighlight ? null : null
            };
            
            storiesState.stories.push(newStory);
            
            if (addToHighlight) {
                addToHighlights(newStory);
            }
            
            saveStoriesData();
            renderStoriesList();
            showToast('✅ Story yuklandi! 24 soat davomida ko\'rinadi.');
            
            // Close modal and reset
            document.getElementById('storyUploadModal').style.display = 'none';
            resetStoryUploadForm();
        };
        reader.readAsDataURL(file);
    };
    
    const addToHighlights = (story) => {
        let highlight = storiesState.highlights.find(h => h.userId === getCurrentUserId());
        if (!highlight) {
            highlight = {
                id: 'highlight_' + getCurrentUserId(),
                userId: getCurrentUserId(),
                userName: getCurrentUserName(),
                userAvatar: getCurrentUserAvatar(),
                name: 'Highlights',
                stories: [],
                createdAt: new Date().toISOString()
            };
            storiesState.highlights.push(highlight);
        }
        highlight.stories.push(story);
        saveStoriesData();
    };
    
    // ============================================
    // STORIES RO'YXATINI KO'RSATISH
    // ============================================
    const renderStoriesList = () => {
        const container = document.getElementById('storiesContainer');
        if (!container) return;
        
        // Remove expired stories
        const now = new Date();
        storiesState.stories = storiesState.stories.filter(s => new Date(s.expiresAt) > now);
        
        // Group by user
        const userStories = {};
        storiesState.stories.forEach(story => {
            if (!userStories[story.userId]) {
                userStories[story.userId] = {
                    userId: story.userId,
                    userName: story.userName,
                    userAvatar: story.userAvatar,
                    stories: [],
                    hasUnviewed: false
                };
            }
            userStories[story.userId].stories.push(story);
            
            // Check if user has viewed all stories
            const viewedStories = storiesState.viewedStories.filter(v => v.userId === story.userId);
            const allViewed = userStories[story.userId].stories.every(s => 
                viewedStories.some(v => v.storyId === s.id)
            );
            userStories[story.userId].hasUnviewed = !allViewed;
        });
        
        const users = Object.values(userStories);
        
        if (users.length === 0) {
            container.innerHTML = '<div style="color: #888; text-align: center; padding: 10px;">Hozircha storylar yo\'q</div>';
            return;
        }
        
        // Add current user's upload button at the beginning
        const currentUserStory = users.find(u => u.userId === getCurrentUserId());
        if (currentUserStory) {
            const index = users.findIndex(u => u.userId === getCurrentUserId());
            if (index > 0) {
                users.splice(index, 1);
                users.unshift(currentUserStory);
            }
        }
        
        container.innerHTML = `
            <div class="story-upload-btn" id="storyUploadBtn" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; min-width: 75px;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: #ff0000; display: flex; align-items: center; justify-content: center; border: 2px solid #fff;">
                    <i class="fas fa-plus" style="font-size: 28px; color: white;"></i>
                </div>
                <span style="font-size: 12px;">Sizning</span>
            </div>
            ${users.map(user => `
                <div class="story-item" data-user-id="${user.userId}" style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; min-width: 75px;">
                    <div class="story-ring" style="width: 70px; height: 70px; border-radius: 50%; background: ${user.hasUnviewed ? 'linear-gradient(135deg, #ff0000, #ff6600)' : '#333'}; display: flex; align-items: center; justify-content: center;">
                        <img src="${user.userAvatar}" class="story-img" style="width: 65px; height: 65px; border-radius: 50%; object-fit: cover; border: 2px solid #000;">
                    </div>
                    <span class="story-name" style="font-size: 12px;">${escapeHtml(user.userName.length > 10 ? user.userName.slice(0,8)+'...' : user.userName)}</span>
                </div>
            `).join('')}
        `;
        
        // Add event listeners
        document.getElementById('storyUploadBtn')?.addEventListener('click', () => {
            createStoryUploadModal();
            document.getElementById('storyUploadModal').style.display = 'flex';
        });
        
        document.querySelectorAll('.story-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                openUserStories(userId);
            });
        });
    };
    
    // ============================================
    // STORY KO'RSATISH
    // ============================================
    const openUserStories = (userId) => {
        const userStories = storiesState.stories.filter(s => s.userId === userId);
        if (userStories.length === 0) return;
        
        storiesState.currentStoryUserId = userId;
        storiesState.currentStoryIndex = 0;
        
        // Mark as viewed
        userStories.forEach(story => {
            if (!storiesState.viewedStories.some(v => v.storyId === story.id)) {
                storiesState.viewedStories.push({
                    storyId: story.id,
                    userId: userId,
                    viewedAt: new Date().toISOString()
                });
            }
        });
        
        saveStoriesData();
        renderStoriesList();
        showStory(0);
        
        const modal = document.getElementById('storiesModal');
        modal.style.display = 'flex';
        startStoryTimer();
    };
    
    const showStory = (index) => {
        const userStories = storiesState.stories.filter(s => s.userId === storiesState.currentStoryUserId);
        const story = userStories[index];
        if (!story) return;
        
        const contentDiv = document.getElementById('storyContent');
        const progressContainer = document.getElementById('storyProgressContainer');
        
        // Render progress bars
        progressContainer.innerHTML = userStories.map((s, i) => `
            <div style="flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 3px; overflow: hidden;">
                <div id="progress_${i}" style="width: ${i < index ? '100%' : i === index ? '0%' : '0%'}; height: 100%; background: white; transition: width 0.1s linear;"></div>
            </div>
        `).join('');
        
        // Render content
        if (story.mediaType === 'video') {
            contentDiv.innerHTML = `
                <video id="storyVideo" src="${story.mediaUrl}" autoplay style="width: 100%; height: 100%; object-fit: contain;"></video>
                <div id="storyCaption" style="position: absolute; bottom: 100px; left: 20px; right: 80px; background: rgba(0,0,0,0.5); padding: 8px 12px; border-radius: 20px; font-size: 14px;">${escapeHtml(story.caption || '')}</div>
            `;
            
            const video = document.getElementById('storyVideo');
            if (video) {
                video.onended = () => {
                    nextStory();
                };
                video.ontimeupdate = () => {
                    const progress = (video.currentTime / video.duration) * 100;
                    const progressBar = document.getElementById(`progress_${index}`);
                    if (progressBar) progressBar.style.width = `${progress}%`;
                };
            }
        } else {
            contentDiv.innerHTML = `
                <img src="${story.mediaUrl}" style="width: 100%; height: 100%; object-fit: contain;">
                <div id="storyCaption" style="position: absolute; bottom: 100px; left: 20px; right: 80px; background: rgba(0,0,0,0.5); padding: 8px 12px; border-radius: 20px; font-size: 14px;">${escapeHtml(story.caption || '')}</div>
            `;
            
            // Auto progress for images
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                const progressBar = document.getElementById(`progress_${index}`);
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    nextStory();
                }
            }, 100);
            
            // Store interval to clear later
            if (storiesState.storyInterval) clearInterval(storiesState.storyInterval);
            storiesState.storyInterval = interval;
        }
        
        // Update viewer info
        updateStoryViews(story);
        
        // Clear reaction panel
        document.getElementById('reactionsList').style.display = 'none';
    };
    
    const updateStoryViews = (story) => {
        const currentUserId = getCurrentUserId();
        if (!story.views.includes(currentUserId)) {
            story.views.push(currentUserId);
            saveStoriesData();
        }
        
        const viewerCount = story.views.length;
        const viewerInfo = document.getElementById('viewerInfo');
        const viewerCountSpan = document.getElementById('viewerCount');
        if (viewerCount > 0) {
            viewerInfo.style.display = 'block';
            viewerCountSpan.textContent = viewerCount;
        }
    };
    
    const sendStoryReaction = (reactionId) => {
        const userStories = storiesState.stories.filter(s => s.userId === storiesState.currentStoryUserId);
        const story = userStories[storiesState.currentStoryIndex];
        if (!story) return;
        
        const reaction = REACTIONS.find(r => r.id === reactionId);
        if (reaction) {
            story.reactions.push({
                userId: getCurrentUserId(),
                userName: getCurrentUserName(),
                reaction: reactionId,
                emoji: reaction.emoji,
                timestamp: new Date().toISOString()
            });
            saveStoriesData();
            
            // Show floating emoji
            showFloatingEmoji(reaction.emoji);
            showToast(`${reaction.emoji} ${reaction.name} yuborildi!`);
        }
    };
    
    const sendStoryReply = () => {
        const input = document.getElementById('storyReplyInput');
        const replyText = input?.value.trim();
        if (!replyText) return;
        
        const userStories = storiesState.stories.filter(s => s.userId === storiesState.currentStoryUserId);
        const story = userStories[storiesState.currentStoryIndex];
        if (!story) return;
        
        story.replies.push({
            id: Date.now(),
            userId: getCurrentUserId(),
            userName: getCurrentUserName(),
            userAvatar: getCurrentUserAvatar(),
            text: replyText,
            timestamp: new Date().toISOString()
        });
        
        saveStoriesData();
        input.value = '';
        showToast('✅ Javob yuborildi!');
        
        // Add coins for reply
        if (window.addNovaCoins) {
            window.addNovaCoins(1, 'Storyga javob yozildi');
        }
    };
    
    const showFloatingEmoji = (emoji) => {
        const emojiDiv = document.createElement('div');
        emojiDiv.textContent = emoji;
        emojiDiv.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 60px;
            animation: floatEmoji 1s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(emojiDiv);
        setTimeout(() => emojiDiv.remove(), 1000);
    };
    
    const startStoryTimer = () => {
        if (storiesState.storyInterval) clearInterval(storiesState.storyInterval);
        // Timer is handled in showStory
    };
    
    const stopStoryTimer = () => {
        if (storiesState.storyInterval) {
            clearInterval(storiesState.storyInterval);
            storiesState.storyInterval = null;
        }
        const video = document.getElementById('storyVideo');
        if (video) video.pause();
    };
    
    const nextStory = () => {
        const userStories = storiesState.stories.filter(s => s.userId === storiesState.currentStoryUserId);
        if (storiesState.currentStoryIndex + 1 < userStories.length) {
            storiesState.currentStoryIndex++;
            showStory(storiesState.currentStoryIndex);
        } else {
            // Go to next user
            const allUsers = [...new Set(storiesState.stories.map(s => s.userId))];
            const currentUserIndex = allUsers.findIndex(uid => uid === storiesState.currentStoryUserId);
            if (currentUserIndex + 1 < allUsers.length) {
                storiesState.currentStoryUserId = allUsers[currentUserIndex + 1];
                storiesState.currentStoryIndex = 0;
                showStory(0);
            } else {
                // Close stories
                document.getElementById('storiesModal').style.display = 'none';
                stopStoryTimer();
            }
        }
    };
    
    const prevStory = () => {
        if (storiesState.currentStoryIndex > 0) {
            storiesState.currentStoryIndex--;
            showStory(storiesState.currentStoryIndex);
        } else {
            // Go to previous user
            const allUsers = [...new Set(storiesState.stories.map(s => s.userId))];
            const currentUserIndex = allUsers.findIndex(uid => uid === storiesState.currentStoryUserId);
            if (currentUserIndex > 0) {
                storiesState.currentStoryUserId = allUsers[currentUserIndex - 1];
                const userStories = storiesState.stories.filter(s => s.userId === storiesState.currentStoryUserId);
                storiesState.currentStoryIndex = userStories.length - 1;
                showStory(storiesState.currentStoryIndex);
            }
        }
    };
    
    // ============================================
    // HIGHLIGHTS
    // ============================================
    const renderHighlights = () => {
        // This would show highlights on user profile
        const userHighlights = storiesState.highlights.filter(h => h.userId === getCurrentUserId());
        // Implement highlight display on profile page
    };
    
    // ============================================
    // AUTO DELETE EXPIRED STORIES
    // ============================================
    const autoDeleteExpiredStories = () => {
        const now = new Date();
        const beforeCount = storiesState.stories.length;
        storiesState.stories = storiesState.stories.filter(s => new Date(s.expiresAt) > now);
        if (beforeCount !== storiesState.stories.length) {
            saveStoriesData();
            renderStoriesList();
        }
    };
    
    // ============================================
    // STORAGE
    // ============================================
    const loadStoriesData = () => {
        const savedStories = localStorage.getItem(CONFIG.STORAGE_STORIES);
        if (savedStories) {
            try { storiesState.stories = JSON.parse(savedStories); } catch(e) {}
        }
        
        const savedHighlights = localStorage.getItem(CONFIG.STORAGE_HIGHLIGHTS);
        if (savedHighlights) {
            try { storiesState.highlights = JSON.parse(savedHighlights); } catch(e) {}
        }
        
        const savedViewed = localStorage.getItem('nova_viewed_stories');
        if (savedViewed) {
            try { storiesState.viewedStories = JSON.parse(savedViewed); } catch(e) {}
        }
        
        autoDeleteExpiredStories();
    };
    
    const saveStoriesData = () => {
        localStorage.setItem(CONFIG.STORAGE_STORIES, JSON.stringify(storiesState.stories));
        localStorage.setItem(CONFIG.STORAGE_HIGHLIGHTS, JSON.stringify(storiesState.highlights));
        localStorage.setItem('nova_viewed_stories', JSON.stringify(storiesState.viewedStories));
    };
    
    // ============================================
    // YORDAMCHI FUNKSIYALAR
    // ============================================
    const resetStoryUploadForm = () => {
        const fileInput = document.getElementById('storyFileInput');
        const previewDiv = document.getElementById('storyPreview');
        const caption = document.getElementById('storyCaption');
        const highlightCheckbox = document.getElementById('addToHighlight');
        const warningDiv = document.getElementById('durationWarning');
        
        if (fileInput) fileInput.value = '';
        if (previewDiv) previewDiv.style.display = 'none';
        if (caption) caption.value = '';
        if (highlightCheckbox) highlightCheckbox.checked = false;
        if (warningDiv) warningDiv.style.display = 'none';
        
        const publishBtn = document.getElementById('publishStoryBtn');
        if (publishBtn) publishBtn.disabled = false;
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
    
    const getCurrentUserAvatar = () => {
        const savedUser = localStorage.getItem('nova_user');
        if (savedUser) {
            try { return JSON.parse(savedUser).avatarUrl || 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=User'; } catch(e) {}
        }
        return 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=User';
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
    // INIT
    // ============================================
    const init = () => {
        console.log('📸 Nova Stories tizimi initializing...');
        loadStoriesData();
        createStoriesModal();
        
        // Add floating emoji animation
        if (!document.querySelector('#storiesAnimStyle')) {
            const style = document.createElement('style');
            style.id = 'storiesAnimStyle';
            style.textContent = `
                @keyframes floatEmoji {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                    100% { transform: translate(-50%, -150%) scale(1.5); opacity: 0; }
                }
                .reaction-emoji:hover {
                    transform: scale(1.3);
                }
            `;
            document.head.appendChild(style);
        }
        
        // Auto delete expired stories every hour
        setInterval(autoDeleteExpiredStories, CONFIG.AUTO_DELETE_INTERVAL);
        
        console.log('✅ Nova Stories tizimi ready!');
        console.log(`📹 Video limit: Oddiy foydalanuvchi - 5 daqiqa | Galichkali - 10 daqiqa`);
    };
    
    const observer = new MutationObserver(() => {
        if (!document.getElementById('storiesModal')) {
            createStoriesModal();
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
