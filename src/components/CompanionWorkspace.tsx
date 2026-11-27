import { useEffect, useRef, useState } from 'react';
import {
  Battery,
  BatteryCharging,
  CloudSun,
  Loader2,
  Mic,
  MicOff,
  Phone,
  Send,
  UserCheck,
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AnimatedSonaAvatar } from './AnimatedSonaAvatar';
import type {
  BossProfile,
  ChatMessage,
  DeviceTelemetry,
  HotspotConfig,
  LoveModeId,
  NavTab,
} from '../types/sona';
import {
  buildGreetingMessage,
  LANGUAGE_MODES,
  LOVE_MODES,
  QUICK_PROMPTS,
  VOICE_STYLES,
} from '../utils/sonaLogic';

interface CompanionWorkspaceProps {
  profile: BossProfile;
  hotspot: HotspotConfig;
  telemetry: DeviceTelemetry;
  messages: ChatMessage[];
  isSending: boolean;
  isTranscribing: boolean;
  playingMessageId: string | null;
  errorBanner: string | null;
  onSelectLoveMode: (mode: LoveModeId) => void;
  onSendMessage: (text: string) => void;
  onSpeakMessage: (messageId: string, text: string) => void;
  onToggleHotspot: (enabled: boolean, source: 'ui' | 'voice') => void;
  onToggleWifi: (enabled: boolean, source: 'ui' | 'voice') => void;
  onRefreshWeather: (city: string) => Promise<void>;
  onTranscribeAudio: (audioBase64: string, mimeType: string) => Promise<void>;
  onNavigateTab: (tab: NavTab) => void;
  onDismissError: () => void;
}

const BACKDROP_URL = '/src/assets/images/morning_rose_backdrop_1795743575057.jpg';

