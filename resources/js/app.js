/************************************************
 * ETAT GLOBAL & INITIALISATION
 ************************************************/
let currentUser = null; // Sera récupéré dynamiquement depuis la session AdonisJS
let selectedMediaFile = null; // Contiendra le vrai fichier binaire (Image/Vidéo)

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Charger l'utilisateur connecté depuis la session serveur
    await fetchCurrentUser();
    // 2. Charger les thèmes et accents stockés localement
    initThemeAndAccent();
    // 3. Charger les vrais tweets et utilisateurs depuis la BDD
    await loadTweets();
    await loadUsers();
});

async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/me'); // Route optionnelle à créer, ou injectée par Edge
        if (response.ok) {
            currentUser = await response.json();
            updateProfileUI();
            updateSidebarProfile();
            updateFollowStats();
        }
    } catch (e) {
        console.error("Impossible de récupérer l'utilisateur connecté", e);
    }
}

/************************************************
 * NAVIGATION PRINCIPALE ET INTERNE
 ************************************************/
function showSection(sectionId) {
    const sections = ['welcomeSection', 'registerSection', 'loginSection', 'welcomeUserSection', 'settingsSection', 'appContainer'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.display = 'none'; el.classList.add('hidden'); }
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = (sectionId === 'appContainer') ? 'grid' : 'block'; // 'grid' pour nos 3 colonnes
    }
}

function showPage(pageName) {
    const pages = ['page-home', 'page-profile', 'page-explorer', 'page-notifications', 'page-messages', 'page-bookmarks'];
    pages.forEach(p => { const el = document.getElementById(p); if (el) el.classList.add('hidden'); });

    const target = document.getElementById('page-' + pageName);
    if (target) target.classList.remove('hidden');

    if (pageName === 'profile') updateProfileUI();
}

/************************************************
 * TWEETS & ULTRA-LARGE MÉDIAS (JUSQU'À 1H)
 ************************************************/
function handleMediaSelect(input, type) {
    const file = input.files[0];
    if (!file) return;

    selectedMediaFile = file; // Stockage du vrai fichier binaire
    
    const container = document.getElementById('mediaPreview');
    const preview = document.getElementById('previewContent');
    
    if (container) container.classList.remove('hidden');
    if (preview) {
        const fileURL = URL.createObjectURL(file); // Génère une URL locale temporaire ultra-légère
        preview.innerHTML = (type === 'image')
            ? `<img src="${fileURL}" style="width:100%; border-radius:15px;">`
            : `<video controls style="width:100%; border-radius:15px;"><source src="${fileURL}"></video>`;
    }
}

function clearMedia() {
    selectedMediaFile = null;
    const previewInputImg = document.getElementById('postImage');
    const previewInputVid = document.getElementById('postVideo');
    if (previewInputImg) previewInputImg.value = '';
    if (previewInputVid) previewInputVid.value = '';
    document.getElementById('mediaPreview').classList.add('hidden');
}

// Publication réelle avec jauge de progression pour les gros fichiers
function postTweet() {
    const input = document.getElementById('tweetInput');
    const content = input.value.trim();
    const button = document.querySelector('.btn-post-main');

    if (!content && !selectedMediaFile) return;

    const formData = new FormData();
    formData.append('content', content);
    if (selectedMediaFile) {
        formData.append('media', selectedMediaFile); // Envoi du fichier brut au serveur
    }

    button.disabled = true;
    button.innerText = "Envoi... 0%";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/tweets");

    // Calcul de la progression (Crucial pour les vidéos de 1h)
    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            button.innerText = `Envoi... ${percent}%`;
        }
    });

    xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            input.value = "";
            clearMedia();
            await loadTweets(); // Rechargement dynamique depuis la BDD
        } else {
            alert("Erreur lors de l'envoi du post (fichier trop lourd ou timeout).");
        }
        button.disabled = false;
        button.innerText = "Poster";
    };

    xhr.onerror = () => {
        alert("Erreur réseau lors du téléversement.");
        button.disabled = false;
        button.innerText = "Poster";
    };

    xhr.send(formData);
}

