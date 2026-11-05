import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  calculateRemainingSeconds,
  OTP_RESEND_COOLDOWN_SECONDS,
  formatTimerDisplay,
} from '../../utils/timer';
import { formatPhoneNumberForDisplay } from '../../utils/validation';

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();
  const { pendingPhone, verifyOtp, sendOtp } = useAuth();

  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const timerStartRef = useRef<number>(Date.now());

  useEffect(() => {
    timerStartRef.current = Date.now();
    setRemainingSeconds(OTP_RESEND_COOLDOWN_SECONDS);

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(
        timerStartRef.current,
        OTP_RESEND_COOLDOWN_SECONDS
      );
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-verify when 6 digits are typed/pasted/autofilled
  useEffect(() => {
    if (otpCode.length === 6 && !isVerifying) {
      handleVerify(otpCode);
    }
  }, [otpCode]);

  const handleVerify = async (codeToVerify: string = otpCode) => {
    if (codeToVerify.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const { isNewUser } = await verifyOtp(codeToVerify);
      setIsVerifying(false);

      if (isNewUser) {
        router.replace('/(auth)/register' as any);
      } else {
        router.replace('/(app)' as any);
      }
    } catch (err: any) {
      setIsVerifying(false);
      console.warn('[OtpScreen] Verification error:', err);

      // Handle Firebase and Backend specific error codes
      const errCode = err.code || '';
      const errMsg = err.message || '';

      if (
        errCode === 'auth/invalid-verification-code' ||
        errMsg.includes('invalid-verification-code') ||
        errMsg.includes('INVALID_CODE')
      ) {
        setErrorMessage(t('otp.error_wrong_code'));
      } else if (
        errCode === 'auth/session-expired' ||
        errCode === 'auth/code-expired' ||
        errMsg.includes('session-expired') ||
        errMsg.includes('EXPIRED') ||
        errMsg.includes('No active verification session')
      ) {
        setErrorMessage(t('otp.error_expired'));
      } else if (
        errCode === 'auth/too-many-requests' ||
        errMsg.includes('TOO_MANY_REQUESTS')
      ) {
        setErrorMessage(t('otp.error_too_many_attempts'));
      } else {
        setErrorMessage(t('otp.error_generic'));
      }
    }
  };

  const handleResend = async () => {
    if (remainingSeconds > 0 || isResending || !pendingPhone) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      await sendOtp(pendingPhone);
      setIsResending(false);
      timerStartRef.current = Date.now();
      setRemainingSeconds(OTP_RESEND_COOLDOWN_SECONDS);

      const interval = setInterval(() => {
        const remaining = calculateRemainingSeconds(
          timerStartRef.current,
          OTP_RESEND_COOLDOWN_SECONDS
        );
        setRemainingSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
    } catch (err: any) {
      setIsResending(false);
      console.warn('[OtpScreen] Resend error:', err);
      if (err.code === 'auth/too-many-requests') {
        setErrorMessage(t('otp.error_too_many_attempts'));
      } else {
        setErrorMessage(t('otp.error_generic'));
      }
    }
  };

  const handleChangeNumber = () => {
    router.back();
  };

  const formattedDisplayPhone = pendingPhone
    ? formatPhoneNumberForDisplay(pendingPhone)
    : '+91';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back / Change Number */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleChangeNumber}
            accessibilityRole="button"
            accessibilityLabel={t('otp.change_phone')}
          >
            <Text style={[styles.backButtonText, { fontFamily }]}>
              ← {t('otp.change_phone')}
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
              {t('otp.title')}
            </Text>
            <Text style={[styles.subtitle, { fontFamily }]}>
              {t('otp.subtitle')}{' '}
              <Text style={styles.phoneHighlight}>{formattedDisplayPhone}</Text>
            </Text>
          </View>

          {/* OTP Input Fields */}
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.otpInput,
                errorMessage ? styles.otpInputError : null,
              ]}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              placeholder="••••••"
              placeholderTextColor="#CBD5E1"
              value={otpCode}
              onChangeText={(text) => {
                const digits = text.replace(/[^\d]/g, '').slice(0, 6);
                setOtpCode(digits);
                if (errorMessage) setErrorMessage(null);
              }}
              maxLength={6}
              editable={!isVerifying}
              autoFocus
              accessibilityLabel={t('otp.input_placeholder')}
            />

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontFamily }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Resend Timer / Button */}
            <View style={styles.resendContainer}>
              {remainingSeconds > 0 ? (
                <Text style={[styles.timerText, { fontFamily }]}>
                  {t('otp.resend_timer', {
                    seconds: formatTimerDisplay(remainingSeconds),
                  })}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={isResending}
                  accessibilityRole="button"
                  accessibilityLabel={t('otp.resend_button')}
                  style={styles.resendButton}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color="#0F52BA" />
                  ) : (
                    <Text style={[styles.resendButtonText, { fontFamily: fontFamilyBold }]}>
                      {t('otp.resend_button')}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (otpCode.length < 6 || isVerifying) && styles.verifyButtonDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={otpCode.length < 6 || isVerifying}
            accessibilityRole="button"
            accessibilityLabel={t('otp.verify_button')}
            activeOpacity={0.8}
          >
            {isVerifying ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.verifyButtonText, { fontFamily: fontFamilyBold, marginLeft: 8 }]}>
                  {t('otp.verifying')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.verifyButtonText, { fontFamily: fontFamilyBold }]}>
                {t('otp.verify_button')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#0F52BA',
    fontWeight: '600',
  },
  header: {
    marginTop: 12,
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0C2340',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#0F52BA',
  },
  inputSection: {
    marginBottom: 'auto',
  },
  otpInput: {
    minHeight: 64,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F52BA',
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 16,
    color: '#0C2340',
  },
  otpInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorBox: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#64748B',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  resendButtonText: {
    fontSize: 15,
    color: '#0F52BA',
    fontWeight: '700',
  },
  verifyButton: {
    minHeight: 56,
    backgroundColor: '#0F52BA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#0F52BA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  verifyButtonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
