const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
    bot.launch({ dropPendingUpdates: true });
    console.log("NAMIKAZE AI يعمل الآن مع نموذج Imagen 4!");
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
            // استخدام نموذج Imagen 4 المدمج في جوجل
            const model = genAI.getGenerativeModel({ model: 'imagen-4.0-generate-001' });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            // استخراج رابط الصورة
            const image = response.candidates[0].content.parts[0].imageBytes; 
            // ملاحظة: قد تختلف طريقة إخراج الصورة حسب تحديث المكتبة، 
            // إذا لم يرسل الصورة، أخبرني لنعدل طريقة المعالجة.
            
            return ctx.replyWithPhoto({ source: Buffer.from(image, 'base64') }, { 
                caption: `NAMIKAZE AI - Imagen 4:\n${prompt}` 
            });
        } catch (error) {
            console.error("خطأ في Imagen 4:", error);
            ctx.reply("حدث خطأ أثناء توليد الصورة.");
        }
    }

    // 2. المحادثة الذكية (Gemini 3.5 Flash)
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const result = await model.generateContent(userText);
        await ctx.reply(result.response.text());
    } catch (error) {
        ctx.reply('حدث خطأ تقني.');
    }
});
