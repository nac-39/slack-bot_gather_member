import { Game } from "@gathertown/gather-game-client";
import Slack from "@slack/bolt";
import dotenv from "dotenv";
import webSocket from "isomorphic-ws";

const updateSlack = async (playersList, tsts) => {
  var BLOCKS = generateBlocks(playersList, tsts);
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
const generateBlocks = (playersList, timeStamp) => {
  var blocks = [];
  let dateTime = new Date(timeStamp * 1000 + 32400000);
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
            player.emojiStatus ? player.emojiStatus : ""
          }${
            player.openToConversation ? ":speaker:" : ":mute:"
          }\n:speech_balloon:${player.textStatus}`,
        },
      };
      blocks.push(section);
    }
  });
  // blocks.push({
  //   type: "actions",
  //   elements: [
  //     {
  //       type: "button",
  //       text: {
  //         type: "plain_text",
  //         text: "botを起こす",
  //         emoji: true,
  //       },
  //       value: "getup",
  //       action_id: "getup_action",
  //     },
  //   ],
  // });

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

const game = new Game(process.env.SPACE_ID, () =>
  Promise.resolve({ apiKey: process.env.API_KEY })
);
game.connect();
game.subscribeToConnection(onConnected);

// action_id が "approve_button" のインタラクティブコンポーネントがトリガーされる毎にミドルウェアが呼び出される
app.action("getup_action", async ({ ack }) => {
  await ack();
  setTimeout(async () => {
    Object.keys(game.players).forEach((e) => {
      gamePlayersList.push(game.getPlayer(e));
    });
    process.env.TS = await updateSlack(gamePlayersList, process.env.TS);
  }, 5000);
});

game.subscribeToEvent("playerJoins", (player) => {
  console.log("playerJoined", player);
  var gamePlayersList = Array();
  setTimeout(async () => {
    Object.keys(game.players).forEach((e) => {
      gamePlayersList.push(game.getPlayer(e));
    });
    process.env.TS = await updateSlack(gamePlayersList, process.env.TS);
  }, 5000);
});

game.subscribeToEvent("playerExits", (player) => {
  console.log("playerExited", player);
  var gamePlayersList = Array();
  setTimeout(async () => {
    Object.keys(game.players).forEach((e) => {
      gamePlayersList.push(game.getPlayer(e));
    });
    process.env.TS = await updateSlack(gamePlayersList, process.env.TS);
  }, 5000);
});
