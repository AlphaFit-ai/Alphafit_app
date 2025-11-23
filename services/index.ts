export { default as apiClient } from './apiClient';
export { default as userService } from './userService';
export { default as firebaseAuthService } from './firebaseAuthService';
export { nativeGoogleSignIn } from './nativeGoogleSignIn';
// Export types only - avoid importing Firebase config at module level
export type { AuthResponse, UserOnboardingData, UserProfile } from './userService';

