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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SupportedLanguage } from '../../i18n';

export const CURRENT_CONSENT_VERSION = 'v1.0';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language, changeLanguage, fontFamily, fontFamilyBold } = useLanguage();
  const { completeRegistration } = useAuth();

  const [name, setName] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!hasConsented) {
      setErrorMessage(t('register.error_consent_required'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await completeRegistration(name, CURRENT_CONSENT_VERSION);
      setIsSubmitting(false);
      router.replace('/(app)' as any);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || t('common.error'));
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontFamilyBold }]}>
              {t('register.title')}
            </Text>
            <Text style={[styles.subtitle, { fontFamily }]}>
              {t('register.subtitle')}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Optional Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { fontFamily: fontFamilyBold }]}>
                {t('register.name_label')}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('register.name_placeholder')}
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                maxLength={50}
                editable={!isSubmitting}
              />
            </View>

            {/* Language Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { fontFamily: fontFamilyBold }]}>
                {t('register.language_label')}
              </Text>
              <View style={styles.langRow}>
                {(['en', 'te', 'hi'] as SupportedLanguage[]).map((langKey) => (
                  <TouchableOpacity
                    key={langKey}
                    style={[
                      styles.langChip,
                      language === langKey && styles.langChipActive,
                    ]}
                    onPress={() => changeLanguage(langKey)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        language === langKey && styles.langChipTextActive,
                      ]}
                    >
                      {langKey === 'en' ? 'English' : langKey === 'te' ? 'తెలుగు' : 'हिन्दी'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Consent Checkbox */}
            <View style={styles.consentContainer}>
              <TouchableOpacity
                style={styles.checkboxTouchable}
                onPress={() => {
                  setHasConsented(!hasConsented);
                  if (errorMessage) setErrorMessage(null);
                }}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasConsented }}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    hasConsented && styles.checkboxBoxChecked,
                  ]}
                >
                  {hasConsented && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.consentText, { fontFamily }]}>
                  {t('register.consent_text')}{' '}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowPolicyModal(true)}
                style={styles.policyLinkButton}
              >
                <Text style={[styles.policyLinkText, { fontFamily: fontFamilyBold }]}>
                  {t('register.privacy_policy')}
                </Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontFamily }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!hasConsented || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!hasConsented || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={t('register.submit')}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.submitButtonText, { fontFamily: fontFamilyBold, marginLeft: 8 }]}>
                  {t('register.submitting')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.submitButtonText, { fontFamily: fontFamilyBold }]}>
                {t('register.submit')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPolicyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: fontFamilyBold }]}>
              {t('register.privacy_policy_title')}
            </Text>
            <ScrollView style={styles.modalScrollView}>
              <Text style={[styles.modalBodyText, { fontFamily }]}>
                {t('register.privacy_policy_body')}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPolicyModal(false)}
              accessibilityRole="button"
            >
              <Text style={[styles.modalCloseButtonText, { fontFamily: fontFamilyBold }]}>
                {t('register.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
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
  formContainer: {
    marginBottom: 'auto',
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0C2340',
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langChip: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipActive: {
    backgroundColor: '#0F52BA',
    borderColor: '#0F52BA',
  },
  langChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  langChipTextActive: {
    color: '#FFFFFF',
  },
  consentContainer: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkboxTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#0F52BA',
    borderColor: '#0F52BA',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  policyLinkButton: {
    marginTop: 4,
    marginLeft: 34,
    paddingVertical: 2,
  },
  policyLinkText: {
    fontSize: 13,
    color: '#0F52BA',
    textDecorationLine: 'underline',
  },
  errorBox: {
    marginTop: 4,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C2340',
    marginBottom: 12,
  },
  modalScrollView: {
    marginVertical: 10,
  },
  modalBodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: '#0F52BA',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
