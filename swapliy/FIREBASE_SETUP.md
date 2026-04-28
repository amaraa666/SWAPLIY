# Firebase Setup Guide for Swapliy

## Steps to Connect Firebase to Your App

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name: "Swapliy"
4. Continue through the setup wizard

### 2. Enable Email/Password Authentication
1. In Firebase Console, go to **Authentication**
2. Click on **Sign-in method**
3. Enable **Email/Password** provider
4. Save the changes

### 3. Get Firebase Configuration
1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Go to **General** tab
3. Under "Your apps" section, click on the Web icon
4. Copy your Firebase config object

### 4. Update Firebase Config in Your App
1. Open `config/firebase.ts`
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

Example:
```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyDxJ...',
  authDomain: 'swapliy-project.firebaseapp.com',
  projectId: 'swapliy-project',
  storageBucket: 'swapliy-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123...',
};
```

### 5. Install Firebase Package (if not already done)
```bash
npm install firebase
```

## Features Implemented

✅ Email/Password Sign Up
✅ Email/Password Login
✅ Error Handling
✅ Loading States
✅ User Session Management
✅ Global Auth Context

## How It Works

1. **AuthProvider**: Wraps the entire app and manages user authentication state
2. **useAuth Hook**: Access auth methods and user state in any component
3. **Login Screen**: Uses `login()` function from auth context
4. **Signup Screen**: Uses `signup()` function from auth context
5. **Automatic Navigation**: After successful auth, users are redirected to the app

## Testing

1. Go to the **Signup** screen
2. Enter an email and password
3. Click "Sign up"
4. If successful, you'll be redirected to the home page
5. Firebase will create the user in your database

## Troubleshooting

- **"Project root directory not found"**: Make sure you're in the correct directory
- **Auth errors**: Check that your Firebase config is correct
- **Users not appearing in Firebase**: Go to Firebase Console > Authentication > Users to verify

## Notes

- Password must be at least 6 characters
- Email must be a valid email format
- Users are persisted in Firebase automatically
- The app checks authentication state on startup
