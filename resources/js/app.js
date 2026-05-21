/************************************************
 * ETAT GLOBAL & INITIALISATION
 ************************************************/
let currentUser = null; 
let selectedMediaFile = null; 

document.addEventListener('DOMContentLoaded', async () => {
    // 1. On récupère d'abord l'utilisateur connecté
    await fetchCurrentUser();
    // 2. On charge le thème visuel
    initThemeAndAccent();
    
    // 3. Sécurité : On ne charge les tweets QUE si on a un utilisateur connecté
    if (currentUser) {
        await loadTweets();
        await loadUsers();
    } else {
        console.warn("Aucun utilisateur connecté détecté. En attente de connexion...");
    }
});

async function fetchCurrentUser() {
    try {
        // 💡 Assure-toi que cette route existe dans ton start/routes.ts (ex: /me ou /api/me)
        const response = await fetch('/api/me');
        if (response.ok) {
            currentUser = await response.json();
            updateProfileUI();
            updateSidebarProfile();
            updateFollowStats();
        } else {
            console.log("L'utilisateur n'est pas connecté au backend.");
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
        target.style.display = (sectionId === 'appContainer') ? 'grid' : 'block';
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
 * TWEETS & ULTRA-LARGE MÉDIAS (JUSQU'À 5 GO)
 ************************************************/
function handleMediaSelect(input, type) {
    const file = input.files[0];
    if (!file) return;

    selectedMediaFile = file;
    
    const container = document.getElementById('mediaPreview');
    const preview = document.getElementById('previewContent');
    
    if (container) container.classList.remove('hidden');
    if (preview) {
        const fileURL = URL.createObjectURL(file);
        preview.innerHTML = (type === 'image')
            ? `<img src="${fileURL}" style="width:100%; border-radius:15px; max-height:300px; object-fit:cover;">`
            : `<video controls style="width:100%; border-radius:15px; max-height:300px;"><source src="${fileURL}"></video>`;
    }
}

function clearMedia() {
    selectedMediaFile = null;
    const previewInputImg = document.getElementById('postImage');
    const previewInputVid = document.getElementById('postVideo');
    if (previewInputImg) previewInputImg.value = '';
    if (previewInputVid) previewInputVid.value = '';
    
    const mediaPreviewZone = document.getElementById('mediaPreview');
    if (mediaPreviewZone) mediaPreviewZone.classList.add('hidden');
}

function postTweet() {
    const input = document.getElementById('tweetInput');
    const content = input ? input.value.trim() : "";
    const button = document.querySelector("button[onclick='postTweet()']");

    if (!content && !selectedMediaFile) return;

    const formData = new FormData();
    formData.append('content', content);
    if (selectedMediaFile) formData.append('media', selectedMediaFile);

    if (button) {
        button.disabled = true;
        button.innerText = "Envoi...";
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/tweets");
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) xhr.setRequestHeader('x-csrf-token', csrfToken);

    xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const newTweet = JSON.parse(xhr.responseText);
                if (input) input.value = "";
                clearMedia();
                addSingleTweetToTop(newTweet);
            } catch (e) {
                // Si le JSON est invalide, on retombe sur l'ancienne méthode
                console.warn("Réponse serveur non-JSON, recharge complète...");
                if (input) input.value = "";
                clearMedia();
                await loadTweets();
            }
        } else {
            alert("Erreur lors de l'envoi.");
        }
        if (button) {
            button.disabled = false;
            button.innerText = "Poster";
        }
    };
    xhr.send(formData);
}

function addSingleTweetToTop(tweet) {
    const container = document.getElementById('tweetsContainer');
    if (!container) return;

    // 1. On récupère le texte (gère 'content' ou 'contenu')
    const texteAafficher = tweet.content || tweet.contenu || "";
    
    // 2. On récupère les infos de l'utilisateur (soit du tweet, soit de votre session)
    const username = tweet.user?.username || (window.currentUser ? window.currentUser.username : "Moi");
    const avatar = tweet.user?.avatarUrl || (window.currentUser ? window.currentUser.avatarUrl : 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png' );

    let mediaHTML = "";
    if (tweet.mediaUrl) {
        mediaHTML = (tweet.mediaType === 'video')
            ? `<div style="margin-top:10px; background:#000; border-radius:15px; overflow:hidden;"><video controls style="width:100%; max-height:400px; display:block;"><source src="${tweet.mediaUrl}"></video></div>`
            : `<div style="margin-top:10px; border-radius:15px; overflow:hidden;"><img src="${tweet.mediaUrl}" style="width:100%; max-height:500px; object-fit:cover; display:block;"></div>`;
    }

    const div = document.createElement('div');
    div.className = "tweet";
    div.style.borderBottom = "1px solid #2f3336";
    div.style.textAlign = "left";
    div.style.display = "block"; 

    div.innerHTML = `
        <div style="display:flex !important; gap:12px; padding:15px; font-family:sans-serif; justify-content: flex-start !important; align-items: flex-start !important; text-align: left !important;">
            <img src="${avatar}" class="avatar-small" style="width:40px; height:40px; border-radius:50%; object-fit:cover; flex-shrink: 0;">
            <div style="flex:1; display: flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: flex-start !important; text-align: left !important; min-width: 0;">
                <div style="display:flex !important; justify-content:space-between !important; align-items: center !important; width: 100%;">
                    <div style="text-align: left !important;">
                        <strong style="color:#fff;">${username}</strong>
                        <span style="color:#71767b; margin-left:5px;">@${username.toLowerCase().replace(/\s/g, '')}</span>
                    </div>
                    <div>
                        <i class="fa-solid fa-trash-can" onclick="deleteTweet(${tweet.id}, event)" style="cursor:pointer; color:#71767b;"></i>
                    </div>
                </div>
                <p style="color:#fff; margin: 4px 0 10px 0 !important; text-align: left !important; white-space: pre-wrap; font-size: 15px; width: 100% !important;">
                    ${texteAafficher}
                </p>
                <div style="width: 100% !important; text-align: left !important;">
                    ${mediaHTML}
                </div>
                <div style="margin-top:10px; width: 100% !important;">
                    <button onclick="toggleLike(${tweet.id}, event)" style="border:none; background:none; cursor:pointer; color:#71767b; padding: 0;">
                        🤍 0
                    </button>
                </div>
            </div>
        </div>
    `;

    container.prepend(div);
}



async function loadTweets() {
    const container = document.getElementById('tweetsContainer');
    if (!container) return;

    try {
        // 🌟 SYNCHRONISATION : Appel direct du point d'entrée de ton contrôleur
        const response = await fetch('/api/tweets');
        
        if (!response.ok) {
            container.innerHTML = "<p style='padding:20px; color:#71767b;'>Veuillez vous connecter pour voir les tweets.</p>";
            return;
        }

        const tweets = await response.json();
        container.innerHTML = "";

        tweets.forEach(tweet => {
            let mediaHTML = "";
            
            if (tweet.mediaUrl) {
                mediaHTML = (tweet.mediaType === 'video')
                    ? `<div style="margin-top:10px; background:#000; border-radius:15px; overflow:hidden;"><video controls style="width:100%; max-height:400px; display:block;"><source src="${tweet.mediaUrl}"></video></div>`
                    : `<div style="margin-top:10px; border-radius:15px; overflow:hidden;"><img src="${tweet.mediaUrl}" style="width:100%; max-height:500px; object-fit:cover; display:block;"></div>`;
            }

            // 🌟 Sécurisation de l'ID Auteur (gère camelCase et snake_case)
            const idAuteur = tweet.userId || tweet.user_id;
            let rightHeaderElement = "";
            
            // On vérifie si window.currentUser existe pour éviter le plantage
            const monId = (window.currentUser && window.currentUser.id) ? window.currentUser.id : null;

            if (monId && idAuteur === monId) {
                // Mon tweet -> Poubelle
                rightHeaderElement = `<i class="fa-solid fa-trash-can" onclick="deleteTweet(${tweet.id})" style="cursor:pointer; color:#71767b;"></i>`;
            } else if (idAuteur) {
                // Autre utilisateur -> Bouton Follow
                rightHeaderElement = `
                    <button 
                        id="follow-btn-${idAuteur}"
                        onclick="toggleFollow(${idAuteur})"
                        data-following="${tweet.hasFollowed ? 'true' : 'false'}"
                        style="background-color: ${tweet.hasFollowed ? 'transparent' : '#fff'}; 
                               color: ${tweet.hasFollowed ? '#fff' : '#0f1419'}; 
                               border: ${tweet.hasFollowed ? '1px solid #536471' : 'none'}; 
                               font-weight: bold; font-size: 13px; padding: 4px 12px; border-radius: 9999px; cursor: pointer; font-family: sans-serif;"
                    >
                        ${tweet.hasFollowed ? 'Abonné' : 'Suivre'}
                    </button>
                `;
            }

            const div = document.createElement('div');
            div.className = "tweet";
            
            // 🌟 FORCE LE BLOC DE BASE À S'ALIGNER À GAUCHE (Écrase le CSS global)
            div.style.borderBottom = "1px solid #2f3336";
            div.style.textAlign = "left";
            div.style.display = "block"; 

            div.innerHTML = `
                <div style="display:flex !important; gap:12px; padding:15px; font-family:sans-serif; justify-content: flex-start !important; align-items: flex-start !important; text-align: left !important;">
                    <img src="${tweet.user?.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" class="avatar-small" style="width:40px; height:40px; border-radius:50%; object-fit:cover; flex-shrink: 0;">
                    
                    <div style="flex:1; display: flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: flex-start !important; text-align: left !important; min-width: 0;">
                        
                        <div style="display:flex !important; justify-content:space-between !important; align-items: center !important; width: 100%;">
                            <div style="text-align: left !important;">
                                <strong style="color:#fff;">${tweet.user?.username || 'Anonyme'}</strong>
                                <span style="color:#71767b; margin-left:5px;">@${(tweet.user?.username || 'anonyme').toLowerCase().replace(/\s/g, '')}</span>
                            </div>
                            <div>
                                ${rightHeaderElement}
                            </div>
                        </div>
                        
                        <p style="color:#fff; margin: 4px 0 10px 0 !important; text-align: left !important; white-space: pre-wrap; font-size: 15px; width: 100% !important; align-self: flex-start !important;">
                         ${tweet.content || tweet.contenu || ''}
                        </p>
                        
                        <div style="width: 100% !important; text-align: left !important;">
                            ${mediaHTML}
                        </div>
                        
                        <div style="margin-top:10px; width: 100% !important; text-align: left !important;">
                            <button onclick="toggleLike(${tweet.id}, event)" style="border:none; background:none; cursor:pointer; color:${tweet.hasLiked ? '#f91880' : '#71767b'}; padding: 0;">
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

async function toggleLike(tweetId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    // 1. On récupère le bouton
    const btn = event.currentTarget || event.target;
    
    // 2. On extrait le nombre actuel depuis le texte du bouton
    // (On enlève l'émoji et on garde le chiffre)
    let currentText = btn.innerText.trim();
    let currentCount = parseInt(currentText.replace(/[❤️🤍]/g, '')) || 0;
    
    // 3. On détermine le nouvel état localement
    const isCurrentlyLiked = btn.innerText.includes("❤️");
    const newIsLiked = !isCurrentlyLiked;
    const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    // 4. MISE À JOUR IMMÉDIATE DE L'INTERFACE (C'est instantané !)
    btn.style.color = newIsLiked ? '#f91880' : '#71767b';
    btn.innerHTML = `${newIsLiked ? "❤️" : "🤍"} ${newCount}`;

    try {
        // 5. On envoie la requête au serveur en arrière-plan
        const response = await fetch(`/api/tweets/${tweetId}/like`, {
            method: 'POST',
            headers: {
                'x-csrf-token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (!response.ok) {
            throw new Error("Erreur serveur");
        }
        
        // Optionnel : si le serveur renvoie le vrai compte, on synchronise
        const data = await response.json();
        if (data && typeof data.likesCount !== 'undefined') {
            btn.innerHTML = `${newIsLiked ? "❤️" : "🤍"} ${data.likesCount}`;
        }

    } catch (e) {
        console.error("Erreur lors du like", e);
        // En cas d'erreur, on remet l'ancien état pour ne pas mentir à l'utilisateur
        btn.style.color = isCurrentlyLiked ? '#f91880' : '#71767b';
        btn.innerHTML = `${isCurrentlyLiked ? "❤️" : "🤍"} ${currentCount}`;
        alert("Impossible de liker ce tweet. Vérifiez votre connexion.");
    }
}

async function deleteTweet(tweetId, event) {
    // 1. On demande confirmation
    if (!confirm("Supprimer ce post définitivement ?")) return;

    try {
        // 2. On envoie la demande de suppression au serveur
        const response = await fetch(`/api/tweets/${tweetId}`, { 
            method: 'DELETE',
            headers: {
                'x-csrf-token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            // 3. MISE À JOUR CHIRURGICALE
            // On trouve le bloc ".tweet" le plus proche de l'icône cliquée
            if (event) {
                const tweetElement = event.target.closest('.tweet');
                if (tweetElement) {
                    // On le retire de l'écran avec une petite animation si on veut, 
                    // ou simplement comme ça :
                    tweetElement.remove();
                }
            } else {
                // Au cas où l'event ne passerait pas, on recharge tout (roue de secours)
                await loadTweets();
            }
        } else {
            alert("Erreur lors de la suppression sur le serveur.");
        }
    } catch (e) {
        console.error("Erreur suppression:", e);
    }
}

/************************************************
 * GESTION DU PROFIL (RÉEL)
 ************************************************/
async function saveProfile() {
    const nameInput = document.getElementById('editName');
    const bioInput = document.getElementById('editBio');
    const bannerInput = document.getElementById('editBannerFile');
    const photoInput = document.getElementById('editPhotoFile');

    if (!nameInput) return;

    const formData = new FormData();
    formData.append('username', nameInput.value);
    if (bioInput) formData.append('bio', bioInput.value);
    
    if (photoInput && photoInput.files[0]) formData.append('avatar', photoInput.files[0]);
    if (bannerInput && bannerInput.files[0]) formData.append('banner', bannerInput.files[0]);

    try {
        const response = await fetch('/api/profile', { 
            method: 'PUT', 
            body: formData,
            headers: {
                'x-csrf-token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
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
        <img src="${currentUser.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}" class="avatar-small" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
        <div style="margin-left:10px">
            <strong style="display:block; color:#fff;">${currentUser.username}</strong>
            <span style="color:#71767b">@${currentUser.username.toLowerCase().replace(/\s/g, '')}</span>
        </div>
    `;
}

async function logout() {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
        try {
            const response = await fetch('/api/logout', { 
                method: 'POST',
                headers: {
                    'x-csrf-token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            if (response.ok) window.location.href = '/login';
        } catch (e) { window.location.reload(); }
    }
}

function openEditModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal && currentUser) {
        modal.classList.remove('hidden');
        if (document.getElementById('editName')) document.getElementById('editName').value = currentUser.username;
        if (document.getElementById('editBio')) document.getElementById('editBio').value = currentUser.bio || '';
    }
}
function closeEditModal() { 
    const modal = document.getElementById('editProfileModal');
    if (modal) modal.classList.add('hidden'); 
}

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
    if (!passwordInput) return;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (toggleIcon) toggleIcon.className = 'fa-solid fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        if (toggleIcon) toggleIcon.className = 'fa-regular fa-eye';
    }
}

function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(iconId);

    if (!passwordInput || !eyeIcon) return;

    if (passwordInput.type === 'password') {
        // 1. On change le type en text pour afficher le mot de passe
        passwordInput.type = 'text';
        
        // 2. On change l'icône FontAwesome pour l'œil barré (eye-slash)
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        // 1. On remet le type en password pour masquer
        passwordInput.type = 'password';
        
        // 2. On remet l'icône de l'œil normal
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

async function toggleFollow(userId) {
    const button = document.getElementById(`follow-btn-${userId}`)
    const isFollowing = button.getAttribute('data-following') === 'true'
  
    try {
      // Envoi de la requête au backend AdonisJS
      const response = await fetch(`/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') // Décommente si Shield bloque
        }
      })
  
      if (!response.ok) throw new Error('Erreur réseau')
      const data = await response.json()
  
      // 🔄 Mise à jour visuelle du bouton selon la réponse du serveur
      if (data.following) {
        button.setAttribute('data-following', 'true')
        button.textContent = 'Abonné'
        button.style.backgroundColor = 'transparent'
        button.style.color = '#fff'
        button.style.border = '1px solid #536471'
      } else {
        button.setAttribute('data-following', 'false')
        button.textContent = 'Suivre'
        button.style.backgroundColor = '#fff'
        button.style.color = '#0f1419'
        button.style.border = 'none'
      }
    } catch (error) {
      console.error("Impossible de modifier le follow :", error)
    }
  }
  
  // 🎨 Effet X (Twitter) : Quand on passe la souris sur "Abonné", il affiche "Se désabonner" en rouge
  function handleMouseOver(btn) {
    if (btn.getAttribute('data-following') === 'true') {
      btn.textContent = 'Se désabonner'
      btn.style.color = '#f4212e'
      btn.style.borderColor = '#f4212e'
      btn.style.backgroundColor = 'rgba(244, 33, 46, 0.1)'
    }
  }
  
  function handleMouseOut(btn) {
    if (btn.getAttribute('data-following') === 'true') {
      btn.textContent = 'Abonné'
      btn.style.color = '#fff'
      btn.style.borderColor = '#536471'
      btn.style.backgroundColor = 'transparent'
    }
  }

// ... toutes tes autres fonctions ...

async function loadUsers() {
    // Ton code existant...
}

function updateFollowStats() {
    // Ton code existant...
}

/************************************************
 * 🌟 LE BLOC WINDOW TOUT EN BAS DE TOUT LE FICHIER
 ************************************************/
window.showSection = showSection;
window.showPage = showPage;
window.handleMediaSelect = handleMediaSelect;
window.clearMedia = clearMedia;
window.postTweet = postTweet;
window.toggleLike = toggleLike;
window.deleteTweet = deleteTweet;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveProfile = saveProfile;
window.setTheme = setTheme;
window.setAccent = setAccent;
window.logout = logout;
window.togglePassword = togglePassword;
window.toggleFollow = toggleFollow;
window.loadTweets = loadTweets; 