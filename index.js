const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // التحقق إذا كان المستخدم يسأل عن الهوية أو الاسم
    if (lowerText.includes('من انت') || lowerText.includes('ما اسمك') || lowerText.includes('تعرف عن نفسك')) {
        return ctx.reply('أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام');
    }

    // إذا لم يكن سؤالاً عن الهوية، ننتقل لمعالجة الذكاء الاصطناعي
    try {
        await ctx.sendChatAction('typing');
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: userText }] }]
        });

        const replyText = response.data.candidates[0].content.parts[0].text;
        await ctx.reply(replyText);
        
    } catch (error) {
        ctx.reply('حدث خطأ تقني، يرجى المحاولة لاحقاً.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI جاهز (الرد المخصص مفعل)!"));
