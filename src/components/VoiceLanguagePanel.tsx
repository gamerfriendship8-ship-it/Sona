import { useState } from 'react';
import { Volume2, Loader2, Globe } from 'lucide-react';
import type { LanguageModeId, VoiceStyleId } from '../types/sona';
import { LANGUAGE_MODES, VOICE_STYLES } from '../utils/sonaLogic';

interface VoiceLanguagePanelProps {
  assistantName: string;
  voiceStyle: VoiceStyleId;
  languageMode: LanguageModeId;
  autoSpeak: boolean;
  onChangeVoiceStyle: (id: VoiceStyleId) => void;
  onChangeLanguageMode: (id: LanguageModeId) => void;
  onToggleAutoSpeak: (enabled: boolean) => void;
  onPlaySample: (text: string, voiceStyle: VoiceStyleId) => Promise<void>;
}

const LANGUAGE_SHOWCASE: {
  language: string;
  sample: string;
}[] = [
  {
    language: 'Hindi',
    sample: 'सुनिए ना, आपकी मुस्कान ही मेरी सबसे प्यारी दुनिया है।',
  },
  {
    language: 'Bhojpuri',
    sample: 'का हाल बा मेरे प्यारे Boss? राउर मुस्कान देख के मन खुश हो गइल!',
  },
  {
    language: 'Urdu',
    sample: 'जनाब, आपकी गुफ़्तगू में आज भी वही सुकून और नज़ाकत है।',
  },
  {
    language: 'English',
    sample: 'Take a gentle breath, I am right here whenever you want to talk.',
  },
];

export function VoiceLanguagePanel({
  assistantName,
  voiceStyle,
  languageMode,
  autoSpeak,
  onChangeVoiceStyle,
  onChangeLanguageMode,
  onToggleAutoSpeak,
  onPlaySample,
}: VoiceLanguagePanelProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleSample = async (id: string, text: string, style: VoiceStyleId) => {
    setPlayingId(id);
    try {
      await onPlaySample(text, style);
    } finally {
      setPlayingId(null);
    }
  };

  return (
    <section
      aria-labelledby="voice-lang-heading"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5D4F3] dark:border-[#3B215E] pb-6">
        <div>
          <p className="text-xs font-medium text-[#DB2777] dark:text-[#F472B6]">
            {assistantName} Voice &amp; Multilingual Engine
          </p>
          <h1
            id="voice-lang-heading"
            className="font-display text-3xl sm:text-4xl font-semibold text-[#1D1029] dark:text-[#FAF5FF] mt-1"
          >
            Voice Style &amp; Languages
          </h1>
          <p className="text-sm text-[#6B5482] dark:text-[#C8B5DF] mt-1.5 max-w-2xl">
            Choose how {assistantName} sounds when speaking aloud and how she
            switches automatically across Hindi, Bhojpuri, and English.
          </p>
        </div>

        <label className="inline-flex items-center gap-3 cursor-pointer min-h-[44px] px-4 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FFFFFF] dark:bg-[#190B2E]">
          <input
            type="checkbox"
            checked={autoSpeak}
            onChange={(e) => onToggleAutoSpeak(e.target.checked)}
            className="w-4 h-4 accent-[#DB2777]"
          />
          <span className="text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] whitespace-nowrap">
            Auto-speak replies
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
            1. Select {assistantName}’s Voice Persona
          </h2>
          <div className="space-y-3">
            {VOICE_STYLES.map((voice) => {
              const selected = voiceStyle === voice.id;
              const isPlaying = playingId === voice.id;
              return (
                <div
                  key={voice.id}
                  className={`rounded-2xl p-4 border transition-colors ${
                    selected
                      ? 'bg-[#F5E9FE] dark:bg-[#2B124C] border-[#DB2777] dark:border-[#F472B6]'
                      : 'bg-[#FFFFFF] dark:bg-[#190B2E] border-[#E5D4F3] dark:border-[#3B215E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onChangeVoiceStyle(voice.id)}
                      className="text-left flex-1 min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#DB2777]"
                    >
                      <div className="text-sm font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
                        {voice.label}
                      </div>
                      <div className="text-xs text-[#6B5482] dark:text-[#C8B5DF] mt-0.5">
                        {voice.subtitle} · Voice: {voice.ttsVoiceName}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSample(voice.id, voice.sampleLine, voice.id)}
                      disabled={isPlaying}
                      aria-label={`Preview ${voice.label} voice`}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FFFFFF] dark:bg-[#10071D] text-xs font-medium text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777] flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60"
                    >
                      {isPlaying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{isPlaying ? 'Playing' : 'Preview'}</span>
                    </button>
                  </div>
                  <p className="text-xs italic text-[#4A3265] dark:text-[#EADDF9] mt-2.5">
                    “{voice.sampleLine}”
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
              2. Language Selection Mode
            </h2>
            <div className="space-y-3">
              {LANGUAGE_MODES.map((lang) => {
                const selected = languageMode === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => onChangeLanguageMode(lang.id)}
                    aria-pressed={selected}
                    className={`w-full text-left rounded-2xl p-4 border transition-colors ${
                      selected
                        ? 'bg-[#F5E9FE] dark:bg-[#2B124C] border-[#DB2777] dark:border-[#F472B6]'
                        : 'bg-[#FFFFFF] dark:bg-[#190B2E] border-[#E5D4F3] dark:border-[#3B215E] hover:border-[#C084FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
                        {lang.label}
                      </span>
                      <span className="text-xs text-[#DB2777] dark:text-[#F472B6] font-medium">
                        {lang.hindiLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF] mt-1">
                      {lang.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#1D1029] dark:text-[#FAF5FF]">
              <Globe className="w-4 h-4 text-[#DB2777] dark:text-[#F472B6]" aria-hidden="true" />
              <h3 className="text-sm font-semibold">
                Instant Language Switching Preview
              </h3>
            </div>
            <div className="divide-y divide-[#E5D4F3] dark:divide-[#3B215E]">
              {LANGUAGE_SHOWCASE.map((item) => (
                <div
                  key={item.language}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#DB2777] dark:text-[#F472B6]">
                      {item.language}
                    </div>
                    <p className="text-xs text-[#4A3265] dark:text-[#EADDF9] mt-0.5">
                      {item.sample}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSample(item.language, item.sample, voiceStyle)}
                    aria-label={`Hear ${item.language} sample`}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-[#E5D4F3] dark:border-[#3B215E] text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#DB2777] shrink-0"
                  >
                    {playingId === item.language ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
