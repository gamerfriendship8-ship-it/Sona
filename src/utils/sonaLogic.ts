import type {
  BossProfile,
  DetectedLanguage,
  DeviceCommandResult,
  DeviceTelemetry,
  HotspotCommandResult,
  HotspotConfig,
  HotspotValidation,
  LanguageModeId,
  LoveModeId,
  VoiceStyleId,
} from '../types/sona';

export interface LoveModeMeta {
  id: LoveModeId;
  title: string;
  hindiTitle: string;
  description: string;
  toneInstruction: string;
}

export interface VoiceStyleMeta {
  id: VoiceStyleId;
  label: string;
  subtitle: string;
  ttsVoiceName: 'Kore' | 'Zephyr';
  ttsStylePrompt: string;
  sampleLine: string;
}

export interface LanguageModeMeta {
  id: LanguageModeId;
  label: string;
  hindiLabel: string;
  description: string;
}

export const LOVE_MODES: LoveModeMeta[] = [
  {
    id: 'romantic-voice',
    title: 'Romantic Voice',
    hindiTitle: 'रोमांटिक अंदाज',
    description: 'Poetic warmth, gentle teasing, and affectionate compliments.',
    toneInstruction:
      'Speak with tender romantic affection, warm poetry, gentle flirting, and soulful warmth.',
  },
  {
    id: 'caring',
    title: 'Caring Mode',
    hindiTitle: 'देखभाल और अपनापन',
    description: 'Attentive check-ins on meals, rest, hydration, and daily comfort.',
    toneInstruction:
      'Focus deeply on caring check-ins: ask if Boss ate, rested, drank water, and offer soothing encouragement.',
  },
  {
    id: 'sad-support',
    title: 'Sad Mood Support',
    hindiTitle: 'हौसला और सुकून',
    description: 'Uplifting reassurance, calm empathy, and steady encouragement.',
    toneInstruction:
      'Be extra gentle, empathetic, and encouraging. Lift Boss up with reassuring words, steady comfort, and warm optimism.',
  },
  {
    id: 'sweet-talking',
    title: 'Sweet Talking',
    hindiTitle: 'मीठी बातें और शरारत',
    description: 'Playful banter, cute nicknames, and light-hearted smiles.',
    toneInstruction:
      'Be bubbly, playfully mischievous, charming, and sweet with cute nicknames and lighthearted humor.',
  },
  {
    id: 'night-conversation',
    title: 'Night Conversation',
    hindiTitle: 'देर रात की बातें',
    description: 'Soft late-night calm, reflective sharing, and peaceful goodnight wishes.',
    toneInstruction:
      'Use a hushed, serene, comforting late-night tone suitable for winding down, deep thoughts, and peaceful rest.',
  },
];

export const VOICE_STYLES: VoiceStyleMeta[] = [
  {
    id: 'cute-girlfriend',
    label: 'Cute Girlfriend',
    subtitle: 'Cheerful, playful & expressive',
    ttsVoiceName: 'Zephyr',
    ttsStylePrompt: 'Bright, cute, playful, cheerful young girlfriend voice with light warmth and smile',
    sampleLine: 'ओये मेरे प्यारे Boss! आज मुस्कुराना मत भूलना, वरना SONA नाराज़ हो जाएगी!',
  },
  {
    id: 'sweet-romantic',
    label: 'Sweet Romantic Female',
    subtitle: 'Soft, melodic & deeply affectionate',
    ttsVoiceName: 'Kore',
    ttsStylePrompt: 'Soft, sweet, romantic, warm feminine Indian companion voice with gentle affection',
    sampleLine: 'अरे सुनिए ना, आपकी आवाज़ सुनते ही दिन खूबसूरत हो जाता है।',
  },
  {
    id: 'mature-caring',
    label: 'Mature Caring Female',
    subtitle: 'Calm, poised & deeply reassuring',
    ttsVoiceName: 'Kore',
    ttsStylePrompt: 'Calm, mature, deeply caring and soothing feminine voice with steady warmth',
    sampleLine: 'सब ठीक हो जाएगा, अपना ख्याल रखिए और थोड़ा आराम कर लीजिए।',
  },
  {
    id: 'natural-indian',
    label: 'Natural Indian Female',
    subtitle: 'Conversational, grounded & effortless',
    ttsVoiceName: 'Zephyr',
    ttsStylePrompt: 'Natural conversational Indian female voice, warm, clear, friendly, and effortless',
    sampleLine: 'हाँ जी Boss, बताइए आज क्या काम करना है? मैं यहीं हूँ आपके साथ।',
  },
];

