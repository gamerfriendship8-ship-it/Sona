import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  buildSystemInstruction,
  detectConversationLanguage,
  parseDeviceActionCommand,
  parseHotspotVoiceCommand,
  VOICE_STYLES,
} from './src/utils/sonaLogic';
import type {
  BossProfile,
  ChatMessage,
  DeviceTelemetry,
  HotspotConfig,
} from './src/types/sona';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const ttsCache = new Map<string, { audioBase64: string; mimeType: string }>();
let liteTtsCooldownUntil = 0;

function isRateLimitMessage(msg: string): boolean {
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('rate limit')
  );
}

function getGeminiClient(apiVersion?: string): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
      retryOptions: {
        attempts: 2,
        initialDelay: 0.4,
        maxDelay: 1.0,
      },
    },
  });
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Misty';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Showers';
  return 'Thunderstorm';
}

function collectAndroidFiles(dir: string, baseDir: string): { path: string; content: string }[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: { path: string; content: string }[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectAndroidFiles(full, baseDir));
    } else {
      results.push({
        path: `android/${path.relative(baseDir, full)}`,
        content: fs.readFileSync(full, 'utf-8'),
      });
    }
  }
  return results;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    );
    res.json({ ok: true, geminiConfigured: hasKey });
  });

  app.get('/api/weather', async (req, res) => {
    try {
      const cityParam = typeof req.query.city === 'string' ? req.query.city.trim() : 'Mumbai';
      const safeCity = cityParam.slice(0, 60) || 'Mumbai';

      const geoResp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(safeCity)}&count=1&language=en&format=json`,
      );
      if (!geoResp.ok) {
        throw new Error('Geocoding service unavailable');
      }
      const geoData = (await geoResp.json()) as {
        results?: { latitude: number; longitude: number; name: string }[];
      };
      const place = geoData.results?.[0];
      if (!place) {
        return res.status(404).json({ error: `City "${safeCity}" not found.` });
      }

      const weatherResp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m`,
      );
      if (!weatherResp.ok) {
        throw new Error('Weather feed unavailable');
      }
      const weatherData = (await weatherResp.json()) as {
        current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
      };
      const current = weatherData.current;
      if (!current) {
        throw new Error('Incomplete weather payload');
      }

      return res.json({
        city: place.name,
        temperatureC: Math.round(current.temperature_2m),
        condition: weatherCodeToLabel(current.weather_code),
        windKph: Math.round(current.wind_speed_10m),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to fetch weather.';
      return res.status(502).json({ error: msg });
    }
  });

  app.get('/api/android-files', (_req, res) => {
    const androidDir = path.resolve(__dirname, 'android');
    const files = collectAndroidFiles(androidDir, androidDir);
    res.json({ files });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const {
        message,
        history = [],
        profile,
        hotspot,
        telemetry,
      } = req.body as {
        message?: string;
        history?: ChatMessage[];
        profile?: BossProfile;
        hotspot?: HotspotConfig;
        telemetry?: DeviceTelemetry;
      };

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message text is required.' });
      }
      if (!profile || !hotspot) {
        return res.status(400).json({ error: 'Profile and hotspot configuration are required.' });
      }

      const detectedLanguage = detectConversationLanguage(message);
      const hotspotCommand = parseHotspotVoiceCommand(message);
      const deviceCommand = parseDeviceActionCommand(message);

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error:
            'Gemini API key is not configured yet. Please check Settings > Secrets to add GEMINI_API_KEY.',
          detectedLanguage,
          hotspotCommand,
          deviceCommand,
        });
      }

      const systemInstruction = buildSystemInstruction(
        profile,
        detectedLanguage,
        hotspot,
        telemetry,
      );

      const recentHistory = history.slice(-10).map((m) => ({
        role: m.role === 'sona' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      const actionHints: string[] = [];
      if (hotspotCommand.matched) {
        actionHints.push(
          `Hotspot command triggered: action=${hotspotCommand.action}${
            hotspotCommand.value ? `, value="${hotspotCommand.value}"` : ''
          }.`,
        );
      }
      if (deviceCommand.matched) {
        actionHints.push(
          `Device command triggered: type=${deviceCommand.type}${
            deviceCommand.target ? `, target="${deviceCommand.target}"` : ''
          }${deviceCommand.messageBody ? `, smsBody="${deviceCommand.messageBody}"` : ''}. Note: Call/SMS requires explicit Boss confirmation in UI.`,
        );
      }

      const commandContext =
        actionHints.length > 0 ? `\n[System Context: ${actionHints.join(' ')}]` : '';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          ...recentHistory,
          { role: 'user', parts: [{ text: `${message.trim()}${commandContext}` }] },
        ],
        config: {
          systemInstruction,
        },
      });

      const assistantName = profile.assistantName?.trim() || 'SONA';
      const replyText =
        response.text?.trim() ||
        `${profile.nickname || profile.bossName}, मैं ${assistantName} यहीं हूँ आपके साथ! बताइए आज कैसे मदद करूँ? ❤️`;

      return res.json({
        reply: replyText,
        detectedLanguage,
        hotspotCommand,
        deviceCommand,
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'Unable to reach Gemini right now.';
      if (isRateLimitMessage(errMessage)) {
        return res.status(429).json({
          code: 'RATE_LIMIT_EXCEEDED',
          error:
            'Gemini API rate limit reached on the Free Tier. Please retry shortly or select a billing-enabled API key in Settings > Secrets.',
        });
      }
      console.error('[/api/chat error]', errMessage);
      return res.status(500).json({
        error: `SONA could not respond right now: ${errMessage}`,
      });
    }
  });

  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voiceStyle } = req.body as {
        text?: string;
        voiceStyle?: string;
      };

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Text is required for speech synthesis.' });
      }

      const ai = getGeminiClient('v1beta');
      if (!ai) {
        return res.status(503).json({
          error:
            'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      const voiceMeta =
        VOICE_STYLES.find((v) => v.id === voiceStyle) ?? VOICE_STYLES[0];
      const normalizedText = text.trim().slice(0, 600);
      const cacheKey = `${voiceMeta.id}::${normalizedText}`;
      const cached = ttsCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const synthesizeWithModel = async (modelName: string) => {
        return ai.interactions.create(
          {
            model: modelName,
            input: [
              {
                type: 'text',
                text: normalizedText,
                annotations: [
                  {
                    type: 'speech_metadata',
                    style: voiceMeta.ttsStylePrompt,
                  },
                ],
              },
            ],
            response_format: { type: 'audio' },
            generation_config: {
              speech_config: [
                {
                  voice: voiceMeta.ttsVoiceName,
                },
              ],
            },
          },
          {
            retries: { strategy: 'none' },
            timeout_ms: 15000,
          },
        );
      };

      let interaction;
      if (Date.now() < liteTtsCooldownUntil) {
        interaction = await synthesizeWithModel('gemini-3.8-flash-tts');
      } else {
        try {
          interaction = await synthesizeWithModel('gemini-3.8-flash-lite-tts');
        } catch (primaryErr: unknown) {
          const primaryMsg =
            primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
          if (isRateLimitMessage(primaryMsg)) {
            liteTtsCooldownUntil = Date.now() + 5 * 60 * 1000;
            interaction = await synthesizeWithModel('gemini-3.8-flash-tts');
          } else {
            throw primaryErr;
          }
        }
      }

      const base64Audio = interaction.output_audio?.data;

      if (!base64Audio) {
        return res.status(502).json({ error: 'No audio data returned by TTS model.' });
      }

      const payload = {
        audioBase64: base64Audio,
        mimeType: interaction.output_audio?.mime_type || 'audio/wav',
      };
      if (ttsCache.size >= 100) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) ttsCache.delete(firstKey);
      }
      ttsCache.set(cacheKey, payload);

      return res.json(payload);
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'TTS generation failed.';
      if (isRateLimitMessage(errMessage)) {
        return res.status(429).json({
          code: 'RATE_LIMIT_EXCEEDED',
          error:
            'Gemini TTS Free Tier daily limit reached. Please retry later or select a billing-enabled API key in Settings > Secrets.',
        });
      }
      console.error('[/api/tts error]', errMessage);
      return res.status(500).json({
        error: `Voice synthesis failed: ${errMessage}`,
      });
    }
  });

  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64 || typeof audioBase64 !== 'string') {
        return res.status(400).json({ error: 'Audio payload is required.' });
      }

      const ai = getGeminiClient('v1beta');
      if (!ai) {
        return res.status(503).json({
          error:
            'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe the spoken audio accurately in its original language (Hindi, English, Bhojpuri, or Urdu). Output only the transcription text.',
            },
          ],
        },
      });

      const transcript = response.text?.trim() || '';
      return res.json({
        transcript,
        detectedLanguage: detectConversationLanguage(transcript),
      });
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'Audio transcription failed.';
      if (isRateLimitMessage(errMessage)) {
        return res.status(429).json({
          code: 'RATE_LIMIT_EXCEEDED',
          error:
            'Gemini transcription rate limit reached on the Free Tier. Please retry later or select a billing-enabled API key in Settings > Secrets.',
        });
      }
      console.error('[/api/transcribe error]', errMessage);
      return res.status(500).json({
        error: `Transcription failed: ${errMessage}`,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SONA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
