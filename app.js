const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express(); // instanceof express.
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(59111, () => {
      console.log("Server Running at http://localhost:59111/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API-1 to get all player details.
let list = [];
function convertCamelCase(array) {
  for (let item of array) {
    let obj = {
      playerId: item.player_id,
      playerName: item.player_name,
    };
    list.push(obj);
  }
  return list;
}
module.exports = app.get("/players/", async (request, response) => {
  const playersQuery = `SELECT * FROM player_details;`;
  const playerArray = await db.all(playersQuery);
  response.send(convertCamelCase(playerArray));
});

// API-2 to get a particular player through a player_id.
module.exports = app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params; // path parameter.
  const playerQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const player = await db.get(playerQuery);
  const object = {
    playerId: player.player_id,
    playerName: player.player_name,
  };
  response.send(object);
});

// API-3 is update a particular player to player_id.
module.exports = app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `UPDATE player_details SET 
    player_name='${playerName}'
    WHERE player_id=${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

// API-4 to get a particular match from match_details table.
module.exports = app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchGetQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const matchDetail = await db.get(matchGetQuery);
  let matchObject = {
    matchId: matchDetail.match_id,
    match: matchDetail.match,
    year: matchDetail.year,
  };
  response.send(matchObject);
});

// API-5 to get a particular player to get a list of all matches.
let list1 = [];
function convertMatchCamelCase(array1) {
  for (let item1 of array1) {
    let matchObj = {
      matchId: item1.match_id,
      match: item1.match,
      year: item1.year,
    };
    list1.push(matchObj);
  }
  return list1;
}
module.exports = app.get(
  "/players/:playerId/matches",
  async (request, response) => {
    const { playerId } = request.params;
    const matchesQuery = `SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_match_score.player_id=${playerId};`;
    const matchesArray = await db.all(matchesQuery);
    const matchCamelCase = convertMatchCamelCase(matchesArray);
    response.send(matchCamelCase);
  }
);

// API-6 to get a list of players in specific match.
let list2 = [];
function convertPlayersCamelCase(array2) {
  for (let item2 of array2) {
    let playerObject = {
      playerId: item2.player_id,
      playerName: item2.player_name,
    };
    list2.push(playerObject);
  }
  return list2;
}
module.exports = app.get(
  "/matches/:matchId/players",
  async (request, response) => {
    const { matchId } = request.params;
    const listOfMatchesQuery = `SELECT * FROM match_details NATURAL JOIN player_details WHERE match_details.match_id=${matchId};`;
    const listOfPlayersArray = await db.all(listOfMatchesQuery);
    response.send(convertPlayersCamelCase(listOfPlayersArray));
  }
);

// API-7 to get a specific player total runs,fours,sixes in a player_match_score.
module.exports = app.get(
  "/players/:playerId/playerScores",
  async (request, response) => {
    const { playerId } = request.params; // path parameter.
    const query = `SELECT player_details.player_id ,player_details.player_name,SUM(score) AS total_score,SUM(fours) AS total_fours,SUM(sixes) AS total_sixes FROM player_match_score NATURAL JOIN player_details WHERE player_id=${playerId};`;
    const singleObject = await db.get(query);
    const playerTotalScoreObj = {
      playerId: singleObject.player_id,
      playerName: singleObject.player_name,
      totalScore: singleObject.total_score,
      totalFours: singleObject.total_fours,
      totalSixes: singleObject.total_sixes,
    };
    response.send(playerTotalScoreObj);
  }
);
