const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// الحل الجذري للتعارض (Conflict 409)
// نقوم بحذف الـ Webhook ونخبر تليجرام بتجاهل أي تحديثات قديمة معلقة
bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    console.log("تم تنظيف الاتصالات القديمة، جاري تشغيل البوت...");
    
    // تشغيل البوت مع خيار dropPendingUpdates للتأكد من عدم وجود تداخل
    bot.launch({ dropPendingUpdates: true }).then(() => {
        console.log("NAMIKAZE AI يعمل الآن بنجاح!");
    });
});

bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(ctx.message.text);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error("خطأ في المعالجة:", error);
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
