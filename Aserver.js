////////////////ServerNo////////////////
const ServerNo = "A_";

////////////////Module////////////////
const Database = require("nedb");
const discord = require("discord.js");
const request = require("request");
const log4js = require("log4js");
const fetch = require("node-fetch");
const ytdl = require("ytdl-core");
const cron = require("node-cron");
const http = require("http");
const yts = require("yt-search");
const fs = require("fs");
const os = require("os");

////////////////DOTENV////////////////
require("dotenv").config();
eval("var TOKEN = process.env." + ServerNo + "TOKEN;");
eval("var PORTN = process.env." + ServerNo + "PORTN;");
const VOnylChannelName = process.env.VOCN;
const GenLogChannelId = process.env.GENLOG;
const MsgLogChannelId = process.env.MSGLOG;
const DSKLChannelId = process.env.DSKL;

////////////////Directory////////////////
const db_dir = "./db/";
const log_dir = "./logs/";
const lib_dir = "./lib/" + ServerNo + "/";
const image_dir = lib_dir + "Image/";
const voice_dir = lib_dir + "Voice/";
const other_dir = lib_dir + "Other/";
const vcimg_dir = lib_dir + "Image/VCimages/";

////////////////Initialization////////////////
const client = new discord.Client();
const logger = log4js.getLogger(ServerNo + "Server");
const VCdirs = fs.readdirSync(vcimg_dir, { withFileTypes: true });
const VCimgs = VCdirs.filter((dirent) => dirent.isFile()).map(
  ({ name }) => name
);

log4js.configure({
  appenders: {
    Server: { type: "file", filename: log_dir + "system.log" },
  },
  categories: {
    default: { appenders: ["Server"], level: "trace" },
  },
});

////////////////CreateServer////////////////
http
  .createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Discord Bot is active now\n");
  })
  .listen(PORTN);

////////////////Database////////////////
const db_int = new Database({ filename: db_dir + "Z_int.db", autoload: true });
const db_grk = new Database({
  filename: db_dir + ServerNo + "grk.db",
  autoload: true,
});
const db_vic = new Database({
  filename: db_dir + ServerNo + "vic.db",
  autoload: true,
});
const db_scd = new Database({
  filename: db_dir + ServerNo + "scd.db",
  autoload: true,
});

client.on("debug", console.debug);

client.on("ready", () => {
  client.channels.cache
    .get(GenLogChannelId)
    .send("==========[READYBOT]==========");
  console.log("Discord Bot is active now.");
  logger.debug("[READYBOT]");

  ////////////////Activity////////////////
  setInterval(() => {
    client.user.setPresence({
      activity: {
        name: `/help`,
        type: "STREAMING",
        url: "https://www.twitch.tv/v/",
      },
    });
  }, 10000);

  ////////////////LoadDatabese////////////////
  db_grk.loadDatabase((error) => {
    if (error !== null) {
      logger.error(error);
      logERR(error.name, error.message);
    }
    logger.debug("[LOADDB-G] - Loaded GRK.DB");
  });
  db_vic.loadDatabase((error) => {
    if (error !== null) {
      logger.error(error);
      logERR(error.name, error.message);
    }
    logger.debug("[LOADDB-V] - Loaded VIC.DB");
  });
  db_scd.loadDatabase((error) => {
    if (error !== null) {
      logger.error(error);
      logERR(error.name, error.message);
    }
    logger.debug("[LOADDB-S] - Loaded SCD.DB");
  });
  db_int.loadDatabase((error) => {
    if (error !== null) {
      logger.error(error);
      logERR(error.name, error.message);
    }
    logger.debug("[LOADDB-I] - Loaded INT.DB");
  });

  ////////////////Schedule////////////////
  db_scd.count({ type: "計画" }, (error, count) => {
    if (error !== null) {
      logger.error(error);

      logERR(error.name, error.message);
    }
    db_scd.find({ type: "計画" }).exec((e, docs) => {
      for (let step = 0; step < count; step++) {
        eval(
          "task_" +
            docs[step]._id +
            " = cron.schedule('" +
            docs[step].date +
            "', () => { sendMsgSCD('SCHEDULED TASK', '" +
            docs[step].target +
            "', '" +
            docs[step].text +
            "', '" +
            docs[step].img +
            "');},{scheduled: false});"
        );
        eval("task_" + docs[step]._id + ".start();");
        const dateargs = docs[step].date.split(" ");
        for (var i = 0; i < 6; i++) {
          if (dateargs[i] == "*") {
            dateargs.splice(i, 1, "毎");
          }
        }
        sendMsgSAVE(
          "Scheduled",
          MsgLogChannelId,
          client.channels.cache.get(docs[step].target).guild.name +
            " : " +
            client.channels.cache.get(docs[step].target).name +
            "\n『 " +
            docs[step].text +
            " 』\n" +
            dateargs[4] +
            "月 " +
            dateargs[3] +
            "日 " +
            dateargs[5] +
            "曜日 " +
            dateargs[2] +
            "時 " +
            dateargs[1] +
            "分 " +
            dateargs[0] +
            "秒にスケジュールされました\n\n【データ削除：" +
            docs[step].type +
            "：" +
            docs[step]._id +
            "】で取り消すことができます"
        );
      }
    });
  });
});

