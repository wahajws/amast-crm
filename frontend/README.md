# CRM Frontend - AMAST Theme

Modern, industrial-standard React frontend for the CRM system.

## Features

- 🎨 Clean, modern UI following AMAST logo theme (blue network/molecular design)
- 🔐 Authentication (Email/Password + Gmail OAuth)
- 👥 User Management
- 🛡️ Role Management
- 📊 Dashboard with statistics
- 👤 Profile Management
- 📱 Responsive design
- ⚡ Fast and optimized

## Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your API URL.

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Tech Stack

- React 18
- React Router 6
- Tailwind CSS
- Vite
- Axios
- React Icons
- React Toastify

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   │   ├── Layout/     # Layout components
│   │   └── UI/         # UI components
│   ├── contexts/       # React contexts
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── index.html          # HTML template
```

## Color Scheme

Following AMAST logo theme:
- Primary Blue: `#0073e6`
- Light Blue: `#4da6ff`
- Lighter Blue: `#80bfff`
- Network nodes with gradient

## Development

The frontend runs on `http://localhost:3001` and proxies API requests to `http://localhost:3000/api`.







