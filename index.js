const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const userMemory = {}; // ذاكرة مؤقتة لحفظ أسماء المستخدمين

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.trim().toLowerCase();

    // 1. قاعدة طلب الصورة (رسم احترافي مع تحسينات لمنع الأخطاء)
    if (lowerText.startsWith('صورة ') || lowerText.startsWith('ارسم ')) {
        const userPrompt = userText.split(' ').slice(1).join(' ');
        if (!userPrompt) return ctx.reply('يرجى كتابة وصف للصورة. مثال: "ارسم شخص يحمل قطة"');
        
        try {
            await ctx.sendChatAction('upload_photo');
            
            // الوصف الاحترافي والوصف السلبي لمنع التشوهات
            const refinedPrompt = `masterpiece, best quality, highly detailed, ${userPrompt}, 8k resolution, photorealistic`;
            const negativePrompt = "deformed, distorted, disfigured, human cat face, extra limbs, bad anatomy, blurry, low quality, cartoon, drawing";
            
            const encodedPrompt = encodeURIComponent(refinedPrompt);
            const encodedNegative = encodeURIComponent(negativePrompt);
            
            // الرابط مع إضافة المحددات لمنع الأخطاء
            const finalImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?negative=${encodedNegative}&width=1024&height=1024&nologo=true&model=flux`; 
            
            return await ctx.replyWithPhoto({ url: finalImageUrl }, { caption: `NAMIKAZE AI رسم لك: ${userPrompt}` });
        } catch (error) {
            return ctx.reply('حدث خطأ أثناء الرسم، حاول مرة أخرى.');
        }
    }

    // 2. قاعدة حفظ الاسم
    if (lowerText.startsWith('اسمي ')) {
        const name = userText.split(' ').slice(1).join(' ');
        userMemory[chatId] = name;
        return ctx.reply(`تشرفت بك يا ${name}! لقد حفظت اسمك في ذاكرتي.`);
    }

    // 3. قاعدة السؤال عن الاسم
    if (lowerText.includes('ما هو اسمي') || lowerText.includes('ما اسمي')) {
        const name = userMemory[chatId];
        return name ? ctx.reply(`اسمك هو ${name}`) : ctx.reply('لم تخبرني باسمك بعد! قل لي "اسمي [اسمك]" وسأحفظه.');
    }

    // 4. الرد المخصص للهوية
    if (lowerText.includes('من انت') || lowerText.includes('ما اسمك')) {
        return ctx.reply('أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام');
    }

    // 5. الرد الذكي المعتاد (Gemini)
    try {
        await ctx.sendChatAction('typing');
        const context = userMemory[chatId] ? `المستخدم يتحدث معك واسمه: ${userMemory[chatId]}` : "المستخدم غير معروف";
        
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [{ parts: [{ text: `${context}\nسؤال المستخدم: ${userText}` }] }]
        });

        await ctx.reply(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        ctx.reply('حدث خطأ تقني، يرجى المحاولة لاحقاً.');
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن مع ميزة الرسم المحسن!"));
