import React, { useState } from 'react';
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
import { validateIndianPhoneNumber } from '../../utils/validation';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamily, fontFamilyBold } = useLanguage();
  const { sendOtp } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTextChange = (text: string) => {
    // Keep only digits
    const digitsOnly = text.replace(/[^\d]/g, '');
    if (digitsOnly.length <= 10) {
      setPhoneNumber(digitsOnly);
      if (errorMessage) {
        setErrorMessage(null);
      }
    }
  };

  const handleSendOtp = async () => {
    const { isValid, e164Format, errorMessageKey } = validateIndianPhoneNumber(phoneNumber);

    if (!isValid) {
      setErrorMessage(errorMessageKey ? t(errorMessageKey) : t('phone.error_invalid'));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await sendOtp(e164Format);
      setIsLoading(false);
      router.push('/(auth)/otp' as any);
    } catch (err: any) {
      setIsLoading(false);
      console.warn('[PhoneScreen] Send OTP error:', err);
      if (err.code === 'auth/too-many-requests') {
        setErrorMessage(t('otp.error_too_many_attempts'));
      } else if (err.code === 'auth/invalid-phone-number') {
        setErrorMessage(t('phone.error_invalid'));
      } else {
        setErrorMessage(err.message || t('otp.error_generic'));
      }
    }
  };

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
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Text style={[styles.backButtonText, { fontFamily }]}>
              ← {t('common.back')}
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
              {t('phone.title')}
            </Text>
            <Text style={[styles.subtitle, { fontFamily }]}>
              {t('phone.subtitle')}
            </Text>
          </View>

          {/* Phone Input Box */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { fontFamily: fontFamilyBold }]}>
              {t('phone.label')}
            </Text>

            <View style={[styles.inputRow, errorMessage ? styles.inputRowError : null]}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>

              <TextInput
                style={styles.textInput}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                placeholder={t('phone.placeholder')}
                placeholderTextColor="#94A3B8"
                value={phoneNumber}
                onChangeText={handleTextChange}
                maxLength={10}
                editable={!isLoading}
                autoFocus
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontFamily }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (phoneNumber.length < 10 || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSendOtp}
            disabled={phoneNumber.length < 10 || isLoading}
            accessibilityRole="button"
            accessibilityLabel={t('phone.send_otp')}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.submitButtonText, { fontFamily: fontFamilyBold, marginLeft: 8 }]}>
                  {t('phone.sending')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.submitButtonText, { fontFamily: fontFamilyBold }]}>
                {t('phone.send_otp')}
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
    marginBottom: 24,
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
  inputContainer: {
    marginBottom: 'auto',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  inputRowError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C2340',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2340',
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  errorBox: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
