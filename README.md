# Expense Manager

A React PWA TypeScript application for tracking and managing personal expenses using localStorage.

## Features

- 🚀 Progressive Web App (PWA) with offline support
- 📱 Fully responsive design for mobile and desktop
- 💰 Monetization via ads and in-app purchases
- 💾 LocalStorage-based data persistence (no backend required)
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
│   │   ├── services/           # Service layer (localStorage)
│   │   └── App.tsx             # Main app component
│   ├── public/                 # Static assets
│   ├── index.html              # HTML entry point
│   ├── vite.config.ts          # Vite configuration
│   └── package.json
├── package.json                 # Root workspace configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Start development server:
```bash
npm run dev
```

This will start the frontend dev server on `http://localhost:5173` (or configured port).

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
- localStorage for data persistence

## Data Storage

All expenses are stored in the browser's localStorage:
- **Storage Key**: `expense-manager-expenses`
- **Location**: Browser localStorage
- **Persistence**: Data persists across page refreshes
- **No Backend Required**: Everything runs client-side

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

## Development Scripts

### Root Level
- `npm run dev` - Start frontend in development mode
- `npm run build` - Build frontend for production
- `npm run install:all` - Install dependencies for all workspaces

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Monetization

The application includes:
- **Ad Integration**: Infrastructure for displaying ads (Google AdSense ready)
  - Ad banner component with placeholder
  - Configurable ad slots
  - Environment variable support for ad client IDs

- **In-App Purchases**: Premium subscription system
  - Purchase button component
  - Purchase tracking (ready for payment processor integration)

## Next Steps

1. **Features**: Add expense export, budget limits, recurring expenses
2. **Testing**: Add unit and integration tests
3. **Payment Integration**: Connect Stripe or PayPal for purchases
4. **Ad Integration**: Add Google AdSense or other ad providers

## License

MIT
