const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
    try {
        const userText = ctx.message.text;
        
        // استخدام النموذج المحدث من قائمتك الجديدة
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: userText }] }]
        });

        const replyText = response.data.candidates[0].content.parts[0].text;
        await ctx.reply(replyText);
        
    } catch (error) {
        console.error("خطأ:", error.response ? error.response.data : error.message);
        ctx.reply('حدث خطأ في الاتصال بالنموذج الجديد.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن بنموذج gemini-3.5-flash!"));
