import { useState } from 'react';
import { Moon, Sun, Info } from 'lucide-react';
import type { BossProfile } from '../types/sona';
import { buildGreetingMessage, NICKNAME_PRESETS } from '../utils/sonaLogic';

interface ProfilePanelProps {
  profile: BossProfile;
  onSaveProfile: (updated: Partial<BossProfile>) => void;
}

export function ProfilePanel({ profile, onSaveProfile }: ProfilePanelProps) {
  const [assistantName, setAssistantName] = useState(profile.assistantName || 'SONA');
  const [bossName, setBossName] = useState(profile.bossName);
  const [nickname, setNickname] = useState(profile.nickname);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const previewProfile: BossProfile = {
    ...profile,
    assistantName: assistantName.trim() || 'SONA',
    bossName: bossName.trim() || 'Boss',
    nickname: nickname.trim() || bossName.trim() || 'Boss',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantName.trim()) {
      setError('Please enter an assistant name.');
      setSavedNote(null);
      return;
    }
    if (!bossName.trim()) {
      setError('Please enter the name your assistant should call you.');
      setSavedNote(null);
      return;
    }
    setError(null);
    onSaveProfile({
      assistantName: assistantName.trim(),
      bossName: bossName.trim(),
      nickname: nickname.trim() || bossName.trim(),
    });
    setSavedNote(
      `Saved. ${assistantName.trim()} will now call you ${nickname.trim() || bossName.trim()}.`,
    );
  };

  return (
    <section
      aria-labelledby="profile-heading"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5D4F3] dark:border-[#3B215E] pb-6">
        <div>
          <p className="text-xs font-medium text-[#DB2777] dark:text-[#F472B6]">
            Assistant &amp; Boss Identity
          </p>
          <h1
            id="profile-heading"
            className="font-display text-3xl sm:text-4xl font-semibold text-[#1D1029] dark:text-[#FAF5FF] mt-1"
          >
            Assistant Name &amp; Boss Profile
          </h1>
          <p className="text-sm text-[#6B5482] dark:text-[#C8B5DF] mt-1.5">
            Customize your assistant’s name, how she addresses you, and switch
            between Futuristic Dark and Light Orchid modes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSaveProfile({ nightTheme: !profile.nightTheme })}
          aria-pressed={profile.nightTheme}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FFFFFF] dark:bg-[#190B2E] text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] flex items-center gap-2 whitespace-nowrap shrink-0 hover:border-[#DB2777]"
        >
          {profile.nightTheme ? (
            <>
              <Sun className="w-4 h-4 text-[#F472B6]" aria-hidden="true" />
              <span>Switch to Light Orchid</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#9333EA]" aria-hidden="true" />
              <span>Switch to Futuristic Dark</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-7 bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-6 space-y-5"
        >
          <div>
            <label
              htmlFor="assistant-name-input"
              className="block text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] mb-1.5"
            >
              Assistant Name
            </label>
            <input
              id="assistant-name-input"
              type="text"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              maxLength={24}
              placeholder="e.g. SONA"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-[#1D1029] dark:text-[#FAF5FF] text-sm focus:outline-none focus:border-[#DB2777]"
            />
          </div>

          <div>
            <label
              htmlFor="boss-name-input"
              className="block text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] mb-1.5"
            >
              Your Name (Assistant आपको किस नाम से बुलाए?)
            </label>
            <input
              id="boss-name-input"
              type="text"
              value={bossName}
              onChange={(e) => setBossName(e.target.value)}
              maxLength={30}
              placeholder="e.g. Boss, Aarav, Raja"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-[#1D1029] dark:text-[#FAF5FF] text-sm focus:outline-none focus:border-[#DB2777]"
            />
          </div>

          <div>
            <label
              htmlFor="boss-nickname-input"
              className="block text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] mb-1.5"
            >
              Cute Nickname (प्यारा उपनाम)
            </label>
            <input
              id="boss-nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={32}
              placeholder="e.g. Mere Pyare Boss, Jaan, Hero"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-[#1D1029] dark:text-[#FAF5FF] text-sm focus:outline-none focus:border-[#DB2777]"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {NICKNAME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNickname(preset)}
                  className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    nickname === preset
                      ? 'bg-[#F5E9FE] dark:bg-[#2B124C] border-[#DB2777] dark:border-[#F472B6] text-[#DB2777] dark:text-[#F472B6]'
                      : 'border-[#E5D4F3] dark:border-[#3B215E] text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#1D1029]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-[#BE123C] dark:text-[#FDA4AF]">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DB2777] to-[#9333EA] hover:from-[#BE185D] hover:to-[#7E22CE] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Update Settings
            </button>
            {savedNote && (
              <p className="text-xs font-medium text-[#10B981]">
                {savedNote}
              </p>
            )}
          </div>
        </form>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
              Live Greeting Preview
            </h2>
            <p className="text-sm leading-relaxed text-[#4A3265] dark:text-[#EADDF9]">
              “{buildGreetingMessage(previewProfile)}”
            </p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-6 space-y-2.5">
            <div className="flex items-center gap-2 text-[#1D1029] dark:text-[#FAF5FF]">
              <Info className="w-4 h-4 text-[#DB2777] dark:text-[#F472B6] shrink-0" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Privacy-First Design</h2>
            </div>
            <p className="text-xs leading-relaxed text-[#6B5482] dark:text-[#C8B5DF]">
              Your assistant name, Boss name, chat history, and hotspot settings
              stay locally on your device. Calls, SMS, and system toggles always
              ask your explicit permission first.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
