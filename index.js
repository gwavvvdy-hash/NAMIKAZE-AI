const { Telegraf } = require("telegraf");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

bot.on("text", async (ctx) => {
    const userText = ctx.message.text;
    const lowerText = userText.toLowerCase();

    // ===========================
    // AI Horde Image Generator
    // ===========================
    if (lowerText.startsWith("ارسم ")) {

        const prompt = userText.substring(5).trim();

        if (!prompt) {
            return ctx.reply("❌ اكتب وصفًا للصورة.");
        }

        await ctx.sendChatAction("upload_photo");
        const waitMsg = await ctx.reply("🎨 جاري إنشاء الصورة...");

        try {

            const { data } = await axios.post(
                "https://aihorde.net/api/v2/generate/async",
                {
                    prompt: `${prompt}, masterpiece, best quality, ultra detailed, photorealistic, perfect anatomy`,
                    params: {
                        width: 1024,
                        height: 1024,
                        steps: 30,
                        cfg_scale: 7,
                        sampler_name: "k_euler",
                        n: 1
                    },
                    nsfw: false
                },
                {
                    headers: {
                        "Client-Agent": "NAMIKAZE AI",
                        "Content-Type": "application/json"
                    }
                }
            );

            const id = data.id;

            while (true) {

                await new Promise(resolve => setTimeout(resolve, 3000));

                const status = await axios.get(
                    `https://aihorde.net/api/v2/generate/check/${id}`
                );

                if (!status.data.done) {
                    continue;
                }

                const result = await axios.get(
                    `https://aihorde.net/api/v2/generate/status/${id}`
                );

                if (
                    result.data.generations &&
                    result.data.generations.length > 0
                ) {

                    await ctx.deleteMessage(waitMsg.message_id);

                    return ctx.replyWithPhoto({
                        url: result.data.generations[0].img
                    });
                }

                throw new Error("لم يتم إنشاء الصورة.");
            }

        } catch (error) {

            console.error(
                error.response?.data ||
                error.message ||
                error
            );

            await ctx.reply("❌ فشل إنشاء الصورة.");

            return;
        }
    }

    // ===========================
    // Gemini Chat
    // ===========================

    try {

        await ctx.sendChatAction("typing");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const result = await model.generateContent(userText);

        await ctx.reply(result.response.text());

    } catch (error) {

        console.error(error);

        await ctx.reply("❌ حدث خطأ أثناء معالجة طلبك.");

    }

});

bot.launch();

console.log("🤖 NAMIKAZE AI Started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
