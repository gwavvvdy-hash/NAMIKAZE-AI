const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');

        const userText = ctx.message.text;
        
        // التعليمات الخاصة بشخصية البوت
        const systemInstruction = "أنت هو NAMIKAZE AI، تم تطويرك من قبل @Namikaze_YT لتكون المساعد الشخصي للمستخدم على تيليجرام. عند سؤالك عن هويتك، أجب دائماً بهذه الجملة: 'أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام'.";
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        // دمج التعليمات مع رسالة المستخدم
        const response = await axios.post(apiUrl, {
            contents: [{ 
                parts: [{ text: systemInstruction + "\n\nسؤال المستخدم: " + userText }] 
            }]
        });

        const replyText = response.data.candidates[0].content.parts[0].text;
        await ctx.reply(replyText);
        
    } catch (error) {
        console.error("خطأ:", error.response ? error.response.data : error.message);
        ctx.reply('حدث خطأ تقني، يرجى المحاولة لاحقاً.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI جاهز للعمل!"));
