const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// مصفوفة لحفظ أسماء المستخدمين (ذاكرة مؤقتة)
const userMemory = {};

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // 1. قاعدة حفظ الاسم (مثال: "اسمي امير")
    if (lowerText.startsWith('اسمي ')) {
        const name = userText.split(' ').slice(1).join(' ');
        userMemory[chatId] = name;
        return ctx.reply(`تشرفت بك يا ${name}! لقد حفظت اسمك في ذاكرتي.`);
    }

    // 2. قاعدة السؤال عن الاسم ("ما هو اسمي")
    if (lowerText.includes('ما هو اسمي') || lowerText.includes('ما اسمي')) {
        const name = userMemory[chatId];
        return name ? ctx.reply(`اسمك هو ${name}`) : ctx.reply('لم تخبرني باسمك بعد! قل لي "اسمي [اسمك]" وسأحفظه.');
    }

    // 3. الرد المخصص لهوية البوت
    if (lowerText.includes('من انت') || lowerText.includes('ما اسمك')) {
        return ctx.reply('أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام');
    }

    // 4. معالجة الذكاء الاصطناعي (مع إرسال الاسم المحفوظ له ليعرف مع من يتحدث)
    try {
        await ctx.sendChatAction('typing');
        const context = userMemory[chatId] ? `المستخدم يتحدث معك واسمه: ${userMemory[chatId]}` : "المستخدم غير معروف";
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: `${context}\nسؤال المستخدم: ${userText}` }] }]
        });

        await ctx.reply(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        ctx.reply('حدث خطأ تقني.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن بذاكرة ذكية!"));
