# Deployment Guide

## Frontend Deployment (PWA)

### Build for Production

```bash
cd frontend
npm run build
```

The build output will be in the `frontend/dist` directory.

### Deployment Options

1. **Vercel** (Recommended for React/Vite)
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `frontend/dist`
   - Add environment variables in Vercel dashboard

2. **Netlify**
   - Deploy the `frontend/dist` directory
   - Configure redirects for SPA routing

3. **Firebase Hosting**
   - Use Firebase CLI to deploy
   - Configure `firebase.json` for SPA routing

### PWA Configuration

Ensure your hosting provider supports:
- HTTPS (required for PWA)
- Service Worker registration
- Web App Manifest

## Backend Deployment

### Environment Variables

Create a `.env` file in the backend directory with:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret
```

### Deployment Options

1. **Railway**
   - Connect GitHub repository
   - Set build command: `cd backend && npm run build`
   - Set start command: `cd backend && npm start`
   - Add environment variables

2. **Render**
   - Create new Web Service
   - Set root directory to `backend`
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Heroku**
   - Use Heroku CLI or GitHub integration
   - Set buildpacks for Node.js
   - Configure environment variables

4. **DigitalOcean App Platform**
   - Connect repository
   - Configure as Node.js service
   - Set environment variables

## Database Setup

### MongoDB Atlas (Cloud)

1. Create account at mongodb.com/atlas
2. Create a new cluster
3. Get connection string
4. Add to `MONGODB_URI` environment variable

### Local MongoDB

For development, install MongoDB locally or use Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

## Payment Integration

### Stripe Setup

1. Create Stripe account
2. Get API keys from dashboard
3. Add to environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY` (frontend)

### PayPal Setup

Similar process - add PayPal API credentials to environment variables.

## Ad Integration

### Google AdSense

1. Sign up for AdSense
2. Get publisher ID
3. Add to frontend `.env`:
   - `VITE_ADS_CLIENT_ID`

Update `AdBanner` component with actual AdSense code.

## Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Plausible)
- Uptime monitoring (UptimeRobot, Pingdom)

## SSL/HTTPS

Required for PWA functionality. Most hosting providers offer free SSL certificates:
- Let's Encrypt (free)
- Cloudflare (free)
- Hosting provider SSL

## Continuous Deployment

Set up CI/CD pipelines:
- GitHub Actions
- GitLab CI
- CircleCI

Example GitHub Actions workflow can be added for automatic deployments.
