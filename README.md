# K-List: K-Drama Listing and Rating Platform (Full-Stack)
## !! THIS IS JUST A DEMO-PROJECT !!

## 🌟 Project Overview

**K-List** is a modern, full-stack web application designed as a dedicated platform for **listing, tracking, and user rating** of Korean dramas.
The project features a responsive HTML/CSS/JS frontend powered by a **persistent, zero-pause database architecture** (Node.js REST API + local file database in `data/klist-db.json` and universal browser storage in `assets/js/db.js`).

> [!NOTE]
> **No More Supabase Pausing:** The backend no longer depends on Supabase's free-tier cloud instance that pauses after inactivity. All dramas, actor portraits, user ratings, reviews, and watchlists are stored persistently in your local database that is always ready and never sleeps.

## ✨ Features

* **Zero-Pause Persistent Database:** Local file-backed database (`data/klist-db.json`) that never pauses, expires, or requires restarting.
* **40+ K-Drama Catalog with Images:** Full catalog with images mapped from `assets/img/poster/`.
* **21+ K-Actors Directory:** Actor directory with portraits from `assets/img/actors/`, biographies, birth decades, and gender filters.
* **Interactive Rating & Review System:** Users can submit, view, and update reviews and 1-10 star ratings.
* **Personal Watchlist Management:** Track dramas you are currently watching, plan to watch, or completed.
* **Full Authentication:** User registration, login, and session persistence.
* **Detailed Views:** Pages for drama details (`drama-detail.html`) and actors (`actor.html`).

## 📁 Project Structure
```
K-List/
├── data/
│   └── klist-db.json         # Persistent database (dramas, actors, reviews, watchlist, users)
├── K-list/
│   ├── assets/
│   │   ├── css/              # Stylesheets for different sections:
│   │   │   ├── actor.css
│   │   │   ├── base.css
│   │   │   ├── drama-detail.css
│   │   │   ├── drama.css
│   │   │   ├── home.css
│   │   │   └── watchlist.css
│   │   ├── img/              # Images used on the site:
│   │   │   ├── actors/       # 21 actor portraits (e.g. bae-suzy.jpg, gong-yoo.png, Han-So-Hee.jpeg)
│   │   │   ├── poster/       # 40 drama poster images (e.g. Vincenzo.jpg, cloy.jpg, 2521.jpg)
│   │   │   ├── Avatar.jpg    # Default user avatar image
│   │   │   ├── no-poster.jpg # Fallback poster placeholder
│   │   │   └── no-photo.jpg  # Fallback actor photo placeholder
│   │   └── js/               # JavaScript logic and data adapters:
│   │       ├── data.js       # Complete drama & actor dataset
│   │       ├── db.js         # Universal Database engine (replaces Supabase)
│   │       ├── config.js     # Legacy config alias
│   │       ├── main.js
│   │       ├── actor.js
│   │       ├── drama.js
│   │       ├── drama-detail.js
│   │       ├── auth.js
│   │       ├── search.js
│   │       ├── watchlist.js
│   │       └── watchlist-page.js
│   ├── actor.html            # Actor profile page
│   ├── drama-detail.html     # Individual drama details page
│   ├── drama.html            # Drama index/listing page
│   ├── index.html            # Main landing page
│   ├── login.html            # User login interface
│   ├── register.html         # User registration interface
│   └── watchlist.html        # Personal watchlist page
├── server.js                 # Standalone Node.js backend server & REST API
├── package.json              # Project scripts & metadata
├── index.html                # Root redirect to K-list
└── README.md
```

## 🛠️ Technology Stack

| Role | Component | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Client-Side** | UI & Logic | HTML5, CSS3, JavaScript | Handles the user interface, routing, and all data display logic. |
| **Backend Server** | Server & REST API | **Node.js (`server.js`)** | Serves static assets, images from `assets/img/`, and REST API endpoints. |
| **Database** | Persistent Storage | **JSON / SQLite File DB (`data/klist-db.json`)** | Persistent storage for all dynamic data (Dramas, Actors, User Ratings, Watchlist). Never sleeps! |
| **Client Database** | Local Engine | **`assets/js/db.js`** | Connects to Node API or browser storage, eliminating Supabase pausing issues. |
| **Authentication** | Auth Manager | **Native Local Auth** | Manages user sign-up, sign-in, and session security. |

## 🚀 How to Run

### Running the App:

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. In your terminal, run:
   ```bash
   npm start
   # or: node server.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   All drama posters, actor portraits, reviews, and watchlists are immediately ready. Changes to reviews and watchlists are automatically saved to `data/klist-db.json`.

---

## ☁️ Cloud Database Alternatives (If Cloud is Desired)

If you ever want a cloud database instead of a local file database, here are recommended alternatives that **never pause on the free tier**:

| Provider | Type | Free Tier Sleep Policy | Notes |
| :--- | :--- | :--- | :--- |
| **Firebase Firestore** | NoSQL Document DB | **Never sleeps (24/7 active)** | 1GB free storage, instant real-time sync, great client SDK. |
| **MongoDB Atlas** | Document DB | **Never sleeps (M0 Sandbox)** | 512MB free storage, always online. |
| **Turso (LibSQL)** | Cloud SQLite | **Never sleeps** | 9GB free storage, ultra fast, SQLite syntax. |

*(Supabase was pausing because its free tier puts databases to sleep after 7 days of inactivity).*

## 🤝 Contributing

Contributions are welcome! If you find a bug or have an idea for a new feature, please feel free to:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add some NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

## 📧 Contact

Alvenath - [https://github.com/alvenath](https://github.com/alvenath)

Project Link: [https://github.com/alvenath/K-List](https://github.com/alvenath/K-List)
