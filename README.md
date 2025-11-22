# AlphaFit AI - Mobile App

React Native fitness application with Firebase authentication.

## Features

- 🔐 Firebase Authentication (Email, Google, Apple)
- 🏋️ Workout & nutrition tracking
- 📊 Progress analytics
- 🎨 Dark mode support
- 🌍 Multi-language (EN, ES, FR)

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Backend running on port 8080

### Installation

```bash
npm install
```

### Configuration

Create `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

**Note**: Firebase config files `google-services.json` and `GoogleService-Info.plist` are already in the root directory.

### Run

```bash
npm start
# Press 'i' for iOS, 'a' for Android
```

## Authentication

Uses Firebase for authentication, then syncs with Spring Boot backend.

### Email/Password
```typescript
import { userService } from './services';
await userService.registerWithEmail(email, password, fullName);
await userService.loginWithEmail(email, password);
```

### Google Sign-In
```tsx
import { GoogleSignInButton } from './components';
<GoogleSignInButton onSuccess={() => {}} onError={(e) => {}} />
```

### Apple Sign-In (iOS)
```tsx
import { AppleSignInButton } from './components';
<AppleSignInButton onSuccess={() => {}} onError={(e) => {}} />
```

## Project Structure

```
app/          # Screens (Expo Router)
components/   # Reusable components
services/     # API & Firebase services
context/      # State management
constants/    # App constants
```

## Tech Stack

- React Native (Expo)
- TypeScript
- Firebase SDK
- Axios
- Context API

### DevOps
- **Azure** - Cloud hosting
- **GitLab** - Version control
- **Jenkins** - CI/CD
- **Kubernetes** - Container orchestration

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Spring Boot backend running
- MongoDB instance

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/forge-ai.git
cd forge-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
copy .env.example .env
# Edit .env and add your backend URL and OAuth credentials
```

4. **Start development server**
```bash
npm start
```

5. **Run on device**
```bash
# iOS
npm run ios

# Android
npm run android
```

---

## 📂 Project Structure

```
Forge_AI/
├── app/                          # Application screens
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Entry point
│   ├── onboarding/               # Onboarding flow (10 screens)
│   │   ├── splash.tsx            # Welcome splash screen
│   │   ├── login.tsx             # Authentication
│   │   ├── age.tsx               # Date of birth
│   │   ├── gender.tsx            # Gender selection
│   │   ├── height.tsx            # Height & weight
│   │   ├── activity.tsx          # Activity level
│   │   ├── workouts.tsx          # Weekly workout frequency
│   │   ├── fitness-level.tsx    # Current fitness level
│   │   ├── equipment.tsx         # Available equipment
│   │   └── intro.tsx             # AI analysis & completion
│   └── (tabs)/                   # Main app screens
│       ├── home.tsx
│       ├── workouts.tsx
│       ├── nutrition.tsx
│       └── profile.tsx
├── components/                   # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── ProgressBar.tsx
│   └── OptionCard.tsx
├── constants/                    # Theme and design tokens
│   ├── Colors.ts
│   ├── Fonts.ts
│   ├── Spacing.ts
│   └── Theme.ts
├── context/                      # State management
│   └── OnboardingContext.tsx
├── services/                     # API integration
│   ├── apiClient.ts
│   └── userService.ts
├── config.ts                     # App configuration
├── package.json
└── tsconfig.json
```

---

## 🎯 Onboarding Flow

The app includes a professional 10-step onboarding process:

1. **Splash Screen** - Branded welcome screen
2. **Login** - Multi-provider authentication
3. **Age** - Date of birth selection
4. **Gender** - Male/Female selection
5. **Height & Weight** - Imperial/Metric measurements
6. **Activity Level** - Daily activity assessment
7. **Workouts** - Weekly workout frequency
8. **Fitness Level** - Beginner/Intermediate/Advanced
9. **Equipment** - Available gym equipment
10. **AI Analysis** - Physique projection and completion

Each step:
- Shows progress with a progress bar
- Has back navigation
- Validates input
- Stores data in context
- Final step submits to backend

---

## 🔌 API Integration

### Backend Endpoints Required

