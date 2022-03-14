import { Game } from "@gathertown/gather-game-client";
import Slack from "@slack/bolt";
import dotenv from "dotenv";
import webSocket from "isomorphic-ws";

const updateSlack = async (playersList, tsts) => {
  var BLOCKS = generateBlocks(playersList);
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
  }
};
// 各パーツの画像を合成してgatherのアイコンを生成する予定
// 今は顔（髪なし）をかえすだけ
const genImage = (outfitJson) => {
  return outfitJson.skin.previewUrl;
};

// Slackを更新する時の本文を生成する
const generateBlocks = (playersList) => {
  var blocks = [];
  playersList.forEach((player) => {
    if (player) {
      var section = {
        type: "section",
        accessory: {
          type: "image",
          image_url: `${player.outfitString?genImage(JSON.parse(player.outfitString)):"https://dotown.maeda-design-room.net/wp-content/uploads/2022/01/person_ghost_01.png"}`,
          alt_text: `${player.name}`,
        },
        text: {
          type: "mrkdwn",
          text: `${player.name} ${
            player.emojiStatus ? player.emojiStatus : ""
          }`,
        },
      };
      blocks.push(section);
    }
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
var TS = "";

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
  TS = await firstPost();
})();

const game = new Game(process.env.SPACE_ID, () =>
  Promise.resolve({ apiKey: process.env.API_KEY })
);
game.connect();
game.subscribeToConnection(onConnected);
game.subscribeToEvent("playerJoins", (player) => {
  console.log("playerJoined", player);
  var gamePlayersList = Array();
  setTimeout(async () => {
    Object.keys(game.players).forEach((e) => {
      gamePlayersList.push(game.getPlayer(e));
    });
    TS = await updateSlack(gamePlayersList, TS);
  }, 5000);
});

game.subscribeToEvent("playerExits", (player) => {
  console.log("playerExited", player);
  var gamePlayersList = Array();
  setTimeout(async () => {
    Object.keys(game.players).forEach((e) => {
      gamePlayersList.push(game.getPlayer(e));
    });
    TS = await updateSlack(gamePlayersList, TS);
  }, 5000);
});
