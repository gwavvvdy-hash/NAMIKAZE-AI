const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
    try {
        const userText = ctx.message.text;
        
        // استخدام النموذج 1.0-pro وهو الأكثر استقراراً في جميع المناطق
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: userText }] }]
        });

        const replyText = response.data.candidates[0].content.parts[0].text;
        ctx.reply(replyText);
        
    } catch (error) {
        console.error("خطأ تقني:", error.response ? error.response.data : error.message);
        ctx.reply('خطأ: تعذر الاتصال بالنموذج. تأكد من تفعيل Gemini API في حسابك.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن!"));
