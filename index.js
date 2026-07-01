const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch({ dropPendingUpdates: true });
    console.log("NAMIKAZE AI يعمل الآن مع Imagen 4 و Gemini 3.5 Flash!");
});

bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // 1. ميزة الرسم باستخدام Imagen 4
    if (lowerText.startsWith('ارسم ') || lowerText.startsWith('صورة ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) return ctx.reply('يرجى كتابة وصف للصورة بعد كلمة ارسم.');
        
        await ctx.sendChatAction('upload_photo');
        
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`,
                {
                    instances: [{ prompt: prompt }],
                    params: { sampleCount: 1 }
                }
            );

            const base64Image = response.data.predictions[0].bytesBase64Encoded;
            return ctx.replyWithPhoto({ source: Buffer.from(base64Image, 'base64') }, {
                caption: `NAMIKAZE AI - Imagen 4:\n${prompt}`
            });
        } catch (error) {
            console.error("خطأ Imagen:", error.response ? error.response.data : error.message);
            return ctx.reply("عذراً، فشل توليد الصورة. ربما نموذج Imagen غير متاح لمفتاح الـ API الخاص بك حالياً.");
        }
    }

    // 2. المحادثة الذكية باستخدام Gemini 3.5 Flash
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const result = await model.generateContent(userText);
        await ctx.reply(result.response.text());
    } catch (error) {
        console.error("خطأ في المحادثة:", error);
        ctx.reply('حدث خطأ في معالجة النص.');
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
