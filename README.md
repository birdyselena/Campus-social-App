# Campus Social App

A React Native mobile application for university students to connect, chat, attend events, and earn rewards through an in-app coins system.

## Features

### 🎓 Student Authentication

- Student registration with university affiliation
- Secure login/logout functionality
- Profile management with student ID verification

### 💬 Group & Personal Chat

- Create and join chat groups
- Real-time messaging
- University-specific groups
- Public and private group options

### 📅 Campus Events

- Create and discover campus events
- Event attendance tracking
- Earn coins for event participation
- Location-based event discovery

### 🪙 In-App Coins System

- Earn coins through engagement:
  - Daily check-ins (+10 coins)
  - Event attendance (+15 coins)
  - Chat participation (+5 coins)
- Track coin balance and transaction history

### 🛍️ Partner Brand Integration

- Redeem coins for discounts
- Partner brand marketplace
- Stripe payment integration
- Student-exclusive offers

## Technical Stack

- **Frontend**: React Native with Expo SDK 53
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper
- **Backend**: Supabase (Database & Authentication)
- **Payments**: Stripe API
- **Local Storage**: AsyncStorage
- **Icons**: Expo Vector Icons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Expo CLI
- iOS Simulator or Android Emulator
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd campus-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

4. Configure Supabase:
   Update `src/services/supabase.js` with your Supabase credentials.

5. Start the development server:

```bash
npm start
```

6. Run on device:

```bash
npm run android  # For Android
npm run ios      # For iOS (macOS only)
```

## Database Schema

### Tables Overview

#### users

- User profiles with university information
- Coins balance tracking
- Authentication data

#### chat_groups

- Group chat information
- Public/private settings
- University affiliation

#### messages

- Chat messages with timestamps
- User association
- Group association

#### events

- Campus event details
- Location and timing
- Organizer information

#### event_attendees

- Event attendance tracking
- User participation records

#### coins_transactions

- Coin earning/spending history
- Transaction types and descriptions

#### partner_brands

- Brand information and offers
- Discount percentages
- Active status

### Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in `database/migrations/`
3. Set up Row Level Security (RLS) policies
4. Configure authentication settings

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
│   └── AuthContext.js  # Authentication state management
├── navigation/         # Navigation configuration
│   └── AppNavigator.js # Main navigation structure
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   ├── main/         # Main tab screens
│   ├── chat/         # Chat-related screens
│   ├── events/       # Event-related screens
│   └── coins/        # Coins-related screens
├── services/         # External service integrations
│   └── supabase.js   # Supabase client configuration
└── utils/           # Utility functions
```

## Key Features Implementation

### Authentication Flow

- Registration with student validation
- Email verification
- Secure session management
- Profile creation with university data

### Real-time Chat

- WebSocket connections via Supabase
- Message persistence
- Group management
- Online presence indicators

### Event Management

- Event creation and discovery
- Attendance tracking
- Location-based filtering
- Coins rewards for participation

### Coins Economy

- Multiple earning opportunities
- Transaction history
- Partner integration
- Redemption system

## Development Guidelines

### Code Style

- Use functional components with React Hooks
- Implement proper error handling
- Follow React Native best practices
- Use TypeScript interfaces for data structures

### Security Considerations

- Implement Row Level Security in Supabase
- Validate user inputs
- Secure API endpoints
- Handle sensitive data properly

### Performance Optimization

- Use FlatList for large datasets
- Implement proper loading states
- Optimize image loading
- Use React.memo for expensive components

## Testing

### Unit Testing

```bash
npm test
```

### E2E Testing

```bash
npm run test:e2e
```

### Device Testing

- Test on multiple screen sizes
- Verify on both iOS and Android
- Test offline functionality
- Performance testing on older devices

## Deployment

### Expo Build

```bash
expo build:android
expo build:ios
```

### App Store Deployment

1. Configure app.json with store information
2. Generate signed builds
3. Upload to respective app stores
4. Configure store listings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Environment Setup

### Development

- Use Expo development build
- Enable hot reloading
- Use debugging tools

### Production

- Optimize bundle size
- Enable crash reporting
- Configure analytics
- Set up monitoring

## API Documentation

### Supabase Integration

- Authentication APIs
- Real-time subscriptions
- Database operations
- File storage

### Stripe Integration

- Payment processing
- Subscription management
- Webhook handling

## Troubleshooting

### Common Issues

- Metro bundler cache issues
- Expo CLI version conflicts
- Platform-specific dependencies
- Network connectivity problems

### Solutions

- Clear Metro cache: `npx react-native start --reset-cache`
- Update Expo CLI: `npm install -g @expo/cli`
- Check platform compatibility
- Verify network permissions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the documentation
- Join the community Discord

## Roadmap

### Version 1.1

- Push notifications
- Advanced search functionality
- Video chat integration
- Enhanced profile customization

### Version 1.2

- AI-powered event recommendations
- Advanced analytics dashboard
- Multi-language support
- Accessibility improvements

### Version 2.0

- AR features for campus navigation
- Integration with university systems
- Advanced coins marketplace
- Social features expansion
