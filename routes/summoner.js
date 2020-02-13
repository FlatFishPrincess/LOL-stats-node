import express from 'express';
import { BASE_URL, MATCH_BY_GAME_ID, MAX_MATCHLIST_COUNT } from '../shared/constants';
import { readChampionNameById, readSpellNameById, readPerkIconByStyleId, readItemById, readQueueType, getSelectedQueue, callAsynchronousOperation } from '../shared/utils';

const router = express.Router();

router.get('/:name', async (req, res, next) => {
  try {
    const name = [req.params.name];
    // summoner name, get accountID
    const SUMMONER_BY_NAME = `${BASE_URL}/summoner/v4/summoners/by-name/${name}`;
    const summonerResult = callAsynchronousOperation(SUMMONER_BY_NAME);
    const { accountId } = summonerResult;

    // get match list maximum 5
    const MATCH_LIST_BY_ACCOUNT_ID = `https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountId}?endIndex=${MAX_MATCHLIST_COUNT}`;
    const matchListResult = callAsynchronousOperation(MATCH_LIST_BY_ACCOUNT_ID);
    const { matches } = matchListResult;
    const matchResultList = await Promise.all(matches.map(async (matchItem)=> {
      const { gameId } = matchItem;
      const matchByGameIdUrl = `${MATCH_BY_GAME_ID}/${gameId}`
      const fetchedMatchById = await callAsynchronousOperation(matchByGameIdUrl);
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

export default router;