////////////////Message////////////////
client.on("message", async (message) => {
  ////////////////Test////////////////
  if (message.content === "/test") {
  }

  ////////////////EMS////////////////
  if (message.content === "/ems") {
    sendMsgSAVE(
      "EMERGENCY STOP",
      message.channel.id,
      "Emergency stop, sir. Terminates the connection to Discord and Destroys the client."
    );
    logger.fatal("!!!!!!!EMERGENCY STOP!!!!!!!");
    message.channel.send("🏳 SYSTEM EMERGENCY STOP...").then((m) => {
      client.destroy();
    });
  }

  ////////////////シャットダウン////////////////
  if (message.content === "/shutdown") {
    sendMsgSAVE(
      "DESTROY",
      message.channel.id,
      "Terminates the connection to Discord and Destroys the client."
    );
    sendMsgSAVE(
      "WARNING",
      message.channel.id,
      "The called client.destroy() is specified as a serious property,\n Please enter the administrator password."
    );
    const filter = (msg) => msg.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
    });
    const response = collected.first();
    if (!response) return sendMsg(message.channel.id, "Time out.");
    if (response.content === process.env.PASSWORD) {
      response.delete();
      logFATAL(
        "[SHUTDOWN]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        "System Shutting Down"
      );
      message.channel.send("🏳 SYSTEM Shutting down...").then((m) => {
        client.destroy();
      });
    } else {
      sendMsg(
        message.channel.id,
        "The password you typed is incorrect. Start all over again."
      );
    }
  }

  ////////////////再起動////////////////
  if (message.content === "/restart") {
    sendMsgSAVE(
      "DESTROY",
      message.channel.id,
      "Terminates the connection to Discord and Destroys the client."
    );
    sendMsgSAVE(
      "WARNING",
      message.channel.id,
      "The called client.destroy() is specified as a serious property,\n Please enter the administrator password."
    );
    const filter = (msg) => msg.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
    });
    const response = collected.first();
    if (!response) return sendMsg(message.channel.id, "Time out.");
    if (response.content === process.env.PASSWORD) {
      response.delete();
      logFATAL(
        "[RE START]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        "SYSTEM Restarting"
      );
      message.channel.send("🏳 SYSTEM Restarting...").then((m) => {
        client.destroy();
        client.login(process.env.TOKEN);
      });
    } else {
      sendMsg(
        message.channel.id,
        "The password you typed is incorrect. Start all over again."
      );
    }
  }

  ////////////////システムログ////////////////
  if (
    message.channel.name === "msg-log" ||
    message.channel.name === "gen-log"
  ) {
    return;
  } else if (message.author.bot) {
    if (message.content.match("🏴")) {
      setTimeout(function () {
        message.delete();
        logWARN(
          "[DELE MSG]",
          message.guild.name,
          message.channel.name,
          message.channel.id,
          message.member.user.username,
          message.content
        );
      }, 120000);
      return;
    } else if (message.content.match("🏳") || message.attachments.size) {
      return logWARN(
        "[SAVE MSG]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        message.content
      );
    } else {
      return;
    }
  } else if (message.member == undefined) {
    const files = message.attachments.map((attachment) => attachment.url);
    logTRACE(
      "[TAKE MSG]",
      "DM",
      message.author.username,
      message.author.id,
      message.author.username,
      message.content + "\n" + files
    );
    if (message.attachments.size) {
      client.channels.cache
        .get(GenLogChannelId)
        .send({ files })
        .catch((error) => {
          logger.error(error);
          logERR(error.name, error.message);
        });
      client.channels.cache
        .get(MsgLogChannelId)
        .send({ files })
        .catch((error) => {
          logger.error(error);
          logERR(error.name, error.message);
        });
    }
  } else {
    const files = message.attachments.map((attachment) => attachment.url);
    logTRACE(
      "[TAKE MSG]",
      message.guild.name,
      message.channel.name,
      message.channel.id,
      message.member.user.username,
      message.content + "\n" + files
    );
    if (message.attachments.size) {
      client.channels.cache
        .get(GenLogChannelId)
        .send({ files })
        .catch((error) => {
          logger.error(error);
          logERR(error.name, error.message);
        });
      client.channels.cache
        .get(MsgLogChannelId)
        .send({ files })
        .catch((error) => {
          logger.error(error);
          logERR(error.name, error.message);
        });
    }
  }

  ////////////////ボット判定////////////////
  if (message.author.bot) {
  }

  ////////////////保護////////////////
  if (message.content.match("`")) {
    return logWARN(
      "[SAVE MSG]",
      message.guild.name,
      message.channel.name,
      message.channel.id,
      message.member.user.username,
      message.content + "\n" + files
    );
  }

  ////////////////メッセージ削除////////////////
  if (message.content.startsWith("/msgdel")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(message.channel.id, "/msgdel:〈ChannelID〉:〈MessageID〉");
    }
    const MsgCatchId = message.channel.id;
    const args = message.content.split(splitSpace);
    const ChannelId = args[1];
    const MsgId = args[2];
    const Adminpass = args[3];
    const MsgCon =
      "[DELETED][S:" +
      message.guild.name +
      " F:" +
      message.channel.name +
      " B:" +
      message.member.user.username +
      "]\n" +
      message.content;
    if (Adminpass == process.env.PASSWORD) {
      logWARN(
        "[DELE MSG]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        message.content
      );
      client.channels.cache
        .get(ChannelId)
        .messages.fetch(MsgId)
        .then(async (message) => {
          message.delete();
          sendMsgSAVE("DELETE MSG", MsgCatchId, MsgCon);
          return;
        });
    } else {
      client.channels.cache
        .get(ChannelId)
        .messages.fetch(MsgId)
        .then(async (message) => {
          if (message.member.id != client.user.id) {
            return sendMsg(
              MsgCatchId,
              "BOT以外のメッセージを削除するには、管理コードが必要です。\nコマンドにコロンと管理コードを追加して再実行してください。"
            );
          } else {
            message.delete();
            logWARN(
              "[DELE MSG]",
              message.guild.name,
              message.channel.name,
              message.channel.id,
              message.member.user.username,
              message.content
            );
            sendMsgSAVE("DELETE MSG", MsgCatchId, MsgCon);
            return;
          }
        });
    }
    return;
  }

  ////////////////メッセージ送信////////////////
  if (message.content.startsWith("/msgsend")) {
    const files = message.attachments.map((attachment) => attachment.url);
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(message.channel.id, "/msgsend:〈ChannelID〉:〈Message〉");
    }
    const args = message.content.split(splitSpace);
    const ChannelId = args[1];
    const MsgCon = args[2];
    logWARN(
      "[RSENDMSG]",
      message.guild.name,
      message.channel.name,
      message.channel.id,
      message.member.user.username,
      message.content
    );
    return sendMsgSPE(ChannelId, MsgCon, { files });
  }

  ////////////////更新情報////////////////
  if (message.content.startsWith("/update")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(
        message.channel.id,
        "/update:field:text:text:field:text:text"
      );
    }
    const file = message.attachments.first();
    let args = message.content.split(splitSpace);
    for (let step = 1; step < args.length; step++) {
      if (!args[step]) {
        args[step] = "";
      }
    }
    client.guilds.cache.map((channel) => {
      sendMsgSPE(
        channel.channels.guild.channels.cache.find(
          (channel) => channel.type == "text"
        ).id,
        "🏳 -INFORMATION-",
        {
          embed: {
            title: "更新情報を受信しました！",
            thumbnail: file,
            fields: [
              {
                name: args[1],
                value: "\n" + args[2] + "\n" + args[3],
              },
              {
                name: args[4],
                value: "\n" + args[5] + "\n" + args[6],
              },
            ],
            color: "#2f3136",
            footer: { text: "〈SENDING TO ALL SERVERS〉" },
            timestamp: new Date(),
          },
        }
      );
    });
    logger.warn("Send Message");
    return;
  }

  ////////////////ボイス停止////////////////
  if (message.content === "/stop") {
    const vchannel = message.member.voice.channel;
    if (!vchannel)
      return sendMsg(
        message.channel.id,
        "このコマンドはVC参加中しか使えません"
      );
    const connection = await vchannel.join();
    const dispatcher = connection.play(voice_dir + "stop.mp3");
    dispatcher.on("start", () => {
      logWARN(
        "[PLAY MP3]",
        vchannel.guild.name,
        vchannel.name,
        vchannel.id,
        message.member.user.username,
        "STOP"
      );
    });
    dispatcher.on("finish", () => {});
    dispatcher.on("error", (error) => {
      logger.error(error);
      logERR(error.name, error.message);
    });
    setTimeout(function () {
      message.delete();
      logWARN(
        "[DELE MSG]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        message.content
      );
    }, 120000);
    return;
  }
  ////////////////leave////////////////
  if (message.content === "/leave") {
    const vchannel = message.guild.me.voice.channel;
    vchannel.leave();
    logWARN(
      "[LEAVE VC]",
      vchannel.guild.name,
      vchannel.name,
      vchannel.id,
      message.member.user.username,
      "Exile bots from VC"
    );
    setTimeout(function () {
      message.delete();
      logWARN(
        "[DELE MSG]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        message.content
      );
    }, 120000);
    return;
  }
  ////////////////アイコン設定////////////////
  if (message.content.startsWith("/seticon")) {
    const file = message.attachments.first();
    if (!file)
      return sendMsg(
        message.channel.id,
        "画像が添付されていません。画像と共にコマンドを送信してください。"
      );
    if (!file.height && !file.width)
      return sendMsg(
        message.channel.id,
        "添付されたファイルは対応していません。"
      );
    sendMsg(
      message.channel.id,
      "アイコンを変更するには管理コードを続けて入力してください。"
    );
    const filter = (msg) => msg.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
    });
    const response = collected.first();
    if (!response) return sendMsg(message.channel.id, "Time out.");
    if (response.content === process.env.PASSWORD) {
      response.delete();
      logWARN(
        "[SET ICON]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username
      );
      client.user.setAvatar(file.url);
      sendMsgSAVE(
        "SET ICON",
        message.channel.id,
        "アイコンが変更されました。\n端末キャッシュにより表示反映に時間が掛かる場合があります。"
      );
    } else {
      sendMsg(
        message.channel.id,
        "The password you typed is incorrect. Start all over again."
      );
    }
    setTimeout(function () {
      message.delete();
      logWARN(
        "[DELE MSG]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        message.content
      );
    }, 120000);
    return;
  }

  ////////////////アップロード////////////////
  if (message.content.startsWith("/upload")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(
        message.channel.id,
        "/upload:〈(./lib/)Image/ or Voice/〉"
      );
    }
    const args = message.content.split(splitSpace);
    const folder = args[1];
    const file = message.attachments.first();
    if (!file) {
      message.delete();
      return sendMsg(message.channel.id, "ファイルと一緒に送信してください");
    } else {
      downloadFile(file.url, folder, message.channel.id);
      logWARN(
        "[UPLOADED]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        folder
      );
      setTimeout(function () {
        message.delete();
        logWARN(
          "[DELE MSG]",
          message.guild.name,
          message.channel.name,
          message.channel.id,
          message.member.user.username,
          message.content
        );
      }, 120000);
      return;
    }
  }

  ////////////////スケジュール登録////////////////
  if (message.content.startsWith("/schedule")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(
        message.channel.id,
        "/schedule:〈ChannelID〉:〈Message〉:秒 分 時 日 月 曜日:imageURL or localpath\n\nタスクはCronで制御されています。\n日時設定の書式については下記サイトを参考に半角空白含め６桁を設定してください。\nhttps://www.npmjs.com/package/node-cron#cron-syntax"
      );
    }
    const args = message.content.split(splitSpace);
    const key = "0";
    const type = "計画";
    const ch = args[1];
    const msg = args[2];
    const date = args[3];
    const img = args[4];
    const dateargs = date.split(" ");
    const doc = {
      key: key,
      type: type,
      target: ch,
      text: msg,
      date: date,
      img: img,
    };

    db_scd.insert(doc, (error, newDoc) => {
      if (error !== null) {
        logger.error(error);
        logERR(error.name, error.message);
        sendErr(error.name, message.channel.id, error.message);
      }
      const Content =
        "key:" +
        newDoc.key +
        "Type:" +
        newDoc.type +
        " ch:" +
        newDoc.target +
        " msg:" +
        newDoc.text +
        " date:" +
        newDoc.date +
        " img:" +
        newDoc.img +
        " Id:" +
        newDoc._id;
      logWARN(
        "[INSERTDB]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        Content
      );
      for (var i = 0; i < 6; i++) {
        if (dateargs[i] == "*") {
          dateargs.splice(i, 1, "毎");
        }
      }
      eval(
        "task_" +
          newDoc._id +
          " = cron.schedule('" +
          newDoc.date +
          "', () => { sendMsgSCD('SCHEDULED TASK', '" +
          newDoc.target +
          "', '" +
          newDoc.text +
          "', '" +
          newDoc.img +
          "');},{scheduled: false});"
      );
      eval("task_" + newDoc._id + ".start();");

      sendMsgSAVE(
        "Scheduled",
        message.channel.id,
        client.channels.cache.get(newDoc.target).guild.name +
          " : " +
          client.channels.cache.get(newDoc.target).name +
          "\n『 " +
          newDoc.text +
          " 』\n" +
          dateargs[4] +
          "月 " +
          dateargs[3] +
          "日 " +
          dateargs[5] +
          "曜日 " +
          dateargs[2] +
          "時 " +
          dateargs[1] +
          "分 " +
          dateargs[0] +
          "秒にスケジュールされました\n\n【データ削除：" +
          type +
          "：" +
          newDoc._id +
          "】で取り消すことができます"
      );
    });
    return;
  }
  ////////////////設定データ登録////////////////
  if (message.content.startsWith("/intdb")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(message.channel.id, "/intdb：name：state：other");
    }
    const args = message.content.split(splitSpace);
    const key = Number(args[1]);
    const name = args[2];
    const state = args[3];
    const other = args[4];
    const doc = {
      key: key,
      name: name,
      state: state,
      other: other,
    };
    db_int.insert(doc, (error, newDoc) => {
      if (error !== null) {
        logger.error(error);
        logERR(error.name, error.message);
        sendErr(error.name, message.channel.id, error.message);
      }
      const Content =
        "key:" +
        newDoc.key +
        " name:" +
        newDoc.name +
        " state:" +
        newDoc.state +
        " other:" +
        newDoc.other +
        " Id:" +
        newDoc._id;
      logWARN(
        "[INSERTDB]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        Content
      );
      sendMsgSAVE("INSERT DATABASE", message.channel.id, Content);
    });
    return;
  }

  if (message.content.startsWith("/createwh")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    }
    const args = message.content.split(splitSpace);
    const target = args[1];
    const name = args[2];
    const file = message.attachments.first();
    sendMsg(
      message.channel.id,
      "ウェブフックを追加するには管理コードを続けて入力してください。"
    );
    const filter = (msg) => msg.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
    });
    const response = collected.first();
    if (!response) return sendMsg(message.channel.id, "Time out.");
    if (response.content === process.env.PASSWORD) {
      response.delete();
      client.channels.cache
        .get(target)
        .createWebhook(name, {
          avatar: file,
        })
        .then((webhook) => {
          const MsgCon =
            "[CREATED WEBHOOK]\n" +
            client.channels.cache.get(target).guild.name +
            " : " +
            client.channels.cache.get(target).name +
            ` : ${webhook}`;
          sendMsgSAVE("CREATE WEBHOOK", message.channel.id, MsgCon);
          logWARN(
            "[CWEBHOOK]",
            client.channels.cache.get(target).guild.name,
            client.channels.cache.get(target).name,
            client.channels.cache.get(target).id,
            message.member.user.username,
            webhook
          );
        })
        .catch((error) => {
          logger.error(error);
          logERR(error.name, error.message);
        });
    } else {
      sendMsg(
        message.channel.id,
        "The password you typed is incorrect. Start all over again."
      );
    }
    return;
  }

  ////////////////データベース出力////////////////
  if (message.content === "/epdb") {
    const filename = "export.db";
    db_grk
      .find({})
      .sort({ text: 1 })
      .exec((error, docs) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        fs.writeFileSync(filename, JSON.stringify(docs));
        logWARN(
          "[EXPRT DB]",
          message.guild.name,
          message.channel.name,
          message.channel.id,
          message.member.user.username,
          filename
        );
        sendMsgSAVE(
          "EXPRT DATABASE",
          message.channel.id,
          "[success] Export Database"
        );
      });
    return;
  }

  ////////////////チャンネルID////////////////
  if (message.content === "/chmap") {
    sendMsg(
      message.channel.id,
      "全サーバ分を出力する場合は管理コードを続けて入力して下さい。\nこのサーバのみの場合は暫くそのままでお待ちください。"
    );
    const filter = (msg) => msg.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 10000,
    });
    var targets = [];
    const response = collected.first();
    if (!response) {
      message.guild.channels.cache.map((channel) => {
        targets.push(channel.type + " : " + channel.name + " / " + channel.id);
      });
      sendMsg(message.channel.id, targets.join("\n"));
      return;
    }
    if (response.content === process.env.PASSWORD) {
      response.delete();
      client.guilds.cache.map((channel) => {
        targets.push(channel.name + " / " + channel.id);
        channel.channels.guild.channels.cache.map((channel) => {
          targets.push(
            channel.type + " : " + channel.name + " / " + channel.id
          );
        });
        targets.push("================");
      });
      sendMsg(message.channel.id, targets.join("\n"));
      return;
    } else {
      sendMsg(
        message.channel.id,
        "The password you typed is incorrect. Start all over again."
      );
    }
  }

  ////////////////拒否設定////////////////
  if (message.content.startsWith("/reject")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(message.channel.id, "/reject:〈ChannelID〉:〈UserID〉");
    }
    const args = message.content.split(splitSpace);
    const target = args[1]; //ch
    const text = args[2]; //user

    sendMsg(
      message.channel.id,
      "権限を変更するには管理コードを続けて入力してください。"
    );
    const filter = (msg) => msg.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
    });
    const response = collected.first();
    if (!response) return sendMsg(message.channel.id, "Time out.");
    if (response.content === process.env.PASSWORD) {
      message.delete();
      response.delete();
      await client.users.fetch(text).then((res) =>
        client.channels.cache
          .get(target)
          .updateOverwrite(res, {
            VIEW_CHANNEL: false,
          })
          .then(
            logWARN(
              "[REJECTCH]",
              client.channels.cache.get(target).guild.name,
              client.channels.cache.get(target).name,
              target,
              message.member.user.username,
              "=>" + res.username
            ),
            sendMsg(
              message.channel.id,
              "[REJECT]  " +
                client.channels.cache.get(target).name +
                "=>" +
                res.username
            )
          )
          .catch((error) => {
            logger.error(error);
            logERR(error.name, error.message);
            sendErr(error.name, message.channel.id, error.message);
          })
      );
    } else {
      message.delete();
      sendMsg(
        message.channel.id,
        "The password you typed is incorrect. Start all over again."
      );
    }
    return;
  }

  ////////////////許可設定////////////////
  if (message.content.startsWith("/permit")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(message.channel.id, "/permit:〈ChannelID〉:〈UserID〉");
    }
    const args = message.content.split(splitSpace);
    const target = args[1];
    const text = args[2];
    sendMsg(
      message.channel.id,
      "権限を変更するには管理コードを続けて入力してください。"
    );
    const filter = (msg) => msg.author.id === message.author.id;
    const collected = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
    });
    const response = collected.first();
    if (!response) return sendMsg(message.channel.id, "Time out.");
    if (response.content === process.env.PASSWORD) {
      message.delete();
      response.delete();
      await client.users.fetch(text).then((res) =>
        client.channels.cache
          .get(target)
          .updateOverwrite(res, { VIEW_CHANNEL: true })
          .then(
            logWARN(
              "[PERMITCH]",
              client.channels.cache.get(target).guild.name,
              client.channels.cache.get(target).name,
              target,
              message.member.user.username,
              "=>" + res.username
            ),
            sendMsg(
              message.channel.id,
              "[PERMIT]  " +
                client.channels.cache.get(target).name +
                "=>" +
                res.username
            )
          )
          .catch((error) => {
            logger.error(error);
            logERR(error.name, error.message);
            sendErr(error.name, message.channel.id, error.message);
          })
      );
    } else {
      message.delete();
      sendMsg(
        message.channel.id,
        "The password you typed is incorrect. Start all over again."
      );
    }
    return;
  }

  ////////////////トピック設定////////////////
  if (message.content.startsWith("/settopic")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(
        message.channel.id,
        "/settopic:〈ChannelID〉:〈トピック〉"
      );
    }
    const args = message.content.split(splitSpace);
    const target = args[1];
    const text = args[2];
    client.channels.cache.get(target).setTopic(text);
    logWARN(
      "[SETTOPIC]",
      client.channels.cache.get(target).guild.name,
      client.channels.cache.get(target).name,
      client.channels.cache.get(target).id,
      message.member.user.username,
      text
    );
    const MsgCon =
      "[SET TOPIC]\n" +
      client.channels.cache.get(target).guild.name +
      " : " +
      client.channels.cache.get(target).name +
      " : " +
      text;
    sendMsgSAVE("SET TOPIC", message.channel.id, MsgCon);
    return;
  }

  ////////////////データ登録////////////////
  if (message.content.startsWith("データ登録")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(
        message.channel.id,
        "データ登録：語録：〈取得単語〉：〈送信文〉：〈Blank or 「完全一致」〉\nデータ登録：ボイス：〈取得単語〉\nデータ登録：特殊：〈取得単語〉：〈リアクション〉\nデータ登録：挨拶：〈UserID〉"
      );
    }

    const args = message.content.split(splitSpace);
    const type = args[1];
    const target = args[2];
    var text = args[3];
    if (args[4] == null) {
      var decision = "include";
    } else {
      var decision = "match";
    }
    const file = message.attachments.first();

    if (type == "ボイス" || type == "挨拶") {
      var dbtype = db_vic;
      if (!file || !file.name.match(/mp3/)) {
        message.delete();
        return sendMsg(
          message.channel.id,
          "MP3ファイルと一緒に送信してください。"
        );
      } else {
        downloadFile(file.url, "Voice/" + target + ".mp3", message.channel.id);
        text = "MP3";
      }
    } else if (type == "語録" || type == "特殊") {
      var dbtype = db_grk;
    } else {
      message.delete();
      return sendMsg(
        message.channel.id,
        type + "データベースが見つかりませんでした"
      );
    }

    dbtype.find({ target: target }, (error, docs) => {
      if (error !== null) {
        logger.error(error);
        logERR(error.name, error.message);
        sendErr(error.name, message.channel.id, error.message);
      }
      if (docs[0] == null) {
        dbtype.count({}, (error, count) => {
          if (error !== null) {
            logger.error(error);
            logERR(error.name, error.message);
            sendErr(error.name, message.channel.id, error.message);
          }
          const doc = {
            key: '"' + count + '"',
            type: type,
            target: target,
            text: text,
            decision: decision,
          };
          dbtype.insert(doc, (error, newDoc) => {
            if (error !== null) {
              logger.error(error);
              logERR(error.name, error.message);
              sendErr(error.name, message.channel.id, error.message);
            }
            const Content =
              "Type:" +
              newDoc.type +
              " Target:" +
              newDoc.target +
              " Text:" +
              newDoc.text +
              " Decision:" +
              newDoc.decision +
              " Id:" +
              newDoc._id;
            logWARN(
              "[INSERTDB]",
              message.guild.name,
              message.channel.name,
              message.channel.id,
              message.member.user.username,
              Content
            );
            sendMsgSAVE(
              "INSERT DATABASE",
              message.channel.id,
              "[" +
                newDoc.target +
                "] => [" +
                newDoc.text +
                "] (" +
                newDoc.decision +
                ")\nデータベースの" +
                count +
                "件目に登録されました \n\n【データ削除：" +
                type +
                "：" +
                newDoc._id +
                "】で取り消すことができます"
            );
          });
        });
      } else {
        sendMsg(
          message.channel.id,
          "[" +
            docs[0].target +
            "]は既に登録されています\n[" +
            docs[0].target +
            "] => [" +
            docs[0].text +
            "] (" +
            docs[0].decision +
            ")\n\n【データ削除：" +
            type +
            "：" +
            docs[0]._id +
            "】で削除することができます"
        );
      }
    });
    message.delete();
    return;
  }

  ////////////////データ検索////////////////
  if (message.content.startsWith("データ検索")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(
        message.channel.id,
        "データ検索：語録：〈取得単語 or Blank〉：〈送信文 or Blank〉\nデータ検索：ボイス：〈取得単語〉\nデータ検索：挨拶：〈UserID〉\nデータ検索：計画：〈UserID〉"
      );
    }
    const args = message.content.split(splitSpace);
    const type = args[1];
    const target = args[2];
    var text = args[3];
    var targets = [];
    if (args[4] == null) {
      var decision = "include";
    } else {
      var decision = "match";
    }
    if (type == "ボイス" || type == "挨拶") {
      var dbtype = db_vic;
      text = null;
    } else if (type == "語録" || type == "特殊") {
      var dbtype = db_grk;
    } else if (type == "計画") {
      var dbtype = db_scd;
      text = null;
    } else {
      return sendMsg(
        message.channel.id,
        type + "データベースが見つかりませんでした"
      );
    }

    targetReg = new RegExp(target + "$");
    textReg = new RegExp(text + "$");

    if (target && text) {
      dbtype.count(
        { type: type, target: targetReg, text: textReg },
        (error, count) => {
          if (error !== null) {
            logger.error(error);
            logERR(error.name, error.message);
            sendErr(error.name, message.channel.id, error.message);
          }
          if (count > 50) {
            targets.push(count + "件見つかりました 最初の50件を表示します\n");
            var maxstep = 50;
          } else if (count == 0) {
            return sendMsg(
              message.channel.id,
              "該当するアイテムが見つかりませんでした\n検索条件を変えてやり直して下さい"
            );
          } else {
            targets.push(count + "件見つかりました\n");
            var maxstep = count;
          }
          dbtype
            .find({ type: type, target: targetReg, text: textReg })
            .sort({ key: 1 })
            .exec((error, docs) => {
              if (error !== null) {
                logger.error(error);
                logERR(error.name, error.message);
                sendErr(error.name, message.channel.id, error.message);
              }
              for (let step = 0; step < maxstep; step++) {
                targets.push(
                  "Key: " +
                    docs[step].key +
                    "  Target: " +
                    docs[step].target +
                    "  Text: " +
                    docs[step].text +
                    "  ID: " +
                    docs[step]._id
                );
              }
              sendMsg(message.channel.id, targets.join("\n"));
            });
        }
      );
    } else if (target) {
      dbtype.count({ type: type, target: targetReg }, (error, count) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        if (count > 50) {
          targets.push(count + "件見つかりました 最初の50件を表示します\n");
          var maxstep = 50;
        } else if (count == 0) {
          return sendMsg(
            message.channel.id,
            "該当するアイテムが見つかりませんでした\n検索条件を変えてやり直して下さい"
          );
        } else {
          targets.push(count + "件見つかりました\n");
          var maxstep = count;
        }
        dbtype
          .find({ type: type, target: targetReg })
          .sort({ key: 1 })
          .exec((error, docs) => {
            if (error !== null) {
              logger.error(error);
              logERR(error.name, error.message);
              sendErr(error.name, message.channel.id, error.message);
            }
            for (let step = 0; step < maxstep; step++) {
              targets.push(
                "Key: " +
                  docs[step].key +
                  "  Target: " +
                  docs[step].target +
                  "  Text: " +
                  docs[step].text +
                  "  ID: " +
                  docs[step]._id
              );
            }
            sendMsg(message.channel.id, targets.join("\n"));
          });
      });
    } else if (text) {
      dbtype.count({ type: type, text: textReg }, (error, count) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        if (count > 50) {
          targets.push(count + "件見つかりました 最初の50件を表示します\n");
          var maxstep = 50;
        } else if (count == 0) {
          return sendMsg(
            message.channel.id,
            "該当するアイテムが見つかりませんでした\n検索条件を変えてやり直して下さい"
          );
        } else {
          targets.push(count + "件見つかりました\n");
          var maxstep = count;
        }
        dbtype
          .find({ type: type, text: textReg })
          .sort({ key: 1 })
          .exec((error, docs) => {
            if (error !== null) {
              logger.error(error);
              logERR(error.name, error.message);
              sendErr(error.name, message.channel.id, error.message);
            }
            for (let step = 0; step < maxstep; step++) {
              targets.push(
                "Key: " +
                  docs[step].key +
                  "  Target: " +
                  docs[step].target +
                  "  Text: " +
                  docs[step].text +
                  "  ID: " +
                  docs[step]._id
              );
            }
            sendMsg(message.channel.id, targets.join("\n"));
          });
      });
    } else {
      dbtype.count({ type: type }, (error, count) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        if (count > 50) {
          targets.push(count + "件見つかりました 最初の50件を表示します\n");
          var maxstep = 50;
        } else if (count == 0) {
          return sendMsg(
            message.channel.id,
            "該当するアイテムが見つかりませんでした\n検索条件を変えてやり直して下さい"
          );
        } else {
          targets.push(count + "件見つかりました\n");
          var maxstep = count;
        }

        dbtype
          .find({ type: type })
          .sort({ key: 1 })
          .limit(50)
          .exec((error, docs) => {
            if (error !== null) {
              logger.error(error);
              logERR(error.name, error.message);
              sendErr(error.name, message.channel.id, error.message);
            }
            for (let step = 0; step < maxstep; step++) {
              targets.push(
                "Key: " +
                  docs[step].key +
                  "  Target: " +
                  docs[step].target +
                  "  Text: " +
                  docs[step].text +
                  "  ID: " +
                  docs[step]._id
              );
            }
            sendMsg(message.channel.id, targets.join("\n"));
          });
      });
    }
    return;
  }

  ////////////////データ削除////////////////
  if (message.content.startsWith("データ削除")) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    } else {
      return sendMsg(
        message.channel.id,
        "データ削除：語録：〈DB ID〉\nデータ削除：ボイス：〈DB ID〉\nデータ削除：特殊：〈DB ID〉\nデータ削除：挨拶：〈DB ID〉\nデータ削除：計画：〈DB ID〉"
      );
    }
    const args = message.content.split(splitSpace);
    const type = args[1];
    const id = args[2];
    const query = { _id: id };
    const options = {};

    if (type == "ボイス" || type == "挨拶") {
      var dbtype = db_vic;
    } else if (type == "語録" || type == "特殊") {
      var dbtype = db_grk;
    } else if (type == "計画") {
      var dbtype = db_scd;
    } else {
      return sendMsg(
        message.channel.id,
        type + "データベースが見つかりませんでした"
      );
    }

    dbtype.find(query, (error, docs) => {
      if (error !== null) {
        logger.error(error);
        logERR(error.name, error.message);
        sendErr(error.name, message.channel.id, error.message);
      }
      if (!docs) {
        return sendMsg(
          message.channel.id,
          "データベースには存在していないIDです。検索機能で再度確認してください。"
        );
      }
      dbtype.remove(query, options, (error, count) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        sendMsg(
          message.channel.id,
          "[REMOVEDB]\nType:" +
            docs[0].type +
            " Target:" +
            docs[0].target +
            " Id:" +
            docs[0]._id
        );
        const Content =
          "Type:" +
          docs[0].type +
          " Target:" +
          docs[0].target +
          " Id:" +
          docs[0]._id;
        logWARN(
          "[REMOVEDB]",
          message.guild.name,
          message.channel.name,
          message.channel.id,
          message.member.user.username,
          Content
        );

        if (type == "計画") {
          eval("task_" + docs[0]._id + ".stop();");
          sendMsg(message.channel.id, "スケジュールタスクが停止されました");
        }
      });
    });
    return;
  }

  ////////////////翻訳////////////////
  if (
    message.content.startsWith("翻訳") ||
    message.content.startsWith("trans")
  ) {
    if (message.content.match("：")) {
      var splitSpace = "：";
    } else if (message.content.match(":")) {
      var splitSpace = ":";
    }
    const args = message.content.split(splitSpace);
    if (args[0] == "翻訳") {
      var source = "ja";
      var target = "en";
    } else if (args[0] == "trans") {
      var source = "en";
      var target = "ja";
    }
    const text = encodeURI(args[1]);
    const content = await fetch(
      `https://script.google.com/macros/s/AKfycbyi3K_wUhfaNoCemntb-azWLjSAWVcX2QEs8390vgYhgMyaVjo/exec?text=${text}&source=${source}&target=${target}`
    ).then((res) => res.text(logger.warn(res.text)));
    sendMsgSAVE("TRANS", message.channel.id, content);
    return;
  }

  ////////////////OME////////////////
  if (message.content.match(process.env.OME)) {
    setTimeout(function () {
      let reply_text = process.env.OMERP;
      message.reply(reply_text).catch((error) => logger.error(error));
    }, 3600000);
  }

  ////////////////Youtube////////////////
  if (message.content.startsWith("/play") && message.guild) {
    var infohideorshow = "show";
    var vchannel = message.member.voice.channel;
    if (message.content.startsWith("/play-d")) {
      vchannel = DSKLChannelId;
    }
    if (message.content.startsWith("/play-h")) {
      infohideorshow = "hide";
    }

    if (message.content.match("：")) {
      var splitSpace = /(?<=^[^：]+?)：/;
    } else if (message.content.match(":")) {
      var splitSpace = /(?<=^[^:]+?):/;
    } else {
      return sendMsg(
        message.channel.id,
        "/play:https://www.youtube.com/example or 検索文\n/play-h:https://www.youtube.com/example or 検索文\n/play-d:https://www.youtube.com/example or 検索文"
      );
    }
    const args = message.content.split(splitSpace);
    const text = args[1];

    if (!vchannel)
      return sendMsg(
        message.channel.id,
        "このコマンドはVC参加中しか使えません"
      );
    message.delete();
    if (message.content.match("http")) {
      if (!ytdl.validateURL(text))
        return sendMsg(
          message.channel.id,
          "URLが間違っているか、対応していません。ごめんなさい。"
        );
      const stream = ytdl(ytdl.getURLVideoID(text), { filter: "audioonly" });
      const connection = await vchannel.join();
      const dispatcher = connection.play(stream);
      dispatcher.on("start", () => {
        dispatcher.setVolume(0.2);
        logWARN(
          "[PLAYYTDL]",
          vchannel.guild.name,
          vchannel.name,
          vchannel.id,
          message.member.user.username,
          text
        );

        db_int.update(
          { name: "PLAYMUSIC", other: vchannel.id },
          {
            $set: {
              state: "playing",
              other: vchannel.id,
            },
          },
          {
            upsert: true,
          },
          (error) => {
            if (error !== null) {
              logger.error(error);
              logERR(error.name, error.message);
              sendErr(error.name, message.channel.id, error.message);
            }
          }
        );
      });
      stream.on("info", (info) => {
        if (infohideorshow == "show") {
          sendMsgSPE(message.channel.id, "🏴 -INFORMATION-", {
            embed: {
              title: "❰ PLAY MUSIC ❱",
              fields: [
                {
                  name:
                    info.videoDetails.title +
                    "  - (" +
                    toHms(info.videoDetails.lengthSeconds) +
                    ")",
                  value:
                    info.videoDetails.author.name +
                    "\n\nURL : " +
                    info.videoDetails.video_url,
                },
              ],
              image: {
                url: info.videoDetails.thumbnails.pop().url,
              },
              color: "#2f3136",
            },
          });
        }
      });
      dispatcher.on("error", (error) => {
        logger.error(error);
        logERR(error.name, error.message);
        sendErr(error.name, message.channel.id, error.message);
      });
      dispatcher.on("finish", () => {
        logWARN(
          "[STOPYTDL]",
          vchannel.guild.name,
          vchannel.name,
          vchannel.id,
          message.member.user.username,
          text
        );
        db_int.update(
          { name: "PLAYMUSIC", other: vchannel.id },
          {
            $set: {
              state: "stoping",
              other: vchannel.id,
            },
          },
          {
            upsert: true,
          },
          (error) => {
            if (error !== null) {
              logger.error(error);
              logERR(error.name, error.message);
              sendErr(error.name, message.channel.id, error.message);
            }
          }
        );
      });
      return;
    } else {
      yts(text, async function (error, result) {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
          return;
        }
        var videos = result.videos;
        const url = videos[0].url;
        if (!ytdl.validateURL(url))
          return sendMsg(
            message.channel.id,
            "検索結果が見つかりませんでした。"
          );
        const stream = ytdl(ytdl.getURLVideoID(url), { filter: "audioonly" });
        const connection = await vchannel.join();
        const dispatcher = connection.play(stream);
        dispatcher.on("start", () => {
          dispatcher.setVolume(0.2);
          logWARN(
            "[PLAYYTDL]",
            vchannel.guild.name,
            vchannel.name,
            vchannel.id,
            message.member.user.username,
            videos[0].url
          );
          db_int.update(
            { name: "PLAYMUSIC", other: vchannel.id },
            {
              $set: {
                state: "playing",
              },
            },
            {
              upsert: true,
            },
            (error) => {
              if (error !== null) {
                logger.error(error);
                logERR(error.name, error.message);
                sendErr(error.name, message.channel.id, error.message);
              }
            }
          );
        });
        stream.on("info", (info) => {
          if (infohideorshow == "show") {
            sendMsgSPE(message.channel.id, "🏴 -INFORMATION-", {
              embed: {
                title: "❰ PLAY MUSIC ❱",
                fields: [
                  {
                    name:
                      info.videoDetails.title +
                      "  - (" +
                      toHms(info.videoDetails.lengthSeconds) +
                      ")",
                    value:
                      info.videoDetails.author.name +
                      "\n\nURL : " +
                      info.videoDetails.video_url,
                  },
                ],
                image: {
                  url: info.videoDetails.thumbnails.pop().url,
                },
                color: "#2f3136",
                footer: { text: "検索ワード : " + text },
              },
            });
          }
        });
        dispatcher.on("error", (error) => {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        });
        dispatcher.on("finish", () => {
          logWARN(
            "[STOPYTDL]",
            vchannel.guild.name,
            vchannel.name,
            vchannel.id,
            message.member.user.username,
            videos[0].url
          );
          db_int.update(
            { name: "PLAYMUSIC", other: vchannel.id },
            {
              $set: {
                state: "stoping",
              },
            },
            {
              upsert: true,
            },
            (error) => {
              if (error !== null) {
                logger.error(error);
                logERR(error.name, error.message);
                sendErr(error.name, message.channel.id, error.message);
              }
            }
          );
        });
      });
      return;
    }
  }

  ////////////////ヘルプ////////////////
  if (message.content === "/help admin") {
    sendMsgSPE(message.channel.id, "🏴 -INFORMATION-", {
      embed: {
        title: client.user.username + "'s HELP for Admin",
        fields: [
          { name: "Show ChannelID", value: "/chmap" },
          { name: "Send Message", value: "/msgsend:〈ChannelID〉:〈Message〉" },
          {
            name: "Delete Message",
            value: "/msgdel:〈ChannelID〉:〈MessageID〉",
          },
          { name: "Export Database", value: "/epdb" },
          { name: "Insert Database INT", value: "/intdb：name：state：other" },
          {
            name: "Play YouTube Hide Info",
            value: "/play-h:https://www.youtube.com/example or 検索文",
          },
          {
            name: "Play YouTube on DSKL",
            value: "/play-d:https://www.youtube.com/example or 検索文",
          },
          { name: "Leave from VoiceChannel", value: "/leave" },
          { name: "Set Icon", value: "/seticon (and attachment images)" },
          { name: "Set Topic", value: "/settopic:〈ChannelID〉:〈トピック〉" },
          {
            name: "Send Update",
            value: "/update:field:text:text:field:text:text",
          },
          {
            name: "Upload to Server local",
            value: "/upload:〈(./lib/)Image/ or Voice/〉",
          },
          { name: "Reject Channel", value: "/reject:〈ChannelID〉:〈UserID〉" },
          { name: "Permit Channel", value: "/permit:〈ChannelID〉:〈UserID〉" },
          { name: "Shutdown", value: "/shutdown" },
          { name: "Restart", value: "/restart" },
          { name: "Emergency Stop", value: "/ems" },
          {
            name: "Insert Database REACTION",
            value: "データ登録：特殊：〈取得単語〉：〈リアクション〉",
          },
          {
            name: "Insert Database ENTRY-VOICE",
            value: "データ登録：挨拶：〈UserID〉",
          },
          {
            name: "Search Database REACTION",
            value:
              "データ検索：語録：〈取得単語 or Blank〉：〈リアクション or Blank〉",
          },
          {
            name: "Search Database ENTRY-VOICE",
            value: "データ検索：挨拶：〈UserID〉",
          },
          {
            name: "Remove Database REACTION",
            value: "データ削除：特殊：〈DB ID〉",
          },
          {
            name: "Remove Database ENTRY-VOICE",
            value: "データ削除：挨拶：〈DB ID〉",
          },
        ],
        color: "#2f3136",
      },
    });
    return;
  }

  if (message.content === "/help") {
    sendMsgSPE(message.channel.id, "🏴 -INFORMATION-", {
      embed: {
        title: client.user.username + "'s HELP for Users",
        fields: [
          { name: "Show ChannelID", value: "/chmap" },
          { name: "Send Message", value: "/msgsend:〈ChannelID〉:〈Message〉" },
          {
            name: "Delete Message",
            value: "/msgdel:〈ChannelID〉:〈MessageID〉",
          },
          {
            name: "Schedule Message",
            value:
              "/schedule:〈ChannelID〉:〈Message〉:秒 分 時 日 月 曜日(毎=* Sun=0):imageURL or localpath",
          },
          {
            name: "Play YouTube",
            value: "/play:https://www.youtube.com/example or 検索文",
          },
          { name: "Stop YouTube", value: "/stop" },
          { name: "Help A-Voice", value: "/help AV" },
          { name: "Help for Admin", value: "/help admin" },
          {
            name: "Insert Database GROKU",
            value:
              "データ登録：語録：〈取得単語〉：〈送信文〉：〈Blank or 「完全一致」〉",
          },
          {
            name: "Insert Database VOICE",
            value: "データ登録：ボイス：〈取得単語〉",
          },
          {
            name: "Search Database GOROKU",
            value:
              "データ検索：語録：〈取得単語 or Blank〉：〈送信文 or Blank〉",
          },
          {
            name: "Search Database VOICE",
            value: "データ検索：ボイス：〈取得単語〉",
          },
          {
            name: "Remove Database GOROKU",
            value: "データ削除：語録：〈DB ID〉",
          },
          {
            name: "Remove Database VOICE",
            value: "データ削除：ボイス：〈DB ID〉",
          },
        ],
        color: "#2f3136",
      },
    });
    return;
  }

  ////////////////ボイスヘルプ////////////////
  if (message.content === "/help AV") {
    db_vic
      .find({ type: "ボイス" })
      .sort({ key: 1 })
      .exec((error, docs) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        var targets = [];
        for (let step = 0; step < docs.length; step++) {
          targets.push(docs[step].target);
        }
        sendMsgSAVE(
          "/help AV",
          message.channel.id,
          "【ボイス一覧】\n※先頭に「/」を付けてDMや別鯖で送るとロビーで再生されます\n\n" +
            targets.join("\n")
        );
      });
    setTimeout(function () {
      message.delete();
      logWARN(
        "[DELE MSG]",
        message.guild.name,
        message.channel.name,
        message.channel.id,
        message.member.user.username,
        message.content
      );
    }, 120000);
    return;
  }

  ////////////////DM転送////////////////
  if (message.member == undefined) {
    return sendMsg(
      message.channel.id,
      "転送サービスは終了しました。\nメッセージ送信は/msgsendで利用できます。詳しくは/helpを参照してください。"
    );
  }

  ////////////////ボイス////////////////
  var through = "yes";
  db_vic
    .findOne({ type: "ボイス", target: message.content })
    .exec(async (error, docs) => {
      if (error !== null) {
        logger.error(error);
        logERR(error.name, error.message);
        sendErr(error.name, message.channel.id, error.message);
      }
      ////////////////ボイス////////////////
      if (docs) {
        through = "no";
        const vchannel = message.member.voice.channel;
        if (!vchannel)
          return message.reply("このコマンドはVC参加中しか使えません");
        const connection = await vchannel.join();
        const dispatcher = connection.play(voice_dir + docs.target + ".mp3");
        dispatcher.on("start", () => {
          dispatcher.setVolume(0.5);
          message.delete();
          logWARN(
            "[PLAY MP3]",
            vchannel.guild.name,
            vchannel.name,
            vchannel.id,
            message.member.user.username,
            docs.target
          );
        });
        dispatcher.on("finish", () => {});
        dispatcher.on("error", (error) => {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        });
        return;
      }
    });

  ////////////////リアクション判定////////////////
  db_grk.count({ type: "特殊" }, (error, count) => {
    db_grk
      .find({ type: "特殊" })
      .sort({ key: 1 })
      .exec((error, docs) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        for (let step = 0; step < count; step++) {
          if (docs[step].decision == "include") {
            if (message.content.match(docs[step].target)) {
              message.react(docs[step].text).catch((error) => {
                logger.error(error);
                logERR(error.name, error.message);
                sendErr(error.name, message.channel.id, error.message);
              });
              logINFO(
                "[REACTMSG]",
                message.guild.name,
                message.channel.name,
                message.channel.id,
                message.member.user.username,
                docs[step].text
              );
            }
          } else if (docs[step].decision == "match") {
            if (message.content === docs[step].target) {
              message.react(docs[step].text).catch((error) => {
                logger.error(error);
                logERR(error.name, error.message);
                sendErr(error.name, message.channel.id, error.message);
              });
              logINFO(
                "[REACTMSG]",
                message.guild.name,
                message.channel.name,
                message.channel.id,
                message.member.user.username,
                docs[step].text
              );
              break;
            }
          } else {
            break;
          }
        }
      });
  });

  ////////////////語録判定////////////////
  //URL＆ユーザ指定排除//
  if (message.content.match("http") || message.content.match("@!")) {
    return;
  }
  db_grk.count({ type: "語録" }, (error, count) => {
    if (through == "no") {
      return;
    }
    db_grk
      .find({ type: "語録" })
      .sort({ key: 1 })
      .exec((error, docs) => {
        if (error !== null) {
          logger.error(error);
          logERR(error.name, error.message);
          sendErr(error.name, message.channel.id, error.message);
        }
        for (let step = 0; step < count; step++) {
          if (docs[step].decision == "include") {
            if (message.content.match(docs[step].target)) {
              sendInm(message.channel.id, docs[step].text);
            }
          } else if (docs[step].decision == "match") {
            if (message.content === docs[step].target) {
              sendInm(message.channel.id, docs[step].text);
              break;
            }
          } else {
            break;
          }
        }
      });
  });
});

