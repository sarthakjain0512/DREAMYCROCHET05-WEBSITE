# IMPORTANT

This document is the single source of truth for the DreamyCrochet05 Website project.

Every developer, contributor, and AI coding assistant (ChatGPT, Gemini, Claude, Cursor, Windsurf, Codex, etc.) must read this document completely before suggesting, modifying, refactoring, or generating code.

This document contains the complete architecture, development history, business logic, technical decisions, coding standards, known issues, development rules, and Version 1.0 baseline.

Future versions of the project should update this document instead of replacing it.

---

## Table of Contents

* [1. Project Overview](#1-project-overview)
* [2. Project Timeline](#2-project-timeline)
* [3. Technology Stack](#3-technology-stack)
* [4. Folder Structure](#4-folder-structure)
* [5. Project Architecture](#5-project-architecture)
* [6. Modules](#6-modules)
* [7. Database Design](#7-database-design)
* [8. API Overview](#8-api-overview)
* [9. Image Management & Safe Deletion Lifecycle](#9-image-management--safe-deletion-lifecycle)
* [10. Security](#10-security)
* [11. Performance & UI/UX](#11-performance--uiux)
* [12. Project Memory (Architectural & Development Decisions)](#12-project-memory-architectural--development-decisions)
* [13. Do Not Change (Architectural Rules)](#13-do-not-change-architectural-rules)
* [14. Current Project Status](#14-current-project-status)
* [15. Known Issues (Inspected & Verified)](#15-known-issues-inspected--verified)
* [16. Development Rules](#16-development-rules)
* [17. AI Bootstrap Checklist](#17-ai-bootstrap-checklist)
* [18. AI Context (For Code Assistants)](#18-ai-context-for-code-assistants)
* [19. Version History](#19-version-history)
* [20. Future Roadmap](#20-future-roadmap)
* [21. Documentation Metadata](#21-documentation-metadata)
* [22. Final Summary](#22-final-summary)

---

# Project Context: DreamyCrochet05

This document serves as the permanent, comprehensive source of truth for the DreamyCrochet05 application. It outlines the project overview, architectural structure, implementation modules, API design, database schemas, and developer rules. It is designed to enable new developers and AI assistants to understand, maintain, and safely extend the project without reading the entire codebase.

---

## 1. Project Overview

### Project Name
DreamyCrochet05

### Purpose
DreamyCrochet05 is a premium online showcase and digital portfolio for handmade crochet products crafted by the shop owner's mother. It allows users to browse catalog items, view overall and product-specific reviews, and submit custom crochet design inquiries.

### Vision
To provide an elegant, fast, and visual-first online portfolio with a low-friction customer inquiry system (via Instagram, WhatsApp, or direct custom order forms) and a robust administrative panel for managing products, settings, reviews, and inquiries.

### Target Users
* **Customers / Visitors**: Individuals seeking high-quality, customized crochet gifts, keychains, plushies, and bouquets.
* **Administrator (Shop Owner)**: The portfolio manager who curates the products, adjusts home page configurations, approves reviews, and manages custom orders.

### Current Version
v1.0

### Current Status
Production-ready with fallback mechanisms. The codebase supports full Cloudinary cloud integration for media uploads, Brevo for automated email notifications, and MongoDB Atlas for database operations. If external cloud services or databases are disconnected, the application seamlessly falls back to local disk uploads, Brevo logging, and a local JSON database.

---

## 2. Project Timeline

The following development timeline highlights the major milestones achieved leading to the release of Version 1.0:

* **Initial Project Setup**: Configuration of project directories, server entry point in `server.js`, and environment setup with `dotenv`.
* **Frontend Development**: Implementation of static HTML structures, core styles in `style.css`, and basic catalog rendering.
* **Backend Architecture**: Structuring of controllers, Express.js middleware, and endpoints.
* **MongoDB Integration**: Schemas established for all critical collections using Mongoose.
* **Admin Dashboard**: Implementation of secure dashboard rendering, authentication controllers, and login interface.
* **Product CRUD**: Completion of catalog management endpoints supporting dynamic add, update, delete, and visibility updates.
* **Review System**: Creation of customer rating collections with admin approval/moderation pipelines.
* **Wishlist & Recently Viewed**: Addition of frontend local storage states tracking liked and visited items.
* **Search & Filters**: Development of real-time search filtering on description text and tab-based categorizations.
* **Cloudinary Integration**: Dynamic integration of image uploads with Multer buffers.
* **Image Gallery**: Expansion of schemas to allow multi-image galleries with custom primary cover fields.
* **Responsive UI Improvements**: Grid restructuring using responsive Tailwind utility classes.
* **Hero Redesign**: Migration of home hero components to database settings models.
* **Performance Optimization**: Integration of dynamic CDN image compression and sizing strings (`f_auto,q_auto`).
* **Deployment Setup**: Setup of Brevo SMTP endpoints and offline local database JSON redundancy.
* **Cloudinary Image Lifecycle Investigation**: Root cause trace and correction of empty public ID shared asset deletion conflicts.
* **Version 1.0 Release**: Official production baseline deployment.

---

## 3. Technology Stack

### Frontend
* **Core**: Vanilla HTML5, CSS3, and JavaScript (ES6+).
* **Styling**: Vanilla CSS for layouts and modular controls; TailwindCSS (loaded via CDN) for responsive utility design.
* **Libraries**: 
  * Three.js (r128) and OrbitControls for 3D interactive graphics.
  * GSAP (GreenSock Animation Platform) and ScrollTrigger for premium micro-animations.
  * Lenis for smooth scroll performance.
  * Canvas-Confetti for celebratory interactive visual cues.

### Backend
* **Core**: Node.js and Express.js REST API.
* **File Uploads**: Multer (in-memory storage buffer routing).
* **Emails**: Nodemailer integrated with the Brevo (formerly Sendinblue) SMTP API.

### Database
* **Primary**: MongoDB Atlas via Mongoose ODM.
* **Fallback**: Local JSON database (`local_db.json`) managed via file read/write synchronization.

### Image Hosting
* **Primary**: Cloudinary (Image Upload & Optimization APIs).
* **Fallback**: Local uploads saved to `/uploads/` subdirectories.

### Development Tools
* **Testing**: Jest (unit and e2e testing) and Puppeteer (headless browser automation).
* **Environment**: Dotenv for variable configuration.

---

## 4. Folder Structure

```
CROCHETWEBSITE/
├── config/                  # Configuration layers (database, Cloudinary, frontend API)
├── controllers/             # Express route controller actions (business logic)
├── middleware/              # Authentication, schema validation, rate-limiting, and upload handlers
├── models/                  # Mongoose DB schema definitions
├── routes/                  # Express routing files mapping paths to controllers
├── services/                # Third-party integrations (Cloudinary uploads, Brevo SMTP mailing)
├── utils/                   # Shared utility modules (Cloudinary deletion, image wrapping, local DB fallback)
├── uploads/                 # Local media storage directory for fallback uploads
│   ├── products/
│   ├── custom-orders/
│   └── homepage/
├── scratch/                 # Local diagnostic, report, and verification scripts
├── photoes/                 # Static local images and default assets
├── server.js                # Express application initialization and server start script
├── app.js                   # Main application script handling admin and client UI logic
├── style.css                # Custom style sheets for the application
├── index.html               # Main public layout index file
├── 404.html                 # 404 error page layout
├── local_db.json            # Database fallback JSON data file
└── inbox_logs.txt           # Email service fallback log file
```

---

## 5. Project Architecture

The application is built on a clean client-server architecture with an administrative control panel embedded directly into the frontend.

```
+-------------------------------------------------------+
|                       FRONTEND                        |
|   (index.html, app.js, style.css using Vanilla JS)     |
+---------------------------+---------------------------+
                            |
                            | (HTTP requests via fetch / XHR with JWT)
                            v
+-------------------------------------------------------+
|                    REST API ROUTER                    |
|             (routes/mounted in server.js)             |
+---------------------------+---------------------------+
                            |
                            | (Routing to controllers with middleware)
                            v
+-------------------------------------------------------+
|                     CONTROLLERS                       |
|           (controllers/productController.js)          |
+---------------------+-----+---------------------------+
                      |     |
      (Query/Persist) |     | (Asset upload/delete)
                      v     v
+-----------------------+ +-----------------------------+
|       DATABASE        | |          CLOUDINARY         |
|  (MongoDB Atlas /     | |  (Cloud Image Hosting &     |
|   local_db.json)      | |   Optimization service)     |
+-----------------------+ +-----------------------------+
```

---

## 6. Modules

### Public Website
A single-page visual catalog showcasing crochet creations with categorization tabs, search filtering, product quick-view modals, product reviews, custom order submission, and interactive animations.

### Admin Dashboard
Secure panel built into the client view, accessible via password login. Allows the administrator to add, edit, or delete products; toggle visibility or featured flags; review customer inquiries; approve or reject reviews; and update home page banners.

### Authentication
JWT-based access tokens issued on admin login, stored in `sessionStorage` on the frontend, and validated via request authorization headers on protected routes.

### Review System
Two-tier moderation system for client feedback (overall site reviews and specific product reviews). Submissions default to `pending` and do not show publicly until marked `approved` by the admin.

### Products & Categories
Catalog management supporting title, description, category, price (numeric validation but string storage to accommodate flexible prefixes), stock levels, and multiple image assets.

### Homepage Settings
Dynamic configuration module allowing the admin to update the hero title, subtitles, and main cover image without touching the code.

### Custom Orders
A customer inquiry funnel allowing the upload of up to 5 reference photos. Generates email alerts (via Brevo) or logs files locally on fail.

### Search, Wishlist & Recently Viewed
Client-side modules implementing full-text search against the loaded catalog, local-storage favoritism (Wishlist), and a session-based recently-viewed tracker.

---

## 7. Database Design

All database interaction routes go through Mongoose models or corresponding fallback JSON logic.

### Models

#### Admin (`models/Admin.js`)
* Secure email/password for dashboard access.
* Pre-save hook hashes password using `bcryptjs` (salt rounds: 12).
* Instance method `comparePassword()` safely evaluates credentials.

#### Product (`models/Product.js`)
* Mixed schema types utilized for `image`, `images`, and `coverImage` to allow string URLs or object mappings `{ url, public_id }`.
* Pre-validate hook automatically synchronizes cover images:
  ```javascript
  if (this.images && this.images.length > 0) {
    if (!this.coverImage) this.coverImage = this.images[0];
    this.image = this.coverImage;
  }
  ```

#### CustomOrder (`models/CustomOrder.js`)
* Stores contact details, occasion types, descriptions, status tracking, and reference images.

#### ProductReview / OverallReview (`models/ProductReview.js` / `models/OverallReview.js`)
* Moderated reviews storing author details, numerical ratings (1-5), comments, and optional review photos.

---

## 8. API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/products` | Retrieve all visible products | No |
| **GET** | `/api/products/:id` | Retrieve single product details | No |
| **POST** | `/api/products` | Add new product | Yes (Admin) |
| **PUT** | `/api/products/:id` | Update product details | Yes (Admin) |
| **DELETE** | `/api/products/:id` | Permanently delete product | Yes (Admin) |
| **PATCH** | `/api/products/:id/visibility` | Toggle product visibility | Yes (Admin) |
| **PATCH** | `/api/products/:id/featured` | Toggle product featured badge | Yes (Admin) |
| **POST** | `/api/custom-orders` | Submit new order inquiry | No (Rate Limited) |
| **GET** | `/api/custom-orders` | Retrieve order inquiries | Yes (Admin) |
| **PATCH** | `/api/custom-orders/:id/status` | Update inquiry status | Yes (Admin) |
| **DELETE** | `/api/custom-orders/:id` | Delete inquiry | Yes (Admin) |
| **GET** | `/api/reviews/overall` | Fetch approved overall reviews | No |
| **POST** | `/api/reviews/overall` | Submit site review | No (Rate Limited) |
| **GET** | `/api/reviews/product/:productId` | Fetch approved product reviews | No |

---

## 9. Image Management & Safe Deletion Lifecycle

To prevent broken image URLs on the frontend, the application implements strict image object preservation and reference checks during deletions.

### Image Storage Format
Images can be stored in the database in two formats:
1. **Object Format**: `{ url: "https://res.cloudinary.com/...", public_id: "DreamyCrochet05/..." }`
2. **String Format**: `"https://res.cloudinary.com/..."` (common in older, migrated, or default seeded records).

### URL Normalization on Edit
When updating products, the frontend sends plain image URLs back to the server. The backend compares these incoming URLs with the database records inside `editProduct()` using a normalization utility (`cleanUrl`). This utility strips version parameters (e.g. `v1784...`) and optimization strings (e.g. `f_auto,q_auto`) to ensure exact matches are found, preserving the original object format (and retaining the `public_id`):

```javascript
const cleanUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return '';
  return urlStr
    .split('?')[0]
    .split('#')[0]
    .replace(/\/f_auto,q_auto\//g, '/image/upload/')
    .replace(/\/v\d+\//g, '/');
};
```

### Deletion Safety Check (`isImageReferenced`)
Before any asset is deleted from Cloudinary via `deleteCloudinaryImage()`, the server executes a safety verification to check if other records reference the same asset. The check queries both object and string format schemas:

```javascript
// Check if any product references the public_id or the raw URL
const conditions = [];
if (publicId) {
  conditions.push(
    { 'image.public_id': publicId },
    { 'coverImage.public_id': publicId },
    { 'images.public_id': publicId }
  );
}
if (url) {
  conditions.push(
    { 'image': url },
    { 'coverImage': url },
    { 'images': url },
    { 'image.url': url },
    { 'coverImage.url': url },
    { 'images.url': url }
  );
}
```

* **Early Exit**: If the `public_id` is missing, empty (`""`), or invalid, the deletion process returns `false` early and does not contact Cloudinary, ensuring assets with partial metadata are protected from deletion.

---

## 10. Security

### Input Validation
* Validation middleware checks for missing parameters, checks string data types, and normalizes and sanitizes product prices to ensure positive numeric bounds.

### Rate Limiting
* Request rate-limiting middleware is applied to public POST actions (`/api/custom-orders`, `/api/reviews`) using a custom in-memory tracker to prevent API abuse.

### API Security
* Admin-only operations verify the presence and signature of standard JWT headers before routing requests to controller actions.

---

## 11. Performance & UI/UX

### Lazy Loading & Asset Delivery
* Frontend assets are lazily loaded.
* Cloudinary URLs are dynamically replaced with optimized formats (`/f_auto,q_auto/`) inside `safeLoadProductImage()` on the frontend.
* Swiper carousels and skeleton loaders prevent layout shifts (CLS) while assets load.

### UI Animation Engine
* Three.js displays an interactive, drag-controlled 3D scene (spinning crochet hooks/balls).
* GSAP drives the entrance transitions, text splitting, hover translations, parallax header components, and catalog card reveals.

---

## 12. Project Memory (Architectural & Development Decisions)

The following records capture the critical technical challenges encountered during the development of DreamyCrochet05 and the rationale behind their chosen solutions:

### Cloudinary Metadata Preservation
* **Problem**: Re-submitting existing image collections during product editing stripped Mongoose image objects of their `public_id` values, wrapping them into empty string representations.
* **Reason**: The frontend client-side code only tracks raw image URLs. On edit submission, it passed URL strings, forcing the backend to wrap unknown URLs into fresh object representations with empty `public_id` fields.
* **Chosen Solution**: URL normalization and comparison. Created the `cleanUrl` helper utility to strip dynamic version parameters and CDN optimizations before evaluating matches against the existing database objects.
* **Why Selected**: Avoided performing expensive database reads or parsing patterns repeatedly on every edit request.
* **Long-Term Impact**: Existing database objects (including valid `public_id` strings) are preserved, securing their metadata long-term.

### Shared Image Protection & Safe Deletion
* **Problem**: Deleting a product (or removing an image from a product's gallery) resulted in physical asset deletion on Cloudinary, which inadvertently broke other products that shared that same image asset.
* **Reason**: The reference check logic (`isImageReferenced`) only queried MongoDB using `{ 'images.public_id': publicId }`. It failed to find matches where the image was referenced as a string URL or nested inside objects with empty `public_id`s.
* **Chosen Solution**: Multi-format query check. Expanded `isImageReferenced` to build query conditions covering both `public_id` fields and raw/nested `url` fields across all collections.
* **Why Selected**: Provided complete lookup coverage across all schema models, regardless of whether the image is stored in object or string format.
* **Long-Term Impact**: Prevented accidental deletion of referenced cloud assets, protecting the portfolio catalog from broken images.

### Local JSON Fallback
* **Problem**: Network outages or invalid cloud credentials (MongoDB Atlas, Cloudinary) caused the web application to fail during live local portfolio showcases.
* **Reason**: Portfolio presentation demands high availability, even when working in offline environments.
* **Chosen Solution**: Redundant storage hooks. Created local storage operations in `localDbHelper.js` that capture database states in `local_db.json` and direct uploads to `/uploads/` if primary service variables are missing or connections time out.
* **Why Selected**: Maintained a consistent API response structure for the frontend, ensuring the user experience is identical.
* **Long-Term Impact**: Enabled reliable offline showcases of the portfolio.

### Responsive Admin Redesign
* **Problem**: Managing catalog items from mobile viewports was difficult due to truncated text and oversized form elements.
* **Reason**: The dashboard table layout was originally optimized for desktop viewports.
* **Chosen Solution**: Mobile-first flex cards. Swapped standard table lists for responsive Tailwind flex grids that collapse to card displays on small viewports.
* **Why Selected**: Simplified mobile catalog updates without introducing complex dashboard layout dependencies.
* **Long-Term Impact**: Enabled convenient, mobile-friendly shop management.

### Skeleton Loading
* **Problem**: High-resolution crochet images caused page jumps (Cumulative Layout Shift) when rendering on slower cellular connections.
* **Reason**: Layouts dynamically shifted to accommodate images as they finished rendering.
* **Chosen Solution**: Skeleton placeholder classes. Configured swipers and image containers with static Aspect-Ratio bounds and background animation pulses.
* **Why Selected**: Kept layout positions stable while images loaded.
* **Long-Term Impact**: Smoothed page loads, improving UX.

---

## 13. Do Not Change (Architectural Rules)

Future developers and AI assistants must strictly follow these rules:

* **Verify Before Deletion**: Never call the Cloudinary destroy API without routing the verification through `isImageReferenced(publicId, url)`.
* **Preserve Local JSON Fallback**: Never modify or remove the offline JSON database fallback (`localDbHelper.js`) unless replacing it with a better local recovery pattern.
* **Retain Metadata on Updates**: Ensure that any update operation on the backend preserves the `public_id` property of image objects; do not overwrite valid objects with string fallbacks.
* **Preserve API Contract Compatibility**: Keep the existing endpoint pathways, payload parameters, and mapped JSON response signatures stable.
* **Minimize Scope**: Do not rewrite, restructure, or refactor unrelated modules when resolving issues.
* **Maintain Mobile-First Grid Layouts**: Ensure that any UI adjustments scale fluidly across desktop, tablet, and mobile breakpoints.
* **Schema Validation Safety**: Never bypass rating, price, or stock bounds validations in middleware when writing new routes.
* **Early Return Deletion Guard**: Do not remove the early return validation in `deleteCloudinaryImage` that blocks deletions of empty (`""`) or invalid public IDs.

---

## 14. Current Project Status

* **Current Version**: v1.0 (Official Production Baseline)
* **Production Status**: Stable and fully optimized.
* **Deployment Status**: Configured for VPS deployment with local storage fallback hooks.
* **Completed Modules**: Product CRUD, Moderated Reviews, Custom Inquiries, Hero Banner settings, 3D Canvas Scene, Micro-animations, Search, Wishlist, Recently Viewed, Local Fallback.
* **Known Stable Components**: Mongoose schema hook validations, JWT auth middleware, image URL cleaning, Brevo email notification API.
* **Known Limitations**: Product price is typed as a String rather than a Number in MongoDB to support flexible symbols; price validation is handled upstream by validation middleware.
* **Open Technical Debt**: Seeded catalog products that currently possess empty `public_id` values require administrative re-upload to prevent future reference warnings.

---

## 15. Known Issues (Inspected & Verified)

### Cloudinary Asset Disappearance
Some products in the database originally had images saved with empty `public_id: ""` fields. When corresponding images were updated or deleted in other products, the reference checker failed to detect matches on those empty strings, causing Cloudinary to delete the underlying shared cloud asset. This left the target products with broken image URLs (leading to the frontend product placeholder).
* **Fix**: Deletion checks and URL normalizations were updated to handle both objects and string matches, and deletions with empty `public_id`s are blocked.

---

## 16. Development Rules

### Rule 1: Always Guard Image Deletion
Never call `cloudinary.uploader.destroy()` directly. Always route media deletion through the `deleteCloudinaryImage()` helper.

### Rule 2: Maintain Fallback Compatibility
Ensure that any new feature added to controllers or services supports the local JSON database and disk upload fallback in case MongoDB or Cloudinary credentials are missing.

### Rule 3: Do Not Mutate Unrelated Schema
Ensure that database model validation hooks are clean and do not interfere with standard updates or validation flows.

---

## 17. AI Bootstrap Checklist

Before proposing or introducing any code changes to the project workspace, AI assistants and contributors must fulfill every item in the checklist below:

* **[ ] Read documentation first**: Fully read and understand this `PROJECT_CONTEXT.md` file before proposing suggestions or generating code.
* **[ ] Inspect source files**: Locate and read the relevant implementation file and Mongoose schemas to verify variable types and routes before writing replacement code.
* **[ ] Never assume behavior**: Test or inspect actual logic behaviors rather than assuming endpoints or variables exist.
* **[ ] Maintain backwards compatibility**: Do not change signatures or structures of endpoints and database fields that would break existing API or UI operations.
* **[ ] Isolate modification scope**: Make targeted changes strictly inside the scope of the assigned module; do not touch or refactor unrelated files.
* **[ ] Maintain architectural patterns**: Adhere to the established controllers/middleware/routes routing structure and fallback paths.
* **[ ] Obtain approval first**: Present structural refactoring plans and obtain explicit approval before editing core logic files.
* **[ ] Keep PROJECT_CONTEXT.md updated**: If any architectural boundary, configuration, or important data lifecycle logic changes, update this document immediately to keep it as the single source of truth.
* **[ ] Document decisions**: Write details of new architectural solutions or updates directly into the Project Memory section to ensure technical decisions are preserved.
* **[ ] Keep modifications minimal**: Propose the simplest, most robust, and safest code edits possible.

---

## 18. AI Context (For Code Assistants)

### Architecture Notes
- This is a monorepo structure where the backend API serves both public and administrative client actions.
- Client UI actions are written in [app.js](file:///c:/Users/SARTHAK%20JAIN/OneDrive/Desktop/CROCHETWEBSITE/app.js) using Vanilla JS DOM events. Do not introduce client-side frameworks (React, Vue, Svelte) unless explicitly requested.

### Workflows
- **Admin Authentication**: Uses JWT. Protected requests must append `Authorization: Bearer <token>` in the header.
- **Product Updates**: Handled by passing `imagesBase64` arrays containing image strings. The controller matches these with database records to preserve `public_id` metadata.

### Common Mistakes to Avoid
- *Double Password Hashing*: Avoid saving the admin user in a way that triggers the pre-save bcrypt hook multiple times.
- *Strict String Check in image deletion*: When checking references, remember that images can be plain strings or objects. Always check both patterns.

---

## 19. Version History
* **v1.0**: Official Production Release containing optimized media, client catalog view, JWT auth, custom order inquiries, review moderation, and local database fallbacks.

---

## 20. Future Roadmap
* **Automated Admin Image Repair**: An admin dashboard utility to detect images with empty `public_id`s and automatically re-upload them to rebuild their metadata.
* **Customer Chat Integration**: Add WhatsApp business API integration for direct checkout inquiries.

---

## 21. Documentation Metadata

* **Project Name**: DreamyCrochet05 Website
* **Documentation Name**: PROJECT_CONTEXT.md
* **Current Version**: v1.0
* **Documentation Version**: v1.1
* **Project Owner**: Sarthak Jain
* **Maintainer**: Sarthak Jain
* **Current Status**: Official Production Baseline
* **Release Date**: July 18, 2026
* **Last Updated**: July 18, 2026
* **Repository Type**: Git/Express Monorepo
* **Deployment Platform**: Node.js VPS / Cloud Hosting
* **Primary Database**: MongoDB Atlas
* **Image Storage**: Cloudinary (Primary) / Local disk `/uploads/` (Fallback)
* **Purpose of this document**: Central source of truth for architectural decisions, rules, and system definitions.

---

## 22. Final Summary

This project represents **Version 1.0** of the DreamyCrochet05 showcase application. It is a highly optimized, visual-first portfolio showcase website powered by a secure Node/Express backend with integrated media optimization, email alerts, fallback data resilience, and micro-animations.