export function CompanionWorkspace({
  profile,
  hotspot,
  telemetry,
  messages,
  isSending,
  isTranscribing,
  playingMessageId,
  errorBanner,
  onSelectLoveMode,
  onSendMessage,
  onSpeakMessage,
  onToggleHotspot,
  onToggleWifi,
  onRefreshWeather,
  onTranscribeAudio,
  onNavigateTab,
  onDismissError,
}: CompanionWorkspaceProps) {
  const [inputText, setInputText] = useState('');
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState(telemetry.weather?.city || 'Mumbai');
  const [editingCity, setEditingCity] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length, isSending]);

  const assistantName = profile.assistantName.trim() || 'SONA';
  const activeVoice =
    VOICE_STYLES.find((v) => v.id === profile.voiceStyle) ?? VOICE_STYLES[0];
  const activeLanguage =
    LANGUAGE_MODES.find((l) => l.id === profile.languageMode) ??
    LANGUAGE_MODES[0];
  const greetingText = buildGreetingMessage(profile);

  const avatarState = isRecording
    ? 'listening'
    : isSending || isTranscribing
      ? 'thinking'
      : playingMessageId
        ? 'speaking'
        : 'idle';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;
    setInputText('');
    onSendMessage(trimmed);
  };

  const handleToggleRecording = async () => {
    setMicError(null);
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Microphone recording is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          if (base64) {
            await onTranscribeAudio(base64, blob.type || 'audio/webm');
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setMicError('Microphone access was declined. You can type your message anytime.');
    }
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    await onRefreshWeather(cityInput.trim());
    setEditingCity(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="order-2 lg:order-1 lg:col-span-4 space-y-6">
          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl overflow-hidden">
            <AnimatedSonaAvatar
              assistantName={assistantName}
              bossCallName={profile.nickname || profile.bossName}
              voiceLabel={activeVoice.label}
              state={avatarState}
            />

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 text-xs text-[#6B5482] dark:text-[#C8B5DF]">
                <span>Language: {activeLanguage.label}</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('voice')}
                  className="font-medium text-[#DB2777] dark:text-[#F472B6] hover:underline whitespace-nowrap shrink-0"
                >
                  Change
                </button>
              </div>

              <div className="pt-3 border-t border-[#E5D4F3] dark:border-[#3B215E] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#1D1029] dark:text-[#FAF5FF]">
                    Boss: {profile.bossName}
                  </div>
                  <div className="text-xs text-[#6B5482] dark:text-[#C8B5DF] truncate">
                    Nickname: {profile.nickname}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('profile')}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E5D4F3] dark:border-[#3B215E] text-xs font-medium text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit Name</span>
                </button>
              </div>

              <div className="pt-3 border-t border-[#E5D4F3] dark:border-[#3B215E] grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onToggleWifi(!hotspot.wifiEnabled, 'ui')}
                  aria-pressed={hotspot.wifiEnabled}
                  className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    hotspot.wifiEnabled
                      ? 'bg-[#F5E9FE] dark:bg-[#2B124C] text-[#9333EA] dark:text-[#F472B6] border border-[#C084FC]/50'
                      : 'border border-[#E5D4F3] dark:border-[#3B215E] text-[#6B5482] dark:text-[#C8B5DF]'
                  }`}
                >
                  {hotspot.wifiEnabled ? (
                    <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>Wi-Fi {hotspot.wifiEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleHotspot(!hotspot.enabled, 'ui')}
                  aria-pressed={hotspot.enabled}
                  className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    hotspot.enabled
                      ? 'bg-gradient-to-r from-[#DB2777] to-[#9333EA] text-white'
                      : 'border border-[#E5D4F3] dark:border-[#3B215E] text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777]'
                  }`}
                >
                  <span>Hotspot {hotspot.enabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
              Special Love Modes
            </h2>
            <div className="space-y-2" role="radiogroup" aria-label="Special Love Modes">
              {LOVE_MODES.map((mode) => {
                const active = profile.loveMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSelectLoveMode(mode.id)}
                    className={`w-full text-left px-3.5 py-2.5 min-h-[44px] rounded-xl border transition-colors ${
                      active
                        ? 'bg-[#F5E9FE] dark:bg-[#2B124C] border-[#DB2777] dark:border-[#F472B6]'
                        : 'bg-[#FCF7FF] dark:bg-[#10071D] border-[#E5D4F3] dark:border-[#3B215E] hover:border-[#C084FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
                        {mode.title}
                      </span>
                      <span className="text-[11px] text-[#DB2777] dark:text-[#F472B6]">
                        {mode.hindiTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B5482] dark:text-[#C8B5DF] mt-0.5 line-clamp-1">
                      {mode.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section
          aria-label="Conversation with SONA"
          className="order-1 lg:order-2 lg:col-span-8 flex flex-col gap-5"
        >
          {/* Live Battery, Date, Time & Weather Strip */}
          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-[#1D1029] dark:text-[#FAF5FF]">
              <span className="font-medium font-mono-tabular">
                {telemetry.dateLabel} · {telemetry.timeLabel}
              </span>
              <span aria-hidden="true" className="text-[#6B5482] dark:text-[#C8B5DF]">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono-tabular">
                {telemetry.isCharging ? (
                  <BatteryCharging className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                ) : (
                  <Battery className="w-4 h-4 text-[#DB2777] dark:text-[#F472B6]" aria-hidden="true" />
                )}
                <span>
                  {telemetry.batteryPercent !== null
                    ? `${telemetry.batteryPercent}%`
                    : 'Battery N/A'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!editingCity ? (
                <button
                  type="button"
                  onClick={() => setEditingCity(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#DB2777] dark:hover:text-[#F472B6]"
                >
                  <CloudSun className="w-4 h-4 text-[#9333EA] dark:text-[#C084FC]" aria-hidden="true" />
                  <span>
                    {telemetry.weather
                      ? `${telemetry.weather.city}: ${telemetry.weather.temperatureC}°C, ${telemetry.weather.condition}`
                      : 'Check Weather'}
                  </span>
                </button>
              ) : (
                <form onSubmit={handleCitySubmit} className="flex items-center gap-1.5">
                  <label htmlFor="weather-city-input" className="sr-only">
                    Weather city
                  </label>
                  <input
                    id="weather-city-input"
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="City name"
                    className="w-28 px-2.5 py-1 rounded-lg border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-xs text-[#1D1029] dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-[#DB2777] text-white text-xs font-medium"
                  >
                    Go
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FFFFFF] dark:bg-[#190B2E]">
            <div className="relative min-h-44 w-full flex flex-col justify-end overflow-hidden">
              {!backdropFailed ? (
                <img
                  src={BACKDROP_URL}
                  alt="Morning sunlight with tea and roses"
                  referrerPolicy="no-referrer"
                  onError={() => setBackdropFailed(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#2B124C] to-[#4A1942]" />
              )}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#10071D]/92 via-[#190B2E]/65 to-[#190B2E]/30"
              />
              <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-end text-white">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-white/85">
                    {assistantName}’s Daily Dialogue · {profile.nickname || profile.bossName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSpeakMessage('greeting-banner', greetingText)}
                    aria-label={`Listen to ${assistantName} greeting`}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-xs font-medium text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                  >
                    {playingMessageId === 'greeting-banner' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>Listen</span>
                  </button>
                </div>
                <p className="font-display text-lg sm:text-2xl font-medium leading-snug mt-2 text-balance">
                  “{greetingText}”
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl flex flex-col min-h-[440px] max-h-[600px]">
            <div className="px-5 py-3.5 border-b border-[#E5D4F3] dark:border-[#3B215E] flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-sm font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
                Voice &amp; Text Assistant
              </h1>
              <span className="text-xs text-[#6B5482] dark:text-[#C8B5DF]">
                Hindi · Bhojpuri · English · Apps, Calls &amp; Jokes
              </span>
            </div>

            {(errorBanner || micError) && (
              <div
                role="alert"
                className="mx-5 mt-4 px-4 py-3 rounded-xl bg-[#FFF1F2] dark:bg-[#3B1220] border border-[#FECDD3] dark:border-[#881337] text-xs text-[#9F1239] dark:text-[#FDA4AF] flex items-center justify-between gap-3"
              >
                <span>{errorBanner || micError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMicError(null);
                    onDismissError();
                  }}
                  className="font-semibold underline whitespace-nowrap shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div
              ref={chatScrollRef}
              data-testid="chat-messages"
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
            >
              {messages.map((msg) => {
                const isSona = msg.role === 'sona';
                const isPlaying = playingMessageId === msg.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSona ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isSona
                          ? 'bg-[#F5E9FE] dark:bg-[#2B124C] text-[#1D1029] dark:text-[#FAF5FF]'
                          : 'bg-gradient-to-r from-[#DB2777] to-[#9333EA] text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.hotspotEffect && (
                        <p
                          className={`mt-2 pt-2 border-t text-xs font-medium ${
                            isSona
                              ? 'border-[#E5D4F3] dark:border-[#4C2A78] text-[#9333EA] dark:text-[#F472B6]'
                              : 'border-white/20 text-white/90'
                          }`}
                        >
                          {msg.hotspotEffect}
                        </p>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#6B5482] dark:text-[#C8B5DF]">
                      <span>{isSona ? assistantName : profile.bossName}</span>
                      {msg.detectedLanguage && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{msg.detectedLanguage}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{msg.timestamp}</span>
                      {isSona && (
                        <>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => onSpeakMessage(msg.id, msg.text)}
                            aria-label={`Speak ${assistantName} message ${msg.id}`}
                            className="inline-flex items-center gap-1 font-medium text-[#DB2777] dark:text-[#F472B6] hover:underline"
                          >
                            {isPlaying ? (
                              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            ) : (
                              <Volume2 className="w-3 h-3" aria-hidden="true" />
                            )}
                            <span>{isPlaying ? 'Speaking' : 'Speak'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex items-start">
                  <div className="rounded-2xl px-4 py-3 bg-[#F5E9FE] dark:bg-[#2B124C] text-xs text-[#6B5482] dark:text-[#C8B5DF] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DB2777]" aria-hidden="true" />
                    <span>{assistantName} is writing to you...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pt-3 pb-4 border-t border-[#E5D4F3] dark:border-[#3B215E] space-y-3">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.id}
                    type="button"
                    onClick={() => onSendMessage(qp.prompt)}
                    disabled={isSending}
                    className="min-h-[34px] px-3 py-1 rounded-lg border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-xs font-medium text-[#4A3265] dark:text-[#EADDF9] hover:border-[#DB2777] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    {qp.id === 'call-mom' && (
                      <Phone className="w-3 h-3 text-[#DB2777] dark:text-[#F472B6]" aria-hidden="true" />
                    )}
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={isTranscribing || isSending}
                  aria-label={isRecording ? 'Stop voice recording' : 'Start voice input'}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
                    isRecording
                      ? 'bg-[#DB2777] border-[#DB2777] text-white'
                      : 'border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777]'
                  }`}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : isRecording ? (
                    <MicOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Mic className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>

                <label htmlFor="sona-chat-input" className="sr-only">
                  Message {assistantName}
                </label>
                <input
                  id="sona-chat-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask ${assistantName} anything, open apps, call, or chat in Hindi/Bhojpuri/English...`}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-sm text-[#1D1029] dark:text-[#FAF5FF] placeholder:text-[#8E76A8] focus:outline-none focus:border-[#DB2777]"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  aria-label="Send message"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#DB2777] to-[#9333EA] hover:from-[#BE185D] hover:to-[#7E22CE] text-white text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
