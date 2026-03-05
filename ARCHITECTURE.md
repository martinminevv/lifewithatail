# Animal Management System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────────┐    │
│  │  ADMIN PANEL     │              │  ADOPTION PAGE       │    │
│  │  (admin.html)    │              │  (adoption.html)     │    │
│  │                  │              │                      │    │
│  │ • Add Animal     │              │ • View All Animals   │    │
│  │ • Edit Animal    │◄─────API─────►• Pet Cards Grid     │    │
│  │ • Delete Animal  │              │ • Adoption Modal     │    │
│  │ • List Animals   │              │ • Images & Details   │    │
│  └──────────────────┘              └──────────────────────┘    │
│         │                                    │                   │
│         │ admin-form-submit                 │ adoption-script.js │
│         │ edit-btn-click                    │ loadAnimalsFromDB()│
│         │ delete-btn-click                  │                   │
│         │                                   │                   │
└─────────┼───────────────────────────────────┼───────────────────┘
          │                                   │
          │      FETCH/POST/PUT/DELETE       │
          │                                   │
┌─────────▼───────────────────────────────────▼───────────────────┐
│               EXPRESS.JS SERVER (server.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  API Routes:                                                     │
│  ├── GET /api/animals           (PUBLIC - get all animals)      │
│  ├── POST /api/animals          (ADMIN - add animal)            │
│  ├── PUT /api/animals/:id       (ADMIN - update animal)         │
│  ├── DELETE /api/animals/:id    (ADMIN - delete animal)         │
│  ├── GET /api/me                (USER - check auth)             │
│  ├── POST /api/login            (PUBLIC - login)                │
│  ├── POST /api/signup           (PUBLIC - register)             │
│  └── POST /api/logout           (USER - logout)                 │
│                                                                   │
│  Middleware:                                                     │
│  ├── Session management                                         │
│  ├── Authentication (requireLogin)                              │
│  └── Authorization (requireAdmin)                               │
│                                                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ SQL Queries
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              SQLITE DATABASE (data.sqlite)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Table: animals                  Table: users                    │
│  ├── id (PK)                    ├── id (PK)                     │
│  ├── name                       ├── name                        │
│  ├── breed                      ├── email (UNIQUE)              │
│  ├── age                        ├── password (hashed)           │
│  ├── gender                     ├── role (admin/user)           │
│  ├── description                └── created_at                  │
│  ├── image                                                       │
│  └── created_at                 Table: sessions                 │
│                                 ├── sid (PK)                    │
│                                 ├── expires                     │
│                                 └── sess                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Adding an Animal (Admin)

```
Admin fills form
    ↓
Clicks "Save Animal"
    ↓
JavaScript collects form data
    ↓
POST /api/animals with JSON payload
    ↓
Server validates admin role
    ↓
INSERT INTO animals table
    ↓
Return animal data
    ↓
JavaScript updates animal list
    ↓
Admin sees animal in list
    ↓ (without page reload)
Adoption page sees new animal next time
```

### Viewing Animals (Public)

```
User visits adoption.html
    ↓
Page loads with empty grid
    ↓
adoption-script.js runs
    ↓
loadAnimalsFromDatabase() called
    ↓
GET /api/animals request
    ↓
Server queries animals table
    ↓
Returns JSON array of all animals
    ↓
populatePetGrid() creates cards
    ↓
Cards inserted into DOM
    ↓
User sees all animals displayed
```

### Editing an Animal

```
Admin clicks Edit button
    ↓
JavaScript fetches all animals
    ↓
Finds matching animal by ID
    ↓
Form fields auto-populate
    ↓
Admin makes changes
    ↓
Clicks "Save Animal"
    ↓
PUT /api/animals/:id request
    ↓
Server updates record
    ↓
JavaScript refreshes list
    ↓
Both panels update in real-time
```

### Deleting an Animal

```
Admin clicks Delete button
    ↓
Confirmation dialog shown
    ↓
Admin confirms delete
    ↓
DELETE /api/animals/:id request
    ↓
Server removes record
    ↓
JavaScript refreshes both lists
    ↓
Animal disappears from all pages
```

## Authentication Flow

```
┌─────────────────────────────────────────┐
│           USER AUTHENTICATION            │
└─────────────────────────────────────────┘

LOGIN PAGE (login.html)
    ↓
User enters email/password
    ↓
POST /api/login
    ↓
Server hashes password and compares
    ↓
    ├─ Invalid? → 401 error
    │
    └─ Valid? → Create session
        ↓
        Set session cookie
        ↓
        Return user data
        ↓
        JavaScript stores user info
        ↓
        Redirect to admin.html

ADMIN PAGE ACCESS
    ↓
Check session with GET /api/me
    ↓
    ├─ Not logged in? → Redirect to login
    │
    └─ Logged in? → Check role
        ├─ Not admin? → Redirect to home
        │
        └─ Is admin? → Allow access
            ↓
            Load animal list
```

## Component Interaction

```
┌────────────────────────────────────────────────────┐
│           ADMIN PANEL COMPONENTS                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Form Section              Animals List Section    │
│  ├── Input fields          ├── Animal cards       │
│  ├── Textarea              ├── Edit button        │
│  ├── Save button           ├── Delete button      │
│  ├── Cancel button         └── No animals msg     │
│  └── Form validation                             │
│                                                    │
└────────────────────────────────────────────────────┘
        │                          │
        └──────────► API ◄─────────┘
                     │
            ┌────────┴────────┐
            │                 │
        Animals          Users
        Database        Database
```

## File Dependencies

```
index.html
├── base.css
├── adoption.html
│   ├── adoption.css
│   ├── adoption-script.js (NEW)
│   │   └── Fetch: /api/animals
│   │
│   └── Modal/Form handlers
│
└── admin.html
    ├── admin.css (UPDATED)
    └── Inline script (UPDATED)
        ├── POST /api/animals
        ├── PUT /api/animals/:id
        ├── DELETE /api/animals/:id
        └── GET /api/animals

server.js
├── express
├── bcrypt
├── sqlite3
├── express-session
└── Database: data.sqlite
    ├── animals table
    ├── users table
    └── sessions table
```

## Request/Response Examples

### Add Animal Request
```
POST /api/animals
Content-Type: application/json

{
  "name": "Max",
  "breed": "Golden Retriever",
  "age": "3 years",
  "gender": "Male",
  "description": "Friendly and energetic",
  "image": "https://example.com/max.jpg"
}

Response:
{
  "id": 1,
  "name": "Max",
  "breed": "Golden Retriever",
  "age": "3 years",
  "gender": "Male",
  "description": "Friendly and energetic",
  "image": "https://example.com/max.jpg",
  "created_at": "2024-01-14 10:30:00"
}
```

### Get All Animals Request
```
GET /api/animals

Response:
[
  {
    "id": 1,
    "name": "Max",
    "breed": "Golden Retriever",
    "age": "3 years",
    "gender": "Male",
    "description": "Friendly and energetic",
    "image": "https://example.com/max.jpg",
    "created_at": "2024-01-14 10:30:00"
  },
  {
    "id": 2,
    "name": "Luna",
    "breed": "Persian Cat",
    "age": "2 years",
    "gender": "Female",
    "description": "Gentle and affectionate",
    "image": "https://example.com/luna.jpg",
    "created_at": "2024-01-14 10:35:00"
  }
]
```

---

**This architecture enables real-time synchronization between admin management and public viewing!**
