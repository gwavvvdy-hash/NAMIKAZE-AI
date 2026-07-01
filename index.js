const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// هذا السطر هو الحل الجذري لمشكلة الـ 409 (Conflict)
// يقوم بقطع أي اتصال قديم أو معلق مع خوادم تليجرام
bot.telegram.deleteWebhook({ drop_pending_updates: true });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const userMemory = {};

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.trim().toLowerCase();

    // 1. طلب صورة (طريقة Pollinations/Flux المستقرة)
    if (lowerText.startsWith('صورة ') || lowerText.startsWith('ارسم ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) return ctx.reply('يرجى كتابة وصف للصورة.');

        try {
            await ctx.sendChatAction('upload_photo');
            
            // استخدام Gemini لصياغة وصف احترافي للرسم
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(`Create a detailed, high-quality prompt for: ${prompt}. Return only the prompt in English.`);
            const refinedPrompt = result.response.text();
            
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(refinedPrompt)}?model=flux&width=1024&height=1024&nologo=true`;
            
            await ctx.replyWithPhoto({ url: imageUrl }, { caption: `NAMIKAZE AI: ${prompt}` });
        } catch (error) {
            ctx.reply('حدث خطأ أثناء الرسم.');
        }
        return;
    }

    // 2. الهوية والاسم
    if (lowerText.includes('من انت') || lowerText.includes('ما اسمك')) {
        return ctx.reply('أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام');
    }

    if (lowerText.startsWith('اسمي ')) {
        userMemory[chatId] = userText.split(' ').slice(1).join(' ');
        return ctx.reply(`تم حفظ اسمك: ${userMemory[chatId]}`);
    }

    // 3. المحادثة الذكية
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const res = await model.generateContent(userText);
        await ctx.reply(res.response.text());
    } catch (error) {
        ctx.reply('حدث خطأ تقني.');
    }
});

// تشغيل البوت مع معالجة إغلاق العملية
bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن بنجاح وبدون تعارض!"));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
