## Adding a new cryptocurrency to a Lamassu ATM

### Structure

In order to install new coins onto a Lamassu system, there are three points to pay attention:
  - **The blockchain daemon:** This is a file which will need to be running on the lamassu-server and communicates with the blockchain network. This generally has an integrated wallet, but it may occur for the daemon and the wallet to be completely seperate processes (e.g. XMR). This manager is currently built into the lamassu-server project, but in the future, it will be moved to either lamassu-coins or a new library;
  - **The wallet plugin:** This uses the capabilities of the RPC (Remote Procedure Call) API built into the blockchain daemon and wallet to create a linking API to standardize with the Lamassu ecosystem. It is built into the lamassu-server project;
  - **The coin constants:** This has all the information about an implemented coin, including its code, unit scale, daemon RPC ports and all other information to make lamassu-server, lamassu-admin-server and lamassu-machine know about the supported coins. It is built into the lamassu-coins package;

I'll be using XMR as example for all the steps in this guide.

#### Blockchain

Steps to implement a daemon:
  - Create a file in `lamassu-server/lib/blockchain/<name_of_coin>.js`;
  - Go to `lamassu-server/lib/blockchain/common.js` and add a new entry to the `BINARIES` object. Each entry has two mandatory fields (`url` and `dir`), and an optional one (`files`).
    - To get the `url` needed to download the blockchain daemon, you need to access the releases of the daemon of the coin you're working with. For example, for XMR, the daemon can be found in their GitHub releases (https://github.com/monero-project/monero-gui/releases). Get the URL for the Linux 64-bit distribution and note the extension of the file, which will most likely be `.tar.gz` or `.tar.bz2`. For `.tar.bz2`, the coin you're working with needs to be added to the following snippet of code, responsible for the extraction of the downloaded file (`common.js`):
      ```
        coinRec.cryptoCode === 'XMR'
          ? es(`tar -xf ${downloadFile}`)
          : es(`tar -xzf ${downloadFile}`)
      ```
    - To get the `dir`, simply download the file, extract it, and take note of the folder inside the zipped file and the path towards the actual files you want. In XMR's case, `dir` = `monero-x86_64-linux-gnu-v0.17.2.0`, but for BTC it is `bitcoin-0.20.1/bin`
    - Inside the directory specified in the `dir` field, there can be multiple files inside. In that case, you want to specity the `files` field. This is a multi-dimensional array, where each entry contains a pair of [<file_in_the_downloaded_folder>, <name_with_with_the_file_is_saved_in_the_server>].
      ```
        [
          ['monerod', 'monerod'],
          ['monero-wallet-rpc', 'monero-wallet-rpc']
        ]
      ```
      This means that the `monerod` found inside the distribution folder will be saved as `monerod` on the server. Same for the `monero-wallet-rpc`.
  - Go to `lamassu-server/lib/blockchain/install.js` and add a new entry on the `PLUGINS` object. This entry must import the file created in step 1.
  - Go to the file created in step one and import the object (which isn't created right now) containing all the information needed of a coin `const coinRec = utils.getCryptoCurrency('<coin_code>')`.
  - The coin blockchain plugin contains two functions: `setup` and `buildConfig`.
    - The build config has all the required flags to operate the downloaded daemon, and each coin has their particular set of flags and options, so that specification won't be covered here.
    - The setup function has a similar structure in any coin, and the differences between them is generally related to how a daemon is ran.

#### Wallet plugin

Steps to implement a wallet plugin:
  - Create a file in `lamassu-server/lib/plugins/wallet/<name_of_daemon>/<name_of_daemon>.js`
  - The wallet plugin serves as a middleware between the RPC calls supported by each daemon, and the processes ran inside the lamassu-server ecosystem. This includes address creation, balance lookup, making transactions, etc. As such, this file needs to export the following functions:
    - `balance`: Responds with the amount of usable balance the operator wallet has;
    - `sendCoins`: Responsible for creating a transaction and responds with an object containing the fee of the transaction and the transactionID;
    - `newAddress`: Generates a new address for the operator wallet. Used for machine transactions and funding page;
    - `getStatus`: Responsible for getting the status of a cash-out transaction (transaction from an operator address to a client address).
    - `newFunding`: Creates the response to the funding page, with the amount of balance the operator has, the pending balance and a new funding address;
    - `cryptoNetwork`: Responds with the crypto network the wallet is operating in, based on the port of the RPC calls used.

#### Coin utils

Steps to work on lamassu-coins:
    - Create a new object on `lamassu-coins/config/consts.js` containing all the information relative to a coin. If you're using a wallet built into the daemon, use BTC as template. Otherwise, if the wallet process is separated from the daemon, use XMR as template;
    - Create a new file on `lamassu-coins/plugins/<coin_code>.js`. This file should handle URL parsing and address validation. Despite most coins in lamassu-coins operating on base58 or bech32 validation, this validation can implemented on some variation of the existing algorithms, as is the case with XMR. When this happens, the implementation of this variation needs to be created from scratch. With the validator created, the machine should be able to recognize a valid address. To test this out, simply edit the `lamassu-machine/device-config.json` file with the new coin address to validate.
