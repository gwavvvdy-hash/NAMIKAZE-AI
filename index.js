require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// --- وظائف مساعدة ---
function loadUserFile(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : { current: [] };
}

function saveUserFile(fileName, data) {
    fs.writeFileSync(path.join(DATA_DIR, fileName), JSON.stringify(data, null, 2));
}

// --- الأوامر ---
bot.command("start", (ctx) => {
    ctx.reply("هلا بيك! أنا NAMIKAZE AI.\n\nالأوامر المتاحة:\n/new [اسم] - لفتح سجل جديد\n/clear - لمسح السجل الحالي\n/history - لعرض سجلاتك والتبديل بينها");
});

bot.command("new", (ctx) => {
    const topic = ctx.message.text.split(" ").slice(1).join("_") || "General";
    const fileName = `${ctx.from.id}_${topic}.json`;
    saveUserFile(fileName, { current: [] });
    fs.writeFileSync(path.join(DATA_DIR, `active_${ctx.from.id}.txt`), fileName);
    ctx.reply(`✅ تم فتح سجل جديد باسم: ${topic}`);
});

bot.command("clear", (ctx) => {
    const activeFile = path.join(DATA_DIR, `active_${ctx.from.id}.txt`);
    if (fs.existsSync(activeFile)) {
        const fileName = fs.readFileSync(activeFile, "utf8");
        saveUserFile(fileName, { current: [] });
        ctx.reply("✅ تم مسح ذاكرة هذا السجل وبدأنا صفحة جديدة!");
    } else {
        ctx.reply("⚠️ لا يوجد سجل نشط، استخدم /new لإنشاء سجل.");
    }
});

bot.command("history", (ctx) => {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith(ctx.from.id.toString()));
    if (files.length === 0) return ctx.reply("لا توجد سجلات. استخدم /new لإنشاء واحد.");
    
    const buttons = files.map(f => [Markup.button.callback(`📁 ${f.replace(ctx.from.id + "_", "").replace(".json", "")}`, `load_${f}`)]);
    ctx.reply("📜 سجل المحادثات (اضغط للتبديل):", Markup.inlineKeyboard(buttons));
});

bot.action(/load_(.+)/, (ctx) => {
    const fileName = ctx.match[1];
    fs.writeFileSync(path.join(DATA_DIR, `active_${ctx.from.id}.txt`), fileName);
    ctx.answerCbQuery(`تم التحويل إلى سجل: ${fileName.replace(ctx.from.id + "_", "").replace(".json", "")}`);
    ctx.reply(`🔄 تم التحويل إلى سجل: ${fileName.replace(ctx.from.id + "_", "").replace(".json", "")}`);
});

// --- معالجة الرسائل ---
bot.on("message", async (ctx) => {
    if (!ctx.message.text || ctx.message.text.startsWith("/")) return;

    const userId = ctx.from.id;
    const activeFile = path.join(DATA_DIR, `active_${userId}.txt`);
    const fileName = fs.existsSync(activeFile) ? fs.readFileSync(activeFile, "utf8") : `${userId}_General.json`;
    
    let data = loadUserFile(fileName);

    if (data.current.length === 0) {
        data.current.push({ role: "system", content: "أنت NAMIKAZE AI، مساعد ذكي ومطور احترافي، تجيد اللهجة العراقية والعربية بطلاقة." });
    }

    data.current.push({ role: "user", content: ctx.message.text });
    if (data.current.length > 10) data.current = [data.current[0], ...data.current.slice(-9)];

    try {
        await ctx.sendChatAction("typing");
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "google/gemma-2-27b-it",
            messages: data.current
        }, {
            headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "HTTP-Referer": "https://github.com/namikaze-ai", "X-Title": "NAMIKAZE AI" }
        });

        const reply = response.data.choices?.[0]?.message?.content;
        data.current.push({ role: "assistant", content: reply });
        saveUserFile(fileName, data);
        await ctx.reply(reply);
    } catch (err) {
        await ctx.reply("❌ عيوني، واجهت مشكلة تقنية، جرب مرة ثانية.");
    }
});

bot.launch();
console.log("🚀 NAMIKAZE AI is Live!");
