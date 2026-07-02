require("dotenv").config();

const { Telegraf } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const DATA_DIR = path.join(__dirname, "data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadUser(userId) {
    const file = path.join(DATA_DIR, `${userId}.json`);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { current: [] };
}

function saveUser(userId, data) {
    fs.writeFileSync(path.join(DATA_DIR, `${userId}.json`), JSON.stringify(data, null, 2));
}

// --- قسم الأوامر ---
bot.command("start", (ctx) => {
    ctx.reply("هلا والله! أنا NAMIKAZE AI، مساعدك الذكي. أنا حاضر لأي سؤال تقني أو برمجي. شلون أگدر أساعدك اليوم؟");
});

bot.command("clear", (ctx) => {
    const userId = ctx.from.id;
    saveUser(userId, { current: [] });
    ctx.reply("تم مسح الذاكرة بنجاح، نبلش صفحة جديدة؟");
});

// أمر سجل المحادثات الجديد
bot.command("history", (ctx) => {
    const userId = ctx.from.id;
    const userData = loadUser(userId);
    
    if (userData.current.length <= 1) { // 1 لأن الـ system prompt محجوزة
        return ctx.reply("سجل المحادثات فارغ حالياً.");
    }

    let historyText = "📜 *سجل المحادثات*:\n\n";
    // نعرض آخر 6 رسائل ليكون التنسيق مرتباً
    userData.current.slice(-7).forEach(msg => {
        if (msg.role !== "system") {
            const name = msg.role === "user" ? "أنت" : "NAMIKAZE";
            historyText += `*${name}*: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}\n`;
        }
    });
    ctx.replyWithMarkdown(historyText);
});

// --- قسم المحادثة الذكية ---
bot.on("message", async (ctx) => {
    if (!ctx.message.text) return;

    const userId = ctx.from.id;
    let userData = loadUser(userId);
    
    if (userData.current.length === 0) {
        userData.current.push({ 
            role: "system", 
            content: "أنت NAMIKAZE AI، مساعد ذكي ومطور احترافي، تجيد اللهجة العراقية والعربية بطلاقة، وتتميز بالدقة في الأكواد والمنطق." 
        });
    }

    userData.current.push({ role: "user", content: ctx.message.text });
    if (userData.current.length > 10) userData.current = [userData.current[0], ...userData.current.slice(-9)];

    try {
        await ctx.sendChatAction("typing");
        
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemma-2-27b-it",
            messages: userData.current
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://github.com/namikaze-ai",
                "X-Title": "NAMIKAZE AI"
            }
        });

        const reply = response.data.choices?.[0]?.message?.content;
        userData.current.push({ role: "assistant", content: reply });
        saveUser(userId, userData);
        await ctx.reply(reply);

    } catch (err) {
        console.error("خطأ:", err.response ? err.response.data : err.message);
        await ctx.reply("❌ عيوني، واجهت مشكلة تقنية بسيطة. جرب ترسل الرسالة مرة ثانية.");
    }
});

bot.launch();
console.log("🚀 NAMIKAZE AI Ready with History Feature!");
