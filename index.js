const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/generative-ai'); // تأكد من تثبيت هذه المكتبة

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
const userMemory = {};

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.trim().toLowerCase();

    // 1. قاعدة طلب الصورة باستخدام Imagen 4
    if (lowerText.startsWith('صورة ') || lowerText.startsWith('ارسم ')) {
        const userPrompt = userText.split(' ').slice(1).join(' ');
        if (!userPrompt) return ctx.reply('يرجى كتابة وصف للصورة.');

        try {
            await ctx.sendChatAction('upload_photo');

            // استخدام نموذج Imagen 4 المدمج في Gemini API
            const model = genAI.getGenerativeModel({ model: 'imagen-4.0-generate-001' });
            
            const result = await model.generateImages({
                prompt: userPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: '1:1',
                    imageSize: '2k' // دقة عالية جداً
                }
            });

            const imageBytes = result.generatedImages[0].image.imageBytes;
            await ctx.replyWithPhoto({ source: Buffer.from(imageBytes, 'base64') }, { caption: `NAMIKAZE AI (Imagen 4): ${userPrompt}` });
            
        } catch (error) {
            console.error(error);
            ctx.reply('حدث خطأ أثناء استخدام Imagen 4. تأكد من إعدادات API الخاص بك.');
        }
        return;
    }

    // (بقية الأوامر كما هي في الكود السابق..)
    // ... حفظ الاسم ...
    // ... الرد الذكي المعتاد ...
});

bot.launch();
