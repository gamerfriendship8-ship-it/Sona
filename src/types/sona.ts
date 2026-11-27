export type NavTab = 'companion' | 'hotspot' | 'voice' | 'profile' | 'android';

export type LoveModeId =
  | 'romantic-voice'
  | 'caring'
  | 'sad-support'
  | 'sweet-talking'
  | 'night-conversation';

export type VoiceStyleId =
  | 'sweet-romantic'
  | 'cute-girlfriend'
  | 'mature-caring'
  | 'natural-indian';

export type LanguageModeId =
  | 'auto'
  | 'hindi-english'
  | 'hindi-bhojpuri-english';

export type DetectedLanguage =
  | 'Hindi'
  | 'Bhojpuri'
  | 'Urdu'
  | 'Hinglish'
  | 'English';

export interface BossProfile {
  assistantName: string;
  bossName: string;
  nickname: string;
  voiceStyle: VoiceStyleId;
  languageMode: LanguageModeId;
  loveMode: LoveModeId;
  nightTheme: boolean;
  autoSpeak: boolean;
}

export interface HotspotConfig {
  enabled: boolean;
  wifiEnabled: boolean;
  ssid: string;
  password: string;
  band: '2.4 GHz' | '5 GHz';
  lastUpdatedBy: 'ui' | 'voice';
  lastActionNote: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'sona';
  text: string;
  timestamp: string;
  detectedLanguage?: DetectedLanguage;
  loveMode?: LoveModeId;
  hotspotEffect?: string;
}

export interface HotspotCommandResult {
  matched: boolean;
  action?: 'enable' | 'disable' | 'set_ssid' | 'set_password' | 'status';
  value?: string;
}

export interface DeviceCommandResult {
  matched: boolean;
  type?: 'open_app' | 'make_call' | 'send_sms' | 'wifi_on' | 'wifi_off' | 'device_info';
  target?: string;
  messageBody?: string;
}

export interface PendingPermissionAction {
  type: 'make_call' | 'send_sms';
  target: string;
  messageBody?: string;
}

export interface WeatherInfo {
  city: string;
  temperatureC: number;
  condition: string;
  windKph: number;
}

export interface DeviceTelemetry {
  batteryPercent: number | null;
  isCharging: boolean | null;
  dateLabel: string;
  timeLabel: string;
  weather: WeatherInfo | null;
}

export interface HotspotValidation {
  valid: boolean;
  ssidError?: string;
  passwordError?: string;
}

export interface AndroidProjectFile {
  path: string;
  content: string;
}
