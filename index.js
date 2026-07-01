const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// تنظيف الاتصالات وضمان التشغيل المستقر
bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch({ dropPendingUpdates: true });
    console.log("NAMIKAZE AI يعمل الآن بنجاح مع نموذج gemini-3.5-flash وتطويرات Flux!");
});

bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // 1. ميزة الرسم بتقنية Flux المحسنة
    if (lowerText.startsWith('ارسم ') || lowerText.startsWith('صورة ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) return ctx.reply('يرجى كتابة وصف للصورة بعد كلمة ارسم.');
        
        await ctx.sendChatAction('upload_photo');
        
        // تحسين الـ Prompt لضمان دقة التشريح (يدين فقط)
        const enhancedPrompt = `${prompt}, high detail, photorealistic, cinematic lighting, accurate human anatomy, exactly two arms, holding a wounded cat gently`;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
        
        return ctx.replyWithPhoto({ url: imageUrl }, { 
            caption: `NAMIKAZE AI - Flux:\n${prompt}` 
        });
    }

    // 2. المحادثة الذكية باستخدام النموذج القوي gemini-3.5-flash
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const result = await model.generateContent(userText);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error("خطأ في المعالجة:", error);
        ctx.reply('حدث خطأ تقني، تأكد من إعدادات الـ API.');
    }
});

// معالجة إغلاق البوت بسلام
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
