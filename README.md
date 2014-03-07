# lamassu-server

Lamassu remote server.

## Installation

```sh
git clone git@github.com:lamassu/lamassu-server.git
cd lamassu-server
npm install
```

If you're working on this stack, you probably want to `npm link`
[`lamassu-atm-protocol`](https://github.com/lamassu/lamassu-atm-protocol).

```sh
git clone git@github.com:lamassu/lamassu-atm-protocol.git
cd lamassu-atm-protocol
npm install
npm link
```

```sh
# Back in lamassu-server
npm link lamassu-atm-protocol
```

## Running
```sh
node lib/app.js --https
```

The https flag is required for local testing. When deployed to a PAAS environment - such as heroku, the https flag is not required,
as the SSL connection typically terminates on the load balancer and the application will see http only.

## Deployment
Deployment of this application is described in
[`lamassu-admin`](https://github.com/lamassu/lamassu-admin) documentation.
