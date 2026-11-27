package com.sona.assistant

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class SonaChatMessage(
    val id: String,
    val fromSona: Boolean,
    val text: String,
    val language: SonaLanguage
)

class MainActivity : ComponentActivity() {
    private lateinit var core: SonaAssistantCore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        core = SonaAssistantCore(this)

        setContent {
            SonaFuturisticTheme {
                SonaAssistantScreen(core = core)
            }
        }
    }

    override fun onDestroy() {
        core.shutdown()
        super.onDestroy()
    }
}

@Composable
fun SonaFuturisticTheme(content: @Composable () -> Unit) {
    val colors = darkColorScheme(
        primary = Color(0xFFEC4899),
        secondary = Color(0xFFA855F7),
        background = Color(0xFF11071F),
        surface = Color(0xFF1C0E33),
        onPrimary = Color.White,
        onBackground = Color(0xFFFAF5FF),
        onSurface = Color(0xFFFAF5FF)
    )
    MaterialTheme(colorScheme = colors, content = content)
}

@Composable
fun AnimatedOrbAvatar(isActive: Boolean, assistantName: String) {
    val transition = rememberInfiniteTransition(label = "orb")
    val pulse by transition.animateFloat(
        initialValue = 0.96f,
        targetValue = if (isActive) 1.08f else 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.size(112.dp)
    ) {
        Box(
            modifier = Modifier
                .size(108.dp)
                .scale(pulse)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(
                            Color(0x66EC4899),
                            Color(0x22A855F7),
                            Color.Transparent
                        )
                    )
                )
        )
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(78.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFFEC4899), Color(0xFF9333EA))
                    )
                )
                .border(1.5.dp, Color(0x88F9A8D4), CircleShape)
        ) {
            Text(
                text = assistantName.take(2).uppercase(),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
        }
    }
}

