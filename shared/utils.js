import fs from 'fs';
import fetch from 'node-fetch';
import { STATIC_DIR, headers } from './constants';

export const readJsonFile = url => {
  const rawData = fs.readFileSync(url);
  return JSON.parse(rawData);
}

export const readChampionNameById = (championId) => {
  const champions = readJsonFile(`${STATIC_DIR}/champion.json`);
  const championList = champions.data;
  for (let i in championList) {
    if (championList[i].key == championId) {
      return (championList[i].id);
    }
  }
}

export const readSpellNameById = (spellId) => {
  const summoners = readJsonFile(`${STATIC_DIR}/summoner.json`)
  const summonerList = summoners.data;
  for (let i in summonerList) {
    if (summonerList[i].key == spellId) {
      return (summonerList[i].id);
    }
  }
}

export const readPerkIconByStyleId = (styleId) => {
  const perks = readJsonFile(`${STATIC_DIR}/runesReforged.json`);
  const selectedPerk = perks.find((perk) => perk.id === styleId);
  return selectedPerk;
}

export const readItemById = (itemId) => {
  if(itemId === 0) return null;
  const summoners = readJsonFile(`${STATIC_DIR}/item.json`);
  const itemName = summoners.data[itemId]["name"];
  return itemName;
}

export const readQueueType = async () => {
  const queue = await fetch('http://static.developer.riotgames.com/docs/lol/queues.json');
  const queueList = await queue.json();
  return queueList;
}

export const getSelectedQueue = (queueList, id) => {
  const queueTypeName = queueList.find(queue => queue.queueId === id)["description"];
  return queueTypeName;
}

export const callAsynchronousOperation = async (url) => {
  const data = await fetch(url, {headers});
  const json = await data.json();
  return json;
}