////////////////ボイスチャンネル////////////////
client.on("voiceStateUpdate", async (oldState, newState) => {
  const new_VCOnlyCh = newState.guild.channels.cache.find(
    (channel) => channel.name === VOnylChannelName
  );
  const old_VCOnlyCh = oldState.guild.channels.cache.find(
    (channel) => channel.name === VOnylChannelName
  );
  const imagesNo = Math.floor(Math.random() * VCimgs.length);

  //判定-me
  if (
    newState.member.id === client.user.id ||
    oldState.member.id === client.user.id
  ) {
    return;
  }
  //判定-例外
  if (oldState.channelID === newState.channelID) {
    return;
  }
  //判定-参加
  if (newState.channelID != null) {
    logTRACE(
      "[JOIN  VC]",
      newState.guild.name,
      client.channels.cache.get(newState.channelID).name,
      newState.channelID,
      newState.member.user.username
    );

    await db_int.findOne(
      { name: "PLAYMUSIC", other: newState.channelID },
      (error, doc) => {
        if (error !== null) {
          logger.error(error);
          sendErr(error.name, new_VCOnlyCh, error.message);
          logERR(error.name, error.message);
        }
        if (doc == null) {
          const doc = {
            key: 0,
            name: "PLAYMUSIC",
            state: "stoping",
            other: newState.channelID,
          };
          db_int.insert(doc, (error, newdoc) => {
            if (error !== null) {
              logger.error(error);
              sendErr(error.name, new_VCOnlyCh, error.message);
              logERR(error.name, error.message);
            }
          });
        }
      }
    );

    //VC専用チャット存在判定 ->作成
    if (new_VCOnlyCh == undefined) {
      newState.guild.channels
        .create(VOnylChannelName, {
          parent: newState.guild.channels.cache.find(
            (channel) => channel.rawPosition === 0
          ).id,
          type: "text",
          permissionOverwrites: [
            {
              id: newState.guild.roles.everyone.id,
              deny: ["VIEW_CHANNEL"],
            },
            {
              id: client.user.id,
              allow: ["VIEW_CHANNEL"],
            },
          ],
        })
        .then(
          logWARN(
            "[MAKE VCH]",
            newState.guild.name,
            client.channels.cache.get(newState.channelID).name,
            newState.channelID
          )
        )
        .catch((error) => {
          logger.error(error);
          sendErr(error.name, new_VCOnlyCh.id, error.message);
          logERR(error.name, error.message);
        });
    } else {
      //VC専用チャット許可
      await newState.guild.channels.cache
        .get(new_VCOnlyCh.id)
        .updateOverwrite(newState.member, { VIEW_CHANNEL: true })
        .then(
          logWARN(
            "[TRUE  VW]",
            newState.guild.name,
            client.channels.cache.get(newState.channelID).name,
            newState.channelID,
            newState.member.user.username
          )
        )
        .catch((error) => {
          logger.error(error);
          sendErr(error.name, new_VCOnlyCh.id, error.message);
          logERR(error.name, error.message);
        });
    }
    /*
    sendMsg(new_VCOnlyCh.id,
      "[周知]\n現在、音楽再生機能がYouTubeAPIの仕様変更により使用できません。\n修正まで暫く掛かる予定です。"
    );
    */
  }
  //判定-退出
  if (oldState.channelID != null) {
    logINFO(
      "[LEAVE VC]",
      oldState.guild.name,
      client.channels.cache.get(oldState.channelID).name,
      oldState.channelID,
      oldState.member.user.username
    );
    //VC専用チャット拒否
    oldState.guild.channels.cache
      .get(old_VCOnlyCh.id)
      .updateOverwrite(oldState.member, { VIEW_CHANNEL: false })
      .then(
        logWARN(
          "[FALSE VW]",
          oldState.guild.name,
          client.channels.cache.get(oldState.channelID).name,
          oldState.channelID,
          oldState.member.user.username
        )
      )
      .catch((error) => {
        logger.error(error);
        sendErr(error.name, old_VCOnlyCh.id, error.message);
        logERR(error.name, error.message);
      });
  }
  //判定-終了
  if (
    oldState.channelID != null &&
    client.channels.cache
      .get(oldState.channelID)
      .members.filter((member) => !member.user.bot).size == 0
  ) {
    oldState.guild.me.voice.channel.leave();
    logINFO(
      "[FINISHVC]",
      oldState.guild.name,
      client.channels.cache.get(oldState.channelID).name,
      oldState.channelID
    );
    db_int.update(
      { name: "PLAYMUSIC", other: oldState.channelID },
      {
        $set: {
          state: "stoping",
          other: oldState.channelID,
        },
      },
      {
        upsert: true,
      },
      (error) => {
        if (error !== null) {
          logger.error(error);
          sendErr(error.name, new_VCOnlyCh.id, error.message);
          logERR(error.name, error.message);
        }
      }
    );
  }

  //参加時
  if (oldState.channelID == undefined && newState.channelID != undefined) {
    //一人目判定
    if (
      client.channels.cache
        .get(newState.channelID)
        .members.filter((member) => !member.user.bot).size == 1
    ) {
      logINFO(
        "[START VC]",
        newState.guild.name,
        client.channels.cache.get(newState.channelID).name,
        newState.channelID,
        newState.member.user.username
      );
      newState.channel.createInvite({ maxAge: "0" }).then((invite) => {
        var attachment = new discord.MessageAttachment(
          vcimg_dir + VCimgs[imagesNo],
          "image.gif"
        );
        sendMsgSPE(
          newState.guild.channels.cache.find(
            (channel) => channel.type == "text"
          ).id,
          "🏳 " +
            newState.guild.name +
            "サーバーで" +
            newState.member.user.username +
            "さんが通話を始めました！  [@everyone]",
          {
            files: [attachment],
            embed: {
              title:
                client.channels.cache.get(newState.channelID).name +
                "CHで" +
                newState.member.user.username +
                "さんがVCを開始しました",
              thumbnail: {
                url: "attachment://image.gif",
                //url: "https://cdn.glitch.com/" + VCimgs[imagesNo],
              },
              description: "\nURLをクリックしてVCに参加する\n" + invite.url,
              color: "RANDOM",
            },
          }
        );
      });
    }

    ////////////////ボイス////////////////
    db_int.findOne(
      { name: "PLAYMUSIC", other: newState.channelID },
      (error, docs) => {
        if (error !== null) {
          logger.error(error);
          sendErr(error.name, new_VCOnlyCh.id, error.message);
          logERR(error.name, error.message);
        }
        if (docs.state == "stoping") {
          db_vic.count({ type: "挨拶" }, (error, count) => {
            db_vic
              .find({ type: "挨拶" })
              .sort({ key: 1 })
              .exec(async (error, docs) => {
                if (error !== null) {
                  logger.error(error);
                  sendErr(error.name, new_VCOnlyCh.id, error.message);
                  logERR(error.name, error.message);
                }
                for (let step = 0; step < count; step++) {
                  if (newState.member.user.id == docs[step].target) {
                    const connection =
                      await newState.member.voice.channel.join();
                    const dispatcher = connection.play(
                      voice_dir + docs[step].target + ".mp3"
                    );
                    dispatcher.on("start", () => {
                      dispatcher.setVolume(0.5);
                      logWARN(
                        "[PLAY MP3]",
                        newState.member.voice.channel.guild.name,
                        newState.member.voice.channel.name,
                        newState.member.voice.channel.id,
                        client.user.username,
                        docs[step].target + ".mp3"
                      );
                    });
                    dispatcher.on("finish", () => {});
                    dispatcher.on("error", (error) => {
                      logger.error(error);
                      sendErr(error.name, new_VCOnlyCh.id, error.message);
                      logERR(error.name, error.message);
                    });
                    return;
                  }
                }
                const connection = await newState.member.voice.channel.join();
                const dispatcher = connection.play(voice_dir + "nodata.mp3");
                dispatcher.on("start", () => {
                  dispatcher.setVolume(0.5);
                  logWARN(
                    "[PLAY MP3]",
                    newState.member.voice.channel.guild.name,
                    newState.member.voice.channel.name,
                    newState.member.voice.channel.id,
                    client.user.username,
                    "nodata"
                  );
                });
                dispatcher.on("finish", () => {});
                dispatcher.on("error", (error) => {
                  logger.error(error);
                  sendErr(error.name, new_VCOnlyCh.id, error.message);
                  logERR(error.name, error.message);
                });
                return;
              });
          });
        } else {
          sendMsg(
            new_VCOnlyCh.id,
            "こんにちは、<@" +
              newState.member.user.id +
              ">さん\n現在、音楽が再生されているため挨拶ボイスを省略しました。"
          );
        }
      }
    );
  }
});

