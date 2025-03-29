# Deployment Guide for CompeteHQ

This document outlines the steps required to deploy CompeteHQ to a production environment.

## Prerequisites

- Node.js (v18+)
- MongoDB Atlas account or other MongoDB hosting
- Hosting platform (Vercel, Netlify, or custom server)
- SMTP email service (for production notifications)

## Environment Setup

Before deployment, you must set up environment variables. **Never** commit sensitive credentials to your repository.

### Required Environment Variables

```
# Required in production
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/competehq?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-string
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NODE_ENV=production

# Optional for email functionality
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@your-domain.com
```

## Deployment Steps

### 1. Prepare Your Code

- Ensure all environment-specific code is properly conditionalized
- Run tests to verify functionality
- Build the application locally to check for any build errors

```bash
npm run build
```

### 2. MongoDB Setup

- Create a new MongoDB Atlas cluster (or use existing)
- Configure network access to allow connections from your deployment servers
- Create a database user with appropriate permissions
- Obtain your MongoDB connection string

### 3. Deploy to Hosting Platform

#### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy your main branch

#### Custom Server

1. Clone your repository to the server
2. Install dependencies: `npm install --production`
3. Build the application: `npm run build`
4. Start the server: `npm start`

### 4. Verify Deployment

After deployment, verify that:

- The application loads correctly
- User authentication works
- MongoDB connection is established
- Team and player management functions work
- Lineup functionality works properly

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to your repository
- Use your hosting platform's environment variable management
- Rotate sensitive credentials periodically

### 2. MongoDB Security

- Restrict network access to your MongoDB deployment
- Use strong, unique passwords for database users
- Consider enabling MongoDB Atlas encryption

### 3. JWT Security

- Use a strong, random JWT secret
- Configure proper token expiration

## Troubleshooting

### Connection Issues

If you experience MongoDB connection issues:

1. Verify your connection string is correct
2. Check that your IP is whitelisted in MongoDB Atlas
3. Ensure your database user has the correct permissions

### Build Errors

If you encounter build errors:

1. Check for missing dependencies
2. Verify that all required environment variables are set
3. Look for syntax errors or unsupported features

## Continuous Deployment

For a smooth development workflow:

1. Use feature branches for development
2. Set up automatic deployments for preview environments
3. Only merge thoroughly tested code to the main branch

---

For additional support, refer to the documentation for your specific hosting platform.