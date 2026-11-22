# K-List: K-Drama Listing and Rating Platform (Full-Stack)
## !! THIS IS JUST A DEMO-PROJECT !!

## 🌟 Project Overview

**K-List** is a modern, full-stack web application designed as a dedicated platform for **listing, tracking, and user rating** of Korean dramas.
The project combines a responsive HTML/CSS/JS frontend with a versatile backend architecture supporting both a **dedicated Node.js backend server** with local image asset resolution and **Supabase** for cloud database, auth, and storage.

## ✨ Features

* **Full-Stack Architecture:** Node.js backend server (`server.js`) with REST APIs and Supabase cloud integration.
* **40+ K-Drama Catalog with Images:** Fully populated catalog featuring posters directly mapped from `assets/img/poster/`.
* **21+ K-Actors Directory:** Actor directory with biographies, birth decades, gender filters, and portraits mapped from `assets/img/actors/`.
* **User Rating & Review System:** Allows users to submit, view, and update ratings and reviews for each drama.
* **Watchlist Management:** Users can track dramas they are watching, completed, or plan to watch.
* **Resilient Data Layer:** Automatically resolves and serves local images (`assets/img`) seamlessly even if the cloud database is offline.
* **Detailed Views:** Dedicated pages (`drama-detail.html`, `actor.html`) display comprehensive, dynamically loaded content.

## 📁 Project Structure
```
K-List/
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
│   │       ├── config.js     # Supabase client & resilient local backend adapter
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
├── supabase-schema-and-seed.sql # Supabase PostgreSQL schema and seed data
├── index.html                # Root redirect to K-list
└── README.md
```

## 🛠️ Technology Stack

| Role | Component | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Client-Side** | UI & Logic | HTML5, CSS3, JavaScript | Handles the user interface, routing, and all data display logic. |
| **Backend Server** | Server & REST API | **Node.js (`server.js`)** | Serves static assets, images from `assets/img/`, and REST API endpoints. |
| **Server-Side** | Database | **Supabase (PostgreSQL) / Local** | Persistent storage for all dynamic data (Dramas, Actors, User Ratings). |
| **Server-Side** | Authentication | **Supabase Auth / Local Session** | Manages user sign-up, sign-in, and session security. |
| **Server-Side** | File Storage | **Local `assets/img/` / Supabase** | Stores all media files (posters, actor images). |

## 🚀 How to Run

### Option 1: Running with the Node.js Backend Server (Recommended)

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. In your terminal, run:
   ```bash
   npm start
   # or
   node server.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   The backend server automatically hosts the website and serves all drama posters and actor portraits from `assets/img/`.

### Option 2: Running with Supabase in the Cloud

1. Create a project at [supabase.com](https://supabase.com/).
2. In the Supabase Dashboard, go to **SQL Editor** and paste the contents of `supabase-schema-and-seed.sql`, then click **Run**.
3. In `K-list/assets/js/config.js`, update `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your project's credentials.

## 🤝 Contributing

Contributions are welcome! If you find a bug or have an idea for a new feature (like a rating system or better search), please feel free to:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add some NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

## 📧 Contact

Alvenath - [https://github.com/alvenath](https://github.com/alvenath)

Project Link: [https://github.com/alvenath/K-List](https://github.com/alvenath/K-List)
