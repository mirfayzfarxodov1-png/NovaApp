// ============================================
// NOVA TRENDING SYSTEM (trending-system.js)
// TRENDDAGI VIDEOLAR, HASHTAGLAR, CREATORLAR
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('📈 NOVA Trending tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        STORAGE_TRENDING: 'nova_trending',
        TRENDING_UPDATE_INTERVAL: 3600000, // 1 soat
        TOP_CREATORS_COUNT: 50,
        TOP_HASHTAGS_COUNT: 20,
        TRENDING_VIDEOS_COUNT: 100
    };
    
    // ============================================
    // STATE
    // ============================================
    let trendingState = {
        trendingVideos: [],
        trendingHashtags: [],
        topCreators: [],
        weeklyTop: [],
        monthlyTop: [],
        lastUpdate: null,
        currentFilter: 'day' // day, week, month, year
    };
    
    // ============================================
    // TRENDING SAHIFASI MODALI
    // ============================================
    const createTrendingModal = () => {
        if (document.getElementById('trendingModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'trendingModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; width: 95%; max-height: 85vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-chart-line" style="color: #ff0000;"></i> Trendlar</h2>
                    <button class="close-modal" id="closeTrendingModal">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Filter tabs -->
                    <div style="display: flex; gap: 10px; border-bottom: 1px solid #ff000020; margin-bottom: 20px; flex-wrap: wrap;">
                        <button class="trend-filter-btn active" data-filter="day">📅 Bugun</button>
                        <button class="trend-filter-btn" data-filter="week">📆 Hafta</button>
                        <button class="trend-filter-btn" data-filter="month">📅 Oy</button>
                        <button class="trend-filter-btn" data-filter="year">🗓️ Yil</button>
                    </div>
                    
                    <!-- Trending Videos -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="margin-bottom: 15px;"><i class="fas fa-fire" style="color: #ff0000;"></i> Trenddagi videolar</h3>
                        <div id="trendingVideosList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                            <!-- Trending videos will be inserted here -->
                        </div>
                    </div>
                    
                    <!-- Trending Hashtags -->
                    <div style="margin-bottom: 30px; background: #0a0a0a; padding: 20px; border-radius: 16px;">
                        <h3 style="margin-bottom: 15px;"><i class="fas fa-hashtag" style="color: #ff0000;"></i> Trenddagi hashtaglar</h3>
                        <div id="trendingHashtagsList" style="display: flex; flex-wrap: wrap; gap: 12px;">
                            <!-- Trending hashtags will be inserted here -->
                        </div>
                    </div>
                    
                    <!-- Top Creators -->
                    <div>
                        <h3 style="margin-bottom: 15px;"><i class="fas fa-trophy" style="color: #ffd700;"></i> Top creatorlar</h3>
                        <div id="topCreatorsList" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Top creators will be inserted here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close button
        document.getElementById('closeTrendingModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Filter buttons
        document.querySelectorAll('.trend-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.trend-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                trendingState.currentFilter = filter;
                refreshTrendingData();
            });
        });
        
        return modal;
    };
    
    // ============================================
    // TRENDING MA'LUMOTLARNI HISOBLASH
    // ============================================
    const calculateTrendingScore = (post, filter) => {
        const now = new Date();
        const postDate = new Date(post.time);
        let hoursDiff = (now - postDate) / (1000 * 60 * 60);
        
        // Adjust based on filter
        if (filter === 'day') hoursDiff = Math.max(hoursDiff, 1);
        else if (filter === 'week') hoursDiff = hoursDiff / 7;
        else if (filter === 'month') hoursDiff = hoursDiff / 30;
        else if (filter === 'year') hoursDiff = hoursDiff / 365;
        
        // Score formula: (likes * 1 + comments * 2 + shares * 3 + views * 0.5) / hours
        const score = (
            (post.likes || 0) * 1 +
            (post.comments?.length || 0) * 2 +
            (post.shares || 0) * 3 +
            (post.views || 0) * 0.5
        ) / Math.max(hoursDiff, 1);
        
        return score;
    };
    
    const extractHashtags = (text) => {
        if (!text) return [];
        const hashtags = text.match(/#[\w\u0400-\u04FF]+/g) || [];
        return hashtags.map(tag => tag.toLowerCase());
    };
    
    const calculateTrendingHashtags = (posts, filter) => {
        const hashtagCount = {};
        const now = new Date();
        
        posts.forEach(post => {
            const postDate = new Date(post.time);
            let include = false;
            
            if (filter === 'day') include = (now - postDate) < 24 * 60 * 60 * 1000;
            else if (filter === 'week') include = (now - postDate) < 7 * 24 * 60 * 60 * 1000;
            else if (filter === 'month') include = (now - postDate) < 30 * 24 * 60 * 60 * 1000;
            else include = true;
            
            if (include) {
                const hashtags = extractHashtags(post.caption);
                hashtags.forEach(tag => {
                    hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
                });
            }
        });
        
        return Object.entries(hashtagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, CONFIG.TOP_HASHTAGS_COUNT)
            .map(([tag, count]) => ({ tag, count }));
    };
    
    const calculateTopCreators = (posts, filter) => {
        const creatorStats = {};
        const now = new Date();
        
        posts.forEach(post => {
            const postDate = new Date(post.time);
            let include = false;
            
            if (filter === 'day') include = (now - postDate) < 24 * 60 * 60 * 1000;
            else if (filter === 'week') include = (now - postDate) < 7 * 24 * 60 * 60 * 1000;
            else if (filter === 'month') include = (now - postDate) < 30 * 24 * 60 * 60 * 1000;
            else include = true;
            
            if (include) {
                if (!creatorStats[post.userId]) {
                    creatorStats[post.userId] = {
                        userId: post.userId,
                        name: post.userName,
                        avatar: post.userAvatar,
                        totalLikes: 0,
                        totalViews: 0,
                        totalComments: 0,
                        videoCount: 0,
                        score: 0
                    };
                }
                creatorStats[post.userId].totalLikes += post.likes || 0;
                creatorStats[post.userId].totalViews += post.views || 0;
                creatorStats[post.userId].totalComments += post.comments?.length || 0;
                creatorStats[post.userId].videoCount++;
                creatorStats[post.userId].score = 
                    (creatorStats[post.userId].totalLikes * 1 + 
                     creatorStats[post.userId].totalComments * 2 + 
                     creatorStats[post.userId].totalViews * 0.1) / 
                    Math.max(creatorStats[post.userId].videoCount, 1);
            }
        });
        
        return Object.values(creatorStats)
            .sort((a, b) => b.score - a.score)
            .slice(0, CONFIG.TOP_CREATORS_COUNT);
    };
    
    const refreshTrendingData = () => {
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const filter = trendingState.currentFilter;
        
        // Calculate scores for each post
        const postsWithScore = posts.map(post => ({
            ...post,
            score: calculateTrendingScore(post, filter)
        }));
        
        // Sort by score
        trendingState.trendingVideos = postsWithScore
            .sort((a, b) => b.score - a.score)
            .slice(0, CONFIG.TRENDING_VIDEOS_COUNT);
        
        // Calculate trending hashtags
        trendingState.trendingHashtags = calculateTrendingHashtags(posts, filter);
        
        // Calculate top creators
        trendingState.topCreators = calculateTopCreators(posts, filter);
        
        trendingState.lastUpdate = new Date().toISOString();
        
        // Save to storage
        localStorage.setItem(CONFIG.STORAGE_TRENDING, JSON.stringify({
            trendingVideos: trendingState.trendingVideos,
            trendingHashtags: trendingState.trendingHashtags,
            topCreators: trendingState.topCreators,
            lastUpdate: trendingState.lastUpdate
        }));
        
        // Render
        renderTrendingVideos();
        renderTrendingHashtags();
        renderTopCreators();
    };
    
    // ============================================
    // RENDER FUNKSIYALARI
    // ============================================
    const renderTrendingVideos = () => {
        const container = document.getElementById('trendingVideosList');
        if (!container) return;
        
        if (trendingState.trendingVideos.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">Hozircha trenddagi videolar yo\'q</div>';
            return;
        }
        
        container.innerHTML = trendingState.trendingVideos.map((video, index) => `
            <div class="trending-video-card" data-post-id="${video.id}" style="background: #0a0a0a; border-radius: 12px; overflow: hidden; cursor: pointer; border: 1px solid #ff000020; transition: transform 0.3s;">
                <div style="position: relative;">
                    ${video.mediaType === 'video' ? 
                        `<video src="${video.mediaUrl}" style="width: 100%; height: 180px; object-fit: cover;"></video>` :
                        `<img src="${video.mediaUrl}" style="width: 100%; height: 180px; object-fit: cover;">`
                    }
                    <div style="position: absolute; top: 10px; left: 10px; background: #ff0000; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        #${index + 1}
                    </div>
                    <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 4px 8px; border-radius: 20px; font-size: 11px;">
                        🔥 ${Math.floor(video.score)} ball
                    </div>
                </div>
                <div style="padding: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <img src="${video.userAvatar}" style="width: 30px; height: 30px; border-radius: 50%;">
                        <div style="font-size: 13px; font-weight: 600;">${escapeHtml(video.userName)}</div>
                    </div>
                    <div style="font-size: 13px; color: #ddd; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${escapeHtml(video.caption || 'Videosiz')}
                    </div>
                    <div style="display: flex; gap: 15px; font-size: 11px; color: #888;">
                        <span><i class="fas fa-heart"></i> ${(video.likes || 0).toLocaleString()}</span>
                        <span><i class="fas fa-comment"></i> ${(video.comments?.length || 0).toLocaleString()}</span>
                        <span><i class="fas fa-eye"></i> ${(video.views || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        document.querySelectorAll('.trending-video-card').forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.postId;
                playVideoFromTrending(postId);
            });
        });
    };
    
    const renderTrendingHashtags = () => {
        const container = document.getElementById('trendingHashtagsList');
        if (!container) return;
        
        if (trendingState.trendingHashtags.length === 0) {
            container.innerHTML = '<div style="color: #888;">Hozircha trenddagi hashtaglar yo\'q</div>';
            return;
        }
        
        container.innerHTML = trendingState.trendingHashtags.map((item, index) => `
            <div class="trending-hashtag" data-hashtag="${item.tag}" style="background: #1a1a1a; padding: 8px 16px; border-radius: 30px; cursor: pointer; border: 1px solid #ff0000; transition: all 0.3s;">
                <span style="color: #ff0000; font-weight: bold;">${item.tag}</span>
                <span style="margin-left: 8px; font-size: 11px; color: #888;">${item.count} post</span>
            </div>
        `).join('');
        
        document.querySelectorAll('.trending-hashtag').forEach(el => {
            el.addEventListener('click', () => {
                const hashtag = el.dataset.hashtag;
                searchByHashtag(hashtag);
            });
        });
    };
    
    const renderTopCreators = () => {
        const container = document.getElementById('topCreatorsList');
        if (!container) return;
        
        if (trendingState.topCreators.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">Hozircha top creatorlar yo\'q</div>';
            return;
        }
        
        container.innerHTML = trendingState.topCreators.map((creator, index) => `
            <div class="top-creator-item" data-user-id="${creator.userId}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #0a0a0a; border-radius: 12px; cursor: pointer; border: 1px solid #ff000020;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 30px; text-align: center; font-weight: bold; color: ${index < 3 ? '#ffd700' : '#888'}; font-size: 18px;">
                        ${index + 1}
                        ${index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                    </div>
                    <img src="${creator.avatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <div style="font-weight: 600;">${escapeHtml(creator.name)}</div>
                        <div style="font-size: 11px; color: #888;">📹 ${creator.videoCount} video</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #ff0000; font-weight: bold;">🔥 ${Math.floor(creator.score)}</div>
                    <div style="font-size: 11px; color: #888;">❤️ ${creator.totalLikes.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.top-creator-item').forEach(el => {
            el.addEventListener('click', () => {
                const userId = el.dataset.userId;
                if (window.showChannelPage) {
                    window.showChannelPage(userId);
                }
            });
        });
    };
    
    // ============================================
    // YORDAMCHI FUNKSIYALAR
    // ============================================
    const playVideoFromTrending = (postId) => {
        const posts = JSON.parse(localStorage.getItem('nova_posts') || '[]');
        const post = posts.find(p => p.id === postId);
        
        if (post) {
            // Close trending modal
            const modal = document.getElementById('trendingModal');
            if (modal) modal.style.display = 'none';
            
            // Scroll to video in feed
            setTimeout(() => {
                const feedContainer = document.getElementById('feedContainer');
                if (feedContainer) {
                    // Add video to top of feed temporarily
                    const currentFeed = JSON.parse(localStorage.getItem('nova_posts') || '[]');
                    const postIndex = currentFeed.findIndex(p => p.id === postId);
                    if (postIndex !== -1) {
                        currentFeed.splice(postIndex, 1);
                        currentFeed.unshift(post);
                        localStorage.setItem('nova_posts', JSON.stringify(currentFeed));
                        if (window.renderFeed) window.renderFeed();
                    }
                }
            }, 100);
        }
    };
    
    const searchByHashtag = (hashtag) => {
        const modal = document.getElementById('trendingModal');
        if (modal) modal.style.display = 'none';
        
        // Search in feed
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = hashtag;
            searchInput.dispatchEvent(new Event('input'));
        }
        
        if (window.showToast) {
            window.showToast(`🔍 ${hashtag} bo'yicha qidiruv`);
        }
    };
    
    const loadTrendingData = () => {
        const saved = localStorage.getItem(CONFIG.STORAGE_TRENDING);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                trendingState.trendingVideos = data.trendingVideos || [];
                trendingState.trendingHashtags = data.trendingHashtags || [];
                trendingState.topCreators = data.topCreators || [];
                trendingState.lastUpdate = data.lastUpdate;
            } catch(e) {}
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
    
    // ============================================
    // TRENDING TUGMASINI QO'SHISH
    // ============================================
    const addTrendingButton = () => {
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav && !document.querySelector('[data-page="trending-page"]')) {
            const trendingNav = document.createElement('div');
            trendingNav.className = 'nav-item';
            trendingNav.setAttribute('data-page', 'trending-page');
            trendingNav.innerHTML = '<i class="fas fa-chart-line"></i><span>Trendlar</span>';
            trendingNav.addEventListener('click', () => {
                createTrendingModal();
                refreshTrendingData();
                document.getElementById('trendingModal').style.display = 'flex';
            });
            
            // Insert after explore or at the end
            const exploreNav = document.querySelector('[data-page="explore"]');
            if (exploreNav && exploreNav.parentNode) {
                exploreNav.parentNode.insertBefore(trendingNav, exploreNav.nextSibling);
            } else {
                sidebarNav.appendChild(trendingNav);
            }
        }
    };
    
    // ============================================
    // TOP BARGA TRENDING TUGMASI
    // ============================================
    const addTrendingTopButton = () => {
        const topIcons = document.querySelector('.top-icons');
        if (topIcons && !document.getElementById('trendingTopIcon')) {
            const trendingIcon = document.createElement('i');
            trendingIcon.id = 'trendingTopIcon';
            trendingIcon.className = 'fas fa-fire';
            trendingIcon.style.cssText = 'font-size: 22px; cursor: pointer; color: #ff0000;';
            trendingIcon.title = 'Trendlar';
            trendingIcon.addEventListener('click', () => {
                createTrendingModal();
                refreshTrendingData();
                document.getElementById('trendingModal').style.display = 'flex';
            });
            topIcons.appendChild(trendingIcon);
        }
    };
    
    // ============================================
    // AVTOMATIK YANGILASH
    // ============================================
    const startAutoUpdate = () => {
        setInterval(() => {
            refreshTrendingData();
        }, CONFIG.TRENDING_UPDATE_INTERVAL);
    };
    
    // ============================================
    // INIT
    // ============================================
    const init = () => {
        console.log('📈 Nova Trending tizimi initializing...');
        loadTrendingData();
        addTrendingButton();
        addTrendingTopButton();
        startAutoUpdate();
        console.log('✅ Nova Trending tizimi ready!');
    };
    
    const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-page="trending-page"]')) {
            addTrendingButton();
        }
        if (!document.getElementById('trendingTopIcon')) {
            addTrendingTopButton();
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
