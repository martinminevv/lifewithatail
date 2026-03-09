// Check user authentication status and update nav button
async function updateAuthNav() {
    try {
        const res = await fetch('/api/me', {
            credentials: 'include'
        });
        
        const navAuthLink = document.querySelector('.nav-auth .auth-icon');
        const navAuth = document.querySelector('.nav-auth');
        
        if (res.ok) {
            const user = await res.json();
            
            // User is logged in - show logout button
            navAuthLink.href = '#';
            navAuthLink.setAttribute('aria-label', 'Log out');
            navAuthLink.setAttribute('title', 'Log out');
            navAuthLink.querySelector('.auth-user').src = 'images/logout.png';
            navAuthLink.querySelector('.auth-user').alt = 'Log out';
            
            // Add logout functionality
            navAuthLink.onclick = (e) => {
                e.preventDefault();
                logout();
            };

            // Add profile button for all logged-in users
            const existingProfileBtn = document.querySelector('.profile-menu-btn');
            if (!existingProfileBtn) {
                const profileBtn = document.createElement('a');
                profileBtn.href = 'profile.html';
                profileBtn.className = 'profile-menu-btn';
                profileBtn.setAttribute('aria-label', 'My Profile');
                profileBtn.setAttribute('title', 'My Profile');
                profileBtn.innerHTML = `<span class="profile-icon-circle">${(user.name || user.email || 'U')[0].toUpperCase()}</span>`;
                navAuth.insertBefore(profileBtn, navAuthLink);
            }
            
            // If user is admin, add admin menu button
            if (user.role === 'admin') {
                const existingAdminBtn = document.querySelector('.admin-menu-btn');
                if (!existingAdminBtn) {
                    const adminBtn = document.createElement('a');
                    adminBtn.href = 'admin.html';
                    adminBtn.className = 'admin-menu-btn';
                    adminBtn.setAttribute('aria-label', 'Admin Menu');
                    adminBtn.setAttribute('title', 'Admin Menu');
                    
                    const adminImg = document.createElement('img');
                    adminImg.src = 'images/admin.png';
                    adminImg.alt = 'Admin Menu';
                    
                    adminBtn.appendChild(adminImg);
                    navAuth.insertBefore(adminBtn, navAuthLink);
                }
            }
        } else {
            // User is not logged in - show login button
            navAuthLink.href = 'login.html';
            navAuthLink.setAttribute('aria-label', 'Log in');
            navAuthLink.setAttribute('title', 'Log in');
            navAuthLink.querySelector('.auth-user').src = 'images/login.png';
            navAuthLink.querySelector('.auth-user').alt = 'Log in';
            navAuthLink.onclick = null;
            
            // Remove admin button if it exists
            const adminBtn = document.querySelector('.admin-menu-btn');
            if (adminBtn) {
                adminBtn.remove();
            }
            // Remove profile button if it exists
            const profileBtn = document.querySelector('.profile-menu-btn');
            if (profileBtn) {
                profileBtn.remove();
            }
        }
    } catch (err) {
        console.error('Error checking auth status:', err);
    }
}

async function logout() {
    try {
        const res = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        if (res.ok) {
            window.location.reload();
        }
    } catch (err) {
        console.error('Logout error:', err);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateAuthNav);
