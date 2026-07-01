const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
    try {
        const userText = ctx.message.text;
        
        // استخدام الرابط المباشر للإصدار المستقر (v1) مع اسم النموذج الصحيح
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: userText }] }]
        });

        // استخراج الرد من استجابة JSON
        const replyText = response.data.candidates[0].content.parts[0].text;
        ctx.reply(replyText);
        
    } catch (error) {
        console.error("خطأ تقني:", error.response ? error.response.data : error.message);
        ctx.reply('حدث خطأ في الاتصال. حاول مرة أخرى لاحقاً.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن!"));
