# Pollen Tracker App - AI Assistant Guidelines

## Project Overview

You are working on a **Pollen Tracker Mobile Web App** - a Progressive Web App (PWA) that provides personalized pollen forecasts based on user location and individual sensitivity levels. This document contains critical information for maintaining consistency and quality in the codebase.

## Core Business Logic

### Application Purpose
This app helps allergy sufferers by providing:
- **Personalized risk assessments** (not just raw pollen counts)
- **Location-based real-time data** using Google Pollen API
- **3-day forecasts** tailored to individual sensitivities
- **Mobile-first experience** optimized for quick glanceable information

### Key Business Rules

1. **Personalization Formula**
   ```typescript
   /**
    * Calculate personalized risk based on:
    * Risk = (Pollen Index × User Sensitivity) / 10
    * 
    * Where:
    * - Pollen Index: 0-5 from Google API
    * - User Sensitivity: 1-10 from user settings
    * - Result: Normalized risk score
    * 
    * Combined risk across all pollen types determines overall severity
    */
   ```

2. **Risk Levels**
   - **Low**: Combined score < 2 (Green - #22c55e)
   - **Moderate**: Combined score 2-5 (Yellow - #eab308)
   - **High**: Combined score 5-8 (Orange - #f97316)
   - **Very High**: Combined score > 8 (Red - #ef4444)

3. **Data Freshness**
   - **NO CACHING in MVP** - Always fetch fresh data
   - API calls on: app load, manual refresh, location change
   - Display "Last updated" timestamp

## Technical Requirements

### Technology Stack
```javascript
{
  "framework": "React 18 + TypeScript",
  "build": "Vite 5",
  "styling": "Tailwind CSS 3",
  "pwa": "Vite PWA Plugin",
  "api": "Google Pollen API v1",
  "deployment": "Cloudflare Pages"
}
```

### Code Standards

#### TypeScript Requirements
- **Strict mode enabled** in tsconfig.json
- **Explicit typing** for all function parameters and returns
- **Interface definitions** for all API responses and data structures
- **No `any` types** - use `unknown` and type guards instead

#### Component Structure
```typescript
/**
 * Component files must include:
 * 1. Interface definitions for props
 * 2. JSDoc comments for complex logic
 * 3. Error boundaries for API calls
 * 4. Loading and error states
 */

interface ComponentProps {
  // Always define prop types
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // Implementation with comprehensive error handling
};
```

#### File Organization
- **One component per file**
- **Co-locate related components** in folders
- **Services** for API calls and business logic
- **Hooks** for reusable stateful logic
- **Utils** for pure functions

### API Integration Guidelines

#### Google Pollen API
```typescript
// MANDATORY: Always use environment variable for API key
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// MANDATORY: Error handling for all API calls
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return await response.json();
} catch (error) {
  // Always provide user-friendly error messages
  console.error('Pollen API Error:', error);
  // Return fallback or show error state
}
```

#### Rate Limiting
- Google API free tier: $200/month credit
- Approximately 40,000 requests/month free
- **NO CACHING IN MVP** - Direct API calls only
- Monitor usage in Google Cloud Console

### UI/UX Requirements

#### Mobile-First Design
- **Minimum touch target**: 44x44px
- **Font size**: 16px minimum for body text
- **Line height**: 1.5 for readability
- **Viewport meta tag**: Required for mobile

#### Performance Targets
- **Initial Load**: <3 seconds on 3G
- **Bundle Size**: <250KB gzipped
- **Time to Interactive**: <5 seconds
- **Lighthouse Score**: >90

#### Accessibility
- **WCAG 2.1 AA** compliance required
- **Semantic HTML** elements
- **ARIA labels** for interactive elements
- **Keyboard navigation** support
- **Screen reader** compatibility

## Common Development Tasks

### Adding a New Component
1. Create component file in appropriate folder
2. Define TypeScript interfaces for props
3. Implement with error boundaries
4. Add loading and error states
5. Write JSDoc comments for complex logic
6. Update relevant parent components

### Modifying API Integration
1. Check current Google API quota usage
2. Update service file with new endpoint
3. Define TypeScript types for response
4. Implement error handling
5. Test with invalid/edge cases
6. Update any dependent components

### Updating User Preferences
1. Modify localStorage schema carefully
2. Implement migration for existing users
3. Update Settings component
4. Test persistence across sessions
5. Ensure backward compatibility

### Deploying Changes
```bash
# Build and test locally
npm run build
npm run preview

# Deploy to Cloudflare Pages
git add .
git commit -m "feat: description"
git push origin main
# Automatic deployment via Cloudflare Pages
```

## Testing Requirements

### Manual Testing Checklist
- [ ] Test on real mobile devices (iOS Safari, Chrome)
- [ ] Test with location permissions denied
- [ ] Test with invalid API responses
- [ ] Test offline functionality (PWA)
- [ ] Test all sensitivity slider combinations
- [ ] Test in different locations (via VPN/manual)
- [ ] Verify accessibility with screen reader

### Browser Support
- **iOS Safari**: 14+ (critical for iPhone users)
- **Chrome Mobile**: Latest 2 versions
- **Samsung Internet**: Latest version
- **Firefox Mobile**: Latest version

## Important Constraints

### MVP Limitations
1. **NO CACHING** - Direct API calls only
2. **NO USER ACCOUNTS** - localStorage only
3. **NO PUSH NOTIFICATIONS** - Phase 2 feature
4. **NO SYMPTOM TRACKING** - Phase 2 feature
5. **NO HISTORICAL DATA** - Current + forecast only

### Security Considerations
- **Never expose API keys** in client code
- **Use environment variables** for sensitive data
- **Validate user inputs** before API calls
- **Sanitize location data** before storage
- **No personal health information** in MVP

## Error Handling Patterns

### API Errors
```typescript
// Standardized error handling
enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  API_LIMIT = 'API_RATE_LIMIT',
  NO_DATA = 'NO_DATA_AVAILABLE',
  LOCATION = 'LOCATION_ERROR'
}

// User-friendly messages
const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: 'Unable to connect. Check your internet connection.',
  [ErrorType.API_LIMIT]: 'Too many requests. Please try again later.',
  [ErrorType.NO_DATA]: 'Pollen data not available for this location.',
  [ErrorType.LOCATION]: 'Unable to determine location. Please enable location services.'
};
```

## Performance Optimization

### Critical Rendering Path
1. **Inline critical CSS** for above-the-fold content
2. **Lazy load** forecast and settings views
3. **Preload** Google Fonts (if used)
4. **Minimize** JavaScript bundle size
5. **Use React.memo** for expensive components

### Image Optimization
- **Use SVG** for icons and graphics
- **Lazy load** images below the fold
- **Provide multiple resolutions** with srcset
- **Use WebP format** with fallbacks

## Deployment Configuration

### Environment Variables
```bash
# .env.example
VITE_GOOGLE_API_KEY=your_api_key_here
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### Cloudflare Pages Settings
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node version**: 18.x or later
- **Environment variables**: Set in Cloudflare dashboard

## Troubleshooting Guide

### Common Issues

1. **"Pollen data not available"**
   - Check if location is supported by Google Pollen API
   - Verify API key is valid and has Pollen API enabled
   - Check API quota in Google Cloud Console

2. **Location not detected**
   - Ensure HTTPS is enabled (required for geolocation)
   - Check browser permissions for location
   - Provide manual location input as fallback

3. **App not installing as PWA**
   - Verify manifest.json is properly configured
   - Check service worker registration
   - Ensure HTTPS is enabled
   - Test in supported browsers

4. **Poor performance on mobile**
   - Check bundle size with `npm run build`
   - Analyze with Lighthouse
   - Reduce API calls if exceeding quota
   - Optimize images and assets

## Version Control Guidelines

### Commit Message Format
```bash
# Use conventional commits
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/**: New features
- **fix/**: Bug fixes
- **hotfix/**: Urgent production fixes
- **Create always a new branch for feature and fixes.**

## Resources & Documentation

### Essential Links
- [Google Pollen API Documentation](https://developers.google.com/maps/documentation/pollen)
- [React + TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

### Design References
- Material Design Guidelines for mobile
- iOS Human Interface Guidelines
- Web Content Accessibility Guidelines (WCAG)

## Quick Command Reference

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Testing
npm run test         # Run tests (when implemented)
npm run lighthouse   # Run Lighthouse audit

# Deployment
git push origin main # Auto-deploy to Cloudflare Pages
```

## Contact for Questions

If you encounter issues not covered in this document:
1. Check PROJECT_PLAN.md for business requirements
2. Review Google Pollen API documentation
3. Consult React and Vite documentation
4. Check GitHub issues for similar problems

---

**Remember**: This is an MVP focused on delivering core value quickly. Avoid scope creep and maintain focus on the essential features: location-based pollen data, personalized risk assessment, and 3-day forecast.

*Document Version: 1.0.0*
*Last Updated: [Current Date]*