// ── Translation maps for dynamic animal data ──
const genderMap = {
  en: { 'male': 'Male', 'female': 'Female', 'Мъжко/а': 'Male', 'Женско/а': 'Female' },
  bg: { 'male': 'Мъжко', 'female': 'Женско', 'Мъжко/а': 'Мъжко', 'Женско/а': 'Женско' }
};

const speciesMap = {
  en: { 'dog': 'Dog', 'cat': 'Cat' },
  bg: { 'dog': 'Куче', 'cat': 'Котка' }
};

const labelMap = {
  en: { name: 'Name', age: 'Age', breed: 'Breed', sex: 'Sex', species: 'Species', adoptBtn: 'Adopt Me', unknown: 'Unknown' },
  bg: { name: 'Име', age: 'Възраст', breed: 'Порода', sex: 'Пол', species: 'Вид', adoptBtn: 'Осинови ме', unknown: 'Неизвестно' }
};

// ── Age unit translation ──
function translateAge(rawAge, lang) {
  if (!rawAge) return '';
  if (lang === 'bg') {
    return rawAge
      .replace(/\byears\b/gi, 'години')
      .replace(/\byear\b/gi, 'година')
      .replace(/\bmonths\b/gi, 'месеца')
      .replace(/\bmonth\b/gi, 'месец');
  }
  // en – reverse
  return rawAge
    .replace(/\bгодини\b/gi, 'years')
    .replace(/\bгодина\b/gi, 'year')
    .replace(/\bмесеца\b/gi, 'months')
    .replace(/\bмесец\b/gi, 'month');
}

// ── State ──
let allAnimals = [];
let currentFilter = 'all';
let favoriteIds = new Set();
let isLoggedIn = false;
let currentModalAnimalId = null;

function getCurrentLang() {
  return document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'bg';
}

// ── Check auth & load favorites ──
async function loadUserState() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok) {
      isLoggedIn = true;
      const favRes = await fetch('/api/favorites/ids', { credentials: 'include' });
      if (favRes.ok) {
        const ids = await favRes.json();
        favoriteIds = new Set(ids);
      }
    }
  } catch { /* not logged in */ }
}

// ── Load animals from API ──
async function loadAnimalsFromDatabase() {
  try {
    await loadUserState();
    const response = await fetch('/api/animals');
    if (!response.ok) {
      console.error('Failed to fetch animals:', response.statusText);
      return;
    }
    allAnimals = await response.json();
    renderFilteredPets();
    setupFilterButtons();
  } catch (error) {
    console.error('Error fetching animals:', error);
  }
}

// ── Filter buttons ──
function setupFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderFilteredPets();
    });
  });
}

// ── Render pets based on current filter ──
function renderFilteredPets() {
  let filtered = allAnimals;
  if (currentFilter !== 'all') {
    filtered = allAnimals.filter(a => (a.species || 'dog') === currentFilter);
  }
  populatePetGrid(filtered);
}

// ── Build pet cards with translatable labels ──
function populatePetGrid(animals) {
  const petsGrid = document.querySelector('.pets-grid');
  if (!petsGrid) return;

  petsGrid.innerHTML = '';
  const lang = getCurrentLang();
  const labels = labelMap[lang] || labelMap.en;
  const genders = genderMap[lang] || genderMap.en;
  const speciesTexts = speciesMap[lang] || speciesMap.en;

  animals.forEach(animal => {
    const petCard = document.createElement('div');
    petCard.className = 'pet-card';
    const species = animal.species || 'dog';
    petCard.setAttribute('data-species', species);

    const age = animal.age || labels.unknown;
    const ageTranslated = translateAge(age, lang);
    const genderRaw = animal.gender || '';
    const genderText = genders[genderRaw] || genderRaw || labels.unknown;
    const speciesText = speciesTexts[species] || species;
    const imageUrl = animal.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e0e0e0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

    petCard.innerHTML = `
      <div class="pet-image">
        <img src="${imageUrl}" alt="${animal.name}">
        <button class="fav-heart ${favoriteIds.has(animal.id) ? 'active' : ''}" data-id="${animal.id}" onclick="toggleFavorite(event, ${animal.id})" title="Favorite">
          ${favoriteIds.has(animal.id) ? '&#10084;' : '&#9825;'}
        </button>
      </div>
      <div class="pet-info">
        <div class="pet-name">${animal.name}</div>
        <div class="pet-details-grid">
          <div class="pet-detail-row">
            <span class="pet-label" data-translate="pet-label-breed">${labels.breed}:</span>
            <span class="pet-value">${animal.breed || labels.unknown}</span>
          </div>
          <div class="pet-detail-row">
            <span class="pet-label" data-translate="pet-label-age">${labels.age}:</span>
            <span class="pet-value pet-age" data-age="${age}">${ageTranslated}</span>
          </div>
          <div class="pet-detail-row">
            <span class="pet-label" data-translate="pet-label-sex">${labels.sex}:</span>
            <span class="pet-value pet-gender" data-gender="${genderRaw}">${genderText}</span>
          </div>
          <div class="pet-detail-row">
            <span class="pet-label" data-translate="pet-label-species">${labels.species}:</span>
            <span class="pet-value pet-species" data-species-val="${species}">${speciesText}</span>
          </div>
        </div>
        <button class="adopt-btn" data-translate="pet-adopt-btn" onclick="openModal('${animal.name.replace(/'/g, "\\'")}', ${animal.id})">${labels.adoptBtn}</button>
      </div>
    `;

    petsGrid.appendChild(petCard);
  });
}

