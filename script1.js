function scrollToPets() {
    const el = document.getElementById('pets');
    if (!el) return;
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    window.scrollTo({ top, behavior: 'smooth' });
}

function openModal(petName) {
    document.getElementById('petName').textContent = petName;
    document.getElementById('adoptModal').style.display = 'block';
}

function redirectToAdoption(petName) {
    // Navigate to adoption page with pet parameter so it opens the same pet modal there
    window.location.href = `adoption.html?pet=${encodeURIComponent(petName)}`;
}

function closeModal() {
    document.getElementById('adoptModal').style.display = 'none';
}

function submitForm(e) {
    e.preventDefault();
    alert('Thank you for your application! We will contact you soon.');
    closeModal();
    e.target.reset();
}

async function submitContactForm(e) {
    e.preventDefault();
    const name = document.getElementById('cf_name').value.trim();
    const email = document.getElementById('cf_email').value.trim();
    const phone = document.getElementById('cf_phone').value.trim();
    const subject = document.getElementById('cf_subject').value;
    const message = document.getElementById('cf_message').value.trim();
    if (!name || !email || !message) return alert('Please fill in all required fields.');
    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, subject, message })
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error || 'Failed to send message.');
        const lang = document.documentElement.lang || localStorage.getItem('preferredLanguage') || 'bg';
        alert(lang === 'bg' ? 'Благодарим за съобщението! Ще се свържем с вас скоро.' : 'Thank you for your message! We will get back to you shortly.');
        e.target.reset();
    } catch (err) {
        alert('Network error. Please try again.');
    }
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

// If there's a `pet` query parameter (e.g., ?pet=Max), open that pet's modal and scroll to the card
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const pet = params.get('pet');
    if (pet) {
        const petCards = document.querySelectorAll('.pet-card');
        petCards.forEach(card => {
            const nameEl = card.querySelector('.pet-name');
            if (nameEl && nameEl.textContent.trim().toLowerCase() === pet.toLowerCase()) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        // Give a moment for scroll to finish, then open modal
        setTimeout(() => openModal(pet), 500);
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

// Observe stats sections on all pages
const statsSections = document.querySelectorAll('.stats-section, .intro-stats');
statsSections.forEach(section => {
    if (section) observer.observe(section);
});