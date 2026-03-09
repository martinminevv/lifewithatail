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

function closeModal() {
    document.getElementById('adoptModal').style.display = 'none';
}

function submitForm(e) {
    e.preventDefault();
    alert('Thank you for your application! We will contact you soon.');
    closeModal();
    e.target.reset();
}

function submitContactForm(e) {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you shortly.');
    e.target.reset();
}

window.onclick = function(e) {
    const modal = document.getElementById('adoptModal');
    if (e.target === modal) {
        closeModal();
    }
}

// Animated counter for statistics
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                let count = 0;
                const increment = target / 50;
                
                const updateCount = () => {
                    if (count < target) {
                        count += increment;
                        stat.textContent = Math.ceil(count);
                        setTimeout(updateCount, 30);
                    } else {
                        stat.textContent = target;
                    }
                };
                updateCount();
            });
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

observer.observe(document.querySelector('.stats-section'));