// ── Called by language-switcher after language change ──
function retranslatePetCards() {
  const lang = getCurrentLang();
  const labels = labelMap[lang] || labelMap.en;
  const genders = genderMap[lang] || genderMap.en;
  const speciesTexts = speciesMap[lang] || speciesMap.en;

  document.querySelectorAll('.pet-label[data-translate="pet-label-breed"]').forEach(el => el.textContent = labels.breed + ':');
  document.querySelectorAll('.pet-label[data-translate="pet-label-age"]').forEach(el => el.textContent = labels.age + ':');
  document.querySelectorAll('.pet-label[data-translate="pet-label-sex"]').forEach(el => el.textContent = labels.sex + ':');
  document.querySelectorAll('.pet-label[data-translate="pet-label-species"]').forEach(el => el.textContent = labels.species + ':');

  document.querySelectorAll('.pet-age').forEach(el => {
    const raw = el.getAttribute('data-age');
    el.textContent = translateAge(raw, lang);
  });

  document.querySelectorAll('.pet-gender').forEach(el => {
    const raw = el.getAttribute('data-gender');
    el.textContent = genders[raw] || raw || labels.unknown;
  });

  document.querySelectorAll('.pet-species').forEach(el => {
    const raw = el.getAttribute('data-species-val');
    el.textContent = speciesTexts[raw] || raw || '';
  });

  document.querySelectorAll('[data-translate="pet-adopt-btn"]').forEach(el => {
    el.textContent = labels.adoptBtn;
  });
}

// ── Toggle favorite heart ──
async function toggleFavorite(e, animalId) {
  e.stopPropagation();
  if (!isLoggedIn) {
    const lang = getCurrentLang();
    alert(lang === 'bg' ? 'Моля, влезте в профила си, за да добавите любими.' : 'Please log in to add favorites.');
    window.location.href = '/login.html';
    return;
  }
  const btn = e.currentTarget;
  const isFav = favoriteIds.has(animalId);
  try {
    if (isFav) {
      await fetch('/api/favorites/' + animalId, { method: 'DELETE', credentials: 'include' });
      favoriteIds.delete(animalId);
      btn.classList.remove('active');
      btn.innerHTML = '&#9825;';
    } else {
      await fetch('/api/favorites/' + animalId, { method: 'POST', credentials: 'include' });
      favoriteIds.add(animalId);
      btn.classList.add('active');
      btn.innerHTML = '&#10084;';
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
  }
}

function scrollToPets() {
  const el = document.getElementById('pets');
  if (!el) return;
  const header = document.querySelector('header');
  const headerHeight = header ? header.offsetHeight : 0;
  const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
  window.scrollTo({ top, behavior: 'smooth' });
}

function openModal(petName, animalId) {
  currentModalAnimalId = animalId || null;
  document.getElementById('petName').textContent = petName;
  document.getElementById('adoptModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('adoptModal').style.display = 'none';
}

function submitForm(e) {
  e.preventDefault();
  const lang = getCurrentLang();
  if (!isLoggedIn) {
    alert(lang === 'bg' ? 'Моля, влезте в профила си, за да кандидатствате.' : 'Please log in to submit an application.');
    window.location.href = '/login.html';
    return;
  }
  // Submit to API
  const message = e.target.querySelector('textarea') ? e.target.querySelector('textarea').value : '';
  fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ animal_id: currentModalAnimalId, message }),
    credentials: 'include'
  }).then(res => res.json().then(data => {
    if (!res.ok) {
      alert(data.error || (lang === 'bg' ? 'Грешка при изпращане.' : 'Submission error.'));
      return;
    }
    alert(lang === 'bg' ? 'Благодарим за заявката! Ще се свържем с вас скоро.' : 'Thank you for your application! We will contact you soon.');
    closeModal();
    e.target.reset();
  })).catch(() => {
    alert(lang === 'bg' ? 'Мрежова грешка.' : 'Network error.');
  });
}

function submitContactForm(e) {
  e.preventDefault();
  alert('Thank you for your message! We will get back to you shortly.');
  e.target.reset();
}

function submitVolunteerForm(e) {
  e.preventDefault();
  alert('Thank you for your interest in volunteering! We will contact you soon to schedule an orientation.');
  e.target.reset();
}

window.onclick = function(e) {
  const modal = document.getElementById('adoptModal');
  if (modal && e.target === modal) {
    closeModal();
  }
}

// Load animals when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadAnimalsFromDatabase();

  // If there's a `pet` query parameter (e.g., ?pet=Max), open that pet's modal and scroll to the card
  const params = new URLSearchParams(window.location.search);
  const pet = params.get('pet');
  if (pet) {
    setTimeout(() => {
      const petCards = document.querySelectorAll('.pet-card');
      petCards.forEach(card => {
        const nameEl = card.querySelector('.pet-name');
        if (nameEl && nameEl.textContent.trim().toLowerCase() === pet.toLowerCase()) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      // Give a moment for scroll to finish, then open modal
      setTimeout(() => openModal(pet), 500);
    }, 100);
    // Remove the query parameter from the URL to prevent re-triggering on refresh
    history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
});

// Animated counter for statistics
const observerOptions = {
  threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumbers = entry.target.querySelectorAll('.stat-number');
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target')) || 0;
        const suffix = stat.getAttribute('data-suffix') || '';
        let count = 0;
        const increment = target / 50;
        
        const updateCount = () => {
          if (count < target) {
            count += increment;
            const display = Math.min(Math.ceil(count), target);
            stat.textContent = `${display}${suffix}`;
            setTimeout(updateCount, 30);
          } else {
            stat.textContent = `${target}${suffix}`;
          }
        };
        updateCount();
      });
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);
