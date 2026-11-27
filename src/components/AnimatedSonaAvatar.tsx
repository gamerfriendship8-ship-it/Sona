import { useState } from 'react';
import { Heart } from 'lucide-react';

interface AnimatedSonaAvatarProps {
  assistantName: string;
  bossCallName: string;
  voiceLabel: string;
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
}

const PORTRAIT_URL = '/src/assets/images/sona_portrait_1795743576286.jpg';

export function AnimatedSonaAvatar({
  assistantName,
  bossCallName,
  voiceLabel,
  state,
}: AnimatedSonaAvatarProps) {
  const [portraitFailed, setPortraitFailed] = useState(false);

  const stateLabel =
    state === 'listening'
      ? 'Listening to Boss'
      : state === 'thinking'
        ? 'Thinking'
        : state === 'speaking'
          ? 'Speaking aloud'
          : 'Online & Ready';

  return (
    <div className="relative aspect-square w-full bg-[#190B2E] overflow-hidden">
      {!portraitFailed ? (
        <img
          src={PORTRAIT_URL}
          alt={`${assistantName} AI Assistant Portrait`}
          referrerPolicy="no-referrer"
          onError={() => setPortraitFailed(true)}
          className={`w-full h-full object-cover object-top transition-transform duration-500 ${
            state === 'speaking' || state === 'listening' ? 'scale-[1.03]' : 'scale-100'
          }`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#2B124C] to-[#17092B]">
          <Heart className="w-10 h-10 text-[#F472B6] mb-2" aria-hidden="true" />
          <span className="font-display text-2xl font-semibold text-white">
            {assistantName}
          </span>
        </div>
      )}

      {/* Futuristic pink-purple orbital aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className={`w-56 h-56 rounded-full border border-[#EC4899]/35 border-dashed animate-sona-ring transition-opacity duration-300 ${
            state === 'idle' ? 'opacity-45' : 'opacity-90'
          }`}
        />
        <div
          className={`absolute w-64 h-64 rounded-full border border-[#A855F7]/25 transition-transform duration-500 ${
            state === 'speaking' || state === 'listening' ? 'scale-105' : 'scale-95'
          }`}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#10071D]/90 via-[#10071D]/45 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="font-display text-2xl font-semibold leading-tight">
            {assistantName} · {stateLabel}
          </div>

          {(state === 'speaking' || state === 'listening' || state === 'thinking') && (
            <div
              aria-hidden="true"
              className="flex items-end gap-1 h-5 shrink-0"
            >
              <span className="w-1 h-4 rounded-sm bg-[#F472B6] animate-sona-wave" />
              <span
                className="w-1 h-5 rounded-sm bg-[#C084FC] animate-sona-wave"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1 h-3.5 rounded-sm bg-[#F472B6] animate-sona-wave"
                style={{ animationDelay: '300ms' }}
              />
              <span
                className="w-1 h-4.5 rounded-sm bg-[#C084FC] animate-sona-wave"
                style={{ animationDelay: '450ms' }}
              />
            </div>
          )}
        </div>
        <p className="text-xs text-white/85 mt-1">
          Calling you {bossCallName} · {voiceLabel}
        </p>
      </div>
    </div>
  );
}