////////////////Function////////////////
function downloadFile(url, filename, channelID) {
  request(
    { method: "GET", url: url, encoding: null },
    function (error, response, body) {
      if (!error && response.statusCode === 200) {
        fs.writeFileSync(lib_dir + filename, body, "binary");
        sendMsgIMAGE(
          "UPLOAD DONE",
          channelID,
          "ファイルバイナリデータアップロード完了",
          lib_dir + filename
        );
      } else if (error) {
        logger.error(error);
        logERR(error.name, error.message);
        sendErr(error.name, channelID, error.message);
      }
    }
  );
  return;
}

function toHms(t) {
  var hms = "";
  var h = (t / 3600) | 0;
  var m = ((t % 3600) / 60) | 0;
  var s = t % 60;
  if (h != 0) {
    hms = h + ":" + padZero(m) + ":" + padZero(s);
  } else if (m != 0) {
    hms = m + ":" + padZero(s);
  } else {
    hms = "0:" + s;
  }
  return hms;
  function padZero(v) {
    if (v < 10) {
      return "0" + v;
    } else {
      return v;
    }
  }
}

function logTRACE(
  flag = "[SYSTRACE]",
  servername,
  channelname,
  channelid,
  username = client.user.username,
  content = ""
) {
  const Con =
    flag +
    "\n[S:" +
    servername +
    " F:" +
    channelname +
    "(" +
    channelid +
    ") B:" +
    username +
    "]\n" +
    content;
  const logCon = Con.replace(/\n/g, " - ");
  client.channels.cache
    .get(GenLogChannelId)
    .send("", {
      embed: {
        description: Con,
        color: 16777215,
      },
    })
    .catch((error) => logger.error(error));
  client.channels.cache
    .get(MsgLogChannelId)
    .send("", {
      embed: {
        description: Con,
        color: 16777215,
      },
    })
    .catch((error) => logger.error(error));
  logger.trace(logCon);
}

