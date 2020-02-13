import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 5000;

const DEVELOP_API = process.env.DEVELOP_API || 'RGAPI-fd268602-8863-4d75-b724-72d798e81b98';
const BASE_URL = `https://na1.api.riotgames.com/lol`
const MATCH_BY_GAME_ID = `https://na1.api.riotgames.com/lol/match/v4/matches`;

const MAX_MATCHLIST_COUNT = 5;
const headers = {
  "Origin": "https://developer.riotgames.com",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-Riot-Token": DEVELOP_API,
  "Accept-Language": "en,ko-KR;q=0.9,ko;q=0.8,da;q=0.7"
}

app.use(cors());
app.options('*', cors());  // enable pre-flight


app.get('/', (req, res) => (
  res.send(`server running server port on ${PORT}`)
));

const callAsynchronousOperation = async (gameId) => {
  const data = await fetch(`${MATCH_BY_GAME_ID}/${gameId}`, {headers});
  const json = await data.json();
  return json;
}

const readChampionNameById = (championId) => {
  const rawdata = fs.readFileSync('./public/dragontail-10.3.1/10.3.1/data/en_US/champion.json');
  const champions = JSON.parse(rawdata);
  const championList = champions.data;
  for (let i in championList) {
    if (championList[i].key == championId) {
      return (championList[i].id);
    }
  }
}

const readSpellNameById = (spellId) => {
  const rawdata = fs.readFileSync('./public/dragontail-10.3.1/10.3.1/data/en_US/summoner.json');
  const summoners = JSON.parse(rawdata);
  const summonerList = summoners.data;
  for (let i in summonerList) {
    if (summonerList[i].key == spellId) {
      return (summonerList[i].id);
    }
  }
}

const readPerkIconByStyleId = (styleId) => {
  const rawdata = fs.readFileSync('./public/dragontail-10.3.1/10.3.1/data/en_US/runesReforged.json');
  const perks = JSON.parse(rawdata);
  const selectedPerk = perks.find((perk) => perk.id === styleId);
  return selectedPerk;
}

const readItemById = (itemId) => {
  if(itemId === 0) return null;
  const rawdata = fs.readFileSync('./public/dragontail-10.3.1/10.3.1/data/en_US/item.json');
  const summoners = JSON.parse(rawdata);
  const itemName = summoners.data[itemId]["name"];
  return itemName;
}

const readQueueType = async () => {
  const queue = await fetch('http://static.developer.riotgames.com/docs/lol/queues.json');
  const queueList = await queue.json();
  return queueList;
}

const getSelectedQueue = (queueList, id) => {
  const queueTypeName = queueList.find(queue => queue.queueId === id)["description"];
  return queueTypeName;
}

// https://www.acuriousanimal.com/blog/2018/03/15/express-async-middleware
app.get('/api/summoner/:name', async (req, res, next) => {
  try {
    const name = [req.params.name];
    // summoner name, get accountID
    const data = await fetch(`${BASE_URL}/summoner/v4/summoners/by-name/${name}`, {headers});
    const result = await data.json();
    const { accountId } = result;

    // get match list maximum 5
    const MATCH_LIST_BY_ACCOUNT_ID = `https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountId}?endIndex=${MAX_MATCHLIST_COUNT}`;
    const matchList = await fetch(MATCH_LIST_BY_ACCOUNT_ID, {headers});
    const matchListResult = await matchList.json();
    // console.log(matchListResult,'??');
    const { matches } = matchListResult;
    const matchResultList = await Promise.all(matches.map(async (matchItem)=> {
      const { gameId } = matchItem;
      const fetchedMatchById = await callAsynchronousOperation(gameId);
      return fetchedMatchById;
    })); 

    const queueList = await readQueueType();

    const resultWithPlayerStats = matchResultList.map((match, index) => {
      const { participantIdentities, participants, gameDuration, gameCreation, queueId } = match;
      // get selected player
      const player = participantIdentities.find(({ player }) => player.currentAccountId === accountId);
      // get stats only for the selected player from the matched games
      const participantStat = participants.find(({ participantId }) => participantId === player.participantId);
     
      const { championId, spell1Id, spell2Id, stats } = participantStat;
      const { perkPrimaryStyle, perkSubStyle, perk0, item0, item1, item2, item3, item4, item5, item6 } = stats;
      const championName = readChampionNameById(championId);
      const spell1Name = readSpellNameById(spell1Id);
      const spell2Name = readSpellNameById(spell2Id);
      
      const primaryPerk = readPerkIconByStyleId(perkPrimaryStyle);
      // primary => selected by perk0, secondary => selected by perk sub style
      const primaryPerkList = primaryPerk["slots"][0]["runes"];
      const primaryPerkIcon = primaryPerkList.find(perk => perk.id === perk0)["icon"];
      const secondaryPerkIcon = readPerkIconByStyleId(perkSubStyle)["icon"];

      // get item names
      const item0Name = readItemById(item0);
      const item1Name = readItemById(item1);
      const item2Name = readItemById(item2);
      const item3Name = readItemById(item3);
      const item4Name = readItemById(item4);
      const item5Name = readItemById(item5);
      const item6Name = readItemById(item6);
      const items = [item0Name, item1Name, item2Name, item3Name, item4Name, item5Name, item6Name];

      // queue id
      const queueTypeName = getSelectedQueue(queueList, queueId);
      return {
        gameDuration,
        gameCreation,
        championName,
        spell1Name,
        spell2Name,
        primaryPerkIcon,
        queueTypeName,
        secondaryPerkIcon,
        items,
        ...player,
        ...participantStat
      };
    });
    res.send(resultWithPlayerStats);
  } catch (error) {
    next(error);
  } 
});

app.listen(PORT, () => (
  console.log(`your server running ${PORT}`)
))