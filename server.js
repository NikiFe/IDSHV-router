// server.js
const express = require('express');
const path = require('path');
const app = express();

// ------------------------------
// 1) YOUR STATION DATA + BFS LOGIC
// ------------------------------
const LINES = {
    M1: [
      "Zvořany","Dvory (Z)","Fontána přání","Ultra hlíny (Z)","Jezero Mílkov","Věznice Honzov","Spawn",
      "Nádraží Město (S)","Diamantový dům","Úředníků","Honzův dům","Tinovské sedlo","Skalní",
      "Horská planina","Dýňová (Z)","Podzemní řeka (S)"
    ],
    M2: [
      "NC Švandovka","Federální věznice","Betonárna","Jožinská (Z)","Bažinská","Horská planina",
      "Standardů","Honzův dům","Unifikace (Z)","Build battle","Survival (S)","Magistrála (Z)",
      "Bany a unbany (Z)","Hornaté vršky","Jezero Mílkov","Luxusní villa (Z)","Hradní věž",
      "Honzovo sídliště","Ubytovny (Z)","Jeskynní sídliště","Železárny Vitja","Kryptonu (Z)",
      "JE Nuggetov"
    ],
    M2a: ["Unifikace (Z)","Severní město","Hlavní nádraží (S)","Spawn"],
    M3: [
      "Nádraží Město (S)","Pěkná jeskyně","Přírodní koupaliště","Jezero Mílkov","Patriotů (Z)",
      "Prales Honzov (Z)","Vesnická pláň (Z)","Ve Vesnici"
    ],
    M4: [
      "Podzemní řeka (S)","Inženýrů","Skalní","Náměstí Svobody","Průsmyk","Rozhledna Nová čtvrť",
      "Honzův dům","Honzův les","Veřejné prostory","Minecraft Got Talent","Pouštní (Z)",
      "Pouštní řeka","Národní pláž"
    ],
    M5: [
      "Manfredziakow Centralny","Manfredziak Water park","Lotnisko Manfredziakow (S)",
      "Port (S)","Hotel Morski","Historyczny Krecik","Galeria Milenium","Manfredziakow Centralny"
    ],
    M6: [
      "Radiokomunikace (S)","Meandr","Expo town","Expo 2023 (S)","Inženýra Vitjy","NC Švandovka",
      "Ošklivců","Aquapark Ondrovoda","Minecraft Got Talent","Národní pláž","Kreativní pláž",
      "Přístav HVgame","Honzova sjezdovka - Imgoodov","Sídliště Jiřinov","Manfredziakow Centralny",
      "Kořanov","Honza I.","Sídliště Naděje","Malá Rána","Honzův dům","Diamantový dům",
      "Pěkná jeskyně","Honzov Airport (S)","Hradní věž","Fontána přání","Sídliště nad jámou",
      "Plážovka"
    ],
    M8: [
      "Honzova sjezdovka - Imgoodov","Plážní","Pobřežní (Z)","Imgoodovip - Centrum"
    ],
    M9: [
      "Vitjův ráj","Pouštní řeka","Písečné závody","Savanská (Z)","Sídliště Zátoka","Oceánská",
      "Hotel Imgoodov (Z)","Plážní","Poloostrovní sídliště","Spojené ostrovy - Centrum",
      "Vitjova villa - Pracovníků","Sídliště Jiřinov","Historický přístav","Přístavní vlečka",
      "Manfredziakow Centralny","Serverovo údolí","Sídliště Prosperity","Manfredziakowa góra",
      "Osiedle wschódnie","Elektrownia węglowa","Galeria Wschodnia"
    ],
    M9a: [
      "Vitjova villa - Pracovníků","FC Vitjova villa (Z)","Vitjova villa"
    ],
    M10: [
      "Fontána přání","Boumova","Náměstí přejezdů","Włocławská (Z)","Zvořany","Luník 9","Skalnatá",
      "Maine (Z)","Brněnská","Oganesjanova (Z)","Pirátů (Z)","Nový Nuggetov (Z)","Futurum","Tabule"
    ],
    M12: [
      "Port (S)","Fabryka andezitu","Řízkový ráj","Mały kościół","Nowa ulica","Manfredziakow Centralny",
      "Vitjova villa - Promenáda (Z)","Vitjova villa - Arboretum (Z)","Vitjova villa - Botanická (Z)",
      "Vitjova villa","Vitjova villa - Rekreační (Z)","Prefabrikáty"
    ],
    M13: [
      "Honzův dům","Vitjův ráj","Honzova sjezdovka - Imgoodov","Poloostrovní sídliště","Prefabrikáty"
    ],
    M14: [
      "Lotnisko Manfredziakow (S)","Manfredziakowo Nowe osiedle (S)","Sídliště Prosperity"
    ]
  };

  const lineColors = {
    M1:"#FF8000",M2:"#00EEFF",M2a:"#00EEFF",M3:"#09FF00",M4:"#FF0000",M5:"#0011FF",
    M6:"#FFCE7A",M8:"#57B6FF",M9:"#24BF8C",M9a:"#24BF8C",M10:"#C73A3A",M12:"#7A0000",
    M13:"#F700FF",M14:"#8800FF"
  };

// We'll build a global graph
const graph = {};

function addEdge(a, b, line) {
  if (!graph[a]) graph[a] = [];
  if (!graph[b]) graph[b] = [];
  graph[a].push({ station: b, line });
  graph[b].push({ station: a, line });
}

