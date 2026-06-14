
# DreamyCrochet05

## Project Description
A charming web application for crochet enthusiasts that allows customers to browse, purchase, and customize crochet products, while providing an admin portal for managing inventory, orders, and content.

## Features
- **Customer Portal**: Browse products, view details, place orders, and manage user accounts.
- **Admin Portal**: Manage products, categories, orders, and users. Secure login with role‑based access.
- **Cloudinary Integration**: Store and serve images efficiently.
- **Responsive Design**: Works on desktop and mobile devices.
- **Local DB Fallback**: Works with a local JSON DB when MongoDB is unavailable.

## Tech Stack
- **Frontend**: HTML, CSS, vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with local JSON fallback)
- **Image Hosting**: Cloudinary
- **Environment Management**: dotenv

## Folder Structure
```
CROCHETWEBSITE/
├─ .env                # (ignored) environment variables
├─ .env.example        # example env file
├─ .gitignore          # Git ignore rules
├─ app.js               # Main Express app
├─ server.js            # Server entry point
├─ config/              # Configuration (db, cloudinary, etc.)
├─ controllers/         # Route handlers
├─ models/              # Mongoose schemas
├─ routes/              # Express routes
├─ services/            # Business logic/services
├─ utils/               # Helper utilities
├─ public/              # Static assets (images, CSS, JS)
│   ├─ style.css
│   └─ ...
├─ tests/               # Automated tests
├─ README.md            # **This file**
└─ ...
```

## Installation Steps
1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd CROCHETWEBSITE
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create an `.env` file** based on `.env.example`
   ```bash
   cp .env.example .env
   # Fill in your actual values (MongoDB URI, Cloudinary credentials, etc.)
   ```
4. **Start the development server**
   ```bash
   npm run dev   # or `node server.js`
   ```
   The app will be available at `http://localhost:8000`.

## Environment Variables (`.env.example`)
```dotenv
# Server
PORT=8000

# MongoDB (fallback to local JSON DB if unavailable)
MONGO_URI=mongodb://127.0.0.1:27017/dreamycrochet

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Run Locally
```bash
npm start            # Runs `node server.js`
# or for hot‑reloading (if using nodemon)
nodemon server.js
```
Visit:
- **Customer portal**: `http://localhost:8000/`
- **Admin portal**: `http://localhost:8000/dreamycrochet05-admin`

## Admin Features
- Add / edit / delete crochet products
- Manage inventory levels
- View and process orders
- Manage user accounts and roles
- Upload images directly to Cloudinary

## Customer Features
- Browse product catalog
- Search and filter items
- View product details and images
- Add items to cart and checkout
- Create and manage user accounts

## Cloudinary Integration
Images are uploaded to Cloudinary using the credentials defined in `.env`. The `config/cloudinary.js` file reads these variables and provides a reusable Cloudinary instance.

## Screenshots
*Add screenshots of the UI here (placeholders for now)*
- ![Customer Home](/path/to/screenshot1.png)
- ![Admin Dashboard](/path/to/screenshot2.png)

## Deployment Notes
- Ensure the `.env` file is **not** committed – it is already listed in `.gitignore`.
- Set the `MONGO_URI` environment variable in your hosting platform (e.g., Heroku, Render, Railway).
- Configure Cloudinary credentials as environment variables on the host.
- Use a process manager like `pm2` or the platform’s built‑in process runner.

## Future Improvements
- Add unit and integration tests for API routes.
- Implement pagination for large product catalogs.
- Add OAuth/social login options.
- Introduce WebSocket notifications for order status updates.
- Refactor CSS to a modern design system (e.g., CSS variables, dark mode).

## License
This project is licensed under the MIT License – see the `LICENSE` file for details.
