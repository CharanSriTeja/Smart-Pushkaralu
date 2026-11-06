import { LocalizedString } from '../types/ghats.js';
import { DraftTranslationRequest, DraftTranslationResult, SupportedLanguage } from '../types/news.js';

/**
 * Glossary of key domain terms for Godavari Pushkaralu
 */
const GLOSSARY: Record<string, { te: string; hi: string }> = {
  'godavari pushkaralu': { te: 'గోదావరి పుష్కరాలు', hi: 'गोदावरी पुष्करालु' },
  'godavari river': { te: 'గోదావరి నది', hi: 'गोदावरी नदी' },
  'pushkar ghat': { te: 'పుష్కర ఘాట్', hi: 'पुष्कर घाट' },
  'ghat': { te: 'ఘాట్', hi: 'घाट' },
  'bathing ghat': { te: 'స్నాన ఘాట్', hi: 'स्नान घाट' },
  'kotilingala ghat': { te: 'కోటిలింగాల ఘాట్', hi: 'कोटालिंगाला घाट' },
  'vip ghat': { te: 'విఐపి ఘాట్', hi: 'वीआईपी घाट' },
  'saraswathi ghat': { te: 'సరస్వతి ఘాట్', hi: 'सरस्वती घाट' },
  'water level': { te: 'నీటి మట్టం', hi: 'जल स्तर' },
  'danger mark': { te: 'ప్రమాద స్థాయి', hi: 'खतरे का निशान' },
  'bathing prohibited': { te: 'స్నానం నిషేధించబడింది', hi: 'स्नान प्रतिबंधित है' },
  'bathing allowed': { te: 'స్నానం అనుమతించబడింది', hi: 'स्नान की अनुमति है' },
  'medical camp': { te: 'వైద్య శిబిరం', hi: 'चिकित्सा शिविर' },
  'drinking water': { te: 'తాగునీరు', hi: 'पेयजल' },
  'police post': { te: 'పోలీస్ పోస్ట్', hi: 'पुलिस चौकी' },
  'changing rooms': { te: 'దుస్తులు మార్చుకునే గదులు', hi: 'वस्त्र बदलने के कक्ष' },
  'traffic diversion': { te: 'ట్రాఫిక్ మళ్లింపు', hi: 'यातायात डायवर्जन' },
  'parking area': { te: 'పార్కింగ్ ప్రదేశం', hi: 'पार्किंग क्षेत्र' },
  'advisory': { te: 'ముందస్తు హెచ్చరిక', hi: 'परामर्श' },
  'urgent': { te: 'అత్యవసరం', hi: 'अति आवश्यक' },
  'safety notice': { te: 'భద్రతా సూచన', hi: 'सुरक्षा सूचना' },
  'free prasad': { te: 'ఉచిత ప్రసాదం', hi: 'मुफ्त प्रसाद' },
  'holy dip': { te: 'పుణ్యస్నానం', hi: 'पवित्र स्नान' },
  'district administration': { te: 'జిల్లా యంత్రాంగం', hi: 'जिला प्रशासन' },
  'police advisory': { te: 'పోలీసు సలహా', hi: 'पुलिस सलाह' },
};

export class TranslationService {
  /**
   * Generates a draft translation for the admin editor.
   * NOTE: The administrative workflow strictly requires the admin to review
   * and confirm or edit all translated fields before saving to the database.
   */
  static generateDraft(req: DraftTranslationRequest): DraftTranslationResult {
    const sourceLang: SupportedLanguage = req.sourceLang || 'en';

    return {
      sourceLang,
      title: req.title ? this.translateText(req.title, sourceLang) : undefined,
      content: req.content ? this.translateText(req.content, sourceLang) : undefined,
      summary: req.summary ? this.translateText(req.summary, sourceLang) : undefined,
    };
  }

  /**
   * Translates a string using terminology mapping and phrase synthesis
   */
  private static translateText(text: string, sourceLang: SupportedLanguage): LocalizedString {
    const trimmed = text.trim();
    if (!trimmed) {
      return { en: '', te: '', hi: '' };
    }

    if (sourceLang === 'te') {
      return {
        te: trimmed,
        en: trimmed, // admin will review
        hi: trimmed,
      };
    }

    if (sourceLang === 'hi') {
      return {
        hi: trimmed,
        en: trimmed,
        te: trimmed,
      };
    }

    // Default source is English
    let teResult = trimmed;
    let hiResult = trimmed;

    // Apply known domain terminology substitutions
    for (const [phrase, trans] of Object.entries(GLOSSARY)) {
      const reg = new RegExp(`\\b${phrase}\\b`, 'gi');
      teResult = teResult.replace(reg, trans.te);
      hiResult = hiResult.replace(reg, trans.hi);
    }

    // Common action prefixes
    if (trimmed.toLowerCase().startsWith('urgent:')) {
      teResult = 'అత్యవసరం: ' + teResult.replace(/^urgent:\s*/i, '');
      hiResult = 'अति आवश्यक: ' + hiResult.replace(/^urgent:\s*/i, '');
    } else if (trimmed.toLowerCase().startsWith('advisory:')) {
      teResult = 'సలహా: ' + teResult.replace(/^advisory:\s*/i, '');
      hiResult = 'परामर्श: ' + hiResult.replace(/^advisory:\s*/i, '');
    } else if (trimmed.toLowerCase().startsWith('notice:')) {
      teResult = 'గమనిక: ' + teResult.replace(/^notice:\s*/i, '');
      hiResult = 'सूचना: ' + hiResult.replace(/^notice:\s*/i, '');
    }

    // Pushkaralu contextual phrase translations
    if (/high crowd/i.test(trimmed)) {
      teResult = teResult.replace(/high crowd/gi, 'అధిక రద్దీ');
      hiResult = hiResult.replace(/high crowd/gi, 'अत्यधिक भीड़');
    }
    if (/heavy rain/i.test(trimmed)) {
      teResult = teResult.replace(/heavy rain/gi, 'భారీ వర్షం');
      hiResult = hiResult.replace(/heavy rain/gi, 'भारी वर्षा');
    }
    if (/operational/i.test(trimmed)) {
      teResult = teResult.replace(/operational/gi, 'అందుబాటులో ఉంది');
      hiResult = hiResult.replace(/operational/gi, 'चालू है');
    }

    return {
      en: trimmed,
      te: teResult,
      hi: hiResult,
    };
  }
}