function logINFO(
  flag = "[SYS INFO]",
  servername,
  channelname,
  channelid,
  username = client.user.username,
  content = ""
) {
  const Con =
    flag +
    "\n[S:" +
    servername +
    " F:" +
    channelname +
    "(" +
    channelid +
    ") B:" +
    username +
    "]\n" +
    content;
  const logCon = Con.replace(/\n/g, " - ");
  client.channels.cache
    .get(GenLogChannelId)
    .send("", {
      embed: {
        description: Con,
        color: 3447003,
      },
    })
    .catch((error) => logger.error(error));
  logger.info(" " + logCon);
}

function logWARN(
  flag = "[SYS WARN]",
  servername,
  channelname,
  channelid,
  username = client.user.username,
  content = ""
) {
  const Con =
    flag +
    "\n[S:" +
    servername +
    " F:" +
    channelname +
    "(" +
    channelid +
    ") B:" +
    username +
    "]\n" +
    content;
  const logCon = Con.replace(/\n/g, " - ");
  client.channels.cache
    .get(GenLogChannelId)
    .send("", {
      embed: {
        description: Con,
        color: 15105570,
      },
    })
    .catch((error) => logger.error(error));
  logger.warn(" " + logCon);
}

function logFATAL(
  flag = "[SYSFATAL]",
  servername,
  channelname,
  channelid,
  username = client.user.username,
  content = ""
) {
  const Con =
    flag +
    "\n[S:" +
    servername +
    " F:" +
    channelname +
    "(" +
    channelid +
    ") B:" +
    username +
    "]\n" +
    content;
  const logCon = Con.replace(/\n/g, " - ");
  client.channels.cache
    .get(GenLogChannelId)
    .send("", {
      embed: {
        description: Con,
        color: 15158332,
      },
    })
    .catch((error) => logger.error(error));
  logger.fatal(logCon);
}

