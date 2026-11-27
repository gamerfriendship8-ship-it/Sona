import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  MessageSquare,
  Phone,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { HotspotConfig } from '../types/sona';
import { validateHotspotConfig } from '../utils/sonaLogic';

interface HotspotPanelProps {
  hotspot: HotspotConfig;
  bossCallName: string;
  onToggleHotspot: (enabled: boolean, source: 'ui' | 'voice') => void;
  onToggleWifi: (enabled: boolean, source: 'ui' | 'voice') => void;
  onUpdateCredentials: (
    ssid: string,
    password: string,
    band: '2.4 GHz' | '5 GHz',
  ) => void;
  onRunVoiceCommand: (commandText: string) => void;
}

const VOICE_COMMAND_EXAMPLES = [
  'Hotspot on karo',
  'Wi-Fi off kardo',
  'WhatsApp open karo',
  'Call Mom',
  'Send SMS to Rahul saying I am on my way',
];

export function HotspotPanel({
  hotspot,
  bossCallName,
  onToggleHotspot,
  onToggleWifi,
  onUpdateCredentials,
  onRunVoiceCommand,
}: HotspotPanelProps) {
  const [ssidInput, setSsidInput] = useState(hotspot.ssid);
  const [passwordInput, setPasswordInput] = useState(hotspot.password);
  const [bandInput, setBandInput] = useState<'2.4 GHz' | '5 GHz'>(hotspot.band);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'ssid' | 'password' | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ ssid?: string; password?: string }>({});

  useEffect(() => {
    setSsidInput(hotspot.ssid);
    setPasswordInput(hotspot.password);
    setBandInput(hotspot.band);
  }, [hotspot.ssid, hotspot.password, hotspot.band]);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateHotspotConfig(ssidInput, passwordInput);
    if (!validation.valid) {
      setErrors({
        ssid: validation.ssidError,
        password: validation.passwordError,
      });
      setFormMessage(null);
      return;
    }
    setErrors({});
    onUpdateCredentials(ssidInput.trim(), passwordInput, bandInput);
    setFormMessage(`Hotspot credentials saved for ${bossCallName}.`);
  };

  const handleCopy = async (value: string, field: 'ssid' | 'password') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      setCopiedField(null);
    }
  };

  return (
    <section
      aria-labelledby="hotspot-heading"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5D4F3] dark:border-[#3B215E] pb-6">
        <div>
          <p className="text-xs font-medium text-[#DB2777] dark:text-[#F472B6]">
            Device Network &amp; Voice Actions
          </p>
          <h1
            id="hotspot-heading"
            className="font-display text-3xl sm:text-4xl font-semibold text-[#1D1029] dark:text-[#FAF5FF] mt-1"
          >
            Wi-Fi, Hotspot &amp; Phone Actions
          </h1>
          <p className="text-sm text-[#6B5482] dark:text-[#C8B5DF] mt-1.5 max-w-2xl">
            Manage Wi-Fi, Hotspot SSID and WPA2 password, or test voice commands
            for opening apps, calls, and SMS with explicit user permission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onToggleWifi(!hotspot.wifiEnabled, 'ui')}
            aria-pressed={hotspot.wifiEnabled}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              hotspot.wifiEnabled
                ? 'bg-[#F5E9FE] dark:bg-[#2B124C] text-[#9333EA] dark:text-[#F472B6] border border-[#C084FC]/60'
                : 'bg-[#FFFFFF] dark:bg-[#190B2E] text-[#1D1029] dark:text-[#FAF5FF] border border-[#E5D4F3] dark:border-[#3B215E]'
            }`}
          >
            {hotspot.wifiEnabled ? (
              <Wifi className="w-4 h-4" aria-hidden="true" />
            ) : (
              <WifiOff className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{hotspot.wifiEnabled ? 'Wi-Fi ON' : 'Wi-Fi OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleHotspot(!hotspot.enabled, 'ui')}
            aria-pressed={hotspot.enabled}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              hotspot.enabled
                ? 'bg-gradient-to-r from-[#DB2777] to-[#9333EA] text-white'
                : 'bg-[#FFFFFF] dark:bg-[#190B2E] text-[#1D1029] dark:text-[#FAF5FF] border border-[#E5D4F3] dark:border-[#3B215E] hover:border-[#DB2777]'
            }`}
          >
            <span>{hotspot.enabled ? 'Turn Hotspot OFF' : 'Turn Hotspot ON'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E5D4F3] dark:border-[#3B215E]">
            <div>
              <h2 className="text-lg font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
                Hotspot Configuration
              </h2>
              <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF] mt-1">
                Wi-Fi: {hotspot.wifiEnabled ? 'ON' : 'OFF'} · Hotspot:{' '}
                {hotspot.enabled ? 'Active' : 'Off'} · Band: {hotspot.band}
              </p>
            </div>
            <span
              className={`text-sm font-semibold ${
                hotspot.enabled
                  ? 'text-[#10B981]'
                  : 'text-[#6B5482] dark:text-[#C8B5DF]'
              }`}
            >
              {hotspot.enabled ? 'Hotspot ON' : 'Hotspot OFF'}
            </span>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="hotspot-ssid"
                className="block text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] mb-1.5"
              >
                Network Name (SSID)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="hotspot-ssid"
                  type="text"
                  value={ssidInput}
                  onChange={(e) => setSsidInput(e.target.value)}
                  maxLength={32}
                  placeholder="SONA_Boss_Hotspot"
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-[#1D1029] dark:text-[#FAF5FF] font-mono-tabular text-sm focus:outline-none focus:border-[#DB2777]"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(ssidInput, 'ssid')}
                  aria-label="Copy hotspot network name"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#1D1029] dark:hover:text-white transition-colors"
                >
                  {copiedField === 'ssid' ? (
                    <Check className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.ssid && (
                <p role="alert" className="text-xs text-[#BE123C] dark:text-[#FDA4AF] mt-1.5">
                  {errors.ssid}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="hotspot-password"
                className="block text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] mb-1.5"
              >
                WPA2 Security Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="hotspot-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  maxLength={63}
                  placeholder="Minimum 8 characters"
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-[#1D1029] dark:text-[#FAF5FF] font-mono-tabular text-sm focus:outline-none focus:border-[#DB2777]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide hotspot password' : 'Show hotspot password'}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#1D1029] dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(passwordInput, 'password')}
                  aria-label="Copy hotspot password"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#1D1029] dark:hover:text-white transition-colors"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-xs text-[#BE123C] dark:text-[#FDA4AF] mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <span className="block text-sm font-medium text-[#1D1029] dark:text-[#FAF5FF] mb-2">
                AP Frequency Band
              </span>
              <div className="inline-flex p-1 rounded-xl bg-[#F5E9FE] dark:bg-[#2B124C] gap-1">
                {(['2.4 GHz', '5 GHz'] as const).map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setBandInput(band)}
                    className={`px-4 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      bandInput === band
                        ? 'bg-[#FFFFFF] dark:bg-[#190B2E] text-[#1D1029] dark:text-white shadow-xs'
                        : 'text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#1D1029]'
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DB2777] to-[#9333EA] hover:from-[#BE185D] hover:to-[#7E22CE] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Save Hotspot Credentials
              </button>
              {formMessage && (
                <p className="text-xs font-medium text-[#10B981]">
                  {formMessage}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#1D1029] dark:text-[#FAF5FF]">
              Voice Command Launcher
            </h2>
            <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF]">
              Test app opening, calls, SMS, Wi-Fi, and hotspot voice commands.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {VOICE_COMMAND_EXAMPLES.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => onRunVoiceCommand(cmd)}
                  className="min-h-[42px] px-3.5 py-2 text-left text-sm rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF] dark:bg-[#10071D] text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777] transition-colors flex items-center justify-between gap-2"
                >
                  <span className="truncate">“{cmd}”</span>
                  <span className="text-xs font-medium text-[#DB2777] dark:text-[#F472B6] whitespace-nowrap shrink-0">
                    Run
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E5D4F3] dark:border-[#3B215E] grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onRunVoiceCommand('Call Mom')}
                className="min-h-[40px] px-3 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] text-xs font-medium text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777] flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#DB2777] dark:text-[#F472B6]" aria-hidden="true" />
                <span>Test Call</span>
              </button>
              <button
                type="button"
                onClick={() => onRunVoiceCommand('Send SMS to Rahul saying Hello Boss')}
                className="min-h-[40px] px-3 py-2 rounded-xl border border-[#E5D4F3] dark:border-[#3B215E] text-xs font-medium text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#9333EA] flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#9333EA] dark:text-[#C084FC]" aria-hidden="true" />
                <span>Test SMS</span>
              </button>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-[#1D1029] dark:text-[#FAF5FF]">
              <ShieldCheck className="w-5 h-5 text-[#DB2777] dark:text-[#F472B6] shrink-0" aria-hidden="true" />
              <h2 className="text-base font-semibold">
                Android Permission &amp; Security Policy
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[#6B5482] dark:text-[#C8B5DF]">
              On Android 10+, OS security blocks silent background radio toggles.
              SONA respects privacy-first permissions:
            </p>
            <ul className="space-y-2 text-xs text-[#4A3265] dark:text-[#EADDF9] pt-1">
              <li>1. <span className="font-mono-tabular">CALL_PHONE &amp; SEND_SMS</span> — always requires explicit Boss approval before dialing or texting.</li>
              <li>2. <span className="font-mono-tabular">Settings.Panel.ACTION_WIFI</span> — opens system Wi-Fi sheet on Android 10+.</li>
              <li>3. <span className="font-mono-tabular">WRITE_SETTINGS</span> — manages hotspot tethering where Android permits.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