```
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Login with email
POST   /api/auth/google             # Google OAuth
POST   /api/auth/apple              # Apple OAuth
POST   /api/users/onboarding        # Submit onboarding data
PATCH  /api/users/onboarding        # Update onboarding data
GET    /api/users/profile           # Get user profile
PUT    /api/users/profile           # Update user profile
GET    /health                      # Health check
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API specifications.

---

## 🎨 Design System

### Color Palette

- **Primary Orange**: `#FF6B4A` - FORGE branding
- **Secondary Blue**: `#4A9FFF` - AI accent
- **Black**: `#000000` - Main buttons and text
- **White**: `#FFFFFF` - Backgrounds
- **Gray Scale**: 50-900 - Supporting colors

### Typography

- **Font Sizes**: 12px - 48px (8 levels)
- **Font Weights**: Regular (400) - Extra Bold (800)
- **Line Heights**: Tight, Normal, Relaxed

### Spacing

- **Base Units**: 4, 8, 16, 24, 32, 40, 48, 64px
- **Button Height**: 56px with 28px border radius
- **Screen Padding**: 24px

---

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - BCrypt on backend
- **HTTPS Only** - Encrypted communication
- **Token Storage** - Secure AsyncStorage
- **Input Validation** - Client and server-side
- **Rate Limiting** - API abuse prevention

---

## 📊 Data Flow

```
User Input → OnboardingContext → API Service → Spring Boot → MongoDB
```

1. User completes onboarding screens
2. Data collected in React Context
3. Submitted via Axios to backend
4. Spring Boot processes and validates
5. Stored in MongoDB
6. JWT token returned
7. User navigated to main app

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Test API connection
curl http://localhost:8080/api/health
```

---

## 🚢 Deployment

### Build for Production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Submit to Stores

```bash
# App Store
eas submit --platform ios

# Play Store
eas submit --platform android
```

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete deployment guide.

---

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup instructions
- [Architecture](./ARCHITECTURE.md) - System architecture overview
- [API Documentation](./API_DOCUMENTATION.md) - Backend API specifications
- [Commands](./COMMANDS.md) - Quick command reference
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Pre-launch checklist

---

## 🛠️ Configuration

### Environment Variables

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_APPLE_CLIENT_ID=your-apple-client-id
```

### Update Backend URL

Edit `config.ts`:
```typescript
API_BASE_URL: 'https://your-backend-url.com/api'
```

---

## 🐛 Troubleshooting

### Common Issues

**Metro bundler not starting**
```bash
npm start -- --clear
```

**Module not found**
```bash
rm -rf node_modules && npm install
```

**API connection fails**
- Verify backend is running
- Check API URL in config
- Test with health endpoint

**OAuth not working**
- Verify client IDs
- Check OAuth configuration
- Test with Expo Go vs standalone build

---

## 🗺️ Roadmap

### Phase 1: Onboarding (✅ Complete)
- [x] Splash screen
- [x] Multi-provider authentication
- [x] 10-step onboarding flow
- [x] Progress tracking
- [x] MongoDB integration
- [x] Professional UI/UX

### Phase 2: Core Features (🚧 In Progress)
- [ ] Home dashboard
- [ ] AI workout plan generation
- [ ] Nutrition tracking
- [ ] Meal photo analysis
- [ ] Progress photos
- [ ] Body composition tracking

### Phase 3: AI Integration (📋 Planned)
- [ ] LLM chatbot coach
- [ ] AI physique analysis
- [ ] Personalized recommendations
- [ ] Voice coach
- [ ] Progress predictions

### Phase 4: Advanced Features (📋 Planned)
- [ ] Gamification system
- [ ] Social features
- [ ] Wearable integration
- [ ] Advanced analytics
- [ ] Community challenges

---

## 👥 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

## 📞 Support

- **Documentation**: See docs folder
- **Issues**: Create a GitHub issue
- **Email**: support@forgeai.com

---

## 🙏 Acknowledgments

- React Native and Expo teams
- Spring Boot community
- MongoDB developers
- All contributors

---

<div align="center">

**Built with ❤️ by the Forge AI Team**

[Website](https://forgeai.com) · [Documentation](./docs) · [API Docs](./API_DOCUMENTATION.md)

</div>