# K-List (Kernel-style Doubly Linked List)
## !! THIS IS JUST A DEMO-PROJECT !!

## 🌟 Project Overview

This repository provides a robust and efficient **Kernel-style doubly linked list** data structure, designed for use in general-purpose applications that require high performance and low memory overhead. This implementation follows the **"intrusive list"** pattern, where the list pointers are embedded directly into the structures they link.

It is designed to be highly flexible, allowing any user-defined structure to be easily linked without requiring a complex wrapper or additional memory allocation for the list node itself.

## ✨ Features

* **Full-Stack Architecture:** Utilizes Supabase as the entire back-end (Database, Auth, and Storage).
* **Database Management:** Stores dynamic data for Dramas, Actors, and user Watchlists in a PostgreSQL database (managed by Supabase).
* **Secure User Authentication:** Handles user sign-up, sign-in, and session management using Supabase Auth.
* **Watchlist Management:** Allows authenticated users to track dramas they are watching, completed, or plan to watch.
* **Detailed Views:** Dedicated pages (`drama-detail.html`, `actor.html`) to display comprehensive, dynamically loaded content.
* **Client-Side:** Built using pure HTML5, CSS3, and JavaScript.

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

This is a pure client-side application utilizing:

| Role | Component | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Client-Side** | UI & Logic | HTML5, CSS3, JavaScript | Handles the user interface, routing, and all data display logic. |
| **Server-Side** | Database | **Supabase (PostgreSQL)** | Persistent storage for all dynamic data (Dramas, Actors, Watchlists). |
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
