# Onboarding Flow Feature

## Overview

The onboarding flow provides a guided tour for first-time users to help them understand the key features of Instant Expense Manager. It's designed to be informative, non-intrusive, and easily accessible.

## Features

### 1. **First-Time User Detection**
- Automatically detects when a user first opens the app
- Shows the onboarding dialog on first launch
- Tracks completion status in persistent storage (IndexedDB)

### 2. **Step-by-Step Guide**
The onboarding consists of 6 comprehensive steps:

1. **Welcome** - Introduction to the app
2. **Banks & Accounts** - How to add banks and accounts
3. **Transactions** - Understanding income, expenses, and savings
4. **Financial Planner** - Monthly planning with buckets
5. **Analytics & Insights** - Understanding financial patterns
6. **Settings & Features** - Exploring advanced features

### 3. **User Experience**
- **Responsive Design**: Full-screen on mobile, dialog on desktop
- **Progress Tracking**: Visual stepper on desktop, dots on mobile
- **Navigation**: Next/Back buttons with keyboard support
- **Skip Option**: Users can skip the tour at any time
- **Persistence**: Progress is saved, so users can resume if interrupted

### 4. **Restart Capability**
- Users can restart the onboarding tour from Settings
- Useful for users who want to review the guide again
- Accessible via "Getting Started" section in Settings

## Implementation Details

### Store (`useOnboardingStore.ts`)
- Uses Zustand with persistence middleware
- Stores `hasCompletedOnboarding` flag
- Tracks `currentStep` for resume capability
- Provides `resetOnboarding()` function

### Component (`OnboardingDialog.tsx`)
- Material-UI Dialog component
- Responsive layout (full-screen on mobile)
- Stepper component for desktop view
- Progress indicators for mobile view
- Integrated with routing (optional navigation to features)

### Integration
- Integrated into `App.tsx` to show on first launch
- Settings page includes restart button
- Automatically detects when onboarding should be shown

## User Flow

1. **First Launch**:
   - User opens app for the first time
   - Onboarding dialog appears automatically
   - User can proceed through steps or skip

2. **Completion**:
   - User completes all steps or clicks "Skip Tour"
   - `hasCompletedOnboarding` is set to `true`
   - Dialog won't appear again automatically

3. **Restart**:
   - User goes to Settings → Getting Started
   - Clicks "Restart Onboarding Tour"
   - Onboarding dialog appears again
   - User can go through the tour again

## Technical Notes

- **Storage**: Uses IndexedDB via Zustand persist middleware
- **Responsiveness**: Fully responsive with mobile-first design
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Lightweight component with minimal re-renders
- **State Management**: Centralized state management via Zustand

## Future Enhancements

Potential improvements:
- Interactive feature highlights (tooltips pointing to actual UI elements)
- Video tutorials or animated guides
- Contextual help based on user actions
- Multi-language support
- Customizable onboarding steps based on user preferences

