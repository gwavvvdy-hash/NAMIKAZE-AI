const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// تهيئة البوت
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// سطر تتبع: يطبع في الـ Logs أي شيء يصل للبوت للتأكد من الاتصال
bot.use(async (ctx, next) => {
    console.log("تم استلام تحديث جديد من تليجرام:", ctx.updateType);
    await next();
});

// تنظيف الاتصالات المعلقة وإعادة التشغيل
bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch();
    console.log("NAMIKAZE AI يعمل الآن بنجاح!");
});

bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    console.log("نص الرسالة المستلم:", userText);

    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(userText);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error("خطأ في معالجة Gemini:", error);
        ctx.reply('حدث خطأ تقني في المعالجة.');
    }
});

// معالجة الإغلاق الآمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
