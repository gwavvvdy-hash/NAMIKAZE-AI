const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// إعداد الاتصال
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// استخدام نموذج gemini-pro لضمان الاستقرار وتجنب خطأ 404
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// التعامل مع الرسائل النصية
bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');
        const result = await model.generateContent(ctx.message.text);
        const response = await result.response;
        const text = response.text();
        await ctx.reply(text);
    } catch (error) {
        console.error("خطأ تقني:", error);
        ctx.reply('عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
    }
});

// إزالة أي Webhook عالق قبل التشغيل
bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch(() => {
        console.log("NAMIKAZE AI يعمل الآن بنجاح!");
    });
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
