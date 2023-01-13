# ChatMe Bot example

ChatMe bot that listen private messages and reply using OpenAI. You can use this repo to build your own bot for chatMe, you can find more
details in our documentation.

## Requirements

- nodeJS 16+

## Install

1. Install requirements:

``` 
npm install
```

2. Copy ".env.sample" into ".env.testnet" and/or ".env.production" files and set environment variables:

- NODE_ENV: testnet or mainnet environment (NEAR network).
- BOT_PRIVATE_KEY: Private key for your bot account.
- BOT_ACCOUNT_NAME: NEAR wallet for your bot account.

NOTE: Our bot example using OpenAI API to process responses to user and require OPENAI_API_KEY in environment file.

## Local development

We recommend to use watch script for local development - it build typescript and relaunch nodeJS process:

```npm run watch```

## Deployment & Production

Next steps required to deploy your bot:

- Create NEAR account or use existing one as bot wallet address.
- Check account balance, your account need some NEAR tokens to send messages.
- Update BOT_ACCOUNT_NAME - set bot wallet address in your environment file.
- Get private key for this NEAR account and update BOT_PRIVATE_KEY in your environment file.
- Update bot request/response functionality in src/utils/messages.ts.
- Build: ```npm run build```
- Deploy to server and run by using PM2:
    - For testnet:```npm run dev:start```
    - For mainnet:```npm run prod:start```

## Server update deployment

- ```git pull```
- ```npm run build```
- ```pm2 restart chatme-dev-bot --update-env```
- ```pm2 restart chatme-prod-bot --update-env```