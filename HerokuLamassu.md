### Lamassu Heroku DeploymentDetails the steps to deploy the Lamassu back end into Heroku.### 1 Set up Heroku accountGo to www.heroku.com and create an account. Then install the heroku toolbelt on you preferred development system - https://toolbelt.heroku.com/.### 2 create heroku applications Using the Heroku control panel create the following applications:•	Server application - <companyname>-lamassu-server•	Admin application - <companyname>-lamassu-admin•	Optionally create an emulator application <companyname>-lamassu-emulator### 3 Clone Git repositories```sh$mkdir ~/lamassu$cd ~/lamassu$git clone git@github.com:lamassu/lamassu-admin.git$git clone git@github.com:lamassu/lamassu-server.git$git clone git@github.com:lamassu/lamassu-exchange-emulator.git```### 4 Add heroku remotes```sh$cd ~/lamassu/lamassu-admin$git remote add heroku git@heroku.com:<companyname>-lamassu-admin.git$cd ~/lamassu/lamassu-server$git remote add heroku git@heroku.com:<companyname>-lamassu-admin.git$cd ~/lamassu/lamassu-emulator$git remote add heroku git@heroku.com:<companyname>-lamassu-admin.git```### 5 add a database to lamassu-adminFollow the instructions here: https://devcenter.heroku.com/articles/heroku-postgresql### 6 Share the database with lamassu-server```sh$cd lamassu-server$heroku config | grep DATABASE_URL  --app <appname> DATABASE_URL => postgres://lswlmfdsfos:5FSLVUSLLT123@ec2-123-456-78-90.compute1.amazonaws.com/ldfoiusfsf```### 7 Update the connection string
Open the file ~/lamassu/<companyname>-lamassu-server/lib/app.js/ and update the heroku connection string to point to the allocated database, line 29.

### 8 Populate the configuration tables
```sh
$cd ~/lamassu-admin
$heroku pg:psql < database/lamassu.sql
```

### 9 Deploy
```sh
$cd ~/lamassu/lamassu-emulator$git push heroku master$cd ~/lamassu/lamassu-server$git push heroku master$cd ~/lamassu/lamassu-admin$git push heroku master
```### 10 Add SSL
To enable the SSL add on your heroku account will require that a valid payment method is enabled. The SL addon costs 20USD per month. To enable the add on:

```sh
$cd ~/lamassu/lamassu-emulator
$heroku addons:add ssl
$cd ~/lamassu/lamassu-server
$heroku addons:add ssl```

It will then be necessecary to add certificates to each application. For testing purposes a self-signed certificate will suffice. See this heroku guide: https://devcenter.heroku.com/articles/ssl-endpoint### 11 TestUpdate sencha-brain configuration to point to the lamassu-server end point, this will require a change to the user_config.json file in the root of the project. The hostname will need to reference your heroku deployment, typiclly this will be of the form <companyname>-lamassu-server.herokuapp.com.
