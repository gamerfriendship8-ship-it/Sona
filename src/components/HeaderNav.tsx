import { Heart, Mic, Smartphone, User, Wifi } from 'lucide-react';
import type { NavTab } from '../types/sona';

interface HeaderNavProps {
  assistantName: string;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onTriggerGoodMorning: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; mobileLabel: string }[] = [
  { id: 'companion', label: 'Companion', mobileLabel: 'Chat' },
  { id: 'hotspot', label: 'Wi-Fi & Hotspot', mobileLabel: 'Network' },
  { id: 'voice', label: 'Voice & Language', mobileLabel: 'Voice' },
  { id: 'profile', label: 'Profile', mobileLabel: 'Profile' },
  { id: 'android', label: 'Android APK', mobileLabel: 'APK' },
];

export function HeaderNav({
  assistantName,
  activeTab,
  onSelectTab,
  onTriggerGoodMorning,
}: HeaderNavProps) {
  return (
    <>
      <header className="sticky top-0 z-30 h-13 md:h-16 border-b border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF]/92 dark:bg-[#10071D]/92 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('companion');
            }}
            className="font-display text-2xl font-semibold tracking-tight text-[#1D1029] dark:text-[#FAF5FF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
          >
            {assistantName || 'SONA'}
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative py-2 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DB2777] ${
                    active
                      ? 'text-[#DB2777] dark:text-[#F472B6] font-semibold'
                      : 'text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#1D1029] dark:hover:text-[#FAF5FF]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#DB2777] to-[#9333EA]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onTriggerGoodMorning}
              className="px-4 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-xl bg-gradient-to-r from-[#DB2777] to-[#9333EA] hover:from-[#BE185D] hover:to-[#7E22CE] text-white transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
            >
              Good Morning
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 border-t border-[#E5D4F3] dark:border-[#3B215E] bg-[#FCF7FF]/95 dark:bg-[#10071D]/95 backdrop-blur-md grid grid-cols-5 items-center"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          const Icon =
            item.id === 'companion'
              ? Heart
              : item.id === 'hotspot'
                ? Wifi
                : item.id === 'voice'
                  ? Mic
                  : item.id === 'profile'
                    ? User
                    : Smartphone;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active
                  ? 'text-[#DB2777] dark:text-[#F472B6]'
                  : 'text-[#6B5482] dark:text-[#B9A4D4]'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-medium whitespace-nowrap">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
