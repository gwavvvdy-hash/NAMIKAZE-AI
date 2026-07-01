const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// حل مشكلة 409: حذف أي تحديثات معلقة عند بدء التشغيل
bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch({ dropPendingUpdates: true });
    console.log("NAMIKAZE AI يعمل الآن بنجاح!");
});

bot.on('text', async (ctx) => {
    const userText = ctx.message.text;

    try {
        await ctx.sendChatAction('typing');
        
        // استخدام نموذج مستقر ومضمون
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await model.generateContent(userText);
        const responseText = result.response.text();
        
        await ctx.reply(responseText);
    } catch (error) {
        console.error("خطأ تقني:", error);
        ctx.reply('حدث خطأ في الاتصال بالذكاء الاصطناعي (Gemini). تأكد من صلاحية مفتاح API.');
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
