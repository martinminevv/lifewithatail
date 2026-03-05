# CSS File Organization

This document describes the CSS structure for the Paws & Hearts Animal Shelter website.

## Base Styles
**File:** `base.css`
- Global reset and defaults
- Body, html, and universal styles
- Header and navigation styles
- Footer styles
- Common animations (fadeInUp, slideDown, bounce, shimmer)
- Common form elements (buttons, inputs, textareas)
- Common utilities (modal, section titles, etc.)
- **Shared across all pages**

## Page-Specific Styles

### Home Page
**File:** `home.css`
**Used by:** `home.html`
- Hero banner
- Stats section
- Testimonials section
- Donation section

### Adoption Page
**File:** `adoption.css`
**Used by:** `adoption.html`
- Page header
- Pets section and pet cards
- Adoption process steps
- Adoption requirements
- Adoption FAQ

### Volunteer Page
**File:** `volunteer.css`
**Used by:** `volunteer.html`
- Page header
- Volunteer intro section
- Volunteer opportunities
- Volunteer benefits
- Volunteer requirements
- Volunteer application form

### Contact Page
**File:** `contact.css`
**Used by:** `contact.html`
- Page header
- Contact hero section
- Contact information and form
- Info cards and social media links
- Map section
- Emergency contact section
- Contact FAQ

### Auth Pages (Login & Signup)
**File:** `auth.css`
**Used by:** `login.html`, `signup.html`
- Auth container styling
- Auth form elements
- Auth error messages
- Auth footer
- Brand/logo area

### Admin Page
**File:** `admin.css`
**Used by:** `admin.html`
- Admin container
- Animal form section
- Animals list and animal cards
- Edit/delete buttons

## How Pages Link to CSS Files

Each HTML page now links to **two CSS files:**
1. **base.css** - Shared styles for all pages
2. **Page-specific CSS** - Unique styles for that page

Example from `home.html`:
```html
<link rel="stylesheet" href="base.css">
<link rel="stylesheet" href="home.css">
```

## Legacy Files
- **style1.css** - Original combined stylesheet (kept for reference)
- **style.css** - Previous stylesheet (kept for reference)

You can safely delete these legacy files once you've confirmed all pages are working correctly.

## Benefits of This Organization
✅ Easier to find and modify styles for specific pages
✅ Reduces file size by separating concerns
✅ Better maintainability and organization
✅ Prevents style conflicts between pages
✅ Clearer separation of shared vs. page-specific styles
✅ Better for team collaboration