async function loadTweets() {
    const container = document.getElementById('tweetsContainer');
    if (!container) return;

    try {
        const response = await fetch('/api/tweets');
        const tweets = await response.json();
        container.innerHTML = "";

        tweets.forEach(tweet => {
            let mediaHTML = "";
            if (tweet.mediaUrl) {
                mediaHTML = (tweet.mediaType === 'video')
                    ? `<video controls style="width:100%; border-radius:15px; max-height:400px;"><source src="${tweet.mediaUrl}"></video>`
                    : `<img src="${tweet.mediaUrl}" style="width:100%; border-radius:15px; max-height:500px; object-fit:cover;">`;
            }

            // Vérification si l'utilisateur actuel a le droit de le supprimer
            const deleteIcon = (currentUser && tweet.userId === currentUser.id) 
                ? `<i class="fa-solid fa-trash-can" onclick="deleteTweet(${tweet.id})" style="cursor:pointer;"></i>` 
                : '';

            const div = document.createElement('div');
            div.className = "tweet";
            div.style.borderBottom = "1px solid #2f3336";
            div.innerHTML = `
                <div style="display:flex; gap:12px; padding:15px; font-family:sans-serif;">
                    <img src="${tweet.user.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" class="avatar-small" style="width:40px; height:40px; border-radius:50%;">
                    <div style="flex:1">
                        <div style="display:flex; justify-content:space-between;">
                            <div>
                                <strong style="color:#fff;">${tweet.user.username}</strong>
                                <span style="color:#71767b; margin-left:5px;">@${tweet.user.username.toLowerCase().replace(/\s/g, '')}</span>
                            </div>
                            ${deleteIcon}
                        </div>
                        <p style="color:#fff; margin: 5px 0; white-space: pre-wrap;">${tweet.content}</p>
                        ${mediaHTML}
                        <div style="margin-top:10px;">
                            <button onclick="toggleLike(${tweet.id})" style="border:none; background:none; cursor:pointer; color:${tweet.hasLiked ? '#f91880' : '#71767b'}">
                                ${tweet.hasLiked ? "❤️" : "🤍"} ${tweet.likesCount || 0}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        console.error("Erreur de chargement des tweets", e);
    }
}

async function toggleLike(id) {
    try {
        const response = await fetch(`/api/tweets/${id}/like`, { method: 'POST' });
        if (response.ok) await loadTweets(); // Rafraîchit les compteurs de likes réels
    } catch (e) {
        console.error(e);
    }
}

async function deleteTweet(tweetId) {
    if (confirm("Supprimer ce post définitivement ?")) {
        try {
            const response = await fetch(`/api/tweets/${tweetId}`, { method: 'DELETE' });
            if (response.ok) await loadTweets();
        } catch (e) {
            console.error(e);
        }
    }
}

/************************************************
 * GESTION DU PROFIL (RÉEL)
 ************************************************/
async function saveProfile() {
    const nameVal = document.getElementById('editName').value;
    const bioVal = document.getElementById('editBio').value;
    const bannerInput = document.getElementById('editBannerFile');
    const photoInput = document.getElementById('editPhotoFile');

    const formData = new FormData();
    formData.append('username', nameVal);
    formData.append('bio', bioVal);
    
    if (photoInput.files[0]) formData.append('avatar', photoInput.files[0]);
    if (bannerInput.files[0]) formData.append('banner', bannerInput.files[0]);

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            currentUser = await response.json();
            updateProfileUI();
            updateSidebarProfile();
            closeEditModal();
        }
    } catch (e) {
        console.error("Erreur lors de la sauvegarde du profil", e);
    }
}

function updateProfileUI() {
    if (!currentUser) return;
    const nameDisplay = document.getElementById('profNameDisplay');
    const nameTitle = document.getElementById('profNameTitle');
    const handleDisplay = document.getElementById('profHandleDisplay');
    const bioDisplay = document.querySelector('.profile-info .bio');
    const bannerImg = document.getElementById('userBanner');
    const profileImg = document.getElementById('userProfilePic');

    if (nameDisplay) nameDisplay.innerText = currentUser.username;
    if (nameTitle) nameTitle.innerText = currentUser.username;
    if (handleDisplay) handleDisplay.innerText = "@" + currentUser.username.toLowerCase().replace(/\s/g, '');
    if (bioDisplay) bioDisplay.innerText = currentUser.bio || "Pas encore de biographie.";
    if (bannerImg && currentUser.bannerUrl) bannerImg.src = currentUser.bannerUrl;
    if (profileImg && currentUser.avatarUrl) profileImg.src = currentUser.avatarUrl;
}

function updateSidebarProfile() {
    const container = document.getElementById('userProfileSide');
    if (!container || !currentUser) return;

    container.innerHTML = `
        <img src="${currentUser.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" class="avatar-small" style="width:40px; height:40px; border-radius:50%;">
        <div style="margin-left:10px">
            <strong style="display:block; color:#fff;">${currentUser.username}</strong>
            <span style="color:#71767b">@${currentUser.username.toLowerCase().replace(/\s/g, '')}</span>
        </div>
    `;
}

/************************************************
 * DÉCONNEXION OFFICIELLE BACKEND
 ************************************************/
async function logout() {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/login'; // Te renvoie sur ta page de connexion réelle
            }
        } catch (e) {
            window.location.reload();
        }
    }
}

/************************************************
 * FONCTIONS AUXILIAIRES RESTANTES (CONSERVÉES)
 ************************************************/
function openEditModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal && currentUser) {
        modal.classList.remove('hidden');
        document.getElementById('editName').value = currentUser.username;
        document.getElementById('editBio').value = currentUser.bio || '';
    }
}
function closeEditModal() { document.getElementById('editProfileModal').classList.add('hidden'); }

function initThemeAndAccent() {
    const savedColor = localStorage.getItem('twitter-clone-color');
    if (savedColor) document.documentElement.style.setProperty('--brand-color', savedColor);
    const savedTheme = localStorage.getItem('twitter-clone-theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
}

function setTheme(themeName) { document.documentElement.setAttribute('data-theme', themeName); localStorage.setItem('twitter-clone-theme', themeName); }
function setAccent(colorCode) { document.documentElement.style.setProperty('--brand-color', colorCode); localStorage.setItem('twitter-clone-color', colorCode); }
function togglePassword(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fa-solid fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fa-regular fa-eye';
    }
}

// Fonctions vides temporaires pour éviter les crashs si tes autres sections s'activent
async function loadUsers() {}
function updateFollowStats() {}