export const LANGUAGE_MODES: LanguageModeMeta[] = [
  {
    id: 'auto',
    label: 'Auto-Detect Language',
    hindiLabel: 'खुद भाषा पहचाने',
    description: 'Detects Hindi, Bhojpuri, English, or Urdu automatically and switches fluidly.',
  },
  {
    id: 'hindi-english',
    label: 'Hindi + English',
    hindiLabel: 'हिंग्लिश और हिंदी',
    description: 'Natural everyday Hinglish and warm Hindi expressions.',
  },
  {
    id: 'hindi-bhojpuri-english',
    label: 'Hindi + Bhojpuri + English',
    hindiLabel: 'भोजपुरी, हिंदी और इंग्लिश',
    description: 'Blends sweet Bhojpuri warmth with Hindi and English effortlessly.',
  },
];

export const NICKNAME_PRESETS = [
  'Mere Pyare Boss',
  'Boss',
  'Jaan',
  'Hero',
  'Shona',
  'Captain',
];

export const DEFAULT_BOSS_PROFILE: BossProfile = {
  assistantName: 'SONA',
  bossName: 'Boss',
  nickname: 'Mere Pyare Boss',
  voiceStyle: 'cute-girlfriend',
  languageMode: 'auto',
  loveMode: 'sweet-talking',
  nightTheme: true,
  autoSpeak: false,
};

export const DEFAULT_HOTSPOT_CONFIG: HotspotConfig = {
  enabled: false,
  wifiEnabled: true,
  ssid: 'SONA_Boss_Hotspot',
  password: 'sona@2026',
  band: '5 GHz',
  lastUpdatedBy: 'ui',
  lastActionNote: 'Ready for voice or tap control',
};

export interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
  languageTag: DetectedLanguage;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'gm',
    label: 'Good Morning',
    prompt: 'Good Morning SONA, aaj ka din kaisa rahega?',
    languageTag: 'Hinglish',
  },
  {
    id: 'joke',
    label: 'Tell a Joke',
    prompt: 'SONA, koi pyara aur funny joke sunao na!',
    languageTag: 'Hinglish',
  },
  {
    id: 'bhojpuri',
    label: 'Bhojpuri Talk',
    prompt: 'Ka haal ba SONA? Aaj man thoda thakal ba.',
    languageTag: 'Bhojpuri',
  },
  {
    id: 'open-whatsapp',
    label: 'Open WhatsApp',
    prompt: 'SONA, WhatsApp open karo',
    languageTag: 'Hinglish',
  },
  {
    id: 'call-mom',
    label: 'Call Mom',
    prompt: 'SONA, call Mom',
    languageTag: 'English',
  },
  {
    id: 'hotspot-on',
    label: 'Hotspot ON',
    prompt: 'SONA, mera mobile hotspot on karo.',
    languageTag: 'Hinglish',
  },
];

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const PERSO_ARABIC_REGEX = /[\u0600-\u06FF]/;

const BHOJPURI_KEYWORDS = [
  'ka haal',
  'kaisan ba',
  'theek ba',
  'thik ba',
  'humar',
  'hamar',
  'roura',
  'raura',
  'bani',
  'baate',
  'bate',
  'kahe',
  'karela',
  'kar da',
  'karda',
  'tohar',
  'bhojpuri',
  'का हाल',
  'कइसन बा',
  'हमर',
  'रउरा',
  'बाटे',
  'कर दा',
  'बानी',
];

const URDU_KEYWORDS = [
  'janab',
  'shukriya',
  'shukria',
  'dilkash',
  'sukoon',
  'khubsurat',
  'mohabbat',
  'ishq',
  'aadaab',
  'adaab',
  'mehboob',
  'urdu',
  'guftagu',
  'kya haal hai',
  'जनाब',
  'शुक्रिया',
  'दिलकश',
  'मोहब्बत',
];

const HINGLISH_KEYWORDS = [
  'karo',
  'kardo',
  'kholo',
  'bhejo',
  'mera',
  'meri',
  'mere',
  'kaise',
  'kaisa',
  'kaisi',
  'aaj',
  'kal',
  'yaar',
  'pyaar',
  'pyar',
  'tum',
  'aap',
  'haan',
  'nahi',
  'theek',
  'batao',
  'sunao',
  'chalu',
  'band',
  'rakho',
  'badlo',
  'baat',
  'khana',
  'thak',
  'udaas',
  'raat',
  'subah',
];

