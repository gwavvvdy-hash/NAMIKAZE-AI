const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const userMemory = {};

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // 1. [جديد] ميزة صنع الصور
    if (lowerText.startsWith('ارسم ') || lowerText.startsWith('صورة ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) return ctx.reply('يرجى كتابة وصف للصورة بعد كلمة ارسم.');
        
        await ctx.sendChatAction('upload_photo');
        // رابط توليد الصور المجاني والسريع
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 10000)}&nologo=true`;
        return ctx.replyWithPhoto({ url: imageUrl }, { caption: `رسمت لك: ${prompt}` });
    }

    // 2. حفظ الاسم
    if (lowerText.startsWith('اسمي ')) {
        const name = userText.split(' ').slice(1).join(' ');
        userMemory[chatId] = name;
        return ctx.reply(`تشرفت بك يا ${name}!`);
    }

    // 3. المحادثة مع Gemini (استخدمت الرابط الصحيح 1.5)
    try {
        await ctx.sendChatAction('typing');
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: userText }] }]
        });

        await ctx.reply(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        ctx.reply('حدث خطأ تقني، تأكد من مفتاح Gemini.');
    }
});

bot.launch({ dropPendingUpdates: true }).then(() => console.log("NAMIKAZE AI يعمل الآن مع صانع الصور!"));
