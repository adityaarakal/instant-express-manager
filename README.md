# Instant Express Manager

A full-stack React PWA TypeScript application with Node.js/Express backend for managing express deliveries and services.

## Features

- 🚀 Progressive Web App (PWA) with offline support
- 📱 Fully responsive design for mobile and desktop
- 💰 Monetization via ads and in-app purchases
- 🔒 Secure backend API with TypeScript
- 🎨 Modern UI/UX with responsive layouts

## Project Structure

```
instant-express-manager/
├── frontend/                    # React PWA TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   └── App.tsx             # Main app component
│   ├── public/                 # Static assets
│   ├── index.html              # HTML entry point
│   ├── vite.config.ts          # Vite configuration
│   └── package.json
├── backend/                     # Node.js Express TypeScript backend
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Express middleware
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── package.json                 # Root workspace configuration
├── README.md
└── DEPLOYMENT.md               # Deployment guide
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (or your preferred database)

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
   - Copy `frontend/.env.example` to `frontend/.env`
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your configuration values

3. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend dev server on `http://localhost:5173` (or configured port)
- Backend API server on `http://localhost:3000` (or configured port)

### Building for Production

```bash
npm run build
```

## Tech Stack

### Frontend
- React 18+
- TypeScript
- Vite (build tool)
- PWA capabilities (Service Worker, Web App Manifest)
- Responsive CSS/UI framework

### Backend
- Node.js
- Express
- TypeScript
- MongoDB (or your database of choice)

## Monetization

The application includes:
- **Ad Integration**: Infrastructure for displaying ads (Google AdSense ready)
  - Ad banner component with placeholder
  - Configurable ad slots
  - Environment variable support for ad client IDs

- **In-App Purchases**: Premium subscription system
  - Purchase button component
  - Backend API for processing purchases
  - Database models for tracking purchases
  - Payment processor integration ready (Stripe, PayPal)

## Development Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run install:all` - Install dependencies for all workspaces

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start with hot reload (tsx watch)
- `npm run build` - Compile TypeScript
- `npm start` - Run production build

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ADS_CLIENT_ID=your-ads-client-id
VITE_APP_ENV=development
```

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/instant-express-manager
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Purchases
- `POST /api/purchases/premium` - Purchase premium subscription
- `GET /api/purchases/status/:userId` - Check user's purchase status

## Next Steps

1. **Database Setup**: Configure MongoDB connection
2. **Authentication**: Add user authentication system
3. **Payment Integration**: Connect Stripe or PayPal
4. **Ad Integration**: Add Google AdSense or other ad providers
5. **Features**: Implement core express delivery management features
6. **Testing**: Add unit and integration tests

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## License

MIT
