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
        return { current: [], history: [] };
    }
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveUser(userId, data) {
    fs.writeFileSync(getUserFile(userId), JSON.stringify(data, null, 2));
}

// ==========================
// CHAT FUNCTIONS
// ==========================
function startNewChat(userId) {
    const data = loadUser(userId);
    if (data.current.length > 0) {
        const firstUserMessage = data.current.find(m => m.role === "user");
        data.history.unshift({
            id: Date.now(),
            title: firstUserMessage ? firstUserMessage.content.substring(0, 40) : "محادثة جديدة",
            messages: [...data.current],
            createdAt: new Date().toISOString()
        });
    }
    data.current = [];
    saveUser(userId, data);
}

function loadCurrentChat(userId) {
    return loadUser(userId).current;
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
    const chat = data.history.find(h => h.id == historyId);
    if (!chat) return false;
    data.current = [...chat.messages];
    saveUser(userId, data);
    return true;
}

function trimConversation(messages) {
    const system = messages[0];
    const rest = messages.slice(1);
    if (rest.length <= 20) return messages;
    return [system, ...rest.slice(rest.length - 20)];
}

// ==========================
// BOT COMMANDS
// ==========================
bot.telegram.setMyCommands([
    { command: "reset", description: "🔄 بدء محادثة جديدة" },
    { command: "history", description: "📜 سجل المحادثات" }
]);

bot.command("reset", async (ctx) => {
    const userId = ctx.from.id;
    
    // 1. أرشفة المحادثة الحالية
    startNewChat(userId);

    // 2. دفع الرسائل للأعلى
    const spacer = ".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n";
    const header = "✨ —————— [ محادثة جديدة ] —————— ✨\n\nتم حفظ المحادثة السابقة في /history، وبدء صفحة جديدة.";
    
    await ctx.reply(spacer + header);
});

bot.command("history", async (ctx) => {
    const history = getHistory(ctx.from.id);
    if (history.length === 0) return ctx.reply("📭 لا توجد محادثات محفوظة.");
    
    const buttons = history.map(chat => [
        Markup.button.callback(chat.title, `history_${chat.id}`)
    ]);
    await ctx.reply("📜 اختر محادثة لاستئنافها:", Markup.inlineKeyboard(buttons));
});

bot.action(/history_(.+)/, async (ctx) => {
    const id = ctx.match[1];
    const ok = restoreHistory(ctx.from.id, id);
    if (!ok) return ctx.answerCbQuery("❌ المحادثة غير موجودة.");
    await ctx.editMessageText("✅ تم استرجاع المحادثة. يمكنك الآن الإكمال.");
});

// ==========================
// AI CHAT
// ==========================
bot.on("message", async (ctx) => {
    if (!ctx.message.text || ctx.message.text.startsWith("/")) return;

    const userId = ctx.from.id;
    let history = loadCurrentChat(userId);

    if (history.length === 0) {
        history.push({
            role: "system",
            content: `أنت مساعد ذكاء اصطناعي باسم "NAMIKAZE AI". التزم بقواعد الهوية: اسمك NAMIKAZE AI، مطورك @Namikaze_YT، وأجب بالعربية أو اللهجة العراقية.`
        });
    }

    history.push({ role: "user", content: ctx.message.text });
    history = trimConversation(history);

    try {
        await ctx.sendChatAction("typing");
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "openrouter/free",
            messages: history
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://github.com/namikaze-ai",
                "X-Title": "NAMIKAZE AI"
            }
        });

        const reply = response.data.choices?.[0]?.message?.content || "❌ لم يصل رد.";
        history.push({ role: "assistant", content: reply });
        history = trimConversation(history);
        saveCurrentChat(userId, history);
        await ctx.reply(reply);
    } catch (err) {
        console.error(err.message);
        await ctx.reply("❌ حدث خطأ أثناء الاتصال.");
    }
});

bot.launch();
console.log("🚀 NAMIKAZE AI Started");
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