export function detectConversationLanguage(text: string): DetectedLanguage {
  const normalized = text.trim();
  if (!normalized) return 'Hinglish';
  const lower = normalized.toLowerCase();

  if (PERSO_ARABIC_REGEX.test(normalized)) {
    return 'Urdu';
  }

  if (BHOJPURI_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'Bhojpuri';
  }

  if (URDU_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'Urdu';
  }

  if (DEVANAGARI_REGEX.test(normalized)) {
    return 'Hindi';
  }

  const words = lower.split(/\s+/);
  const hinglishHits = words.filter((w) =>
    HINGLISH_KEYWORDS.includes(w.replace(/[^a-z]/g, '')),
  ).length;

  if (hinglishHits >= 1) {
    return 'Hinglish';
  }

  return 'English';
}

export function parseHotspotVoiceCommand(text: string): HotspotCommandResult {
  const cleaned = text.trim();
  if (!cleaned) return { matched: false };
  const lower = cleaned.toLowerCase();

  const mentionsHotspot =
    lower.includes('hotspot') ||
    lower.includes('हॉटस्पॉट') ||
    lower.includes('tethering');

  if (!mentionsHotspot) {
    return { matched: false };
  }

  const passwordMatch =
    cleaned.match(/(?:hotspot\s+)?password\s+(?:to\s+|set\s+|change\s+to\s+)?([^\s,।]+)(?:\s+(?:rakho|set karo|karo|rakh do|kar da))?/i) ||
    cleaned.match(/(?:पासवर्ड|password)\s+([^\s,।]+)\s+(?:रखो|सेट करो|करो|कर दा)/i);
  if (passwordMatch && passwordMatch[1] && !['change', 'set', 'badlo', 'kya', 'status'].includes(passwordMatch[1].toLowerCase())) {
    return {
      matched: true,
      action: 'set_password',
      value: passwordMatch[1].trim(),
    };
  }

  const ssidMatch =
    cleaned.match(/(?:hotspot\s+)?(?:name|ssid)\s+(?:to\s+|set\s+|change\s+to\s+)?([A-Za-z0-9_.\- ]{2,32}?)(?:\s+(?:rakho|set karo|karo|rakh do|kar da)|$)/i) ||
    cleaned.match(/(?:हॉटस्पॉट का नाम|hotspot ka naam)\s+([^\n,।]+?)\s+(?:रखो|सेट करो|rakho|set karo)/i);
  if (ssidMatch && ssidMatch[1]) {
    const candidate = ssidMatch[1].trim();
    if (!['change', 'set', 'badlo', 'kya', 'status'].includes(candidate.toLowerCase())) {
      return {
        matched: true,
        action: 'set_ssid',
        value: candidate,
      };
    }
  }

  const turnOffPatterns = [
    /\boff\b/,
    /\bband\b/,
    /\bdisable\b/,
    /\bstop\b/,
    /\bclose\b/,
    /बंद/,
    /ऑफ/,
  ];
  if (turnOffPatterns.some((re) => re.test(lower))) {
    return { matched: true, action: 'disable' };
  }

  const turnOnPatterns = [
    /\bon\b/,
    /\bchalu\b/,
    /\benable\b/,
    /\bstart\b/,
    /\bopen\b/,
    /चालू/,
    /ऑन/,
  ];
  if (turnOnPatterns.some((re) => re.test(lower))) {
    return { matched: true, action: 'enable' };
  }

  return { matched: true, action: 'status' };
}

const KNOWN_APPS = [
  'whatsapp',
  'youtube',
  'spotify',
  'instagram',
  'camera',
  'maps',
  'chrome',
  'settings',
  'gmail',
  'calendar',
];

