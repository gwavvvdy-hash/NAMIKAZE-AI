const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// ذاكرة مؤقتة لحفظ الأسماء
const userMemory = {};

// رابط توليد الصور (نستخدم خدمة مجانية ومفتوحة المصدر تعتمد على أفضل النماذج)
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'YOUR_IMGBB_KEY_OPTIONAL'; // سنشرح هذا لاحقاً
const IMAGE_GENERATION_API = "https://image.pollinations.ai/prompt/"; // خدمة مجانية لتوليد الصور

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const userText = ctx.message.text;
    const lowerText = userText.trim().toLowerCase();

    // 1. قاعدة طلب الصورة (يبدأ بكلمة "صورة" أو "ارسم")
    if (lowerText.startsWith('صورة ') || lowerText.startsWith('ارسم ')) {
        const prompt = userText.split(' ').slice(1).join(' ');
        if (!prompt) {
            return ctx.reply('يرجى كتابة وصف للصورة بعد كلمة "صورة" أو "ارسم". مثال: "صورة سيارة رياضية"');
        }
        
        try {
            await ctx.sendChatAction('upload_photo'); // إظهار "جاري تحميل الصورة..."
            
            // تجهيز رابط الصورة (نستبدل المسافات بـ %20 لتوافق الرابط)
            const encodedPrompt = encodeURIComponent(prompt);
            // يمكن إضافة معلمات إضافية مثل الحجم والأسلوب إذا أردت (سنبسطها الآن)
            const finalImageUrl = `${IMAGE_GENERATION_API}${encodedPrompt}?nologo=true&width=1024&height=1024`;
            
            // إرسال الصورة مباشرة إلى تليجرام
            await ctx.replyWithPhoto({ url: finalImageUrl }, { caption: `إليك الصورة التي طلبتها لـ: "${prompt}"` });
            return;

        } catch (error) {
            console.error("خطأ في توليد الصورة:", error);
            return ctx.reply('حدث خطأ أثناء محاولة توليد الصورة. يرجى المحاولة لاحقاً.');
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

    // 4. الرد المخصص لهوية البوت
    if (lowerText.includes('من انت') || lowerText.includes('ما اسمك')) {
        return ctx.reply('أنا هو NAMIKAZE AI وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام');
    }

    // 5. معالجة الذكاء الاصطناعي (النص)
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

bot.launch().then(() => console.log("NAMIKAZE AI يعمل الآن (مع ميزة توليد الصور)!"));
