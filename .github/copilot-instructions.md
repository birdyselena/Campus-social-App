# Copilot Instructions for Campus Social App

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a React Native Expo social mobile application for university students with the following features:

- Group and personal chat functionality
- Event attendance system
- In-app coins reward system
- Partner brand integration with coin redemption
- Supabase backend integration
- Stripe payment processing

## Technical Stack

- React Native with Expo SDK 53
- React Navigation for navigation
- React Native Paper for UI components
- Supabase for backend/database
- Stripe API for payments
- AsyncStorage for local data persistence

## Key Features to Implement

1. **Authentication System**: Student registration/login
2. **Chat System**: Group and personal messaging
3. **Events Module**: Create, join, and attend campus events
4. **Coins System**: Earn coins through engagement, redeem with partners
5. **Partner Integration**: Brand partnerships and discount redemption
6. **User Profiles**: Student profiles with university affiliation

## Code Style Guidelines

- Use functional components with React Hooks
- Implement proper error handling and loading states
- Follow React Native best practices for performance
- Use TypeScript interfaces for data structures
- Implement proper navigation patterns
- Follow secure coding practices for authentication and payments

## Database Schema Considerations

- Users (students) with university profiles
- Chat groups and messages
- Events with attendance tracking
- Coins transactions and balances
- Partner brands and offers
- User engagement metrics

When generating code, ensure:

- Proper error boundaries and loading states
- Responsive design for different screen sizes
- Accessibility features
- Security best practices for sensitive data
- Proper state management
- Clean component architecture
