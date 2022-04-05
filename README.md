# slack-bot_gather_member

gatherにいる人を更新し続けるslack botです．

# 使い方
## 1. slackのアプリを作ります．
1. App Manifestはこんな感じです．
```yaml
display_information:
  name: gather_bot
features:
  bot_user:
    display_name: gather_bot
    always_online: true
oauth_config:
  scopes:
    bot:
      - chat:write
      - im:read
      - groups:read
      - channels:read
      - mpim:read
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```
- App Manifestについて詳しくはこちらを参照してください
https://api.slack.com/reference/manifests#creating_manifests

## 2. .envファイルを作ってください．
```
# slack
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
SLACK_CHANNEL_ID=

# gather
API_KEY=
# SPACE_IDのバックスラッシュは一つでOK（エスケープしなくていい）
SPACE_ID=foo\bar
```
SLACK_SIGNING_SECRET：slackのアプリ作成時に取得できます．  
SLACK_BOT_TOKEN：アプリをワークスにインストールする時に取得できます．  
gatherのapi-key：gatherにロクインした状態で https://gather.town/apiKeys ここから取得してください．  
gatherのspace id：gatherのurlのhttps://gather.town/app/{space id}です．スラッシュ(/)→バックスラッシュ(\\)に変えてください．

### 注意！
gatherのapi-keyを取得したユーザーはnode index.jsのプロセスが続いている間ずっとgatherにいることになります．一つこのbot用のgatherのアカウントを作成しておくことをお勧めします．（これがindex.jsの中にあるslack_botくんの正体です）
## 3.パッケージをインストール
```bash
npm install
```
## 4. 起動
```bash
node index.js
```

## 5-1. herokuに上げる場合
Procfile↓に以下を記述してください．
```Procfile
worker: node index.js
```

## 5-2. Dockerのコンテナでお試し実行する場合
```bash
$ docker-compose up -d
$ docker-compose exec app sh
# node index.js
```

## 参考
- gatherのapiのdocument
https://gathertown.notion.site/Gather-Websocket-API-bf2d5d4526db412590c3579c36141063
- gather-game-clientのdocument
http://gather-game-client-docs.s3-website-us-west-2.amazonaws.com/index.html
- herokuに.envをpush
https://e-tec-memo.herokuapp.com/article/277/