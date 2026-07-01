const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// نستخدم 'gemini-1.5-flash' وهو الأسرع والأكثر توافقاً
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

bot.on('text', async (ctx) => {
    try {
        console.log("جاري المعالجة لرسالة:", ctx.message.text);
        const result = await model.generateContent(ctx.message.text);
        const response = await result.response;
        await ctx.reply(response.text());
    } catch (error) {
        console.error("تفاصيل الخطأ:", error.message);
        // نرسل الخطأ للمستخدم لنعرف السبب الدقيق
        ctx.reply('خطأ الاتصال بـ Gemini: ' + error.message);
    }
});

bot.launch();
console.log("NAMIKAZE AI يعمل الآن...");
