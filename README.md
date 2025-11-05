# Expense Manager

A full-stack React PWA TypeScript application with Node.js/Express backend for tracking and managing personal expenses.

## Features

- 🚀 Progressive Web App (PWA) with offline support
- 📱 Fully responsive design for mobile and desktop
- 💰 Monetization via ads and in-app purchases
- 🔒 Secure backend API with TypeScript
- 🎨 Modern pixel-perfect UI/UX with responsive layouts
- 📊 Expense tracking by categories
- 📈 Analytics and insights dashboard
- 🏷️ Tags and categorization system

## Project Structure

```
expense-manager/
├── frontend/                    # React PWA TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard/     # Dashboard with stats
│   │   │   ├── Expenses/      # Expenses list
│   │   │   ├── CreateExpense/ # Add expense form
│   │   │   └── ExpenseDetail/ # Expense details
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
│   │   ├── models/             # Database models (Expense)
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
   - Create `backend/.env` file with:
     ```env
     PORT=3000
     NODE_ENV=development
     MONGODB_URI=mongodb://localhost:27017/expense-manager
     # Or for MongoDB Atlas:
     # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-manager
     FRONTEND_URL=http://localhost:5173
     ```
   - Create `frontend/.env` file with:
     ```env
     VITE_API_BASE_URL=http://localhost:3000/api
     ```

3. **Start MongoDB** (choose one):
   - **Local MongoDB**: Start MongoDB service on your machine
     ```bash
     # macOS with Homebrew:
     brew services start mongodb-community
     
     # Or using Docker:
     docker run -d -p 27017:27017 --name mongodb mongo
     ```
   - **MongoDB Atlas (Cloud)**: Get connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and set `MONGODB_URI` in `backend/.env`

4. Start development servers:
```bash
npm run dev
```

**Note**: The app will run even without MongoDB, but you'll see "Database not connected" errors when trying to create expenses. Make sure MongoDB is running to save expenses.

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
- Responsive CSS with modern design

### Backend
- Node.js
- Express
- TypeScript
- MongoDB (or your database of choice)

## Expense Categories

The app supports the following expense categories:
- 🍔 Food
- 🚗 Transport
- 🛍️ Shopping
- 💳 Bills
- 🎬 Entertainment
- 🏥 Health
- 📚 Education
- ✈️ Travel
- 📦 Other

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Expenses
- `GET /api/expenses` - Get all expenses (with filters)
- `GET /api/expenses/stats` - Get expense statistics
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Purchases
- `POST /api/purchases/premium` - Purchase premium subscription
- `GET /api/purchases/status/:userId` - Check user's purchase status

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
MONGODB_URI=mongodb://localhost:27017/expense-manager
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret
```

## Next Steps

1. **Database Setup**: Configure MongoDB connection
2. **Authentication**: Add user authentication system
3. **Payment Integration**: Connect Stripe or PayPal
4. **Ad Integration**: Add Google AdSense or other ad providers
5. **Features**: Add expense export, budget limits, recurring expenses
6. **Testing**: Add unit and integration tests

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## License

MIT