# K-List (Kernel-style Doubly Linked List)

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


struct employee {
    char name[64];
    int id;
    // The required list node member for linking
    struct list_head list; 
};
