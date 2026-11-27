import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGreetingMessage,
  buildSystemInstruction,
  DEFAULT_BOSS_PROFILE,
  DEFAULT_HOTSPOT_CONFIG,
  detectConversationLanguage,
  parseDeviceActionCommand,
  parseHotspotVoiceCommand,
  validateHotspotConfig,
} from './sonaLogic';

test('detectConversationLanguage identifies Bhojpuri, Urdu, Hindi, Hinglish, and English', () => {
  assert.equal(detectConversationLanguage('Ka haal ba SONA? Humar man thoda thakal ba.'), 'Bhojpuri');
  assert.equal(detectConversationLanguage('Janab shukriya, bahut dilkash baat kahi aapne.'), 'Urdu');
  assert.equal(detectConversationLanguage('आज मौसम बहुत अच्छा है'), 'Hindi');
  assert.equal(detectConversationLanguage('Good morning, aaj ka din kaisa hai?'), 'Hinglish');
  assert.equal(detectConversationLanguage('Could you help me unwind tonight?'), 'English');
});

test('parseHotspotVoiceCommand handles ON, OFF, SSID, and password commands across languages', () => {
  assert.deepEqual(parseHotspotVoiceCommand('SONA, mera mobile hotspot on karo'), {
    matched: true,
    action: 'enable',
  });
  assert.deepEqual(parseHotspotVoiceCommand('Hotspot band kardo please'), {
    matched: true,
    action: 'disable',
  });
  assert.deepEqual(parseHotspotVoiceCommand('Change hotspot name to Boss_5G rakho'), {
    matched: true,
    action: 'set_ssid',
    value: 'Boss_5G',
  });
  assert.deepEqual(parseHotspotVoiceCommand('hotspot password mysecret99 set karo'), {
    matched: true,
    action: 'set_password',
    value: 'mysecret99',
  });
});

test('parseDeviceActionCommand detects open app, call, SMS, Wi-Fi, and device info queries', () => {
  assert.deepEqual(parseDeviceActionCommand('SONA, WhatsApp open karo'), {
    matched: true,
    type: 'open_app',
    target: 'Whatsapp',
  });
  assert.deepEqual(parseDeviceActionCommand('Open YouTube'), {
    matched: true,
    type: 'open_app',
    target: 'Youtube',
  });
  assert.deepEqual(parseDeviceActionCommand('Mom ko call karo'), {
    matched: true,
    type: 'make_call',
    target: 'Mom',
  });
  assert.deepEqual(parseDeviceActionCommand('Send SMS to Rahul saying I am reaching in 10 mins'), {
    matched: true,
    type: 'send_sms',
    target: 'Rahul',
    messageBody: 'I am reaching in 10 mins',
  });
  assert.deepEqual(parseDeviceActionCommand('Wi-Fi off kardo'), {
    matched: true,
    type: 'wifi_off',
  });
  assert.deepEqual(parseDeviceActionCommand('Aaj ka weather kaisa hai?'), {
    matched: true,
    type: 'device_info',
  });
});

test('validateHotspotConfig enforces SSID length and WPA2 password minimum 8 chars', () => {
  assert.equal(validateHotspotConfig('SONA_Net', '12345678').valid, true);
  assert.equal(validateHotspotConfig('', '12345678').valid, false);
  assert.equal(validateHotspotConfig('SONA_Net', 'short').valid, false);
});

test('buildGreetingMessage and buildSystemInstruction reflect custom assistantName and Boss name', () => {
  const customProfile = {
    ...DEFAULT_BOSS_PROFILE,
    assistantName: 'TARA',
    bossName: 'Aarav',
    nickname: 'Jaan',
    loveMode: 'sad-support' as const,
  };
  const greeting = buildGreetingMessage(customProfile);
  assert.ok(greeting.includes('TARA'));
  assert.ok(greeting.includes('Jaan'));

  const instruction = buildSystemInstruction(customProfile, 'Hinglish', DEFAULT_HOTSPOT_CONFIG);
  assert.ok(instruction.includes('You are TARA'));
  assert.ok(instruction.includes('Aarav'));
  assert.ok(instruction.includes('Never claim real human biological feelings'));
});
