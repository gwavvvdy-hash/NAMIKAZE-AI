const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// نستخدم النموذج الأحدث بدون مسارات تجريبية
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

bot.on('text', async (ctx) => {
    try {
        const result = await model.generateContent(ctx.message.text);
        const response = await result.response;
        await ctx.reply(response.text());
    } catch (error) {
        // إذا استمر الخطأ، فالمشكلة في الـ API Key في منطقتك
        ctx.reply('خطأ تقني: ' + error.message);
    }
});

bot.launch();
