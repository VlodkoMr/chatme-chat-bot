# Chatme Bot example

...

## Install

1. Install requirements:

``` 
npm install
```

2. Copy ".env.sample" into ".env.testnet" and/or ".env.production" files and set variables:

- NODE_ENV: testnet or mainnet environment where you contract deployed.
- CONTRACT_PRIVATE_KEY: Private key for deployed smart-contract (without ed25519:).
- DB_CONNECTION: prisma database connection URL.

3. Update server/index.js script to handle new transactions and save in your database structure.
4. Upload script and run.

## Local development

- npm run watch

## Setup & Deploy

Next steps required to deploy your bot:

- Create NEAR account or use existing one as bot wallet address. Set this address for BOT_ACCOUNT_NAME in .env.production file.
- Get private key for this account and update BOT_PRIVATE_KEY in .env.production file.
- Update bot request/response functionality in server/src/index.ts.
- Check account balance, your account need some NEAR tokens to send messages.

