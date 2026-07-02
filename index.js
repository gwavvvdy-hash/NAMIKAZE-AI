require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// ==========================
// DATA STORAGE
// ==========================
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadUser(userId) {
    const file = path.join(DATA_DIR, `${userId}.json`);
    if (!fs.existsSync(file)) return { current: [], history: [] };
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveUser(userId, data) {
    fs.writeFileSync(path.join(DATA_DIR, `${userId}.json`), JSON.stringify(data, null, 2));
}

// ==========================
// AI CHAT
// ==========================
bot.on("message", async (ctx) => {
    if (!ctx.message.text || ctx.message.text.startsWith("/")) return;

    const userId = ctx.from.id;
    let userData = loadUser(userId);
    
    if (userData.current.length === 0) {
        userData.current.push({ role: "system", content: "أنت مساعد ذكي ومطور احترافي." });
    }

    userData.current.push({ role: "user", content: ctx.message.text });
    
    // تقليص المحادثة للحفاظ على الذاكرة
    if (userData.current.length > 20) {
        userData.current = [userData.current[0], ...userData.current.slice(-19)];
    }

    try {
        await ctx.sendChatAction("typing");
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemini-2.0-flash-lite-001", // الموديل المطلوب اختباره
            messages: userData.current
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://github.com/namikaze-ai",
                "X-Title": "NAMIKAZE AI"
            }
        });

        const reply = response.data.choices?.[0]?.message?.content || "❌ لا يوجد رد.";
        userData.current.push({ role: "assistant", content: reply });
        saveUser(userId, userData);
        await ctx.reply(reply);

    } catch (err) {
        let errorMessage = "❌ حدث خطأ في الاتصال.\n\n";
        
        if (err.response && err.response.data && err.response.data.error) {
            const errorData = err.response.data.error;
            errorMessage += `السبب: ${errorData.message || "خطأ غير معروف"}\n\n`;
            
            // استخراج الموديلات المتاحة من استجابة الخطأ
            if (errorData.models && Array.isArray(errorData.models)) {
                errorMessage += "💡 الموديلات المتاحة لمفتاحك:\n• " + errorData.models.slice(0, 15).join("\n• ");
            }
        } else {
            errorMessage += `التفاصيل: ${err.message}`;
        }

        await ctx.reply(errorMessage);
    }
});

bot.launch();
console.log("🚀 NAMIKAZE AI Started with Auto-Debug Mode");
