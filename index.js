const { Telegraf } = require('telegraf');

// استدعاء التوكن من متغيرات البيئة التي ستضعها في Railway
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => ctx.reply('أهلاً بك! أنا NAMIKAZE-AI، كيف أساعدك اليوم؟'));
bot.on('text', (ctx) => {
    ctx.reply('لقد استلمت رسالتك: ' + ctx.message.text);
});

bot.launch().then(() => {
    console.log('البوت يعمل الآن!');
});
