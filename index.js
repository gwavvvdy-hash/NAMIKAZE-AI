const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// إنشاء البوت
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// استقبال الرسائل النصية
bot.on('text', async (ctx) => {
    const userText = ctx.message.text;

    try {
        await ctx.sendChatAction('typing');

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash'
        });

        const result = await model.generateContent(userText);

        await ctx.reply(result.response.text());
    } catch (error) {
        console.error(error);

        await ctx.reply(
            '❌ حدث خطأ أثناء معالجة طلبك، حاول مرة أخرى بعد قليل.'
        );
    }
});

// تشغيل البوت
bot.launch();
console.log("🤖 NAMIKAZE AI Started");

// إيقاف آمن
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
