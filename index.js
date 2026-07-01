const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const userMemory = {};

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.trim().toLowerCase();

    // 1. قاعدة طلب الصورة (Gemini يحلل الطلب أولاً ثم يرسله للمولد)
    if (lowerText.startsWith('صورة ') || lowerText.startsWith('ارسم ')) {
        const userPrompt = userText.split(' ').slice(1).join(' ');
        if (!userPrompt) return ctx.reply('يرجى كتابة وصف للصورة.');
        
        try {
            await ctx.sendChatAction('typing'); 
            
            // هنا الذكاء: نطلب من Gemini صياغة وصف احترافي للرسم (Prompt)
            const promptRefiner = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                contents: [{ parts: [{ text: `أنت خبير في كتابة وصف الصور للذكاء الاصطناعي. اكتب وصفاً دقيقاً ومفصلاً باللغة الإنجليزية للطلب التالي لضمان دقة الرسم: "${userPrompt}". اكتب الوصف فقط بدون أي مقدمات.` }] }]
            });
            
            const detailedPrompt = promptRefiner.data.candidates[0].content.parts[0].text;
            
            await ctx.sendChatAction('upload_photo');
            const finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(detailedPrompt)}?width=1024&height=1024&model=flux&seed=42`; 
            
            return await ctx.replyWithPhoto({ url: finalImageUrl }, { caption: `رسمت لك: ${userPrompt}` });
        } catch (error) {
            return ctx.reply('حدث خطأ، حاول مرة أخرى.');
        }
    }

    // (بقية الأوامر كما هي: اسمي، ما اسمي، من أنت، والرد الذكي)
    if (lowerText.startsWith('اسمي ')) {
        const name = userText.split(' ').slice(1).join(' ');
        userMemory[chatId] = name;
        return ctx.reply(`تم حفظ اسمك: ${name}`);
    }

    if (lowerText.includes('ما اسمي')) {
        return userMemory[chatId] ? ctx.reply(`اسمك هو ${userMemory[chatId]}`) : ctx.reply('لم تخبرني باسمك بعد.');
    }

    if (lowerText.includes('من انت')) {
        return ctx.reply('أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام');
    }

    // الرد الذكي المعتاد
    try {
        await ctx.sendChatAction('typing');
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [{ parts: [{ text: userText }] }]
        });
        await ctx.reply(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        ctx.reply('حدث خطأ.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI عاد بأقوى استراتيجية للرسم!"));
