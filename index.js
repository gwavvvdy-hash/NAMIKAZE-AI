const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// إعداد الاتصال
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// التعامل مع الرسائل النصية
bot.on('text', async (ctx) => {
    try {
        // إظهار حالة "جاري الكتابة" للمستخدم
        await ctx.sendChatAction('typing');

        // إرسال النص إلى Gemini
        const result = await model.generateContent(ctx.message.text);
        const response = await result.response;
        const text = response.text();

        // إرسال الرد
        await ctx.reply(text);
    } catch (error) {
        console.error("خطأ تقني:", error);
        ctx.reply('عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. حاول مرة أخرى.');
    }
});

// إعداد التشغيل وإزالة أي Webhook عالق لضمان عمل bot.launch
bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch(() => {
        console.log("NAMIKAZE AI يعمل الآن بنجاح!");
    });
});

// إيقاف البوت بأمان
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
