# TOEI Backend Application

[![CircleCI](https://circleci.com/gh/toei-jp/backend.svg?style=svg)](https://circleci.com/gh/toei-jp/backend)

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name                             | Required | Value            | Purpose                      |
| -------------------------------- | -------- | ---------------- | ---------------------------- |
| `DEBUG`                          | false    | chevre-backend:* | Debug                        |
| `NODE_ENV`                       | true     |                  | Environment name             |
| `MONGOLAB_URI`                   | true     |                  | MongoDB Connection URI       |
| `REDIS_PORT`                     | true     |                  | Redis Cache Connection       |
| `REDIS_HOST`                     | true     |                  | Redis Cache Connection       |
| `REDIS_KEY`                      | true     |                  | Redis Cache Connection       |
| `API_ENDPOINT`                   | true     |                  |                              |
| `API_AUTHORIZE_SERVER_DOMAIN`    | true     |                  |                              |
| `API_CLIENT_ID`                  | true     |                  |                              |
| `API_CLIENT_SECRET`              | true     |                  |                              |
| `API_CODE_VERIFIER`              | true     |                  |                              |
| `CHEVRE_ENDPOINT`                | true     |                  |                              |
| `CHEVRE_AUTHORIZE_SERVER_DOMAIN` | true     |                  |                              |
| `CHEVRE_CLIENT_ID`               | true     |                  |                              |
| `CHEVRE_CLIENT_SECRET`           | true     |                  |                              |
| `POS_CLIENT_ID`                  | true     |                  | POSアプリクライアントID      |
| `FRONTEND_CLIENT_ID`             | true     |                  | FrontendアプリクライアントID |

## License

ISC
