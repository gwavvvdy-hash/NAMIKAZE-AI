require("dotenv").config();

const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

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
                    prompt: `${prompt}, masterpiece, best quality, ultra detailed, cinematic lighting, sharp focus`,
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
                        "apikey": process.env.AI_HORDE_API_KEY,
                        "Client-Agent": "NAMIKAZE AI"
                    }
                }
            );

            const id = generate.data.id;

            while (true) {

                await new Promise(resolve => setTimeout(resolve, 3000));

                const status = await axios.get(
                    `https://aihorde.net/api/v2/generate/status/${id}`,
                    {
                        headers: {
                            "apikey": process.env.AI_HORDE_API_KEY,
                            "Client-Agent": "NAMIKAZE AI"
                        }
                    }
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

            console.error(error.response?.data || error.message);

            return ctx.reply("❌ فشل إنشاء الصورة.");

        }

    }

    // ===========================
    // OpenRouter Chat
    // ===========================

    try {

        await ctx.sendChatAction("typing");        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openrouter/free",
                messages: [
                    {
                        role: "system",
                        content: `أنت Namikaze AI.

تجيب بالعربية بشكل طبيعي.
إذا المستخدم تكلم باللهجة العراقية جاوبه بنفس اللهجة.
كن ذكيًا ومختصرًا ودقيقًا.
لا تقل أنك ChatGPT أو OpenAI.`
                    },
                    {
                        role: "user",
                        content: userText
                    }
                ],
                max_tokens: 1024,
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/namikaze-ai",
                    "X-Title": "NAMIKAZE AI"
                }
            }
        );

        const reply =
            response.data.choices?.[0]?.message?.content ||
            "❌ لم يتم استلام رد من النموذج.";

        await ctx.reply(reply);

    } catch (error) {

        console.error(
            error.response?.data || error.message
        );

        await ctx.reply("❌ حدث خطأ أثناء معالجة الطلب.");
    }});

bot.launch();

console.log("🤖 NAMIKAZE AI Started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
