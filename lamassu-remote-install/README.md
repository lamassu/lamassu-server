lamassu-remote-install
===============

This will install your Lamassu Bitcoin Machine remote server.

Instructions
------------

1. Start a new Digital Ocean droplet

2. ssh into the droplet

    ```
    ssh root@<your-new-ip-address>
    ```

3. Paste the following command once you're logged in:

    ```
    curl -sS https://raw.githubusercontent.com/lamassu/lamassu-server/master/lamassu-remote-install/install | bash
    ```

4. You should be set. Just follow the instructions on the screen to open your dashboard.
