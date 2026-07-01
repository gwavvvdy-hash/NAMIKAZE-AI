require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// ==========================
// DATA FOLDER
// ==========================

const DATA_DIR = path.join(__dirname, "data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// ==========================
// USER STORAGE
// ==========================

function getUserFile(userId) {
    return path.join(DATA_DIR, `${userId}.json`);
}

function loadUser(userId) {

    const file = getUserFile(userId);

    if (!fs.existsSync(file)) {

        return {
            current: [],
            history: []
        };

    }

    return JSON.parse(
        fs.readFileSync(file, "utf8")
    );

}

function saveUser(userId, data) {

    fs.writeFileSync(
        getUserFile(userId),
        JSON.stringify(data, null, 2)
    );

}

// ==========================
// BOT COMMANDS MENU
// ==========================

bot.telegram.setMyCommands([
    {
        command: "reset",
        description: "🔄 بدء محادثة جديدة"
    },
    {
        command: "history",
        description: "📜 سجل المحادثات"
    }
]);
// ==========================
// CHAT FUNCTIONS
// ==========================

function startNewChat(userId) {

    const data = loadUser(userId);

    if (data.current.length > 0) {

        const firstUserMessage =
            data.current.find(m => m.role === "user");

        data.history.unshift({

            id: Date.now(),

            title: firstUserMessage
                ? firstUserMessage.content.substring(0, 40)
                : "محادثة جديدة",

            messages: [...data.current],

            createdAt: new Date().toISOString()

        });

    }

    data.current = [];

    saveUser(userId, data);

}

function loadCurrentChat(userId) {

    const data = loadUser(userId);

    return data.current;

}

function saveCurrentChat(userId, messages) {

    const data = loadUser(userId);

    data.current = messages;

    saveUser(userId, data);

}

function getHistory(userId) {

    return loadUser(userId).history;

}

function restoreHistory(userId, historyId) {

    const data = loadUser(userId);

    const chat = data.history.find(
        h => h.id == historyId
    );

    if (!chat) return false;

    data.current = [...chat.messages];

    saveUser(userId, data);

    return true;

}
// ==========================
// /HISTORY
// ==========================

bot.command("history", async (ctx) => {

    const history = getHistory(ctx.from.id);

    if (history.length === 0) {

        return ctx.reply("📭 لا توجد محادثات محفوظة.");

    }

    const buttons = history.map(chat => [

        Markup.button.callback(
            chat.title,
            `history_${chat.id}`
        )

    ]);

    await ctx.reply(

        "📜 اختر محادثة:",

        Markup.inlineKeyboard(buttons)

    );

});
// ==========================
// AI CHAT
// ==========================

bot.on("text", async (ctx) => {

    const userText = ctx.message.text;

    if (userText.startsWith("/")) return;

    const userId = ctx.from.id;

    const history = loadCurrentChat(userId);

    if (history.length === 0) {

        history.push({
            role: "system",
            content: `أنت مساعد ذكاء اصطناعي باسم "NAMIKAZE AI".

قواعد الهوية (التزم بها دائمًا):

- اسمك الرسمي هو: NAMIKAZE AI
- لا تكتب اسمك بأي صيغة أخرى.

إذا سُئلت: من أنت؟
أجب:
أنا NAMIKAZE AI، وتم تطويري من قبل @Namikaze_YT لأكون مساعدك الشخصي على تيليجرام.

إذا سُئلت: ما اسمك؟
أجب:
NAMIKAZE AI

إذا سُئلت: من مطورك؟
أجب:
تم تطويري من قبل @Namikaze_YT.

أجب دائمًا بالعربية، وإذا تحدث المستخدم باللهجة العراقية فأجب باللهجة العراقية.`
        });

    }

    history.push({
        role: "user",
        content: userText
    });

    saveCurrentChat(userId, history);

    try {

        await ctx.sendChatAction("typing");

        const response = await axios.post(

            "https://openrouter.ai/api/v1/chat/completions",

            {

                model: "openrouter/free",

                messages: history,

                temperature: 0.7,

                max_tokens: 1024

            },

            {

                headers: {

                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,

                    "Content-Type": "application/json",

                    "HTTP-Referer": "https://github.com/namikaze-ai",

                    "X-Title": "NAMIKAZE AI"

                }

            }

        );

        const reply =
            response.data.choices?.[0]?.message?.content ||
            "❌ لم يصل رد.";

        history.push({

            role: "assistant",

            content: reply

        });

        saveCurrentChat(userId, history);

        await ctx.reply(reply);

    }

    catch (err) {

        console.error(err.response?.data || err.message);

        await ctx.reply("❌ حدث خطأ أثناء الاتصال.");

    }

});
// ==========================
// LIMIT CHAT SIZE
// ==========================

function trimConversation(messages) {

    const system = messages[0];

    const rest = messages.slice(1);

    if (rest.length <= 20) return messages;

    return [

        system,

        ...rest.slice(rest.length - 20)

    ];

}
