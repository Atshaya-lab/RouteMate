import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

const AUTH_STORAGE_KEY = '@routemate_current_user';

export const PRESET_USERS: User[] = [
  {
    id: 'traveler-001',
    name: 'Alex Morgan',
    phoneNumber: '+91 98765 43210',
    role: 'traveler',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    isOnline: true,
  },
  {
    id: 'guide-001',
    name: 'Achu',
    phoneNumber: '+91 94421 88901',
    role: 'guide',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isOnline: true,
  },
  {
    id: 'guide-002',
    name: 'Malar',
    phoneNumber: '+91 94421 88902',
    role: 'guide',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    isOnline: true,
  },
  {
    id: 'guide-003',
    name: 'Ashika',
    phoneNumber: '+91 94421 88903',
    role: 'guide',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    isOnline: true,
  },
  {
    id: 'guide-004',
    name: 'Yuva',
    phoneNumber: '+91 94421 88904',
    role: 'guide',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isOnline: true,
  },
];

export const DEFAULT_TRAVELER: User = PRESET_USERS[0];
export const DEFAULT_GUIDE: User = PRESET_USERS[1]; // Achu

/**
 * Request OTP for phone verification.
 * Note: Plugs into Twilio Verify API / Firebase Auth in production.
 */
export async function sendPhoneVerificationCode(phoneNumber: string): Promise<{ success: boolean; mockOtp: string }> {
  // Simulate network dispatch to Twilio / Auth Provider
  await new Promise((resolve) => setTimeout(resolve, 800));
  const mockOtp = '123456';
  return { success: true, mockOtp };
}

/**
 * Verify submitted OTP and return user session.
 */
export async function verifyCodeAndSignIn(
  phoneNumber: string,
  code: string,
  role: UserRole = 'traveler'
): Promise<{ success: boolean; user?: User; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Accept '123456' or any 6-digit code for mock testing
  if (code.length === 6 || code === '123456') {
    const user: User = {
      id: role === 'guide' ? 'guide-001' : 'traveler-001',
      name: role === 'guide' ? 'Elena Rostova' : 'Alex Morgan',
      phoneNumber,
      role,
      avatarUrl: DEFAULT_TRAVELER.avatarUrl,
      isOnline: true,
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return { success: true, user };
  }

  return { success: false, error: 'Invalid verification code. Please enter 123456' };
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}
