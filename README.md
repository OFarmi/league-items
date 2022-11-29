# League Items

<img src="https://github.com/OFarmi/league-items/blob/master/img/Animation.gif?raw=true" />

## Features

- Searching for a champion displays up to its top 5 winrate items
  - Winrates are based on 300 matches from Challenger players


- Hovering over the items shows their stats, passives, and actives.

## Setup

- Request a Development API Key from the Riot Games API
  - Sign-up at https://developer.riotgames.com/


- Create a database using the prisma schema in [schema.prisma](/prisma/schema.prisma)

- Create a .env file in the backend folder with the same format as [.env.example](/backend/.env.example)
  - Default port should be set to 8080
  - .env file should be created in the frontend folder with the same port

## Usage

- To start, run this in the backend and frontend directories

```
$ npm start
```

- Open `http://localhost:8080` and begin searching!
