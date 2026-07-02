require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// وظائف الإدارة
function getFiles() { return fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')); }

bot.command("start", (ctx) => {
    ctx.reply("هلا بيك! أنا NAMIKAZE AI. استخدم /new [اسم_الموضوع] لفتح سجل جديد، و /history لعرض السجلات.");
});

// فتح سجل جديد
bot.command("new", (ctx) => {
    const topic = ctx.message.text.split(" ").slice(1).join("_") || "General";
    const userId = ctx.from.id;
    const fileName = `${userId}_${topic}.json`;
    fs.writeFileSync(path.join(DATA_DIR, fileName), JSON.stringify({ current: [] }));
    ctx.reply(`✅ تم فتح سجل جديد باسم: ${topic}`);
});

// عرض السجلات مع أزرار للتبديل
bot.command("history", (ctx) => {
    const userId = ctx.from.id;
    const files = getFiles().filter(f => f.startsWith(userId.toString()));
    
    if (files.length === 0) return ctx.reply("ماكو سجلات حالياً. ابدأ واحد بـ /new");

    const buttons = files.map(f => {
        const topic = f.replace(`${userId}_`, "").replace(".json", "");
        return [Markup.button.callback(`📁 ${topic}`, `load_${f}`)];
    });

    ctx.reply("📜 سجل المحادثات (اضغط للتبديل):", Markup.inlineKeyboard(buttons));
});

// التعامل مع ضغطات الأزرار (التبديل بين السجلات)
bot.action(/load_(.+)/, (ctx) => {
    const fileName = ctx.match[1];
    // نحفظ الملف النشط في ذاكرة مؤقتة بسيطة أو نعتمد على تغيير اسم الملف النشط
    // للتبسيط: سنقوم بتغيير اسم ملف خاص باسم 'active_userId.txt'
    const userId = ctx.from.id;
    fs.writeFileSync(path.join(DATA_DIR, `active_${userId}.txt`), fileName);
    ctx.reply(`🔄 تم التحويل إلى سجل: ${fileName.replace(userId + "_", "").replace(".json", "")}`);
});

// المحادثة الذكية (تستخدم الملف النشط)
bot.on("message", async (ctx) => {
    const userId = ctx.from.id;
    const activeFile = path.join(DATA_DIR, `active_${userId}.txt`);
    const fileName = fs.existsSync(activeFile) ? fs.readFileSync(activeFile, "utf8") : `${userId}_General.json`;
    
    const filePath = path.join(DATA_DIR, fileName);
    let data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : { current: [] };

    data.current.push({ role: "user", content: ctx.message.text });
    // ... (هنا ضع كود الاتصال بالـ API كما في الكود السابق) ...
    // لا تنسَ حفظ البيانات في الـ filePath نفسه
});

bot.launch();
