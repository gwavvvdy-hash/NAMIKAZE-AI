require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// وظيفة حفظ واسترجاع المحادثة (نظام الذاكرة)
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
    
    // تعريف هوية البوت (هنا يكمن سر اللهجة العراقية والذكاء)
    if (userData.current.length === 0) {
        userData.current.push({ 
            role: "system", 
            content: `أنت NAMIKAZE AI، مساعد ذكاء اصطناعي متطور. 
            قواعدك:
            1. أجب باللهجة العراقية القريبة للقلب أو العربية الفصحى.
            2. أنت مبرمج وخبير تقني، تفهم الكود والمنطق.
            3. لا تستخدم لغات غريبة، أجب بوضوح.
            4. التزم بالهوية العراقية في أسلوبك (ودود، ذكي، وواثق).
            5. اسمك NAMIKAZE AI ومطورك @Namikaze_YT.` 
        });
    }

    userData.current.push({ role: "user", content: ctx.message.text });
    if (userData.current.length > 15) userData.current = [userData.current[0], ...userData.current.slice(-14)];

    try {
        await ctx.sendChatAction("typing");
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            // اختر الموديل الأفضل من قائمتك المجانية (Gemma 4 26B)
            model: "google/gemma-4-26b-it",
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
        console.error(err);
        await ctx.reply("❌ عيوني، صار خلل بالاتصال. تأكد من الموديل أو حاول مرة ثانية.");
    }
});

bot.launch();
console.log("🚀 NAMIKAZE AI Ready!");
