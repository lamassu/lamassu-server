This is part of the **Raqía** Bitcoin Machine platform.

# lamassu-server

Lamassu remote server.

## Installation

```sh
git clone git@github.com:lamassu/lamassu-server.git
cd lamassu-server
npm install
```

## Configuration

```bash
bin/ssu config smtp2go user pass fromEmail toEmail
bin/ssu config twilio accountSid authToken fromNumber toNumber
bin/ssu set sms twilio
bin/ssu set email smtp2go
bin/ssu notify [email] [sms]  # send email or sms alerts, or both
bin/ssu config notifier lowBalanceThreshold # set low balance alert, in fiat
```

## Running
```sh
node lib/app.js
```