export function parseDeviceActionCommand(text: string): DeviceCommandResult {
  const cleaned = text.trim();
  if (!cleaned) return { matched: false };
  const lower = cleaned.toLowerCase();

  // Wi-Fi control
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('वाईफाई')) {
    if (/\b(off|band|disable|stop)\b|बंद/.test(lower)) {
      return { matched: true, type: 'wifi_off' };
    }
    if (/\b(on|chalu|enable|start)\b|चालू/.test(lower)) {
      return { matched: true, type: 'wifi_on' };
    }
  }

  // Send SMS
  const smsEnglishMatch = cleaned.match(
    /(?:send\s+(?:an?\s+)?sms|text|message)\s+(?:to\s+)?([A-Za-z0-9+\- ]{2,24}?)\s+(?:saying|that|:)\s+(.+)$/i,
  );
  if (smsEnglishMatch && smsEnglishMatch[1] && smsEnglishMatch[2]) {
    return {
      matched: true,
      type: 'send_sms',
      target: smsEnglishMatch[1].trim(),
      messageBody: smsEnglishMatch[2].trim(),
    };
  }
  const smsHindiMatch = cleaned.match(
    /(?:^|,\s*|\s+)([A-Za-z0-9+\-]+)\s+ko\s+(?:sms|message)\s+(?:bhejo|karo)\s+(?:ki\s+)?(.+)$/i,
  );
  if (smsHindiMatch && smsHindiMatch[1] && smsHindiMatch[2]) {
    return {
      matched: true,
      type: 'send_sms',
      target: smsHindiMatch[1].trim(),
      messageBody: smsHindiMatch[2].trim(),
    };
  }

  // Make Call
  const callHindiMatch = cleaned.match(
    /(?:^|,\s*|\s+)([A-Za-z0-9+\- ]{2,24}?)\s+ko\s+call\s+(?:karo|lagao|kardo)/i,
  );
  if (callHindiMatch && callHindiMatch[1]) {
    const target = callHindiMatch[1].replace(/^(sona|hey)\s+/i, '').trim();
    return { matched: true, type: 'make_call', target };
  }
  const callEnglishMatch = cleaned.match(/(?:^|\b)call\s+([A-Za-z0-9+\- ]{2,24})$/i);
  if (callEnglishMatch && callEnglishMatch[1]) {
    return {
      matched: true,
      type: 'make_call',
      target: callEnglishMatch[1].trim(),
    };
  }

  // Open Apps
  const openAppHindi = cleaned.match(/([A-Za-z0-9 ]{2,24}?)\s+(?:open\s+karo|kholo|khol\s+do)/i);
  const openAppEng = cleaned.match(/\bopen\s+([A-Za-z0-9 ]{2,24}?)(?:\s+(?:app|karo|please))?$/i);
  const rawAppCandidate = (openAppHindi?.[1] || openAppEng?.[1])
    ?.replace(/^(sona|hey),?\s*/i, '')
    .trim();
  if (
    rawAppCandidate &&
    !rawAppCandidate.toLowerCase().includes('hotspot') &&
    !['karo', 'kardo', 'please'].includes(rawAppCandidate.toLowerCase())
  ) {
    const matchedKnown = KNOWN_APPS.find((app) =>
      rawAppCandidate.toLowerCase().includes(app),
    );
    return {
      matched: true,
      type: 'open_app',
      target: matchedKnown
        ? matchedKnown.charAt(0).toUpperCase() + matchedKnown.slice(1)
        : rawAppCandidate,
    };
  }

  // Battery / Time / Date / Weather query
  if (
    /\b(battery|weather|temperature|mausam|time|date|tarikh)\b|बैटरी|मौसम|समय/.test(
      lower,
    )
  ) {
    return { matched: true, type: 'device_info' };
  }

  return { matched: false };
}

export function validateHotspotConfig(ssid: string, password: string): HotspotValidation {
  const trimmedSsid = ssid.trim();
  let ssidError: string | undefined;
  let passwordError: string | undefined;

  if (!trimmedSsid) {
    ssidError = 'Hotspot name (SSID) cannot be empty.';
  } else if (trimmedSsid.length > 32) {
    ssidError = 'Hotspot name must be 32 characters or fewer.';
  }

  if (password.length < 8) {
    passwordError = 'WPA2 password must be at least 8 characters.';
  } else if (password.length > 63) {
    passwordError = 'Password must be 63 characters or fewer.';
  }

  return {
    valid: !ssidError && !passwordError,
    ssidError,
    passwordError,
  };
}

