/**

 * TurniejPro SaaS — Tiebreak Engine (S1)

 *

 * Recursive tie clusters (3+ teams), getGroupTieState, legacy 2-team parity.

 *

 * @module tiebreak-engine

 */

(function (root, factory) {

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {

        module.exports = api;

    }

    if (typeof root !== 'undefined') {

        root.TiebreakEngine = api;

    }

})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

    'use strict';



    const MAX_CLUSTER_DEPTH = 8;



    const CRITERIA_ALL = [

        'POINTS',

        'MINI_TABLE_PTS',

        'MINI_TABLE_GD',

        'MINI_TABLE_GF',

        'GROUP_GD',

        'GROUP_GF'

    ];



    function computeCutoff(advCount, numGroups) {

        const advPerGroup = Math.floor(advCount / Math.max(numGroups, 1));

        const cutoffIndex = Math.max(0, advPerGroup - 1);

        return { cutoffIndex: cutoffIndex, advPerGroup: advPerGroup };

    }



    function buildRawGroupStats(teams, groupMatches) {

        const st = teams.map(function (t) {

            return { t: t, m: 0, w: 0, r: 0, p: 0, pkt: 0, bz: 0, bs: 0 };

        });



        groupMatches.forEach(function (m) {

            const s1 = st.find(function (s) { return s.t.id === m.t1.id; });

            const s2 = st.find(function (s) { return s.t.id === m.t2.id; });

            if (!s1 || !s2) return;



            s1.m++; s2.m++;

            s1.bz += m.g1; s1.bs += m.g2;

            s2.bz += m.g2; s2.bs += m.g1;



            if (m.g1 > m.g2) {

                s1.pkt += 3; s1.w++; s2.p++;

            } else if (m.g2 > m.g1) {

                s2.pkt += 3; s2.w++; s1.p++;

            } else {

                s1.pkt++; s2.pkt++; s1.r++; s2.r++;

            }

        });



        return st;

    }



    function buildMiniTableStatsForCluster(clusterStats, groupMatches) {

        const mini = {};

        clusterStats.forEach(function (s) {

            mini[s.t.id] = { mini_pkt: 0, mini_bz: 0, mini_bs: 0 };

        });



        const tIds = clusterStats.map(function (s) { return s.t.id; });

        groupMatches.forEach(function (m) {

            if (!tIds.includes(m.t1.id) || !tIds.includes(m.t2.id)) return;



            const a = mini[m.t1.id];

            const b = mini[m.t2.id];

            if (!a || !b) return;



            a.mini_bz += m.g1; a.mini_bs += m.g2;

            b.mini_bz += m.g2; b.mini_bs += m.g1;



            if (m.g1 > m.g2) a.mini_pkt += 3;

            else if (m.g2 > m.g1) b.mini_pkt += 3;

            else { a.mini_pkt += 1; b.mini_pkt += 1; }

        });



        return mini;

    }



    function getMiniForStanding(s, miniMap) {

        return miniMap[s.t.id] || { mini_pkt: 0, mini_bz: 0, mini_bs: 0 };

    }



    function compareByTiebreakCriteria(a, b, miniMap) {

        const ma = getMiniForStanding(a, miniMap);

        const mb = getMiniForStanding(b, miniMap);



        if (mb.mini_pkt !== ma.mini_pkt) return mb.mini_pkt - ma.mini_pkt;



        const aMiniGd = ma.mini_bz - ma.mini_bs;

        const bMiniGd = mb.mini_bz - mb.mini_bs;

        if (bMiniGd !== aMiniGd) return bMiniGd - aMiniGd;



        if (mb.mini_bz !== ma.mini_bz) return mb.mini_bz - ma.mini_bz;



        const aGd = a.bz - a.bs;

        const bGd = b.bz - b.bs;

        if (bGd !== aGd) return bGd - aGd;



        return b.bz - a.bz;

    }



    function identifyClustersByKey(stats, keyFn) {

        if (!stats.length) return [];



        const clusters = [];

        let current = [stats[0]];

        let currentKey = keyFn(stats[0]);



        for (let i = 1; i < stats.length; i++) {

            const key = keyFn(stats[i]);

            if (key === currentKey) current.push(stats[i]);

            else {

                clusters.push(current);

                current = [stats[i]];

                currentKey = key;

            }

        }

        clusters.push(current);

        return clusters;

    }



    function identifyPointClusters(stats) {

        const byPkt = {};

        stats.forEach(function (s) {

            if (!byPkt[s.pkt]) byPkt[s.pkt] = [];

            byPkt[s.pkt].push(s);

        });



        return Object.keys(byPkt)

            .map(Number)

            .sort(function (a, b) { return b - a; })

            .map(function (pkt) { return byPkt[pkt]; });

    }



    function isAbsoluteTieCluster(clusterStats, groupMatches) {

        const size = clusterStats ? clusterStats.length : 0;

        if (size <= 1) {

            return { absolute: false, criteriaExhausted: [], clusterSize: size };

        }



        const mini = buildMiniTableStatsForCluster(clusterStats, groupMatches);

        const ref = clusterStats[0];

        const refMini = getMiniForStanding(ref, mini);

        const refGd = ref.bz - ref.bs;



        for (let i = 1; i < clusterStats.length; i++) {

            const s = clusterStats[i];

            const m = getMiniForStanding(s, mini);

            const gd = s.bz - s.bs;



            if (s.pkt !== ref.pkt) {

                return { absolute: false, criteriaExhausted: ['POINTS'], clusterSize: size };

            }

            if (m.mini_pkt !== refMini.mini_pkt) {

                return { absolute: false, criteriaExhausted: ['POINTS', 'MINI_TABLE_PTS'], clusterSize: size };

            }

            if ((m.mini_bz - m.mini_bs) !== (refMini.mini_bz - refMini.mini_bs)) {

                return { absolute: false, criteriaExhausted: ['POINTS', 'MINI_TABLE_PTS', 'MINI_TABLE_GD'], clusterSize: size };

            }

            if (m.mini_bz !== refMini.mini_bz) {

                return { absolute: false, criteriaExhausted: ['POINTS', 'MINI_TABLE_PTS', 'MINI_TABLE_GD', 'MINI_TABLE_GF'], clusterSize: size };

            }

            if (gd !== refGd) {

                return { absolute: false, criteriaExhausted: ['POINTS', 'MINI_TABLE_PTS', 'MINI_TABLE_GD', 'MINI_TABLE_GF', 'GROUP_GD'], clusterSize: size };

            }

            if (s.bz !== ref.bz) {

                return { absolute: false, criteriaExhausted: ['POINTS', 'MINI_TABLE_PTS', 'MINI_TABLE_GD', 'MINI_TABLE_GF', 'GROUP_GD', 'GROUP_GF'], clusterSize: size };

            }

        }



        return { absolute: true, criteriaExhausted: CRITERIA_ALL.slice(), clusterSize: size };

    }



    function resolveCluster(clusterStats, groupMatches, depth) {

        depth = depth || 0;

        if (!clusterStats.length) return { ordered: [], absoluteTieClusters: [] };

        if (clusterStats.length === 1) return { ordered: clusterStats.slice(), absoluteTieClusters: [] };

        if (depth > MAX_CLUSTER_DEPTH) {

            return { ordered: clusterStats.slice(), absoluteTieClusters: [clusterStats.slice()] };

        }



        const mini = buildMiniTableStatsForCluster(clusterStats, groupMatches);

        const tieInfo = isAbsoluteTieCluster(clusterStats, groupMatches);



        if (tieInfo.absolute) {

            return { ordered: clusterStats.slice(), absoluteTieClusters: [clusterStats.slice()] };

        }



        const sorted = clusterStats.slice().sort(function (a, b) {

            return compareByTiebreakCriteria(a, b, mini);

        });



        const miniClusters = identifyClustersByKey(sorted, function (s) {

            return getMiniForStanding(s, mini).mini_pkt;

        });



        const ordered = [];

        const absoluteTieClusters = [];



        miniClusters.forEach(function (sub) {

            if (sub.length <= 1) {

                ordered.push(sub[0]);

                return;

            }



            const subMini = buildMiniTableStatsForCluster(sub, groupMatches);

            const subTie = isAbsoluteTieCluster(sub, groupMatches);



            if (subTie.absolute) {

                ordered.push.apply(ordered, sub);

                absoluteTieClusters.push(sub.slice());

            } else if (sub.length === 2) {

                const pairSorted = sub.slice().sort(function (a, b) {

                    return compareByTiebreakCriteria(a, b, subMini);

                });

                const pairTie = isAbsoluteTieCluster(pairSorted, groupMatches);

                ordered.push.apply(ordered, pairSorted);

                if (pairTie.absolute) absoluteTieClusters.push(pairSorted.slice());

            } else {

                const resolved = resolveCluster(sub, groupMatches, depth + 1);

                ordered.push.apply(ordered, resolved.ordered);

                absoluteTieClusters.push.apply(absoluteTieClusters, resolved.absoluteTieClusters);

            }

        });



        return { ordered: ordered, absoluteTieClusters: absoluteTieClusters };

    }



    function resolveAllClusters(rawStats, groupMatches) {

        const pointClusters = identifyPointClusters(rawStats);

        const ordered = [];

        const absoluteTieClusters = [];



        pointClusters.forEach(function (cluster) {

            if (cluster.length <= 1) ordered.push(cluster[0]);

            else {

                const resolved = resolveCluster(cluster, groupMatches, 0);

                ordered.push.apply(ordered, resolved.ordered);

                absoluteTieClusters.push.apply(absoluteTieClusters, resolved.absoluteTieClusters);

            }

        });



        return { standings: ordered, absoluteTieClusters: absoluteTieClusters };

    }



    function applyMiniTableH2H(stats, groupMatches) {

        const pointGroups = {};

        stats.forEach(function (s) {

            if (!pointGroups[s.pkt]) pointGroups[s.pkt] = [];

            pointGroups[s.pkt].push(s);

        });



        Object.values(pointGroups).forEach(function (group) {

            group.forEach(function (s) {

                s.h2h_pkt = 0; s.h2h_bz = 0; s.h2h_bs = 0;

            });

            if (group.length <= 1) return;



            const mini = buildMiniTableStatsForCluster(group, groupMatches);

            group.forEach(function (s) {

                const m = mini[s.t.id];

                if (m) {

                    s.h2h_pkt = m.mini_pkt;

                    s.h2h_bz = m.mini_bz;

                    s.h2h_bs = m.mini_bs;

                }

            });

        });

    }



    function compareStandingsEntry(a, b) {

        if (b.pkt !== a.pkt) return b.pkt - a.pkt;

        if (b.h2h_pkt !== a.h2h_pkt) return b.h2h_pkt - a.h2h_pkt;

        const aH2hGd = a.h2h_bz - a.h2h_bs;

        const bH2hGd = b.h2h_bz - b.h2h_bs;

        if (bH2hGd !== aH2hGd) return bH2hGd - aH2hGd;

        if (b.h2h_bz !== a.h2h_bz) return b.h2h_bz - a.h2h_bz;

        const aGd = a.bz - a.bs;

        const bGd = b.bz - b.bs;

        if (bGd !== aGd) return bGd - aGd;

        return b.bz - a.bz;

    }



    function applyManualOrder(stats, orderIds) {

        if (!orderIds || !orderIds.length) return;

        stats.sort(function (a, b) {

            return orderIds.indexOf(a.t.id) - orderIds.indexOf(b.t.id);

        });

    }



    function assignRanks(stats, groupName) {

        stats.forEach(function (s, idx) {

            s.rank = idx + 1;

            s.group = groupName;

        });

    }



    function buildAlgorithmicStandings(gn, ctx) {

        const groups = ctx.groups || {};

        const matches = ctx.matches || [];

        const teams = groups[gn];

        if (!teams || !teams.length) return [];



        const groupMatches = matches.filter(function (m) {

            return m.group === gn && m.played;

        });



        const raw = buildRawGroupStats(teams, groupMatches);

        const resolved = resolveAllClusters(raw, groupMatches);

        const st = resolved.standings;

        applyMiniTableH2H(st, groupMatches);

        assignRanks(st, gn);

        return st;

    }



    function findCriticalAbsoluteCluster(standings, cutoffIndex, groupMatches) {

        if (!standings.length || cutoffIndex < 0 || cutoffIndex >= standings.length) return null;



        const anchor = standings[cutoffIndex];

        const pointCluster = standings.filter(function (s) { return s.pkt === anchor.pkt; });

        if (pointCluster.length <= 1) return null;



        const resolved = resolveCluster(pointCluster, groupMatches, 0);

        const cutoffTeam = standings[cutoffIndex];

        const nextTeam = standings[cutoffIndex + 1];



        for (let i = 0; i < resolved.absoluteTieClusters.length; i++) {

            const absCluster = resolved.absoluteTieClusters[i];

            const ids = absCluster.map(function (s) { return s.t.id; });



            const ranks = absCluster.map(function (s) {

                return standings.findIndex(function (x) { return x.t.id === s.t.id; });

            }).filter(function (r) { return r >= 0; });



            if (!ranks.length) continue;



            const minRank = Math.min.apply(null, ranks);

            const maxRank = Math.max.apply(null, ranks);

            const straddlesCutoff = minRank <= cutoffIndex && maxRank > cutoffIndex;

            const containsCutoffPair = nextTeam

                && ids.includes(cutoffTeam.t.id)

                && ids.includes(nextTeam.t.id);



            if (straddlesCutoff || containsCutoffPair) return absCluster;

        }



        if (nextTeam && isAbsoluteRemis(standings[cutoffIndex], nextTeam)) {

            return [standings[cutoffIndex], nextTeam];

        }



        return null;

    }



    function hasUnplayedGroupMatches(gn, ctx) {

        return (ctx.matches || []).some(function (m) {

            return m.group === gn && !m.played;

        });

    }



    function getGroupTieState(gn, ctx) {

        const settings = ctx.settings || {};

        const numGroups = ctx.numGroups || Object.keys(ctx.groups || {}).length || 1;

        const advCount = ctx.advCount != null ? ctx.advCount : (settings.advCount || 4);

        const cutoff = computeCutoff(advCount, numGroups);

        const isConfirmed = !!(settings.confirmedTableOrder && settings.confirmedTableOrder[gn]);

        const groupIncomplete = hasUnplayedGroupMatches(gn, ctx);



        const base = {

            groupName: gn,

            cutoffIndex: cutoff.cutoffIndex,

            advPerGroup: cutoff.advPerGroup,

            isConfirmed: isConfirmed,

            groupIncomplete: groupIncomplete,

            detectRemisAlert: false,

            blocksPlayoff: groupIncomplete,

            pairAtCutoffAbsolute: false,

            criticalCluster: null

        };



        if (isConfirmed) {

            base.state = 'ABSOLUTE_TIE_CONFIRMED';

            return base;

        }



        if (groupIncomplete) {

            base.state = 'GROUP_INCOMPLETE';

            return base;

        }



        const standings = buildAlgorithmicStandings(gn, ctx);

        if (standings.length <= cutoff.cutoffIndex) {

            base.state = 'NORMAL';

            return base;

        }



        const groupMatches = (ctx.matches || []).filter(function (m) {

            return m.group === gn && m.played;

        });



        const critical = findCriticalAbsoluteCluster(standings, cutoff.cutoffIndex, groupMatches);

        const nextStanding = standings[cutoff.cutoffIndex + 1];



        if (nextStanding) {

            base.pairAtCutoffAbsolute = isAbsoluteRemis(

                standings[cutoff.cutoffIndex],

                nextStanding

            );

        }



        if (critical && critical.length >= 2) {

            const tieInfo = isAbsoluteTieCluster(critical, groupMatches);

            base.criticalCluster = {

                teamIds: critical.map(function (s) { return s.t.id; }),

                teamNames: critical.map(function (s) { return s.t.name; }),

                size: critical.length,

                absoluteTie: tieInfo.absolute,

                criteriaExhausted: tieInfo.criteriaExhausted

            };



            if (tieInfo.absolute) {

                base.state = 'ABSOLUTE_TIE_PENDING';

                base.detectRemisAlert = true;

                base.blocksPlayoff = true;

                return base;

            }

        }



        if (base.pairAtCutoffAbsolute) {

            base.state = 'ABSOLUTE_TIE_PENDING';

            base.detectRemisAlert = true;

            base.blocksPlayoff = true;

            base.criticalCluster = {

                teamIds: [standings[cutoff.cutoffIndex].t.id, nextStanding.t.id],

                teamNames: [standings[cutoff.cutoffIndex].t.name, nextStanding.t.name],

                size: 2,

                absoluteTie: true,

                criteriaExhausted: CRITERIA_ALL.slice()

            };

            return base;

        }



        base.state = 'NORMAL';

        return base;

    }



    function getSortedGroupStats(gn, ctx) {

        const groups = ctx.groups || {};

        const matches = ctx.matches || [];

        const settings = ctx.settings || {};

        const teams = groups[gn];

        if (!teams || !teams.length) return [];



        const groupMatches = (matches || []).filter(function (m) {

            return m.group === gn && m.played;

        });



        const raw = buildRawGroupStats(teams, groupMatches);

        const resolved = resolveAllClusters(raw, groupMatches);

        const st = resolved.standings.slice();

        applyMiniTableH2H(st, groupMatches);



        if (ctx.tempLocalOrder) applyManualOrder(st, ctx.tempLocalOrder);

        else if (settings.customTableOrder && settings.customTableOrder[gn]) {

            applyManualOrder(st, settings.customTableOrder[gn]);

        }



        assignRanks(st, gn);

        return st;

    }



    function isAbsoluteRemis(a, b) {

        if (!a || !b) return false;

        return a.pkt === b.pkt

            && (a.h2h_pkt || 0) === (b.h2h_pkt || 0)

            && (a.h2h_bz - a.h2h_bs) === (b.h2h_bz - b.h2h_bs)

            && a.h2h_bz === b.h2h_bz

            && (a.bz - a.bs) === (b.bz - b.bs)

            && a.bz === b.bz;

    }



    return {

        CRITERIA_ALL: CRITERIA_ALL,

        computeCutoff: computeCutoff,

        buildRawGroupStats: buildRawGroupStats,

        buildMiniTableStatsForCluster: buildMiniTableStatsForCluster,

        compareByTiebreakCriteria: compareByTiebreakCriteria,

        compareStandingsEntry: compareStandingsEntry,

        identifyPointClusters: identifyPointClusters,

        identifyClustersByKey: identifyClustersByKey,

        isAbsoluteTieCluster: isAbsoluteTieCluster,

        resolveCluster: resolveCluster,

        resolveAllClusters: resolveAllClusters,

        applyMiniTableH2H: applyMiniTableH2H,

        applyManualOrder: applyManualOrder,

        assignRanks: assignRanks,

        buildAlgorithmicStandings: buildAlgorithmicStandings,

        getGroupTieState: getGroupTieState,

        getSortedGroupStats: getSortedGroupStats,

        isAbsoluteRemis: isAbsoluteRemis

    };

});