function logERR(flag = "ERROR", text = "") {
  client.channels.cache
    .get(GenLogChannelId)
    .send("", {
      embed: {
        description: "[" + flag + "]\n" + text,
        color: 15158332,
      },
    })
    .catch((error) => logger.error(error));
  client.channels.cache
    .get(MsgLogChannelId)
    .send("", {
      embed: {
        description: flag + "\n" + text,
        color: 15158332,
      },
    })
    .catch((error) => logger.error(error));
}

function sendMsg(channelId, text = "") {
  const CH = client.channels.cache.get(channelId);
  CH.send("🏴 -INFORMATION-", {
    embed: {
      description: "`❰SYSTEM MESSAGE❱`\n" + text,
      color: "#2f3136",
    },
  })
    .then(
      logINFO(
        "[SEND MSG]",
        CH.guild.name,
        CH.name,
        channelId,
        client.user.username,
        text
      )
    )
    .catch((error) => {
      logger.error(error);
      logERR(error.name, error.message);
      sendErr(error.name, channelId, error.message);
    });
}

function sendErr(flag = "ERROR", channelId, text = "") {
  const attachment = new discord.MessageAttachment(
    image_dir + "error.jpg",
    "image.jpg"
  );
  const CH = client.channels.cache.get(channelId);
  CH.send("🏴 -INFORMATION-", {
    files: [attachment],
    embed: {
      image: {
        url: "attachment://image.jpg",
      },
      description:
        "`❰" +
        flag +
        "❱`\n" +
        "An error occurred while processing your request. Please try again.\n処理中にエラーが発生しました。初めからやり直して下さい。\n\n:::ERROR MESSAGE:::\n" +
        text,
      color: "#2f3136",
    },
  })
    .then(
      logINFO(
        "[SEND MSG]",
        CH.guild.name,
        CH.name,
        channelId,
        client.user.username,
        text
      )
    )
    .catch((error) => logger.error(error));
}

