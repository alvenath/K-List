# K-List (Kernel-style Doubly Linked List)
# !! THIS IS JUST A DEMO-PROJECT !!

## 🌟 Project Overview

This repository provides a robust and efficient **Kernel-style doubly linked list** data structure, designed for use in general-purpose applications that require high performance and low memory overhead. This implementation follows the **"intrusive list"** pattern, where the list pointers are embedded directly into the structures they link.

It is designed to be highly flexible, allowing any user-defined structure to be easily linked without requiring a complex wrapper or additional memory allocation for the list node itself.

## ✨ Features

-   **Intrusive Design:** The list node (`struct list_head`) is embedded within the parent structure, minimizing memory overhead and increasing cache efficiency.
-   **Header-only API:** Clean, straightforward macros and functions for managing list operations.
-   **Type Safety:** Uses the standard `list_entry()` macro for safe retrieval of the parent structure from a list node pointer.
-   **Comprehensive Operations:** Includes methods for initialization, adding/deleting nodes, and safe, robust iteration.
-   **Written in C**

## 🚀 Getting Started

The K-List implementation is a header-only library. Simply include the main list header file (`klist.h`) in your C project.

### File Structure


## 🛠️ Technology Stack

This is a pure client-side application utilizing:

| Component | Files | Purpose |
| :--- | :--- | :--- |
| **HTML5** | All `.html` files | Provides the structure and content for all pages. |
| **CSS3** | `assets/css/*.css` | Manages the layout, visual design, and styling. |
| **JavaScript** | `assets/js/*.js` | Handles front-end interactivity, search, authentication logic, and watchlist functionality. |

## 🤝 Contributing

Contributions are welcome! If you find a bug or have an idea for a new feature (like a rating system or better search), please feel free to:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/NewFeature`)
3.  Commit your Changes (`git commit -m 'Add some NewFeature'`)
4.  Push to the Branch (`git push origin feature/NewFeature`)
5.  Open a Pull Request

## 📧 Contact

Alvenath - [https://github.com/alvenath](https://github.com/alvenath)
