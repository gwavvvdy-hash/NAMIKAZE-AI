const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.launch();

bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // 1. ميزة الرسم (Flux - مستقر وسريع جداً)
    if (lowerText.startsWith('ارسم ') || lowerText.startsWith('صورة ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) return ctx.reply('يرجى كتابة وصف للصورة.');
        
        await ctx.sendChatAction('upload_photo');
        
        // تحسين الـ Prompt لضمان التشريح الصحيح (2 arm/2 leg constraint)
        const enhancedPrompt = `${prompt}, photorealistic, perfect human anatomy, exactly two arms, two hands, correct fingers, high quality`;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?model=flux&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
        
        return ctx.replyWithPhoto({ url: imageUrl }, { 
            caption: `NAMIKAZE AI (Flux):\n${prompt}` 
        });
    }

    // 2. المحادثة (Gemini 3.5 Flash)
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const result = await model.generateContent(userText);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error(error);
        ctx.reply('البوت متاح حالياً، جرب إرسال رسالتك مرة أخرى.');
    }
});