function sendMsgSAVE(flag = "SYSTEM", channelId, text = "") {
  const CH = client.channels.cache.get(channelId);
  CH.send("🏳 -INFORMATION-", {
    embed: {
      description: "`❰" + flag + "❱`\n" + text,
      color: "#2f3136",
    },
  })
    .then(
      logWARN(
        "[SEND MSG]",
        CH.guild.name,
        CH.name,
        channelId,
        client.user.username,
        text
      )
    )
    .catch((error) => {
      logger.error(error);
      logERR(error.name, error.message);
      sendErr(error.name, channelId, error.message);
    });
}

function sendMsgIMAGE(
  flag = "SYSTEM",
  channelId,
  text = "",
  imagedir = image_dir + "noimage.png"
) {
  if (imagedir.match(/http/)) {
    var attachment = new discord.MessageAttachment(imagedir, "image.jpg");
  } else {
    var attachment = new discord.MessageAttachment(imagedir, "image.jpg");
  }
  const CH = client.channels.cache.get(channelId);
  CH.send("🏴 -INFORMATION-", {
    files: [attachment],
    embed: {
      description: "`❰" + flag + "❱`\n" + text,
      image: {
        url: "attachment://image.jpg",
      },
      color: "#2f3136",
    },
  })
    .then(
      logWARN(
        "[SENDIMSG]",
        CH.guild.name,
        CH.name,
        channelId,
        client.user.username,
        text
      )
    )
    .catch((error) => {
      logger.error(error);
      logERR(error.name, error.message);
      sendErr(error.name, channelId, error.message);
    });
}
function sendMsgSCD(
  flag = "SYSTEM",
  channelId,
  text = "",
  imagename = "noimage.png"
) {
  if (imagename.match(/http/)) {
    var attachment = new discord.MessageAttachment(imagename, "image.jpg");
  } else {
    var attachment = new discord.MessageAttachment(
      image_dir + imagename,
      "image.jpg"
    );
  }
  const CH = client.channels.cache.get(channelId);
  CH.send("🏳 " + text, {
    files: [attachment],
    embed: {
      description: "`❰" + flag + "❱`\n" + text,
      image: {
        url: "attachment://image.jpg",
      },
      color: "#2f3136",
    },
  })
    .then(
      logWARN(
        "[SENDIMSG]",
        CH.guild.name,
        CH.name,
        channelId,
        client.user.username,
        text
      )
    )
    .catch((error) => {
      logger.error(error);
      logERR(error.name, error.message);
      sendErr(error.name, channelId, error.message);
    });
}
function sendMsgSPE(channelId, text = "", option = {}) {
  const CH = client.channels.cache.get(channelId);
  CH.send(text, option)
    .then(
      logINFO(
        "[SEND MSG]",
        CH.guild.name,
        CH.name,
        channelId,
        client.user.username,
        text
      )
    )
    .catch((error) => {
      logger.error(error);
      logERR(error.name, error.message);
      sendErr(error.name, channelId, error.message);
    });
}

function sendInm(channelId, text) {
  const CH = client.channels.cache.get(channelId);
  CH.send(text)
    .then(
      logINFO(
        "[SEND INM]",
        CH.guild.name,
        CH.name,
        channelId,
        client.user.username,
        text
      )
    )
    .catch((error) => {
      logger.error(error);
      logERR(error.name, error.message);
      sendErr(error.name, channelId, error.message);
    });
}

////////////////DiscordLogin////////////////
if (TOKEN == undefined) {
  console.log("!!!!!!!PLEASE SET ENV: DISCORD_BOT_TOKEN!!!!!!!");
  logger.fatal("!!!!!!!PLEASE SET ENV: DISCORD_BOT_TOKEN!!!!!!!");
  process.exit(0);
}
client.login(TOKEN);
