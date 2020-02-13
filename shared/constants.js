
export const DEVELOP_API = process.env.DEVELOP_API || 'RGAPI-6cc9826f-b5fc-4ea5-9898-4bb6189fe362';
export const BASE_URL = `https://na1.api.riotgames.com/lol`
export const MATCH_BY_GAME_ID = `https://na1.api.riotgames.com/lol/match/v4/matches`;

export const MAX_MATCHLIST_COUNT = 5;
export const headers = {
  "Origin": "https://developer.riotgames.com",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  "X-Riot-Token": DEVELOP_API,
  "Accept-Language": "en,ko-KR;q=0.9,ko;q=0.8,da;q=0.7"
}

export const STATIC_DIR = './public/dragontail-10.3.1/10.3.1/data/en_US';
