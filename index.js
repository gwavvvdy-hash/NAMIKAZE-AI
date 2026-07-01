const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// تهيئة البوت و Gemini
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userMemory = {};

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.trim().toLowerCase();

    // 1. طلب صورة (Imagen)
    if (lowerText.startsWith('صورة ') || lowerText.startsWith('ارسم ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) return ctx.reply('يرجى كتابة وصف للصورة.');

        try {
            await ctx.sendChatAction('upload_photo');
            // استخدام نموذج Imagen
            const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-002' });
            const result = await model.generateImages({
                prompt: prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
            });

            const base64Image = result.response.images[0].image.imageBytes;
            await ctx.replyWithPhoto({ source: Buffer.from(base64Image, 'base64') }, { caption: `NAMIKAZE AI: ${prompt}` });
        } catch (error) {
            console.error(error);
            ctx.reply('حدث خطأ أثناء توليد الصورة.');
        }
        return;
    }

    // 2. الهوية والاسم
    if (lowerText.includes('من انت') || lowerText.includes('ما اسمك')) {
        return ctx.reply('أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام');
    }

    if (lowerText.startsWith('اسمي ')) {
        const name = userText.split(' ').slice(1).join(' ');
        userMemory[chatId] = name;
        return ctx.reply(`تشرفت بك يا ${name}! لقد حفظت اسمك.`);
    }

    if (lowerText.includes('ما هو اسمي')) {
        return userMemory[chatId] ? ctx.reply(`اسمك هو ${userMemory[chatId]}`) : ctx.reply('لم تخبرني باسمك بعد.');
    }

    // 3. المحادثة الذكية
    try {
        await ctx.sendChatAction('typing');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(userText);
        await ctx.reply(result.response.text());
    } catch (error) {
        ctx.reply('حدث خطأ في الاتصال بالذكاء الاصطناعي.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن بنجاح!"));
