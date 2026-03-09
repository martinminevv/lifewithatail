// ── Profile Page Script ──

// Status label translations
const statusLabels = {
  en: { pending: 'Pending', reviewing: 'Under Review', approved: 'Approved', declined: 'Declined' },
  bg: { pending: 'Чакащо', reviewing: 'В преглед', approved: 'Одобрено', declined: 'Отказано' }
};

function getLang() {
  return document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'bg';
}

// ── Auth guard ──
async function loadProfile() {
  try {
    const res = await fetch('/api/profile', { credentials: 'include' });
    if (!res.ok) {
      window.location.href = '/login.html';
      return null;
    }
    return await res.json();
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', async () => {
  const profile = await loadProfile();
  if (!profile) return;

  // Fill header
  document.getElementById('profileDisplayName').textContent = profile.name || profile.email;
  document.getElementById('profileEmail').textContent = profile.email;
  const since = new Date(profile.created_at).toLocaleDateString();
  document.getElementById('profileSince').textContent = since;

  // Avatar letter
  const initial = (profile.name || profile.email || 'U')[0].toUpperCase();
  document.getElementById('profileAvatar').textContent = initial;

  // Fill form
  document.getElementById('pName').value = profile.name || '';
  document.getElementById('pEmail').value = profile.email || '';
  document.getElementById('pPhone').value = profile.phone || '';
  document.getElementById('pAddress').value = profile.address || '';

  // Load tabs data
  loadFavorites();
  loadApplications();

  // Tab switching
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
  });
});

// ── Save profile form ──
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('profileMsg');
  const lang = getLang();
  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('pName').value,
        phone: document.getElementById('pPhone').value,
        address: document.getElementById('pAddress').value
      }),
      credentials: 'include'
    });
    if (!res.ok) throw new Error();
    msgEl.className = 'profile-msg success';
    msgEl.textContent = lang === 'bg' ? 'Промените са запазени!' : 'Changes saved!';
    msgEl.style.display = 'block';
    // Update header name
    const n = document.getElementById('pName').value;
    if (n) {
      document.getElementById('profileDisplayName').textContent = n;
      document.getElementById('profileAvatar').textContent = n[0].toUpperCase();
    }
    setTimeout(() => msgEl.style.display = 'none', 3000);
  } catch {
    msgEl.className = 'profile-msg error';
    msgEl.textContent = lang === 'bg' ? 'Грешка при запазване.' : 'Error saving changes.';
    msgEl.style.display = 'block';
  }
});

// ── Favorites ──
async function loadFavorites() {
  const grid = document.getElementById('favoritesGrid');
  const lang = getLang();
  try {
    const res = await fetch('/api/favorites', { credentials: 'include' });
    if (!res.ok) return;
    const favs = await res.json();
    if (favs.length === 0) {
      grid.innerHTML = `<p class="empty-state" data-translate="profile-no-favorites">${lang === 'bg' ? 'Все още нямате любими животни. Разгледайте страницата за осиновяване и натиснете сърчицето!' : "You haven't favorited any pets yet. Browse the adoption page and click the heart icon!"}</p>`;
      return;
    }
    grid.innerHTML = '';
    favs.forEach(a => {
      const imgSrc = a.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e0e0e0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
      const card = document.createElement('div');
      card.className = 'fav-card';
      card.innerHTML = `
        <div class="fav-card-image"><img src="${imgSrc}" alt="${a.name}"></div>
        <div class="fav-card-body">
          <div class="pet-name">${a.name}</div>
          <div class="pet-meta">${a.breed} · ${a.age} · ${(a.species === 'cat' ? '🐱' : '🐶')}</div>
          <div class="fav-card-actions">
            <button class="btn-adopt-fav" onclick="window.location.href='adoption.html?pet=${encodeURIComponent(a.name)}'">${lang === 'bg' ? 'Осинови' : 'Adopt'}</button>
            <button class="btn-remove-fav" onclick="removeFavorite(${a.id}, this)">✕</button>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading favorites:', err);
  }
}

async function removeFavorite(animalId, btn) {
  try {
    await fetch('/api/favorites/' + animalId, { method: 'DELETE', credentials: 'include' });
    const card = btn.closest('.fav-card');
    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    setTimeout(() => {
      card.remove();
      const grid = document.getElementById('favoritesGrid');
      if (!grid.querySelector('.fav-card')) {
        const lang = getLang();
        grid.innerHTML = `<p class="empty-state">${lang === 'bg' ? 'Все още нямате любими животни.' : "You haven't favorited any pets yet."}</p>`;
      }
    }, 300);
  } catch (err) {
    console.error('Error removing favorite:', err);
  }
}

// ── Re-translate dynamic profile content (called by language-switcher) ──
function retranslateProfileContent() {
  const lang = getLang();
  const labels = statusLabels[lang] || statusLabels.en;

  // Update application status badges
  document.querySelectorAll('.app-status[data-status]').forEach(el => {
    const status = el.getAttribute('data-status');
    el.textContent = labels[status] || status;
  });

  // Update favorite card buttons
  document.querySelectorAll('.btn-adopt-fav').forEach(el => {
    el.textContent = lang === 'bg' ? 'Осинови' : 'Adopt';
  });

  // Update empty states
  const favGrid = document.getElementById('favoritesGrid');
  const favEmpty = favGrid ? favGrid.querySelector('.empty-state') : null;
  if (favEmpty && !favGrid.querySelector('.fav-card')) {
    favEmpty.textContent = lang === 'bg' ? 'Все още нямате любими животни. Разгледайте страницата за осиновяване и натиснете сърчицето!' : "You haven't favorited any pets yet. Browse the adoption page and click the heart icon!";
  }

  const appList = document.getElementById('applicationsList');
  const appEmpty = appList ? appList.querySelector('.empty-state') : null;
  if (appEmpty && !appList.querySelector('.app-card')) {
    appEmpty.textContent = lang === 'bg' ? 'Все още нямате заявки за осиновяване.' : "You haven't submitted any adoption applications yet.";
  }
}

// ── Applications ──
async function loadApplications() {
  const list = document.getElementById('applicationsList');
  const lang = getLang();
  const labels = statusLabels[lang] || statusLabels.en;
  try {
    const res = await fetch('/api/applications', { credentials: 'include' });
    if (!res.ok) return;
    const apps = await res.json();
    if (apps.length === 0) {
      list.innerHTML = `<p class="empty-state" data-translate="profile-no-applications">${lang === 'bg' ? 'Все още нямате заявки за осиновяване.' : "You haven't submitted any adoption applications yet."}</p>`;
      return;
    }
    list.innerHTML = '';
    apps.forEach(ap => {
      const imgSrc = ap.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70'%3E%3Crect fill='%23e0e0e0' width='70' height='70'/%3E%3C/svg%3E";
      const dateStr = new Date(ap.created_at).toLocaleDateString();
      const card = document.createElement('div');
      card.className = 'app-card';
      card.innerHTML = `
        <div class="app-card-image"><img src="${imgSrc}" alt="${ap.animal_name}"></div>
        <div class="app-card-info">
          <div class="app-pet-name">${ap.animal_name}</div>
          <div class="app-meta">${ap.breed} · ${dateStr}</div>
        </div>
        <span class="app-status ${ap.status}" data-status="${ap.status}">${labels[ap.status] || ap.status}</span>`;
      list.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading applications:', err);
  }
}