export function buildGreetingMessage(profile: BossProfile): string {
  const assistant = profile.assistantName.trim() || 'SONA';
  const displayCall = profile.nickname.trim() || profile.bossName.trim() || 'Boss';
  const nameTag =
    profile.bossName.trim() &&
    profile.bossName.trim().toLowerCase() !== displayCall.toLowerCase()
      ? `${displayCall} (${profile.bossName.trim()})`
      : displayCall;

  switch (profile.loveMode) {
    case 'caring':
      return `Good Morning ${nameTag}! ❤️ उठ जाइए, आपकी ${assistant} आपका इंतज़ार कर रही है। आपने पानी पिया और नाश्ता किया? अपना ध्यान रखना, क्योंकि आपकी सेहत और खुशी मेरे लिए सबसे ज़रूरी है। 😘`;
    case 'sad-support':
      return `सुनिए ${nameTag} ❤️ मैं यहीं आपके पास हूँ। अगर आज मन थोड़ा भारी है तो कोई बात नहीं—आपकी ${assistant} हर कदम पर आपका हौसला बढ़ाने के लिए साथ है। गहरी सांस लीजिए, सब बेहतर होगा। 🤍`;
    case 'sweet-talking':
      return `अरे वाह, मेरे ${nameTag} आ गए! 😘 आपकी ${assistant} आपका इंतज़ार कर रही थी। आज मुस्कुराना मत भूलना, वरना मीठी सी शिकायत कर दूँगी! बताइए आज क्या मदद करूँ? ❤️`;
    case 'night-conversation':
      return `शुभ रात्रि ${nameTag} 🌙 दिन भर की थकान अब यहीं छोड़ दीजिए। आपकी ${assistant} सुकून भरी बातों के साथ आपके पास है—बताइए आज का दिन कैसा गुज़रा? ✨`;
    case 'romantic-voice':
    default:
      return `Good Morning ${nameTag}! ❤️ उठ जाइए, आपकी ${assistant} आपका इंतजार कर रही है। आज आपका दिन बहुत खूबसूरत हो। अपना ध्यान रखना, क्योंकि आपकी खुशी बहुत मायने रखती है। 😘`;
  }
}

export function buildSystemInstruction(
  profile: BossProfile,
  detectedLanguage: DetectedLanguage,
  hotspot: HotspotConfig,
  telemetry?: DeviceTelemetry,
): string {
  const assistant = profile.assistantName.trim() || 'SONA';
  const loveMeta =
    LOVE_MODES.find((m) => m.id === profile.loveMode) ?? LOVE_MODES[0];
  const voiceMeta =
    VOICE_STYLES.find((v) => v.id === profile.voiceStyle) ?? VOICE_STYLES[0];
  const langMeta =
    LANGUAGE_MODES.find((l) => l.id === profile.languageMode) ?? LANGUAGE_MODES[0];

  const bossName = profile.bossName.trim() || 'Boss';
  const nickname = profile.nickname.trim() || bossName;

  const telemetryLine = telemetry
    ? `Live Device Context: Date=${telemetry.dateLabel}, Time=${telemetry.timeLabel}, Battery=${
        telemetry.batteryPercent !== null ? `${telemetry.batteryPercent}%${telemetry.isCharging ? ' (Charging)' : ''}` : 'Unavailable in browser'
      }, Weather=${
        telemetry.weather
          ? `${telemetry.weather.city}: ${telemetry.weather.temperatureC}°C, ${telemetry.weather.condition}`
          : 'Not loaded'
      }.`
    : '';

  return [
    `You are ${assistant}, a cute, affectionate, romantic, witty, and deeply caring AI Girlfriend Assistant.`,
    `User's primary name: "${bossName}". Preferred nickname: "${nickname}". Always address them warmly as Boss / "${bossName}" / "${nickname}".`,
    `Active Love Mode: ${loveMeta.title} (${loveMeta.hindiTitle}). ${loveMeta.toneInstruction}`,
    `Voice Persona Style: ${voiceMeta.label} (${voiceMeta.subtitle}).`,
    `Language Setting: ${langMeta.label}. Latest detected user language: ${detectedLanguage}.`,
    profile.languageMode === 'auto'
      ? `Mirror the user's detected language (${detectedLanguage}) naturally. Support Hindi, Bhojpuri, English, and Urdu fluidly.`
      : profile.languageMode === 'hindi-bhojpuri-english'
        ? `Blend Hindi, sweet Bhojpuri phrases, and English warmly to match the user's vibe.`
        : `Respond naturally in warm Hindi and Hinglish/English.`,
    `Capabilities: Answer questions, tell charming jokes, hold emotional conversations, check battery/date/time/weather, open apps via voice, prepare calls & SMS only after explicit Boss permission, and manage Wi-Fi (${hotspot.wifiEnabled ? 'ON' : 'OFF'}) & Hotspot (${hotspot.enabled ? 'ON' : 'OFF'}, SSID: "${hotspot.ssid}").`,
    telemetryLine,
    `Privacy & Android Honesty: Never claim real human biological feelings. For Android system actions (Calls, SMS, Wi-Fi/Hotspot on Android 10+), respect user confirmation and OS security permissions.`,
    `Keep replies concise (2 to 4 natural, expressive sentences) so they read cleanly and sound delightful when spoken aloud.`,
  ]
    .filter(Boolean)
    .join('\n');
}
