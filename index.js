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

            const generate = await axios.post(
                "https://aihorde.net/api/v2/generate/async",
                {
                    prompt: `${prompt}, masterpiece, best quality, ultra detailed, photorealistic, cinematic lighting, sharp focus, perfect anatomy, correct hands, realistic face, realistic eyes, 8k`,
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
                        "Content-Type": "application/json",
                        "Client-Agent": "NAMIKAZE AI"
                    }
                }
            );

            const id = generate.data.id;

            while (true) {

                await new Promise(resolve => setTimeout(resolve, 3000));

                const status = await axios.get(
                    `https://aihorde.net/api/v2/generate/status/${id}`
                );

                if (!status.data.done) continue;

                if (!status.data.generations || status.data.generations.length === 0) {
                    throw new Error("No image generated");
                }

                const imageUrl = status.data.generations[0].img;

                await ctx.deleteMessage(waitMsg.message_id);

                return ctx.replyWithPhoto(
                    { url: imageUrl },
                    {
                        caption: `🖼️ ${prompt}`
                    }
                );
            }

        } catch (error) {
            console.error(error);
            return ctx.reply("❌ فشل إنشاء الصورة.");
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

        await ctx.reply("❌ حدث خطأ أثناء معالجة طلبك، حاول مرة أخرى.");

    }
});

bot.launch();
console.log("🤖 NAMIKAZE AI Started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
