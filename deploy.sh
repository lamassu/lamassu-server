#!/usr/bin/env bash

git remote | grep heroku
if [ $? -ne 0 ]; then
  echo "Creating Heroku application..."
  heroku apps:create
fi

if [ -n "$DATABASE_URL" ]; then
  echo "Setting DATABASE_URL..."
  heroku config:set DATABASE_URL="$DATABASE_URL"
fi

echo "Deploying..."
git push heroku master
