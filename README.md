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

Next, you need Postgres running. Postgres is required for storing configuration
of the remote server. Install Postgres with your package manager of choice, then:

```sh
sudo su - postgres
createuser --superuser lamassu
createdb -U lamassu lamassu
```

Then you need SQL scripts to seed initial configs. Those are stored in
[`lamassu-admin`](https://github.com/lamassu/lamassu-admin).

```sh
git clone git@github.com:lamassu/lamassu-admin.git
cd lamassu-admin
```

You'll need to make some changes to the provided SQL scripts, since they come
with no configured exchange accounts. This is assuming that you already have
a [Blockchain](https://blockchain.info) account.
Open `database/lamassu.sql`, find the part responsible for Blockchain
configuration and change it to:

```json
"blockchain": {
  "guid": "<account-id>",
  "password": "<password>",
  "fromAddress": "<account-bitcoin-address>"
}
```

Then run:

```sh
# Still in lamassu-admin
psql lamassu lamassu < database/lamassu.sql
```

This should get you set up with a configured database. If you want to change
the configuration, do:

```sh
psql lamassu lamassu < database/drop.sql
psql lamassu lamassu < database/lamassu.sql
```

## Running
```sh
node lib/app.js --https
```

The https flag is required for local testing. When deployed to a PAAS environment - such as heroku, the https flag is not required,
as the SSL connection typically terminates on the load balancer and the application will see http only.


