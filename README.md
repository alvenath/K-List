# K-List: K-Drama Listing and Rating Platform (Full-Stack)
## !! THIS IS JUST A DEMO-PROJECT !!

## 🌟 Project Overview

**K-List** is a modern, full-stack web application designed as a dedicated platform for **listing, tracking, and user rating** of Korean dramas.
The project uses a standard HTML/CSS/JS frontend combined with **Supabase** for all server-side services (database, authentication, and storage), providing a complete and interactive experience for K-Drama enthusiasts.

## ✨ Features

* **Full-Stack Architecture:** Utilizes Supabase for the entire back-end (Database, Auth, and Storage).
* **K-Drama Catalog:** Displays a dynamic list of K-Dramas, fetched from the database.
* **User Rating System:** Allows authenticated users to submit and view ratings for each drama.
* **Watchlist Management:** Users can track dramas they are watching, completed, or plan to watch.
* **Secure User Authentication:** Handles user sign-up, sign-in, and session management using Supabase Auth.
* **Detailed Views:** Dedicated pages (`drama-detail.html`, `actor.html`) display comprehensive, dynamically loaded content.

## 📁 Project Structure
```
K-List/
├── assets/
│ ├── css/ # Stylesheets for different sections:
│ │ ├── actor.css
│ │ ├── base.css
│ │ ├── drama-detail.css
│ │ ├── drama.css
│ │ ├── home.css
│ │ └── watchlist.css
│ ├── img/ # Images used on the site:
│ │ ├── actors/ # Images of actors (e.g., Han-So-Hee.jpeg)
│ │ ├── poster/ # Drama poster images
│ │ └── Avatar.jpg # Default user avatar image
│ └── js/ # All JavaScript logic and utility files:
│ ├── Main.js
│ ├── actor.js
│ ├── admin.js
│ ├── auth.js
│ ├── config.js
│ ├── drama-detail.js
│ ├── drama.js
│ ├── search.js
│ ├── watchlist-page.js
│ └── watchlist.js
├── actor.html # Actor profile page
├── drama-detail.html # Individual drama details page
├── drama.html # Drama index/listing page
├── index.html # Main landing page
├── login.html # User login interface
├── register.html # User registration interface
├── watchlist.html # User's personal watchlist page
└── README.md
```
## 🛠️ Technology Stack

| Role | Component | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Client-Side** | UI & Logic | HTML5, CSS3, JavaScript | Handles the user interface, routing, and all data display logic. |
| **Server-Side** | Database | **Supabase (PostgreSQL)** | Persistent storage for all dynamic data (Dramas, Actors, User Ratings). |
| **Server-Side** | Authentication | **Supabase Auth** | Manages user sign-up, sign-in, and session security. |
| **Server-Side** | File Storage | **Supabase Storage** | Stores all media files (posters, actor images). |
| **Integration** | Client Library | Supabase JS SDK | Connects the frontend to the backend services. |

## 🤝 Contributing

Contributions are welcome! If you find a bug or have an idea for a new feature (like a rating system or better search), please feel free to:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/NewFeature`)
3.  Commit your Changes (`git commit -m 'Add some NewFeature'`)
4.  Push to the Branch (`git push origin feature/NewFeature`)
5.  Open a Pull Request

## 📧 Contact

Alvenath - [https://github.com/alvenath](https://github.com/alvenath)

Project Link: [https://github.com/alvenath/K-List](https://github.com/alvenath/K-List)