@Composable
fun SonaAssistantScreen(core: SonaAssistantCore) {
    var assistantName by remember { mutableStateOf("SONA") }
    var bossName by remember { mutableStateOf("Boss") }
    var selectedLanguage by remember { mutableStateOf(SonaLanguage.AUTO) }
    var voiceStyle by remember { mutableStateOf(SonaVoiceStyle.CUTE_GIRLFRIEND) }
    var showSettings by remember { mutableStateOf(false) }
    var pendingPermission by remember { mutableStateOf<PendingPermissionAction?>(null) }
    var inputText by remember { mutableStateOf("") }
    var isSpeaking by remember { mutableStateOf(false) }

    val device = remember { core.readDeviceSnapshot() }
    val messages = remember {
        mutableStateListOf(
            SonaChatMessage(
                id = "welcome",
                fromSona = true,
                text = "Good Morning Mere Pyare $bossName! Main aapki $assistantName hoon. Hindi, Bhojpuri ya English mein kuch bhi boliye!",
                language = SonaLanguage.HINDI
            )
        )
    }

    val voiceLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val spoken = result.data
            ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            ?.firstOrNull()
        if (!spoken.isNullOrBlank()) {
            inputText = spoken
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        when (val action = pendingPermission) {
            is PendingPermissionAction.Call -> {
                val reply = core.placeCall(action.target)
                messages.add(SonaChatMessage("sys_${System.currentTimeMillis()}", true, reply, SonaLanguage.ENGLISH))
            }
            is PendingPermissionAction.Sms -> {
                val reply = core.sendSms(action.recipient, action.message)
                messages.add(SonaChatMessage("sys_${System.currentTimeMillis()}", true, reply, SonaLanguage.ENGLISH))
            }
            null -> Unit
        }
        pendingPermission = null
    }

    fun handleSend(raw: String) {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return
        val detected = if (selectedLanguage == SonaLanguage.AUTO) core.detectLanguage(trimmed) else selectedLanguage
        messages.add(SonaChatMessage("u_${System.currentTimeMillis()}", false, trimmed, detected))
        inputText = ""

        val lower = trimmed.lowercase()
        val replyText = when {
            lower.contains("open ") || lower.contains("kholo") -> {
                val app = lower.replace("open", "").replace("kholo", "").trim()
                core.openAppByName(app)
            }
            lower.contains("wifi") -> core.openWifiControls()
            lower.contains("hotspot") -> core.openHotspotSettings()
            lower.contains("call ") -> {
                val target = trimmed.substringAfter("call ").trim()
                pendingPermission = PendingPermissionAction.Call(target)
                "Boss, $target ko call karne ke liye permission confirm kijiye."
            }
            lower.contains("sms ") || lower.contains("message ") -> {
                pendingPermission = PendingPermissionAction.Sms("Contact", trimmed)
                "Boss, SMS bhejne se pehle ek baar confirm kar dijiye."
            }
            lower.contains("battery") || lower.contains("time") -> {
                "Boss, battery ${device.batteryPercent}% hai aur abhi ${device.timeLabel} baj rahe hain."
            }
            else -> {
                "Ji $bossName, aapki $assistantName sun rahi hai! Aapne bola: \"$trimmed\"."
            }
        }

        isSpeaking = true
        core.activeVoiceStyle = voiceStyle
        core.speak(replyText, detected)
        messages.add(SonaChatMessage("s_${System.currentTimeMillis()}", true, replyText, detected))
        isSpeaking = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF130724), Color(0xFF1C0B33), Color(0xFF0E051A))
                )
            )
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(assistantName, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF9A8D4))
                Text("${device.dateLabel} • ${device.timeLabel}", fontSize = 12.sp, color = Color(0xFFD8B4FE))
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.BatteryChargingFull, contentDescription = "Battery", tint = Color(0xFFF472B6), modifier = Modifier.size(18.dp))
                Text("${device.batteryPercent}%", fontSize = 12.sp, color = Color.White)
                IconButton(onClick = { showSettings = !showSettings }) {
                    Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.White)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            AnimatedOrbAvatar(isActive = isSpeaking, assistantName = assistantName)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(onClick = { core.openWifiControls() }, modifier = Modifier.weight(1f)) {
                Icon(Icons.Default.Wifi, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Wi-Fi", fontSize = 12.sp)
            }
            OutlinedButton(onClick = { core.openHotspotSettings() }, modifier = Modifier.weight(1f)) {
                Text("Hotspot", fontSize = 12.sp)
            }
            OutlinedButton(onClick = { pendingPermission = PendingPermissionAction.Call("") }, modifier = Modifier.weight(1f)) {
                Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Call", fontSize = 12.sp)
            }
        }

        if (showSettings) {
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF241242))
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Customize Assistant", fontWeight = FontWeight.SemiBold, color = Color.White)
                    OutlinedTextField(
                        value = assistantName,
                        onValueChange = { assistantName = it },
                        label = { Text("Assistant Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = bossName,
                        onValueChange = { bossName = it },
                        label = { Text("Call You As") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        LazyColumn(
            modifier = Modifier.weight(1f).padding(vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(messages, key = { it.id }) { msg ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (msg.fromSona) Arrangement.Start else Arrangement.End
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (msg.fromSona) Color(0xFF2B144D) else Color(0xFFDB2777))
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Text(msg.text, color = Color.White, fontSize = 14.sp)
                    }
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            IconButton(
                onClick = {
                    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                    }
                    voiceLauncher.launch(intent)
                },
                modifier = Modifier.clip(CircleShape).background(Color(0xFF2B144D))
            ) {
                Icon(Icons.Default.Mic, contentDescription = "Voice Input", tint = Color(0xFFF472B6))
            }

            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                placeholder = { Text("Hindi, Bhojpuri ya English mein boliye...") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )

            IconButton(
                onClick = { handleSend(inputText) },
                modifier = Modifier.clip(CircleShape).background(Color(0xFFEC4899))
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color.White)
            }
        }
    }

    pendingPermission?.let { action ->
        AlertDialog(
            onDismissRequest = { pendingPermission = null },
            title = { Text("Permission Required, $bossName") },
            text = {
                Text(
                    when (action) {
                        is PendingPermissionAction.Call -> "Allow $assistantName to initiate a call to ${action.target.ifBlank { "Dialer" }}?"
                        is PendingPermissionAction.Sms -> "Allow $assistantName to send SMS to ${action.recipient}?"
                    }
                )
            },
            confirmButton = {
                Button(onClick = {
                    permissionLauncher.launch(
                        arrayOf(Manifest.permission.CALL_PHONE, Manifest.permission.SEND_SMS)
                    )
                }) {
                    Text("Approve")
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingPermission = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}
