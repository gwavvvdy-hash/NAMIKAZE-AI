const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: ctx.message.text }] }] }
        );
        ctx.reply(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        ctx.reply('خطأ: ' + (error.response?.data?.error?.message || error.message));
    }
});

bot.launch();
