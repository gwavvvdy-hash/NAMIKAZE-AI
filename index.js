const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// استخدام النموذج مع تغيير الطريقة لتجنب مسارات v1beta المعطلة
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

bot.on('text', async (ctx) => {
    try {
        const result = await model.generateContent(ctx.message.text);
        const response = await result.response;
        ctx.reply(response.text());
    } catch (error) {
        // إذا استمر الخطأ، فالمشكلة في منطقة السيرفر نفسه
        console.error("خطأ:", error);
        ctx.reply('خطأ تقني: ' + error.message);
    }
});

bot.launch();