// Initialize the graph from LINES
for (const lineName in LINES) {
  const stations = LINES[lineName];
  for (let i = 0; i < stations.length - 1; i++) {
    addEdge(stations[i], stations[i+1], lineName);
  }
}

/********************************************************
 * 2) BFS LOGIC: MIN STATIONS OR MIN TRANSFERS
 ********************************************************/
function bfsMinStations(start, end, usableGraph) {
  if (!usableGraph[start] || !usableGraph[end]) return null;
  const queue = [start];
  const visited = new Set([start]);
  const parents = { [start]: { parent: null, lineUsed: null } };

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === end) {
      return reconstructPath(parents, end);
    }
    for (const edge of usableGraph[current]) {
      if (!visited.has(edge.station)) {
        visited.add(edge.station);
        parents[edge.station] = { parent: current, lineUsed: edge.line };
        queue.push(edge.station);
      }
    }
  }
  return null;
}

function bfsMinTransfers(start, end, usableGraph) {
  if (!usableGraph[start] || !usableGraph[end]) return null;
  const queue = [];
  const visited = new Map();
  queue.push({ station: start, lineUsed: null, transferCount: 0 });
  visited.set(`${start}|null`, 0);

  const parents = {};
  function setParent(childSt, childLn, parentObj) {
    parents[childSt + "|" + childLn] = {
      pSt: parentObj.station,
      pLn: parentObj.lineUsed
    };
  }

  while (queue.length > 0) {
    // Sort by transferCount
    queue.sort((a,b) => a.transferCount - b.transferCount);
    const current = queue.shift();
    if (current.station === end) {
      return reconstructPathTransfers(parents, end, current.lineUsed);
    }
    for (const edge of usableGraph[current.station]) {
      const nextSt = edge.station;
      const nextLn = edge.line;
      const isTransfer = (current.lineUsed && current.lineUsed !== nextLn) ? 1 : 0;
      const newTransferCount = current.transferCount + isTransfer;

      const key = `${nextSt}|${nextLn}`;
      if (!visited.has(key) || visited.get(key) > newTransferCount) {
        visited.set(key, newTransferCount);
        queue.push({
          station: nextSt,
          lineUsed: nextLn,
          transferCount: newTransferCount
        });
        setParent(nextSt, nextLn, current);
      }
    }
  }
  return null;
}

function reconstructPath(parents, end) {
  const path = [];
  let cur = end;
  while (cur !== null) {
    path.unshift(cur);
    cur = parents[cur].parent;
  }
  const result = [];
  for (let i = 0; i < path.length; i++) {
    let usedLine = null;
    if (i > 0) {
      usedLine = parents[path[i]].lineUsed;
    }
    result.push({ station: path[i], line: usedLine });
  }
  if (result.length > 1 && result[0].line === null) {
    result[0].line = result[1].line;
  }
  return result;
}

function reconstructPathTransfers(parents, end, endLine) {
  const path = [];
  let cSt = end, cLn = endLine;
  while (cSt !== null) {
    path.unshift({ station: cSt, line: cLn });
    const pr = parents[cSt + "|" + cLn];
    if (!pr) break;
    cSt = pr.pSt;
    cLn = pr.pLn;
  }
  if (path.length>1 && path[0].line === null) {
    path[0].line = path[1].line;
  }
  return path;
}

function buildUsableGraph(ignoredLines) {
  const newGraph = {};
  for (const station in graph) {
    newGraph[station] = [];
    for (const edge of graph[station]) {
      if (!ignoredLines.includes(edge.line)) {
        newGraph[station].push({ ...edge });
      }
    }
  }
  return newGraph;
}

function multiSegmentPath(stops, useGraph, comfort) {
  let finalPath = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const segStart = stops[i];
    const segEnd   = stops[i+1];
    let partial = null;
    if (!comfort) {
      partial = bfsMinStations(segStart, segEnd, useGraph);
    } else {
      partial = bfsMinTransfers(segStart, segEnd, useGraph);
    }
    if (!partial) return null;
    if (i > 0) partial.shift(); // avoid duplicating intermediate
    finalPath = finalPath.concat(partial);
  }
  return finalPath;
}

/********************************************************
 * 3) SERVE STATIC FILES
 ********************************************************/
app.use(express.static(path.join(__dirname, 'public')));

/********************************************************
 * 4) /api/route ENDPOINT
 ********************************************************/
app.get('/api/route', (req, res) => {
  const startVal = req.query.start;
  const endVal   = req.query.end;
  const comfort  = (req.query.comfort === '1' || req.query.comfort === 'true');

  const throughVal = req.query.through || '';
  const mustPassStations = throughVal
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const ignoreVal = req.query.ignore || '';
  const ignoredLines = ignoreVal
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Validate
  if (!startVal || !endVal) {
    return res.json({ error: 'Missing start or end station.' });
  }
  if (!graph[startVal] || !graph[endVal]) {
    return res.json({ error: 'Invalid station name(s).' });
  }
  if (startVal === endVal) {
    return res.json({ error: 'Start and end are the same.' });
  }

  // Build graph ignoring lines
  const usableGraph = buildUsableGraph(ignoredLines);

  // BFS with optional must-pass
  const stops = [startVal, ...mustPassStations, endVal];
  const route = multiSegmentPath(stops, usableGraph, comfort);

  if (!route) {
    return res.json({ error: 'No route found with current constraints.' });
  }

  return res.json({
    route,
    stationCount: route.length,
    comfortMode: comfort,
    mustPassStations,
    ignoredLines
  });
});

/********************************************************
 * 5) START SERVER
 ********************************************************/
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});