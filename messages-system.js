// ============================================
// NOVA MESSAGES TIZIMI (messages-system.js)
// SHAXSIY XABARLAR VA GURUHLAR
// Muallif: Mirfayz Nova Creator
// Versiya: 1.0.0
// ============================================

(function() {
    'use strict';
    
    console.log('💬 NOVA Messages tizimi ishga tushdi | Mirfayz Creator');
    
    // ============================================
    // KONFIGURATSIYA
    // ============================================
    const CONFIG = {
        STORAGE_CHATS: 'nova_chats',
        STORAGE_MESSAGES: 'nova_messages',
        STORAGE_GROUPS: 'nova_groups',
        MAX_GROUP_MEMBERS: 5000,
        MAX_MESSAGE_LENGTH: 5000,
        TYPING_TIMEOUT: 3000
    };
    
    // ============================================
    // STATE
    // ============================================
    let messagesState = {
        chats: [],           // List of chats (users and groups)
        messages: {},        // Messages by chatId
        groups: [],          // Groups list
        typingStatus: {},    // Who is typing
        onlineUsers: {},     // Online status
        currentChatId: null,
        unreadCounts: {}
    };
    
    // ============================================
    // XABARLAR MODALI
    // ============================================
    const createMessagesModal = () => {
        if (document.getElementById('messagesModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'messagesModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; width: 95%; height: 85vh; display: flex; flex-direction: column;">
                <div class="modal-header">
                    <h2><i class="fas fa-comment-dots"></i> Xabarlar</h2>
                    <div>
                        <button id="newChatBtn" style="background: #ff0000; border: none; padding: 8px 16px; border-radius: 20px; color: white; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-plus"></i> Yangi chat
                        </button>
                        <button id="newGroupBtn" style="background: #333; border: none; padding: 8px 16px; border-radius: 20px; color: white; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-users"></i> Guruh
                        </button>
                        <button class="close-modal" id="closeMessagesModal">&times;</button>
                    </div>
                </div>
                <div style="display: flex; flex: 1; overflow: hidden;">
                    <!-- Chats List -->
                    <div id="chatsList" style="width: 300px; border-right: 1px solid #ff000020; overflow-y: auto; padding: 10px;">
                        <!-- Chats will be inserted here -->
                    </div>
                    
                    <!-- Chat Area -->
                    <div id="chatArea" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                        <div id="chatHeader" style="padding: 15px; border-bottom: 1px solid #ff000020; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-user-circle" style="font-size: 32px;"></i>
                            <div>
                                <div id="chatName" style="font-weight: 600;">Chat tanlanmagan</div>
                                <div id="chatStatus" style="font-size: 11px; color: #888;">Chat tanlang</div>
                            </div>
                        </div>
                        <div id="messagesContainer" style="flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                            <div style="text-align: center; color: #888;">Chat tanlang</div>
                        </div>
                        <div id="messageInputArea" style="padding: 15px; border-top: 1px solid #ff000020; display: flex; gap: 10px;">
                            <button id="attachFileBtn" style="background: none; border: none; color: #ff0000; font-size: 20px; cursor: pointer;">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <button id="emojiBtn" style="background: none; border: none; color: #ff0000; font-size: 20px; cursor: pointer;">
                                <i class="fas fa-smile"></i>
                            </button>
                            <input type="text" id="messageInput" placeholder="Xabar yozing..." style="flex: 1; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 25px; padding: 12px 18px; color: white;">
                            <button id="sendMessageBtn" style="background: #ff0000; border: none; padding: 12px 24px; border-radius: 25px; color: white; cursor: pointer;">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div id="typingIndicator" style="padding: 5px 15px; font-size: 11px; color: #888; display: none;">
                            <i class="fas fa-ellipsis-h"></i> Kimdir yozmoqda...
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('closeMessagesModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('newChatBtn')?.addEventListener('click', () => {
            showNewChatModal();
        });
        
        document.getElementById('newGroupBtn')?.addEventListener('click', () => {
            showNewGroupModal();
        });
        
        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            sendMessage();
        });
        
        document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
            sendTypingStatus();
        });
        
        document.getElementById('attachFileBtn')?.addEventListener('click', () => {
            showAttachFileModal();
        });
        
        return modal;
    };
    
    // ============================================
    // YANGI CHAT YARATISH
    // ============================================
    const showNewChatModal = () => {
        let modal = document.getElementById('newChatModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'newChatModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        // Get all users
        const users = getAllUsers();
        const currentUserId = getCurrentUserId();
        const existingChats = messagesState.chats.filter(c => c.type === 'private');
        const existingUserIds = existingChats.map(c => c.participants.find(p => p !== currentUserId));
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2><i class="fas fa-user-plus"></i> Yangi chat</h2>
                    <button class="close-modal" id="closeNewChatModal">&times;</button>
                </div>
                <div class="modal-body">
                    <input type="text" id="searchUserInput" placeholder="Foydalanuvchi qidirish..." style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white; margin-bottom: 15px;">
                    <div id="usersList" style="max-height: 400px; overflow-y: auto;">
                        ${users.filter(u => u.id !== currentUserId && !existingUserIds.includes(u.id)).map(user => `
                            <div class="user-item" data-user-id="${user.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #1a1a1a; cursor: pointer;">
                                <img src="${user.avatar}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;">
                                <div>
                                    <div style="font-weight: 600;">${escapeHtml(user.name)}</div>
                                    <div style="font-size: 11px; color: #888;">${user.followers || 0} obunachi</div>
                                </div>
                            </div>
                        `).join('')}
                        ${users.filter(u => u.id !== currentUserId && !existingUserIds.includes(u.id)).length === 0 ? 
                            '<p style="text-align: center; color: #888;">Barcha foydalanuvchilar bilan chat mavjud</p>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('closeNewChatModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('searchUserInput')?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.user-item').forEach(item => {
                const name = item.querySelector('div div:first-child')?.textContent.toLowerCase();
                item.style.display = name?.includes(query) ? 'flex' : 'none';
            });
        });
        
        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                createPrivateChat(userId);
                modal.style.display = 'none';
            });
        });
    };
    
    const createPrivateChat = (otherUserId) => {
        const currentUserId = getCurrentUserId();
        const otherUser = getUserById(otherUserId);
        
        const chatId = `chat_${[currentUserId, otherUserId].sort().join('_')}`;
        
        // Check if chat already exists
        if (messagesState.chats.some(c => c.id === chatId)) {
            openChat(chatId);
            return;
        }
        
        const newChat = {
            id: chatId,
            type: 'private',
            name: otherUser?.name || 'Foydalanuvchi',
            avatar: otherUser?.avatar,
            participants: [currentUserId, otherUserId],
            lastMessage: null,
            lastMessageTime: null,
            createdAt: new Date().toISOString(),
            unreadCount: 0
        };
        
        messagesState.chats.unshift(newChat);
        messagesState.messages[chatId] = [];
        saveMessagesData();
        renderChatsList();
        openChat(chatId);
    };
    
    // ============================================
    // GURUH YARATISH
    // ============================================
    const showNewGroupModal = () => {
        let modal = document.getElementById('newGroupModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'newGroupModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        const users = getAllUsers();
        const currentUserId = getCurrentUserId();
        let selectedUsers = [];
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> Yangi guruh</h2>
                    <button class="close-modal" id="closeNewGroupModal">&times;</button>
                </div>
                <div class="modal-body">
                    <input type="text" id="groupName" placeholder="Guruh nomi" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white; margin-bottom: 15px;">
                    <input type="text" id="searchGroupUserInput" placeholder="Foydalanuvchi qidirish..." style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #ff0000; border-radius: 8px; color: white; margin-bottom: 15px;">
                    <div id="selectedUsersList" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;"></div>
                    <div id="groupUsersList" style="max-height: 300px; overflow-y: auto;">
                        ${users.filter(u => u.id !== currentUserId).map(user => `
                            <div class="group-user-item" data-user-id="${user.id}" style="display: flex; align-items: center; gap: 12px; padding: 10px; border-bottom: 1px solid #1a1a1a; cursor: pointer;">
                                <input type="checkbox" class="user-checkbox" data-user-id="${user.id}" style="width: 18px; height: 18px;">
                                <img src="${user.avatar}" style="width: 40px; height: 40px; border-radius: 50%;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600;">${escapeHtml(user.name)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button id="createGroupBtn" style="background: #ff0000; color: white; border: none; padding: 12px; border-radius: 30px; width: 100%; margin-top: 15px; cursor: pointer;">Guruh yaratish</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('closeNewGroupModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('searchGroupUserInput')?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.group-user-item').forEach(item => {
                const name = item.querySelector('div div:first-child')?.textContent.toLowerCase();
                item.style.display = name?.includes(query) ? 'flex' : 'none';
            });
        });
        
        const updateSelectedUsers = () => {
            const container = document.getElementById('selectedUsersList');
            container.innerHTML = selectedUsers.map(userId => {
                const user = getUserById(userId);
                return `<span style="background: #ff000020; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${escapeHtml(user?.name)} <span class="remove-user" data-user-id="${userId}" style="cursor: pointer; margin-left: 5px;">&times;</span></span>`;
            }).join('');
            
            document.querySelectorAll('.remove-user')?.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = btn.dataset.userId;
                    selectedUsers = selectedUsers.filter(id => id !== userId);
                    const checkbox = document.querySelector(`.user-checkbox[data-user-id="${userId}"]`);
                    if (checkbox) checkbox.checked = false;
                    updateSelectedUsers();
                });
            });
        };
        
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const userId = checkbox.dataset.userId;
                if (checkbox.checked) {
                    if (!selectedUsers.includes(userId)) selectedUsers.push(userId);
                } else {
                    selectedUsers = selectedUsers.filter(id => id !== userId);
                }
                updateSelectedUsers();
            });
        });
        
        document.getElementById('createGroupBtn')?.addEventListener('click', () => {
            const groupName = document.getElementById('groupName')?.value;
            if (!groupName) {
                showToast('❌ Guruh nomini kiriting!');
                return;
            }
            if (selectedUsers.length < 2) {
                showToast('❌ Kamida 2 ta foydalanuvchi tanlang!');
                return;
            }
            
            createGroup(groupName, selectedUsers);
            modal.style.display = 'none';
        });
    };
    
    const createGroup = (groupName, participants) => {
        const currentUserId = getCurrentUserId();
        const allParticipants = [currentUserId, ...participants];
        
        const groupId = 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        
        const newGroup = {
            id: groupId,
            type: 'group',
            name: groupName,
            avatar: null,
            participants: allParticipants,
            admins: [currentUserId],
            createdAt: new Date().toISOString(),
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0
        };
        
        messagesState.chats.unshift(newGroup);
        messagesState.groups.push(newGroup);
        messagesState.messages[groupId] = [];
        saveMessagesData();
        renderChatsList();
        openChat(groupId);
        
        // Add welcome message
        const welcomeMessage = {
            id: 'msg_' + Date.now(),
            chatId: groupId,
            senderId: 'system',
            senderName: 'NOVA System',
            text: `${groupName} guruhi yaratildi!`,
            timestamp: new Date().toISOString(),
            type: 'system'
        };
        messagesState.messages[groupId].push(welcomeMessage);
        saveMessagesData();
        renderMessages(groupId);
    };
    
    // ============================================
    // XABAR YUBORISH
    // ============================================
    const sendMessage = () => {
        const input = document.getElementById('messageInput');
        const text = input?.value.trim();
        if (!text || !messagesState.currentChatId) return;
        
        const newMessage = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            chatId: messagesState.currentChatId,
            senderId: getCurrentUserId(),
            senderName: getCurrentUserName(),
            senderAvatar: getCurrentUserAvatar(),
            text: text,
            timestamp: new Date().toISOString(),
            type: 'text',
            reactions: {},
            seen: false
        };
        
        if (!messagesState.messages[messagesState.currentChatId]) {
            messagesState.messages[messagesState.currentChatId] = [];
        }
        messagesState.messages[messagesState.currentChatId].push(newMessage);
        
        // Update last message in chat
        const chat = messagesState.chats.find(c => c.id === messagesState.currentChatId);
        if (chat) {
            chat.lastMessage = text.length > 50 ? text.slice(0, 50) + '...' : text;
            chat.lastMessageTime = newMessage.timestamp;
        }
        
        saveMessagesData();
        renderMessages(messagesState.currentChatId);
        renderChatsList();
        
        input.value = '';
        
        // Scroll to bottom
        const container = document.getElementById('messagesContainer');
        if (container) container.scrollTop = container.scrollHeight;
        
        // Simulate reply (for demo)
        simulateReply();
    };
    
    const simulateReply = () => {
        setTimeout(() => {
            if (messagesState.currentChatId) {
                const autoReply = {
                    id: 'msg_' + Date.now() + '_auto',
                    chatId: messagesState.currentChatId,
                    senderId: 'auto',
                    senderName: 'NOVA Bot',
                    senderAvatar: 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=Bot',
                    text: 'Xabaringiz qabul qilindi! 😊',
                    timestamp: new Date().toISOString(),
                    type: 'text',
                    reactions: {},
                    seen: false
                };
                messagesState.messages[messagesState.currentChatId].push(autoReply);
                saveMessagesData();
                renderMessages(messagesState.currentChatId);
            }
        }, 2000);
    };
    
    const sendTypingStatus = () => {
        // Simulate typing status
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.style.display = 'block';
            setTimeout(() => {
                if (indicator) indicator.style.display = 'none';
            }, CONFIG.TYPING_TIMEOUT);
        }
    };
    
    // ============================================
    // MEDIA YUBORISH
    // ============================================
    const showAttachFileModal = () => {
        let modal = document.getElementById('attachFileModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'attachFileModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2><i class="fas fa-paperclip"></i> Fayl yuborish</h2>
                    <button class="close-modal" id="closeAttachModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <button id="sendImageBtn" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <i class="fas fa-image" style="font-size: 24px;"></i> Rasm yuborish
                        </button>
                        <button id="sendVideoBtn" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <i class="fas fa-video" style="font-size: 24px;"></i> Video yuborish
                        </button>
                        <button id="sendAudioBtn" style="background: #1a1a1a; border: 1px solid #ff0000; padding: 15px; border-radius: 12px; cursor: pointer;">
                            <i class="fas fa-microphone" style="font-size: 24px;"></i> Ovozli xabar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('closeAttachModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('sendImageBtn')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    sendMediaMessage(file, 'image');
                }
            };
            input.click();
            modal.style.display = 'none';
        });
        
        document.getElementById('sendVideoBtn')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    sendMediaMessage(file, 'video');
                }
            };
            input.click();
            modal.style.display = 'none';
        });
        
        document.getElementById('sendAudioBtn')?.addEventListener('click', () => {
            showAudioRecorder();
            modal.style.display = 'none';
        });
    };
    
    const sendMediaMessage = (file, type) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const newMessage = {
                id: 'msg_' + Date.now(),
                chatId: messagesState.currentChatId,
                senderId: getCurrentUserId(),
                senderName: getCurrentUserName(),
                senderAvatar: getCurrentUserAvatar(),
                mediaUrl: e.target.result,
                mediaType: type,
                text: '',
                timestamp: new Date().toISOString(),
                type: type,
                reactions: {},
                seen: false
            };
            
            messagesState.messages[messagesState.currentChatId].push(newMessage);
            saveMessagesData();
            renderMessages(messagesState.currentChatId);
        };
        reader.readAsDataURL(file);
    };
    
    const showAudioRecorder = () => {
        let modal = document.getElementById('audioRecorderModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'audioRecorderModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <div class="modal-header">
                    <h2><i class="fas fa-microphone"></i> Ovozli xabar</h2>
                    <button class="close-modal" id="closeAudioModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="recordingStatus" style="font-size: 48px; margin: 20px;">🎤</div>
                    <button id="startRecordBtn" style="background: #ff0000; border: none; padding: 12px 24px; border-radius: 30px; color: white; cursor: pointer;">Boshlash</button>
                    <button id="stopRecordBtn" style="background: #333; border: none; padding: 12px 24px; border-radius: 30px; color: white; cursor: pointer; display: none;">Tugatish</button>
                    <div id="recordTimer" style="margin-top: 15px; font-size: 14px;">0:00</div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        let mediaRecorder;
        let audioChunks = [];
        let timerInterval;
        let seconds = 0;
        
        document.getElementById('closeAudioModal')?.addEventListener('click', () => {
            modal.style.display = 'none';
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        });
        
        document.getElementById('startRecordBtn')?.addEventListener('click', async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        sendMediaMessageFromBlob(e.target.result, 'audio');
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                    modal.style.display = 'none';
                };
                
                mediaRecorder.start();
                
                document.getElementById('startRecordBtn').style.display = 'none';
                document.getElementById('stopRecordBtn').style.display = 'flex';
                document.getElementById('recordingStatus').innerHTML = '🔴 Yozilmoqda...';
                
                // Timer
                seconds = 0;
                timerInterval = setInterval(() => {
                    seconds++;
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    document.getElementById('recordTimer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
                }, 1000);
                
            } catch(err) {
                showToast('❌ Mikrofon ruxsatini bering!');
            }
        });
        
        document.getElementById('stopRecordBtn')?.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                clearInterval(timerInterval);
            }
        });
    };
    
    const sendMediaMessageFromBlob = (dataUrl, type) => {
        const newMessage = {
            id: 'msg_' + Date.now(),
            chatId: messagesState.currentChatId,
            senderId: getCurrentUserId(),
            senderName: getCurrentUserName(),
            senderAvatar: getCurrentUserAvatar(),
            mediaUrl: dataUrl,
            mediaType: type,
            text: '',
            timestamp: new Date().toISOString(),
            type: type,
            reactions: {},
            seen: false
        };
        
        messagesState.messages[messagesState.currentChatId].push(newMessage);
        saveMessagesData();
        renderMessages(messagesState.currentChatId);
    };
    
    // ============================================
    // RENDER FUNKSIYALARI
    // ============================================
    const renderChatsList = () => {
        const container = document.getElementById('chatsList');
        if (!container) return;
        
        const currentUserId = getCurrentUserId();
        const sortedChats = [...messagesState.chats].sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });
        
        container.innerHTML = sortedChats.map(chat => {
            const isActive = messagesState.currentChatId === chat.id;
            const unread = chat.unreadCount || 0;
            
            if (chat.type === 'private') {
                const otherUser = chat.participants.find(p => p !== currentUserId);
                const user = getUserById(otherUser);
                return `
                    <div class="chat-item" data-chat-id="${chat.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; margin-bottom: 5px; cursor: pointer; background: ${isActive ? '#ff000020' : 'transparent'};">
                        <img src="${user?.avatar || 'https://ui-avatars.com/api/?background=FF0000&color=fff&name=User'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600;">${escapeHtml(chat.name)}</div>
                            <div style="font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${chat.lastMessage || 'Yangi chat'}</div>
                        </div>
                        ${unread > 0 ? `<div style="background: #ff0000; padding: 2px 8px; border-radius: 20px; font-size: 11px;">${unread}</div>` : ''}
                        <div style="font-size: 10px; color: #888;">${formatTime(chat.lastMessageTime)}</div>
                    </div>
                `;
            } else {
                return `
                    <div class="chat-item" data-chat-id="${chat.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; margin-bottom: 5px; cursor: pointer; background: ${isActive ? '#ff000020' : 'transparent'};">
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #ff000020; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-users" style="font-size: 24px;"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600;">${escapeHtml(chat.name)}</div>
                            <div style="font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${chat.lastMessage || 'Guruh yaratildi'}</div>
                        </div>
                        ${unread > 0 ? `<div style="background: #ff0000; padding: 2px 8px; border-radius: 20px; font-size: 11px;">${unread}</div>` : ''}
                        <div style="font-size: 10px; color: #888;">${formatTime(chat.lastMessageTime)}</div>
                    </div>
                `;
            }
        }).join('');
        
        // Add click handlers
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                openChat(chatId);
            });
        });
    };
    
    const renderMessages = (chatId) => {
        const container = document.getElementById('messagesContainer');
        const chat = messagesState.chats.find(c => c.id === chatId);
        const messages = messagesState.messages[chatId] || [];
        const currentUserId = getCurrentUserId();
        
        if (!container) return;
        
        container.innerHTML = messages.map(msg => {
            const isOwn = msg.senderId === currentUserId;
            const isSystem = msg.senderId === 'system' || msg.senderId === 'auto';
            
            if (isSystem) {
                return `
                    <div style="text-align: center; margin: 10px 0;">
                        <span style="background: #1a1a1a; padding: 5px 12px; border-radius: 20px; font-size: 12px; color: #888;">
                            ${escapeHtml(msg.text)}
                        </span>
                    </div>
                `;
            }
            
            if (msg.type === 'text') {
                return `
                    <div style="display: flex; gap: 10px; justify-content: ${isOwn ? 'flex-end' : 'flex-start'};">
                        ${!isOwn ? `<img src="${msg.senderAvatar}" style="width: 35px; height: 35px; border-radius: 50%;">` : ''}
                        <div style="max-width: 70%;">
                            <div style="background: ${isOwn ? '#ff0000' : '#1a1a1a'}; padding: 10px 15px; border-radius: 18px; ${isOwn ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                                ${!isOwn ? `<div style="font-size: 11px; font-weight: 600; margin-bottom: 3px;">${escapeHtml(msg.senderName)}</div>` : ''}
                                <div style="font-size: 14px; word-wrap: break-word;">${escapeHtml(msg.text)}</div>
                            </div>
                            <div style="font-size: 10px; color: #888; margin-top: 3px; text-align: ${isOwn ? 'right' : 'left'}">
                                ${formatTime(msg.timestamp)}
                                ${msg.reactions ? Object.keys(msg.reactions).length > 0 ? ` · ${Object.values(msg.reactions)[0]}` : '' : ''}
                            </div>
                        </div>
                        <div class="message-actions" style="display: flex; gap: 5px; align-items: center; opacity: 0;">
                            <button class="react-btn" data-msg-id="${msg.id}" style="background: none; border: none; color: #888; cursor: pointer;">❤️</button>
                            ${isOwn ? `<button class="delete-msg-btn" data-msg-id="${msg.id}" style="background: none; border: none; color: #888; cursor: pointer;">🗑️</button>` : ''}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div style="display: flex; gap: 10px; justify-content: ${isOwn ? 'flex-end' : 'flex-start'};">
                        ${!isOwn ? `<img src="${msg.senderAvatar}" style="width: 35px; height: 35px; border-radius: 50%;">` : ''}
                        <div style="max-width: 70%;">
                            <div style="background: ${isOwn ? '#ff0000' : '#1a1a1a'}; padding: 10px; border-radius: 18px;">
                                ${msg.mediaType === 'image' ? `<img src="${msg.mediaUrl}" style="max-width: 200px; max-height: 200px; border-radius: 12px; cursor: pointer;" onclick="window.open('${msg.mediaUrl}')">` : ''}
                                ${msg.mediaType === 'video' ? `<video src="${msg.mediaUrl}" controls style="max-width: 200px; max-height: 200px; border-radius: 12px;"></video>` : ''}
                                ${msg.mediaType === 'audio' ? `<audio src="${msg.mediaUrl}" controls style="width: 200px;"></audio>` : ''}
                            </div>
                            <div style="font-size: 10px; color: #888; margin-top: 3px;">${formatTime(msg.timestamp)}</div>
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        // Add hover effects
        document.querySelectorAll('.message-actions').forEach(el => {
            const parent = el.closest('div');
            parent?.addEventListener('mouseenter', () => {
                el.style.opacity = '1';
            });
            parent?.addEventListener('mouseleave', () => {
                el.style.opacity = '0';
            });
        });
    };
    
    const openChat = (chatId) => {
        messagesState.currentChatId = chatId;
        const chat = messagesState.chats.find(c => c.id === chatId);
        
        if (chat) {
            document.getElementById('chatName').textContent = chat.name;
            document.getElementById('chatStatus').textContent = chat.type === 'private' ? 'Online' : `${chat.participants.length} a'zo`;
            chat.unreadCount = 0;
        }
        
        renderMessages(chatId);
        renderChatsList();
    };
    
    // ============================================
    // YORDAMCHI FUNKSIYALAR
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
        const currentUserId = getCurrentUserId();
        if (!users.find(u => u.id === currentUserId)) {
            users.push({
                id: currentUserId,
                name: getCurrentUserName(),
                avatar: getCurrentUserAvatar(),
                followers: 0
            });
        }
        
        return users;
    };
    
    const getUserById = (userId) => {
        const users = getAllUsers();
        return users.find(u => u.id === userId);
    };
    
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'hozir';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
        if (diff < 86400000) return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
        return date.toLocaleDateString();
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
    
    const loadMessagesData = () => {
        const savedChats = localStorage.getItem(CONFIG.STORAGE_CHATS);
        if (savedChats) {
            try { messagesState.chats = JSON.parse(savedChats); } catch(e) {}
        }
        
        const savedMessages = localStorage.getItem(CONFIG.STORAGE_MESSAGES);
        if (savedMessages) {
            try { messagesState.messages = JSON.parse(savedMessages); } catch(e) {}
        }
        
        const savedGroups = localStorage.getItem(CONFIG.STORAGE_GROUPS);
        if (savedGroups) {
            try { messagesState.groups = JSON.parse(savedGroups); } catch(e) {}
        }
    };
    
    const saveMessagesData = () => {
        localStorage.setItem(CONFIG.STORAGE_CHATS, JSON.stringify(messagesState.chats));
        localStorage.setItem(CONFIG.STORAGE_MESSAGES, JSON.stringify(messagesState.messages));
        localStorage.setItem(CONFIG.STORAGE_GROUPS, JSON.stringify(messagesState.groups));
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
    // XABAR TUGMASINI QO'SHISH
    // ============================================
    const addMessagesButton = () => {
        const topIcons = document.querySelector('.top-icons');
        if (topIcons && !document.getElementById('messagesIconFixed')) {
            const messagesIcon = document.createElement('i');
            messagesIcon.id = 'messagesIconFixed';
            messagesIcon.className = 'fas fa-comment-dots';
            messagesIcon.style.cssText = 'font-size: 22px; cursor: pointer;';
            messagesIcon.title = 'Xabarlar';
            messagesIcon.addEventListener('click', () => {
                createMessagesModal();
                renderChatsList();
                document.getElementById('messagesModal').style.display = 'flex';
            });
            topIcons.appendChild(messagesIcon);
        }
    };
    
    // ============================================
    // INIT
    // ============================================
    const init = () => {
        console.log('💬 Nova Messages tizimi initializing...');
        loadMessagesData();
        addMessagesButton();
        console.log('✅ Nova Messages tizimi ready!');
    };
    
    const observer = new MutationObserver(() => {
        if (!document.getElementById('messagesIconFixed')) {
            addMessagesButton();
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
