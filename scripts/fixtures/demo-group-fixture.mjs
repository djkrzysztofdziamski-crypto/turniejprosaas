/**
 * Builds groups/matches/settings from demo-story-scenario JSON (Node tests).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIO = path.join(__dirname, '..', '..', 'demo-story-scenario');

function readJson(name) {
    return JSON.parse(fs.readFileSync(path.join(SCENARIO, name), 'utf8'));
}

function teamIdToNum(scenarioTeamId) {
    return parseInt(String(scenarioTeamId).replace(/^t/, ''), 10);
}

/**
 * @returns {{ groups: Object, matches: Object[], settings: Object, standings: Object }}
 */
export function loadDemoGroupFixture() {
    const teamsJson = readJson('teams.json');
    const groupsJson = readJson('groups.json');
    const matchesJson = readJson('matches.json');
    const standingsJson = readJson('standings.json');

    const teamsByScenarioId = {};
    teamsJson.teams.forEach(function (t) {
        teamsByScenarioId[t.id] = { id: teamIdToNum(t.id), name: t.name };
    });

    const groups = {};
    groupsJson.groups.forEach(function (g) {
        groups[g.id] = g.teamIds.map(function (tid) {
            const team = teamsByScenarioId[tid];
            return { id: team.id, name: team.name };
        });
    });

    let matchNumId = 1;
    const matches = matchesJson.matches
        .filter(function (m) { return m.phase === 'group'; })
        .map(function (m) {
            const t1 = teamsByScenarioId[m.homeTeamId];
            const t2 = teamsByScenarioId[m.awayTeamId];
            const played = m.status === 'played';
            return {
                id: matchNumId++,
                group: m.group,
                t1: { id: t1.id, name: t1.name },
                t2: { id: t2.id, name: t2.name },
                g1: played ? m.homeScore : 0,
                g2: played ? m.awayScore : 0,
                played: played
            };
        });

    const customTableOrder = {};
    const qualifiedTeamIds = [];
    Object.entries(standingsJson.standings).forEach(function ([gn, block]) {
        const table = block.table || [];
        customTableOrder[gn] = table.map(function (row) {
            const numId = teamIdToNum(row.teamId);
            if (row.qualified) qualifiedTeamIds.push(numId);
            return numId;
        });
    });

    const groupsCount = Object.keys(groups).length;
    const settings = {
        advCount: 8,
        customTableOrder: customTableOrder,
        confirmedTableOrder: Object.fromEntries(Object.keys(groups).map(function (g) { return [g, true]; })),
        qualifiedTeamIds: qualifiedTeamIds
    };

    return {
        groups: groups,
        matches: matches,
        settings: settings,
        standings: standingsJson.standings
    };
}

export const TV_REG_01_EXPECTED = {
    A: ['FC Orły Poznań', 'Lech Mini Gniezno'],
    B: ['United Luboń', 'Pogoń Kostrzyn'],
    C: ['Sparta Swarzędz', 'FC Libero Swarzędz'],
    D: ['KS WIKO Opalenica', 'KS Czarnuszka Suchy Las']
};
