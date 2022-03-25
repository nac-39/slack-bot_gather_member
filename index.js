
import { Game } from "@gathertown/gather-game-client";
import Slack from "@slack/bolt";
import dotenv from "dotenv";
import webSocket from "isomorphic-ws";

const updateSlack = async (playersList, tsts) => {
  const BLOCKS = generateBlocks(playersList, tsts);
  console.log(BLOCKS);
  try {
    var result = await app.client.chat.update({
      channel: process.env.SLACK_CHANNEL_ID,
      ts: tsts,
      blocks: BLOCKS,
    });
    console.log(result);
    return result.ts;
  } catch (error) {
    console.error(error);
    var result = await app.client.chat.update({
      channel: process.env.SLACK_CHANNEL_ID,
      ts: tsts,
      text: "エラーで更新できませんでした><"
    });
  }
};

// 初回投稿用の関数
// 投稿した時のタイムスタンプを返す．awaitで呼び出す．
const firstPost = async () => {
  try {
    const result = await app.client.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID,
      text: "そのうち更新されます……",
    });
    console.log(result);
    return result.ts;
  } catch (error) {
    console.error(error);
    return error;
  }
};
// 各パーツの画像を合成してgatherのアイコンを生成する予定
// 今は顔（髪なし）をかえすだけ
const genImage = (outfitJson) => {
  return outfitJson.skin.previewUrl;
};

// Slackを更新する時の本文を生成する
const generateBlocks = (playersList, timeStamp) => {
  var blocks = [];
  let dateTime = new Date(Date.now() + 32400000);
  // gatherにいる人を追加していく
  playersList.forEach((player) => {
    console.log(player);
    if (player && player.name != "slack_botくん") {
      var section = {
        type: "section",
        accessory: {
          type: "image",
          image_url: `${
            player.outfitString
              ? genImage(JSON.parse(player.outfitString))
              : "https://dotown.maeda-design-room.net/wp-content/uploads/2022/01/person_ghost_01.png"
          }`,
          alt_text: `${player.name}`,
        },
        text: {
          type: "mrkdwn",
          text: `*${player.name}* ${
            player.emojiStatus ? ":" + player.emojiStatus + ":" : ""
          }\n:speech_balloon:${player.textStatus}`,
        },
      };
      blocks.push(section);
    }
  });

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Last Update: ${dateTime.toLocaleTimeString(
          "ja-JP"
        )} ${dateTime.toLocaleDateString()}`,
      },
    ],
  });
  return blocks;
};

const onConnected = (connected) => {
  console.log("Connected: ", connected);
  game.enter(process.env.SPACE_ID);
  console.log(Object.keys(game.players));
  console.log(game.getStats());
};

/* **********************
 ********* main **********
 *********************** */
const { App } = Slack;
dotenv.config();
global.WebSocket = webSocket;


// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  port: process.env.PORT || 3000,
  processBeforeResponse: true,
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
  process.env.TS = await firstPost();
})();

// gatherのgameクラス初期化
const game = new Game(process.env.SPACE_ID, () =>
  Promise.resolve({ apiKey: process.env.API_KEY })
);
game.connect();
game.subscribeToConnection(onConnected);

// websocketを使ってプレイヤーが入ってくるイベントを監視してる
game.subscribeToEvent("playerJoins", (player) => {
  console.log("playerJoined", player);
  var gamePlayersList = Array();
  setTimeout(async () => {
    Object.keys(game.players).forEach((e) => {
      // e: playerのID
      gamePlayersList.push(game.getPlayer(e));
    });
  // websocketを使ってプレイヤーが入ってくるイベントを監視してる
    process.env.TS = await updateSlack(gamePlayersList, process.env.TS);
  }, 5000);// プレイヤーが入室してからgame.playersに反映されるのに少し時間がかかる
});

// websocketを使ってプレイヤーが出ていくイベントを監視してる
game.subscribeToEvent("playerExits", (player) => {
  console.log("playerExited", player);
  var gamePlayersList = Array();
  setTimeout(async () => {
    Object.keys(game.players).forEach((e) => {
      gamePlayersList.push(game.getPlayer(e));
    });
    // タイムスタンプを更新すると共にslackの投稿を更新する
    process.env.TS = await updateSlack(gamePlayersList, process.env.TS);
  }, 5000);
});
