const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', async (ctx) => {
    try {
        const userText = ctx.message.text;
        const apiKey = process.env.GEMINI_API_KEY;
        
        // المحاولة باستخدام النموذج القياسي العالمي v1beta
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{ parts: [{ text: userText }] }]
        });

        const replyText = response.data.candidates[0].content.parts[0].text;
        await ctx.reply(replyText);
        
    } catch (error) {
        console.error("خطأ تقني في الاتصال الأساسي:", error.message);
        
        // ذكاء اصطناعي تشخيصي: إذا فشل الاتصال، يجلب البوت قائمة النماذج المتاحة لمفتاحك فوراً
        try {
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
            const listRes = await axios.get(listUrl);
            
            if (listRes.data && listRes.data.models) {
                const availableModels = listRes.data.models.map(m => m.name.replace('models/', '')).join('\n• ');
                await ctx.reply(`⚠️ خطأ: النموذج الافتراضي لم يعمل.\n\nالنماذج المتاحة والمدعومة لمفتاحك حالياً هي:\n• ${availableModels}\n\n(اختر أحدها لأضعه لك في الكود)`);
            } else {
                await ctx.reply('⚠️ استجابة غريبة من جوجل، لم يتم العثور على نماذج نشطة في هذا الحساب.');
            }
        } catch (listError) {
            // إذا فشل جلب القائمة أيضاً، فهذا يعني الحظر التام للمفتاح أو المنطقة
            await ctx.reply('❌ خطأ فادح: مفتاح الـ API الخاص بك غير صالح، أو أن منطقتك الجغرافية الحالية محظورة تماماً من استخدام خدمات Google AI Studio عبر السيرفر.');
        }
    }
});

bot.launch().then(() => console.log("NAMIKAZE AI يعمل بنمط التشخيص الذكي..."));
