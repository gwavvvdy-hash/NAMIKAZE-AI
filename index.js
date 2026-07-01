const { Telegraf } = require('telegraf');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const userMemory = {};

// تنظيف الاتصالات المعلقة والتشغيل
bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch({ dropPendingUpdates: true });
    console.log("NAMIKAZE AI يعمل الآن مع ميزة الرسم Flux!");
});

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // 1. ميزة الرسم بتقنية Flux
    if (lowerText.startsWith('ارسم ') || lowerText.startsWith('صورة ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) return ctx.reply('يرجى كتابة وصف للصورة بعد كلمة ارسم.');
        
        await ctx.sendChatAction('upload_photo');
        // استخدام نموذج Flux للحصول على جودة عالية
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
        
        return ctx.replyWithPhoto({ url: imageUrl }, { 
            caption: `NAMIKAZE AI - Flux:\n${prompt}` 
        });
    }

    // 2. إدارة الذاكرة (الاسم)
    if (lowerText.startsWith('اسمي ')) {
        userMemory[chatId] = userText.split(' ').slice(1).join(' ');
        return ctx.reply(`تم حفظ اسمك: ${userMemory[chatId]}`);
    }

    // 3. المحادثة الذكية (Gemini 1.5 Flash)
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const context = userMemory[chatId] ? `المستخدم اسمه: ${userMemory[chatId]}` : "";
        
        const result = await model.generateContent(`${context}\n${userText}`);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error(error);
        ctx.reply('حدث خطأ تقني، تأكد من إعدادات الـ API.');
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
