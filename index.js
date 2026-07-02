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

bot.on("message", async (ctx) => {
    if (!ctx.message.text || ctx.message.text.startsWith("/")) return;

    const userId = ctx.from.id;
    let userData = loadUser(userId);
    
    // تعريف الهوية
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
            // الموديل المستقر الجديد
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
console.log("🚀 NAMIKAZE AI Started with Gemma-2-27B!");
