const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// إعداد البوت و Gemini
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// استخدام النموذج المحدث
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

bot.on('text', async (ctx) => {
    try {
        const text = ctx.message.text;
        const result = await model.generateContent(text);
        const response = await result.response;
        await ctx.reply(response.text());
    } catch (error) {
        console.error("خطأ:", error);
        ctx.reply('حدث خطأ تقني، تأكد من مفاتيح التشغيل.');
    }
});

bot.launch().then(() => console.log("Bot is ready!"));
