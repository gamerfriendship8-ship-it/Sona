import { useEffect, useState } from 'react';
import { Check, Copy, FileCode2, ShieldCheck, Smartphone, Terminal } from 'lucide-react';
import type { AndroidProjectFile } from '../types/sona';

export function AndroidBuildPanel() {
  const [files, setFiles] = useState<AndroidProjectFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/android-files')
      .then((r) => r.json())
      .then((data: { files?: AndroidProjectFile[] }) => {
        if (!active) return;
        const list = data.files || [];
        setFiles(list);
        if (list.length > 0) {
          const preferred =
            list.find((f) => f.path.endsWith('BUILD_APK.md')) || list[0];
          setSelectedPath(preferred.path);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Could not load Android project source tree.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const currentFile = files.find((f) => f.path === selectedPath);

  const handleCopy = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-labelledby="android-apk-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5D4F3] dark:border-[#3B215E] pb-6">
        <div>
          <p className="text-xs font-medium text-[#9333EA] dark:text-[#F472B6]">
            Native Kotlin · Jetpack Compose · Material 3
          </p>
          <h1
            id="android-apk-heading"
            className="font-display text-3xl sm:text-4xl font-semibold text-[#1D1029] dark:text-[#FAF5FF] mt-1"
          >
            Android Project &amp; APK Build Guide
          </h1>
          <p className="text-sm text-[#6B5482] dark:text-[#C8B5DF] mt-1.5 max-w-2xl">
            A complete Android Studio Kotlin project is included inside{' '}
            <span className="font-mono-tabular">/android</span> with SpeechRecognizer,
            TextToSpeech, App Launcher, Call/SMS permissions, Wi-Fi/Hotspot
            intents, and Battery telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[#1D1029] dark:text-[#FAF5FF]">
            <Terminal className="w-4 h-4 text-[#DB2777] dark:text-[#F472B6]" aria-hidden="true" />
            <h2 className="text-sm font-semibold">1. Build Debug / Release APK</h2>
          </div>
          <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF] leading-relaxed">
            Open <span className="font-mono-tabular">/android</span> in Android
            Studio (SDK 35, JDK 17) or run{' '}
            <span className="font-mono-tabular">./gradlew assembleDebug</span> and{' '}
            <span className="font-mono-tabular">./gradlew assembleRelease</span>.
          </p>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[#1D1029] dark:text-[#FAF5FF]">
            <ShieldCheck className="w-4 h-4 text-[#9333EA] dark:text-[#C084FC]" aria-hidden="true" />
            <h2 className="text-sm font-semibold">2. Privacy-First Permissions</h2>
          </div>
          <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF] leading-relaxed">
            <span className="font-mono-tabular">CALL_PHONE</span> and{' '}
            <span className="font-mono-tabular">SEND_SMS</span> require explicit
            confirmation dialogs. Backups are disabled with{' '}
            <span className="font-mono-tabular">allowBackup=&quot;false&quot;</span>.
          </p>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[#1D1029] dark:text-[#FAF5FF]">
            <Smartphone className="w-4 h-4 text-[#DB2777] dark:text-[#F472B6]" aria-hidden="true" />
            <h2 className="text-sm font-semibold">3. Android 10–15 Compliance</h2>
          </div>
          <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF] leading-relaxed">
            Uses <span className="font-mono-tabular">&lt;queries&gt;</span> for
            launching WhatsApp, YouTube, Spotify &amp; Camera, and{' '}
            <span className="font-mono-tabular">Settings.Panel.ACTION_WIFI</span>{' '}
            where Android restricts background radio toggles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-[#1D1029] dark:text-[#FAF5FF] px-2 pb-1">
            Included Project Files ({files.length})
          </h2>
          {loading && (
            <p className="text-xs text-[#6B5482] dark:text-[#C8B5DF] px-2 py-4">
              Loading Android project files...
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-[#BE123C] dark:text-[#FDA4AF] px-2 py-4">
              {error}
            </p>
          )}
          <div className="space-y-1">
            {files.map((file) => {
              const active = file.path === selectedPath;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left px-3 py-2.5 min-h-[40px] rounded-xl text-xs font-mono-tabular flex items-center gap-2 transition-colors ${
                    active
                      ? 'bg-[#F5E9FE] dark:bg-[#2B124C] text-[#9333EA] dark:text-[#F472B6] font-medium'
                      : 'text-[#6B5482] dark:text-[#C8B5DF] hover:text-[#1D1029] dark:hover:text-white'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#FFFFFF] dark:bg-[#190B2E] border border-[#E5D4F3] dark:border-[#3B215E] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E5D4F3] dark:border-[#3B215E] flex items-center justify-between gap-3">
            <span className="text-xs font-mono-tabular font-medium text-[#1D1029] dark:text-[#FAF5FF] truncate">
              {currentFile?.path || 'Select a file'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!currentFile}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E5D4F3] dark:border-[#3B215E] text-xs font-medium text-[#1D1029] dark:text-[#FAF5FF] hover:border-[#DB2777] flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-5 overflow-x-auto max-h-[540px] text-xs leading-relaxed font-mono-tabular text-[#1D1029] dark:text-[#EADDF9] bg-[#FCF7FF] dark:bg-[#10071D]">
            <code>{currentFile?.content || ''}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
