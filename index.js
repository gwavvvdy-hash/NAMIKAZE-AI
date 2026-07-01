const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.on('text', async (ctx) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(ctx.message.text);
        const response = await result.response;
        ctx.reply(response.text());
    } catch (error) {
        ctx.reply('عذراً، حدث خطأ أثناء الاتصال بـ Gemini.');
    }
});

bot.launch();
