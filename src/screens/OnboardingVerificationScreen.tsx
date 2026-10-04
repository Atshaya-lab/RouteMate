import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { UserRole } from '../types';
import { sendPhoneVerificationCode, verifyCodeAndSignIn } from '../services/auth';

interface OnboardingVerificationScreenProps {
  onAuthenticated: (role: UserRole) => void;
}

export const OnboardingVerificationScreen: React.FC<OnboardingVerificationScreenProps> = ({
  onAuthenticated,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState<UserRole>('traveler');
  const [phoneNumber, setPhoneNumber] = useState('(555) 019-2834');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return text;
    if (!match[2]) return match[1];
    return `(${match[1]}) ${match[2]}${match[3] ? '-' + match[3] : ''}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleSendCode = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendPhoneVerificationCode(phoneNumber);
      setLoading(false);
      setStep('otp');
      Alert.alert(
        'Code Dispatched',
        `SMS verification code: ${res.mockOtp} (Enter this code or tap Verify to sign in)`
      );
    } catch {
      setLoading(false);
      setStep('otp');
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    const codeToVerify = otpCode.trim() || '123456';
    const res = await verifyCodeAndSignIn(phoneNumber, codeToVerify, selectedRole);
    setLoading(false);

    if (res.success) {
      onAuthenticated(selectedRole);
    } else {
      Alert.alert('Verification Failed', res.error || 'Please enter valid code 123456');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Motif & Welcoming Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoBadgeOuter}>
            <View style={styles.logoGlow} />
            <View style={styles.logoBadgeInner}>
              <MaterialIcons name="person-pin-circle" size={36} color={Colors.primaryContainer} />
            </View>
          </View>

          <View style={styles.presencePill}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.presenceText}>Live Local Presence</Text>
          </View>

          <Text style={styles.headline}>Navigate with confidence</Text>
          <Text style={styles.subhead}>
            Never feel lost or unsafe in an unfamiliar place. Instant localized companion escort at your fingertips.
          </Text>
        </View>

        {/* Dual Role Selection Cards */}
        <View style={styles.rolesContainer}>
          {/* Traveler Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'traveler' ? styles.roleCardActive : styles.roleCardInactive,
            ]}
            onPress={() => setSelectedRole('traveler')}
            activeOpacity={0.85}
          >
            {selectedRole === 'traveler' && <View style={styles.activeBorderStripTraveler} />}
            <View style={styles.roleCardBody}>
              <View style={[styles.roleIconBox, styles.roleIconBoxTraveler]}>
                <MaterialIcons name="explore" size={24} color={Colors.primaryContainer} />
              </View>

              <View style={styles.roleInfo}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle}>I Need Wayfinding Help</Text>
                  <View
                    style={[
                      styles.radioDot,
                      selectedRole === 'traveler' && styles.radioDotSelectedTraveler,
                    ]}
                  >
                    {selectedRole === 'traveler' && (
                      <MaterialIcons name="check" size={12} color={Colors.onPrimary} />
                    )}
                  </View>
                </View>

                <Text style={styles.roleDescription}>
                  Solo explorer, traveler, or late commuter seeking an instant vetted local guide.
                </Text>

                <View style={styles.badgesRow}>
                  <View style={styles.badgeChip}>
                    <MaterialIcons name="verified-user" size={12} color={Colors.secondaryLive} />
                    <Text style={styles.badgeText}>Instant Response</Text>
                  </View>
                  <View style={styles.badgeChip}>
                    <MaterialIcons name="record-voice-over" size={12} color={Colors.primary} />
                    <Text style={styles.badgeText}>Multi-Lingual</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Guide Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'guide' ? styles.roleCardActive : styles.roleCardInactive,
            ]}
            onPress={() => setSelectedRole('guide')}
            activeOpacity={0.85}
          >
            {selectedRole === 'guide' && <View style={styles.activeBorderStripGuide} />}
            <View style={styles.roleCardBody}>
              <View style={[styles.roleIconBox, styles.roleIconBoxGuide]}>
                <MaterialIcons name="handshake" size={24} color={Colors.secondaryLive} />
              </View>

              <View style={styles.roleInfo}>
                <View style={styles.roleTitleRow}>
                  <Text style={styles.roleTitle}>I Want to Guide Others</Text>
                  <View
                    style={[
                      styles.radioDot,
                      selectedRole === 'guide' && styles.radioDotSelectedGuide,
                    ]}
                  >
                    {selectedRole === 'guide' && (
                      <MaterialIcons name="check" size={12} color={Colors.onSecondary} />
                    )}
                  </View>
                </View>

                <Text style={styles.roleDescription}>
                  Earn by safely assisting newcomers, commuters, and lost visitors navigate your neighborhood.
                </Text>

                <View style={styles.badgesRow}>
                  <View style={styles.badgeChip}>
                    <MaterialIcons name="payments" size={12} color={Colors.secondaryLive} />
                    <Text style={styles.badgeText}>Flexible Shifts</Text>
                  </View>
                  <View style={styles.badgeChip}>
                    <MaterialIcons name="shield" size={12} color={Colors.primary} />
                    <Text style={styles.badgeText}>Vetted Escort ID</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Verification Form Card */}
        <View style={styles.authCard}>
          {step === 'phone' ? (
            <>
              <View style={styles.inputHeaderRow}>
                <Text style={styles.inputLabel}>Enter mobile number to begin</Text>
                <View style={styles.encryptedPill}>
                  <MaterialIcons name="lock" size={12} color={Colors.secondaryLive} />
                  <Text style={styles.encryptedText}>Encrypted</Text>
                </View>
              </View>

              {/* Phone Input Box */}
              <View style={styles.phoneInputRow}>
                <View style={styles.countryPill}>
                  <Text style={styles.flagEmoji}>🇺🇸</Text>
                  <Text style={styles.countryCode}>+1</Text>
                </View>

                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  placeholder="(555) 000-0000"
                  placeholderTextColor={Colors.outline}
                  maxLength={14}
                />

                <MaterialIcons name="check-circle" size={18} color={Colors.secondaryLive} />
              </View>

              {/* Main Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {selectedRole === 'guide'
                        ? 'Join as Certified Local Guide'
                        : 'Send Verification Code'}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color={Colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputHeaderRow}>
                <Text style={styles.inputLabel}>Enter 6-Digit Code sent to {phoneNumber}</Text>
                <TouchableOpacity onPress={() => setStep('phone')}>
                  <Text style={styles.changePhoneText}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.otpInputRow}>
                <TextInput
                  style={styles.otpInput}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  placeholder="123456"
                  placeholderTextColor={Colors.outline}
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleVerifyCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Verify & Sign In</Text>
                    <MaterialIcons name="check" size={18} color={Colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.disclaimerText}>
            We will text you a 6-digit code. No spam, ever.
          </Text>
        </View>

        {/* Social Fast Track */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtonsRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => onAuthenticated(selectedRole)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="apple" size={18} color={Colors.onSurface} />
            <Text style={styles.socialButtonText}>Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => onAuthenticated(selectedRole)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="google" size={16} color="#EA4335" />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Standard Strip */}
        <View style={styles.safetyStandardBox}>
          <View style={styles.safetyHeader}>
            <MaterialIcons name="security" size={18} color={Colors.secondaryLive} />
            <Text style={styles.safetyTitle}>Community Trust & Safety Standard</Text>
          </View>

          <View style={styles.safetyGrid}>
            <View style={styles.safetyItem}>
              <View style={styles.safetyIconBgGreen}>
                <MaterialIcons name="verified-user" size={14} color={Colors.onSecondaryFixedVariant} />
              </View>
              <Text style={styles.safetyItemText}>24/7 Verified Local Guides</Text>
            </View>

            <View style={styles.safetyItem}>
              <View style={styles.safetyIconBgRed}>
                <MaterialIcons name="sos" size={14} color={Colors.onErrorContainer} />
              </View>
              <Text style={styles.safetyItemText}>Direct Emergency Dispatch</Text>
            </View>
          </View>
        </View>

        {/* Footer Terms */}
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Safe Escort</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoBadgeOuter: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerHigh,
    opacity: 0.6,
  },
  logoBadgeInner: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.level2,
  },
  presencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
    marginBottom: 8,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  presenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subhead: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 6,
    lineHeight: 20,
  },
  rolesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  roleCard: {
    borderRadius: Radii.xl,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  roleCardActive: {
    backgroundColor: Colors.surfaceContainerLowest,
    ...Elevation.level2,
  },
  roleCardInactive: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  activeBorderStripTraveler: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: Colors.primaryContainer,
  },
  activeBorderStripGuide: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: Colors.secondaryLive,
  },
  roleCardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingLeft: 4,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconBoxTraveler: {
    backgroundColor: Colors.surfaceContainer,
  },
  roleIconBoxGuide: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotSelectedTraveler: {
    backgroundColor: Colors.primaryContainer,
  },
  radioDotSelectedGuide: {
    backgroundColor: Colors.secondaryLive,
  },
  roleDescription: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  authCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.md,
    borderRadius: Radii.xl,
    ...Elevation.level2,
    gap: 10,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  encryptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  encryptedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixedVariant,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radii.md,
    ...Elevation.level2,
  },
  flagEmoji: {
    fontSize: 14,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurface,
    paddingVertical: 6,
  },
  otpInputRow: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryContainer,
    textAlign: 'center',
    letterSpacing: 6,
  },
  changePhoneText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    height: 52,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    ...Elevation.level2,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Elevation.level2,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  safetyStandardBox: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radii.lg,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  safetyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  safetyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyIconBgGreen: {
    width: 24,
    height: 24,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyIconBgRed: {
    width: 24,
    height: 24,
    borderRadius: Radii.full,
    backgroundColor: Colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyItemText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  termsText: {
    fontSize: 11,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  termsLink: {
    color: Colors.primaryContainer,
    fontWeight: '600',
  },
});
