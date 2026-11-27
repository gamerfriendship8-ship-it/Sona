import { useCallback, useEffect, useRef, useState } from 'react';
import { AndroidBuildPanel } from './components/AndroidBuildPanel';
import { CompanionWorkspace } from './components/CompanionWorkspace';
import { HeaderNav } from './components/HeaderNav';
import { HotspotPanel } from './components/HotspotPanel';
import { PermissionConfirmModal } from './components/PermissionConfirmModal';
import { ProfilePanel } from './components/ProfilePanel';
import { VoiceLanguagePanel } from './components/VoiceLanguagePanel';
import type {
  BossProfile,
  ChatMessage,
  DeviceCommandResult,
  DeviceTelemetry,
  HotspotCommandResult,
  HotspotConfig,
  LoveModeId,
  NavTab,
  PendingPermissionAction,
  VoiceStyleId,
  WeatherInfo,
} from './types/sona';
import {
  buildGreetingMessage,
  DEFAULT_BOSS_PROFILE,
  DEFAULT_HOTSPOT_CONFIG,
  detectConversationLanguage,
  parseDeviceActionCommand,
  parseHotspotVoiceCommand,
  validateHotspotConfig,
} from './utils/sonaLogic';

const PROFILE_STORAGE_KEY = 'sona2_boss_profile_v2';
const HOTSPOT_STORAGE_KEY = 'sona2_hotspot_config_v2';
const CHAT_STORAGE_KEY = 'sona2_chat_history_v2';

function formatNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateNow(): string {
  return new Date().toLocaleDateString([], {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function loadStoredProfile(): BossProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_BOSS_PROFILE;
    return { ...DEFAULT_BOSS_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BOSS_PROFILE;
  }
}

function loadStoredHotspot(): HotspotConfig {
  try {
    const raw = localStorage.getItem(HOTSPOT_STORAGE_KEY);
    if (!raw) return DEFAULT_HOTSPOT_CONFIG;
    return { ...DEFAULT_HOTSPOT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_HOTSPOT_CONFIG;
  }
}

function loadStoredMessages(initialProfile: BossProfile): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return [
    {
      id: 'welcome-1',
      role: 'sona',
      text: buildGreetingMessage(initialProfile),
      timestamp: formatNow(),
      detectedLanguage: 'Hindi',
      loveMode: initialProfile.loveMode,
    },
  ];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('companion');
  const [profile, setProfile] = useState<BossProfile>(loadStoredProfile);
  const [hotspot, setHotspot] = useState<HotspotConfig>(loadStoredHotspot);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadStoredMessages(loadStoredProfile()),
  );

  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    batteryPercent: null,
    isCharging: null,
    dateLabel: formatDateNow(),
    timeLabel: formatNow(),
    weather: null,
  });

  const [pendingAction, setPendingAction] =
    useState<PendingPermissionAction | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [ttsQuotaReached, setTtsQuotaReached] = useState(false);
  const [ttsQuotaNotice, setTtsQuotaNotice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<Map<string, string>>(new Map());

  const fetchWeather = useCallback(async (city: string) => {
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) return;
      const data = (await res.json()) as WeatherInfo;
      setTelemetry((prev) => ({ ...prev, weather: data }));
    } catch {
      // Ignore weather network errors on startup
    }
  }, []);

  useEffect(() => {
    void fetchWeather('Mumbai');

    const clockInterval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        dateLabel: formatDateNow(),
        timeLabel: formatNow(),
      }));
    }, 30_000);

    type BatteryManagerLike = {
      level: number;
      charging: boolean;
      addEventListener: (ev: string, fn: () => void) => void;
      removeEventListener: (ev: string, fn: () => void) => void;
    };
    const navWithBattery = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerLike>;
    };

    let batteryObj: BatteryManagerLike | null = null;
    const syncBattery = () => {
      if (!batteryObj) return;
      setTelemetry((prev) => ({
        ...prev,
        batteryPercent: Math.round(batteryObj!.level * 100),
        isCharging: batteryObj!.charging,
      }));
    };

    if (navWithBattery.getBattery) {
      navWithBattery
        .getBattery()
        .then((bat) => {
          batteryObj = bat;
          syncBattery();
          bat.addEventListener('levelchange', syncBattery);
          bat.addEventListener('chargingchange', syncBattery);
        })
        .catch(() => {
          // Battery API unavailable
        });
    }

    return () => {
      clearInterval(clockInterval);
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', syncBattery);
        batteryObj.removeEventListener('chargingchange', syncBattery);
      }
    };
  }, [fetchWeather]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
    const useDark =
      profile.nightTheme || profile.loveMode === 'night-conversation';
    document.documentElement.classList.toggle('dark', useDark);
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(HOTSPOT_STORAGE_KEY, JSON.stringify(hotspot));
    } catch {
      // Ignore storage quota errors
    }
  }, [hotspot]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  const applyHotspotCommand = (cmd: HotspotCommandResult): string | undefined => {
    if (!cmd.matched) return undefined;

    if (cmd.action === 'enable') {
      setHotspot((prev) => ({
        ...prev,
        enabled: true,
        lastUpdatedBy: 'voice',
        lastActionNote: 'Hotspot turned ON via voice command',
      }));
      return 'Hotspot turned ON';
    }
    if (cmd.action === 'disable') {
      setHotspot((prev) => ({
        ...prev,
        enabled: false,
        lastUpdatedBy: 'voice',
        lastActionNote: 'Hotspot turned OFF via voice command',
      }));
      return 'Hotspot turned OFF';
    }
    if (cmd.action === 'set_ssid' && cmd.value) {
      const check = validateHotspotConfig(cmd.value, hotspot.password);
      if (check.valid) {
        setHotspot((prev) => ({
          ...prev,
          ssid: cmd.value!,
          lastUpdatedBy: 'voice',
          lastActionNote: `SSID updated to ${cmd.value}`,
        }));
        return `Hotspot name set to ${cmd.value}`;
      }
      return check.ssidError;
    }
    if (cmd.action === 'set_password' && cmd.value) {
      const check = validateHotspotConfig(hotspot.ssid, cmd.value);
      if (check.valid) {
        setHotspot((prev) => ({
          ...prev,
          password: cmd.value!,
          lastUpdatedBy: 'voice',
          lastActionNote: 'Password updated via voice command',
        }));
        return 'Hotspot password updated';
      }
      return check.passwordError;
    }
    return `Hotspot is currently ${hotspot.enabled ? 'ON' : 'OFF'} (${hotspot.ssid})`;
  };

  const applyDeviceCommand = (cmd: DeviceCommandResult): string | undefined => {
    if (!cmd.matched) return undefined;

    if (cmd.type === 'wifi_on') {
      setHotspot((prev) => ({
        ...prev,
        wifiEnabled: true,
        lastUpdatedBy: 'voice',
        lastActionNote: 'Wi-Fi turned ON via voice command',
      }));
      return 'Wi-Fi turned ON';
    }
    if (cmd.type === 'wifi_off') {
      setHotspot((prev) => ({
        ...prev,
        wifiEnabled: false,
        lastUpdatedBy: 'voice',
        lastActionNote: 'Wi-Fi turned OFF via voice command',
      }));
      return 'Wi-Fi turned OFF';
    }
    if (cmd.type === 'open_app' && cmd.target) {
      return `App Launch Prepared: ${cmd.target} (Android Intent ready)`;
    }
    if (cmd.type === 'make_call' && cmd.target) {
      setPendingAction({ type: 'make_call', target: cmd.target });
      return `Awaiting Boss permission to call ${cmd.target}`;
    }
    if (cmd.type === 'send_sms' && cmd.target) {
      setPendingAction({
        type: 'send_sms',
        target: cmd.target,
        messageBody: cmd.messageBody || '',
      });
      return `Awaiting Boss permission to send SMS to ${cmd.target}`;
    }
    if (cmd.type === 'device_info') {
      const w = telemetry.weather
        ? `${telemetry.weather.city} ${telemetry.weather.temperatureC}°C`
        : 'Weather ready';
      return `${telemetry.dateLabel} · ${telemetry.timeLabel} · ${w}`;
    }
    return undefined;
  };

  const speakWithBrowserFallback = (
    messageId: string,
    text: string,
    voiceStyle: VoiceStyleId,
  ): boolean => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      utterance.lang = hasDevanagari ? 'hi-IN' : 'en-IN';
      utterance.pitch =
        voiceStyle === 'cute-girlfriend'
          ? 1.18
          : voiceStyle === 'sweet-romantic'
            ? 1.1
            : voiceStyle === 'mature-caring'
              ? 1.0
              : 1.06;
      utterance.rate = voiceStyle === 'cute-girlfriend' ? 1.04 : 0.96;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith(hasDevanagari ? 'hi' : 'en') &&
          /female|sangeeta|lekha|heera|kalpana|google हिन्दी|samantha|karen/i.test(v.name),
      );
      if (preferred) {
        utterance.voice = preferred;
      }
      const estimatedMs = Math.min(12_000, Math.max(2_500, text.length * 65));
      const safetyTimer = window.setTimeout(() => {
        setPlayingMessageId((curr) => (curr === messageId ? null : curr));
      }, estimatedMs);
      const clearPlaying = () => {
        window.clearTimeout(safetyTimer);
        setPlayingMessageId((curr) => (curr === messageId ? null : curr));
      };
      utterance.onend = clearPlaying;
      utterance.onerror = clearPlaying;
      window.speechSynthesis.speak(utterance);
      setPlayingMessageId(messageId);
      return true;
    } catch {
      return false;
    }
  };

  const playSpeech = async (
    messageId: string,
    text: string,
    overrideVoice?: VoiceStyleId,
    forceGeminiRetry = false,
  ) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const activeVoice = overrideVoice ?? profile.voiceStyle;
    const cacheKey = `${activeVoice}::${text.trim().slice(0, 600)}`;
    const cachedAudio = ttsCacheRef.current.get(cacheKey);

    if (!cachedAudio && ttsQuotaReached && !forceGeminiRetry) {
      const usedFallback = speakWithBrowserFallback(messageId, text, activeVoice);
      if (!usedFallback) {
        setPlayingMessageId(null);
      }
      return;
    }

    setPlayingMessageId(messageId);
    try {
      let audioBase64 = cachedAudio;
      if (!audioBase64) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceStyle: activeVoice,
          }),
        });
        const data = await res.json();
        if (res.status === 429 || data.code === 'RATE_LIMIT_EXCEEDED') {
          setTtsQuotaReached(true);
          const usedFallback = speakWithBrowserFallback(messageId, text, activeVoice);
          if (!usedFallback) {
            setPlayingMessageId(null);
          }
          setTtsQuotaNotice(
            'Gemini TTS Free Tier daily quota (10/day) reached — using device voice instead. Add a billing-enabled key in Settings > Secrets for higher quota.',
          );
          return;
        }
        if (!res.ok || !data.audioBase64) {
          throw new Error(data.error || 'Voice playback unavailable right now.');
        }
        if (ttsQuotaReached) {
          setTtsQuotaReached(false);
          setTtsQuotaNotice(null);
        }
        audioBase64 = data.audioBase64 as string;
        ttsCacheRef.current.set(cacheKey, audioBase64);
      }

      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setPlayingMessageId(null);
      audio.onerror = () => setPlayingMessageId(null);
      await audio.play();
    } catch (err: unknown) {
      setPlayingMessageId(null);
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'Unable to play assistant voice right now.',
      );
    }
  };

  const handleSendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    setErrorBanner(null);
    const userLang = detectConversationLanguage(trimmed);
    const hotspotEffect = applyHotspotCommand(parseHotspotVoiceCommand(trimmed));
    const deviceEffect = applyDeviceCommand(parseDeviceActionCommand(trimmed));
    const combinedEffect = [hotspotEffect, deviceEffect].filter(Boolean).join(' · ') || undefined;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: formatNow(),
      detectedLanguage: userLang,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          profile,
          hotspot,
          telemetry,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not get a reply.');
      }

      const sonaMsgId = `s-${Date.now()}`;
      const sonaMsg: ChatMessage = {
        id: sonaMsgId,
        role: 'sona',
        text: data.reply,
        timestamp: formatNow(),
        detectedLanguage: data.detectedLanguage || userLang,
        loveMode: profile.loveMode,
        hotspotEffect: combinedEffect,
      };
      setMessages((prev) => [...prev, sonaMsg]);

      if (profile.autoSpeak) {
        void playSpeech(sonaMsgId, data.reply);
      }
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Assistant could not respond right now.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleTranscribeAudio = async (audioBase64: string, mimeType: string) => {
    setIsTranscribing(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not transcribe voice recording.');
      }
      if (data.transcript) {
        await handleSendMessage(data.transcript);
      } else {
        setErrorBanner('No speech was detected in that recording.');
      }
    } catch (err: unknown) {
      setErrorBanner(
        err instanceof Error ? err.message : 'Voice transcription failed.',
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTriggerGoodMorning = () => {
    setActiveTab('companion');
    const freshGreeting = buildGreetingMessage(profile);
    const id = `gm-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id,
        role: 'sona',
        text: freshGreeting,
        timestamp: formatNow(),
        detectedLanguage: 'Hindi',
        loveMode: profile.loveMode,
      },
    ]);
    if (profile.autoSpeak) {
      void playSpeech(id, freshGreeting);
    }
  };

  const handleSelectLoveMode = (mode: LoveModeId) => {
    setProfile((prev) => ({
      ...prev,
      loveMode: mode,
    }));
  };

  const handleToggleHotspot = (enabled: boolean, source: 'ui' | 'voice') => {
    setHotspot((prev) => ({
      ...prev,
      enabled,
      lastUpdatedBy: source,
      lastActionNote: enabled
        ? `Hotspot turned ON via ${source}`
        : `Hotspot turned OFF via ${source}`,
    }));
  };

  const handleToggleWifi = (wifiEnabled: boolean, source: 'ui' | 'voice') => {
    setHotspot((prev) => ({
      ...prev,
      wifiEnabled,
      lastUpdatedBy: source,
      lastActionNote: wifiEnabled
        ? `Wi-Fi turned ON via ${source}`
        : `Wi-Fi turned OFF via ${source}`,
    }));
  };

  const handleUpdateHotspotCredentials = (
    ssid: string,
    password: string,
    band: '2.4 GHz' | '5 GHz',
  ) => {
    setHotspot((prev) => ({
      ...prev,
      ssid,
      password,
      band,
      lastUpdatedBy: 'ui',
      lastActionNote: `Credentials updated (${ssid})`,
    }));
  };

  const handleApprovePermissionAction = () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);

    if (action.type === 'make_call') {
      const telTarget = encodeURIComponent(action.target.replace(/\s+/g, ''));
      const link = document.createElement('a');
      link.href = `tel:${telTarget}`;
      link.click();
      setMessages((prev) => [
        ...prev,
        {
          id: `perm-${Date.now()}`,
          role: 'sona',
          text: `Permission approved, ${profile.bossName}. Opening phone dialer for ${action.target}.`,
          timestamp: formatNow(),
          detectedLanguage: 'English',
        },
      ]);
    } else if (action.type === 'send_sms') {
      const smsTarget = encodeURIComponent(action.target);
      const bodyParam = action.messageBody
        ? `?body=${encodeURIComponent(action.messageBody)}`
        : '';
      const link = document.createElement('a');
      link.href = `sms:${smsTarget}${bodyParam}`;
      link.click();
      setMessages((prev) => [
        ...prev,
        {
          id: `perm-${Date.now()}`,
          role: 'sona',
          text: `Permission approved, ${profile.bossName}. Opening SMS composer for ${action.target}.`,
          timestamp: formatNow(),
          detectedLanguage: 'English',
        },
      ]);
    }
  };

  return (
    <div id="top" className="min-h-screen pb-16 md:pb-8 flex flex-col">
      <HeaderNav
        assistantName={profile.assistantName || 'SONA'}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTriggerGoodMorning={handleTriggerGoodMorning}
      />

      <main className="flex-1">
        {activeTab !== 'companion' && (errorBanner || ttsQuotaNotice) && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
            {errorBanner && (
              <div
                role="alert"
                className="px-4 py-3 rounded-xl bg-[#FFF1F2] dark:bg-[#3B1220] border border-[#FECDD3] dark:border-[#881337] text-xs text-[#9F1239] dark:text-[#FDA4AF] flex items-center justify-between gap-3"
              >
                <span>{errorBanner}</span>
                <button
                  type="button"
                  onClick={() => setErrorBanner(null)}
                  className="font-semibold underline whitespace-nowrap shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
            {ttsQuotaNotice && (
              <div
                role="status"
                className="px-4 py-3 rounded-xl bg-[#F5E9FE] dark:bg-[#2B124C] border border-[#E5D4F3] dark:border-[#4C2A78] text-xs text-[#4A3265] dark:text-[#EADDF9] flex flex-wrap items-center justify-between gap-3"
              >
                <span>{ttsQuotaNotice}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      void playSpeech(
                        'quota-retry',
                        buildGreetingMessage(profile),
                        profile.voiceStyle,
                        true,
                      )
                    }
                    className="font-semibold text-[#DB2777] dark:text-[#F472B6] underline whitespace-nowrap"
                  >
                    Retry Gemini Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => setTtsQuotaNotice(null)}
                    className="font-semibold underline whitespace-nowrap"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'companion' && (
          <CompanionWorkspace
            profile={profile}
            hotspot={hotspot}
            telemetry={telemetry}
            messages={messages}
            isSending={isSending}
            isTranscribing={isTranscribing}
            playingMessageId={playingMessageId}
            errorBanner={errorBanner}
            ttsQuotaNotice={ttsQuotaNotice}
            onSelectLoveMode={handleSelectLoveMode}
            onSendMessage={handleSendMessage}
            onSpeakMessage={(id, text) => void playSpeech(id, text)}
            onRetryGeminiVoice={() =>
              void playSpeech(
                'quota-retry',
                buildGreetingMessage(profile),
                profile.voiceStyle,
                true,
              )
            }
            onToggleHotspot={handleToggleHotspot}
            onToggleWifi={handleToggleWifi}
            onRefreshWeather={fetchWeather}
            onTranscribeAudio={handleTranscribeAudio}
            onNavigateTab={setActiveTab}
            onDismissError={() => setErrorBanner(null)}
            onDismissTtsQuotaNotice={() => setTtsQuotaNotice(null)}
          />
        )}

        {activeTab === 'hotspot' && (
          <HotspotPanel
            hotspot={hotspot}
            bossCallName={profile.nickname || profile.bossName}
            onToggleHotspot={handleToggleHotspot}
            onToggleWifi={handleToggleWifi}
            onUpdateCredentials={handleUpdateHotspotCredentials}
            onRunVoiceCommand={(cmd) => {
              setActiveTab('companion');
              void handleSendMessage(cmd);
            }}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceLanguagePanel
            assistantName={profile.assistantName || 'SONA'}
            voiceStyle={profile.voiceStyle}
            languageMode={profile.languageMode}
            autoSpeak={profile.autoSpeak}
            onChangeVoiceStyle={(voiceStyle) =>
              setProfile((prev) => ({ ...prev, voiceStyle }))
            }
            onChangeLanguageMode={(languageMode) =>
              setProfile((prev) => ({ ...prev, languageMode }))
            }
            onToggleAutoSpeak={(autoSpeak) =>
              setProfile((prev) => ({ ...prev, autoSpeak }))
            }
            onPlaySample={(text, style) => playSpeech(`sample-${style}`, text, style)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePanel
            profile={profile}
            onSaveProfile={(updated) => {
              const nextProfile = { ...profile, ...updated };
              setProfile(nextProfile);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === 'welcome-1'
                    ? {
                        ...m,
                        text: buildGreetingMessage(nextProfile),
                        loveMode: nextProfile.loveMode,
                      }
                    : m,
                ),
              );
            }}
          />
        )}

        {activeTab === 'android' && <AndroidBuildPanel />}
      </main>

      <PermissionConfirmModal
        action={pendingAction}
        assistantName={profile.assistantName || 'SONA'}
        bossName={profile.bossName}
        onApprove={handleApprovePermissionAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
