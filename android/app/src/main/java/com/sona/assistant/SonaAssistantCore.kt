package com.sona.assistant

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.provider.MediaStore
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

enum class SonaLanguage(val label: String, val locale: Locale) {
    AUTO("Auto (Hindi / Bhojpuri / English)", Locale("hi", "IN")),
    HINDI("Hindi", Locale("hi", "IN")),
    BHOJPURI("Bhojpuri", Locale("hi", "IN")),
    ENGLISH("English", Locale.ENGLISH)
}

enum class SonaVoiceStyle(val label: String, val pitch: Float, val rate: Float) {
    CUTE_GIRLFRIEND("Cute Girlfriend", 1.18f, 1.04f),
    SWEET_ROMANTIC("Sweet Romantic", 1.10f, 0.96f),
    MATURE_CARING("Mature Caring", 1.00f, 0.94f),
    NATURAL_INDIAN("Natural Indian Female", 1.06f, 1.00f)
}

sealed class PendingPermissionAction {
    data class Call(val target: String) : PendingPermissionAction()
    data class Sms(val recipient: String, val message: String) : PendingPermissionAction()
}

data class DeviceSnapshot(
    val batteryPercent: Int,
    val isCharging: Boolean,
    val dateLabel: String,
    val timeLabel: String,
    val wifiEnabled: Boolean
)

class SonaAssistantCore(private val context: Context) : TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = TextToSpeech(context, this)
    private var ttsReady = false
    var activeVoiceStyle: SonaVoiceStyle = SonaVoiceStyle.CUTE_GIRLFRIEND

    override fun onInit(status: Int) {
        ttsReady = status == TextToSpeech.SUCCESS
        if (ttsReady) {
            tts?.language = Locale("hi", "IN")
        }
    }

    fun speak(text: String, detectedLang: SonaLanguage) {
        if (!ttsReady) return
        tts?.language = detectedLang.locale
        tts?.setPitch(activeVoiceStyle.pitch)
        tts?.setSpeechRate(activeVoiceStyle.rate)
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "sona_${System.currentTimeMillis()}")
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
    }

    fun detectLanguage(input: String): SonaLanguage {
        val lower = input.lowercase(Locale.ROOT)
        val bhojpuriMarkers = listOf("ka haal", "kaisan ba", "humar", "roura", "bani", "kar da", "baate")
        if (bhojpuriMarkers.any { lower.contains(it) }) return SonaLanguage.BHOJPURI

        val hasDevanagari = input.any { it in '\u0900'..'\u097F' }
        val hindiMarkers = listOf("karo", "kholo", "batao", "mera", "meri", "aaj", "kya", "haan", "nahi")
        if (hasDevanagari || hindiMarkers.any { lower.contains(it) }) return SonaLanguage.HINDI

        return SonaLanguage.ENGLISH
    }

    fun readDeviceSnapshot(): DeviceSnapshot {
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val level = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).coerceIn(0, 100)
        val charging = batteryManager.isCharging

        val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
        val wifiEnabled = wifiManager?.isWifiEnabled == true

        val now = Date()
        val dateLabel = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault()).format(now)
        val timeLabel = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(now)

        return DeviceSnapshot(level, charging, dateLabel, timeLabel, wifiEnabled)
    }

    fun openAppByName(appName: String): String {
        val lower = appName.lowercase(Locale.ROOT).trim()
        val packageMap = mapOf(
            "whatsapp" to "com.whatsapp",
            "youtube" to "com.google.android.youtube",
            "spotify" to "com.spotify.music",
            "instagram" to "com.instagram.android",
            "maps" to "com.google.android.apps.maps",
            "chrome" to "com.android.chrome"
        )

        if (lower.contains("camera")) {
            val camIntent = Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(camIntent)
            return "Camera khol diya hai, Boss!"
        }

        if (lower.contains("setting")) {
            val settingsIntent = Intent(Settings.ACTION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(settingsIntent)
            return "Device Settings khol diya hai, Boss."
        }

        val targetPackage = packageMap.entries.firstOrNull { lower.contains(it.key) }?.value
        if (targetPackage != null) {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(targetPackage)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                return "$appName open kar diya hai, Boss!"
            }
        }
        return "Sorry Boss, $appName phone par installed nahi mila."
    }

    fun hasPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }

    fun placeCall(target: String): String {
        val cleanTarget = target.trim()
        val uri = Uri.parse("tel:$cleanTarget")
        val intent = if (hasPermission(Manifest.permission.CALL_PHONE)) {
            Intent(Intent.ACTION_CALL, uri)
        } else {
            Intent(Intent.ACTION_DIAL, uri)
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        return "Calling $cleanTarget for you, Boss."
    }

    fun sendSms(recipient: String, body: String): String {
        return if (hasPermission(Manifest.permission.SEND_SMS) && recipient.any { it.isDigit() }) {
            val smsManager = context.getSystemService(SmsManager::class.java)
            smsManager.sendTextMessage(recipient, null, body, null, null)
            "SMS sent to $recipient, Boss!"
        } else {
            val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:$recipient")).apply {
                putExtra("sms_body", body)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            "SMS composer opened for $recipient, Boss."
        }
    }

    fun openWifiControls(): String {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Intent(Settings.Panel.ACTION_WIFI)
        } else {
            Intent(Settings.ACTION_WIFI_SETTINGS)
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        return "Wi-Fi panel khol diya hai, Boss. Android 10+ par privacy ke liye user tap required hota hai."
    }

    fun openHotspotSettings(): String {
        val intent = Intent(Settings.ACTION_WIRELESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
        return "Hotspot & Tethering settings open kar di hain, Boss."
    }
}
