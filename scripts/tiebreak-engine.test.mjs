/**

 * S0/S1 — Tiebreak Engine tests

 * TV-REG-01, TV-01…TV-06, legacy 2-team parity

 */

import { createRequire } from 'module';

import { loadDemoGroupFixture, TV_REG_01_EXPECTED } from './fixtures/demo-group-fixture.mjs';



const require = createRequire(import.meta.url);

const TiebreakEngine = require('../tiebreak-engine.js');



function referenceGetSortedGroupStats(gn, state, tempLocalOrders) {

    const st = state.groups[gn].map(function (t) {

        return { t: t, m: 0, w: 0, r: 0, p: 0, pkt: 0, bz: 0, bs: 0 };

    });

    const groupMatches = (state.matches || []).filter(function (m) {

        return m.group === gn && m.played;

    });



    groupMatches.forEach(function (m) {

        const s1 = st.find(function (s) { return s.t.id === m.t1.id; });

        const s2 = st.find(function (s) { return s.t.id === m.t2.id; });

        if (s1 && s2) {

            s1.m++; s2.m++;

            s1.bz += m.g1; s1.bs += m.g2;

            s2.bz += m.g2; s2.bs += m.g1;

            if (m.g1 > m.g2) { s1.pkt += 3; s1.w++; s2.p++; }

            else if (m.g2 > m.g1) { s2.pkt += 3; s2.w++; s1.p++; }

            else { s1.pkt += 1; s2.pkt += 1; s1.r++; s2.r++; }

        }

    });



    const pointGroups = {};

    st.forEach(function (s) {

        if (!pointGroups[s.pkt]) pointGroups[s.pkt] = [];

        pointGroups[s.pkt].push(s);

    });



    Object.values(pointGroups).forEach(function (group) {

        group.forEach(function (s) { s.h2h_pkt = 0; s.h2h_bz = 0; s.h2h_bs = 0; });

        if (group.length > 1) {

            const tIds = group.map(function (s) { return s.t.id; });

            groupMatches.forEach(function (m) {

                if (tIds.includes(m.t1.id) && tIds.includes(m.t2.id)) {

                    const s1 = group.find(function (x) { return x.t.id === m.t1.id; });

                    const s2 = group.find(function (x) { return x.t.id === m.t2.id; });

                    if (s1 && s2) {

                        s1.h2h_bz += m.g1; s1.h2h_bs += m.g2;

                        s2.h2h_bz += m.g2; s2.h2h_bs += m.g1;

                        if (m.g1 > m.g2) s1.h2h_pkt += 3;

                        else if (m.g2 > m.g1) s2.h2h_pkt += 3;

                        else { s1.h2h_pkt += 1; s2.h2h_pkt += 1; }

                    }

                }

            });

        }

    });



    st.sort(function (a, b) {

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

    });



    if (tempLocalOrders && tempLocalOrders[gn]) {

        st.sort(function (a, b) {

            return tempLocalOrders[gn].indexOf(a.t.id) - tempLocalOrders[gn].indexOf(b.t.id);

        });

    } else if (state.settings?.customTableOrder?.[gn]) {

        st.sort(function (a, b) {

            return state.settings.customTableOrder[gn].indexOf(a.t.id) - state.settings.customTableOrder[gn].indexOf(b.t.id);

        });

    }



    st.forEach(function (s, idx) { s.rank = idx + 1; s.group = gn; });

    return st;

}



const STAT_FIELDS = ['m', 'w', 'r', 'p', 'pkt', 'bz', 'bs', 'h2h_pkt', 'h2h_bz', 'h2h_bs', 'rank'];



function snapshotRow(s) {

    const row = { id: s.t.id, name: s.t.name, group: s.group };

    STAT_FIELDS.forEach(function (f) { row[f] = s[f]; });

    return row;

}



function mkMatch(group, t1, t2, g1, g2) {

    return { group, played: true, t1: { id: t1 }, t2: { id: t2 }, g1, g2 };

}



function ctxFrom(state, extra) {

    return Object.assign({

        groups: state.groups,

        matches: state.matches,

        settings: state.settings || {},

        numGroups: Object.keys(state.groups).length

    }, extra || {});

}



let passed = 0;

let failed = 0;



function ok(name) { passed++; console.log('PASS:', name); }

function fail(name, detail) { failed++; console.error('FAIL:', name, detail || ''); }



console.log('\n=== TV-01: 3-team cycle ===\n');



const tv01 = {

    groups: { X: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }] },

    matches: [mkMatch('X', 'A', 'B', 1, 0), mkMatch('X', 'B', 'C', 1, 0), mkMatch('X', 'C', 'A', 1, 0)],

    settings: { advCount: 2 }

};

const tv01Ctx = ctxFrom(tv01, { advCount: 2, numGroups: 1 });

const tv01Cluster = TiebreakEngine.getSortedGroupStats('X', tv01Ctx);

const tv01Abs = TiebreakEngine.isAbsoluteTieCluster(tv01Cluster, tv01.matches);

const tv01State = TiebreakEngine.getGroupTieState('X', tv01Ctx);



if (tv01Abs.absolute && tv01Abs.clusterSize === 3) ok('TV-01 isAbsoluteTieCluster size=3');

else fail('TV-01 isAbsoluteTieCluster', JSON.stringify(tv01Abs));

if (tv01State.state === 'ABSOLUTE_TIE_PENDING' && tv01State.blocksPlayoff) ok('TV-01 blocksPlayoff');

else fail('TV-01 tie state', tv01State.state);

if (tv01State.criticalCluster?.size === 3) ok('TV-01 criticalCluster size=3');

else fail('TV-01 criticalCluster');



console.log('\n=== TV-02: normal table ===\n');

const fixture = loadDemoGroupFixture();

const tv02State = TiebreakEngine.getGroupTieState('A', ctxFrom({

    groups: fixture.groups, matches: fixture.matches, settings: { advCount: 8 }

}, { advCount: 8, numGroups: 4 }));

if (tv02State.state === 'NORMAL' && !tv02State.blocksPlayoff) ok('TV-02 NORMAL');

else fail('TV-02', tv02State.state);



console.log('\n=== TV-03: leader + ABC cycle ===\n');

const tv03 = {

    groups: { X: [{ id: 'D', name: 'D' }, { id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }] },

    matches: [

        mkMatch('X', 'D', 'A', 2, 0), mkMatch('X', 'D', 'B', 2, 0), mkMatch('X', 'D', 'C', 2, 0),

        mkMatch('X', 'A', 'B', 1, 0), mkMatch('X', 'B', 'C', 1, 0), mkMatch('X', 'C', 'A', 1, 0)

    ],

    settings: { advCount: 2 }

};

const tv03Ctx = ctxFrom(tv03, { advCount: 2, numGroups: 1 });

const tv03Standings = TiebreakEngine.getSortedGroupStats('X', tv03Ctx);

const tv03State = TiebreakEngine.getGroupTieState('X', tv03Ctx);

const tv03Abc = tv03Standings.filter(function (s) { return s.t.id !== 'D'; });



if (tv03Standings[0].t.id === 'D') ok('TV-03 D rank 1');

else fail('TV-03 leader', tv03Standings[0]?.t.id);

if (TiebreakEngine.isAbsoluteTieCluster(tv03Abc, tv03.matches).absolute) ok('TV-03 ABC absolute');

else fail('TV-03 ABC');

if (tv03State.blocksPlayoff && tv03State.criticalCluster?.size === 3) ok('TV-03 critical cluster blocks PO');

else fail('TV-03 state', JSON.stringify(tv03State));



console.log('\n=== TV-04: 2-team H2H draw ===\n');

const tv04 = {

    groups: { X: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }, { id: 'D', name: 'D' }] },

    matches: [

        mkMatch('X', 'A', 'B', 2, 2), mkMatch('X', 'A', 'C', 2, 0), mkMatch('X', 'A', 'D', 2, 0),

        mkMatch('X', 'B', 'C', 2, 0), mkMatch('X', 'B', 'D', 2, 0), mkMatch('X', 'C', 'D', 0, 0)

    ],

    settings: { advCount: 2 }

};

const tv04Ctx = ctxFrom(tv04, { advCount: 2, numGroups: 1 });

const tv04AB = TiebreakEngine.getSortedGroupStats('X', tv04Ctx).filter(function (s) {

    return s.t.id === 'A' || s.t.id === 'B';

});

if (tv04AB.every(function (s) { return s.pkt === 7; })) ok('TV-04 both 7 pkt');

else fail('TV-04 pkt');

const tv04Abs = TiebreakEngine.isAbsoluteTieCluster(tv04AB, tv04.matches);

if (tv04Abs.absolute && tv04Abs.clusterSize === 2) ok('TV-04 pair absolute');

else fail('TV-04 absolute', JSON.stringify(tv04Abs));



console.log('\n=== TV-05: H2H resolves pair ===\n');

const tv05StatsA = { t: { id: 'A', name: 'A' }, pkt: 4, bz: 3, bs: 1, m: 3, w: 1, r: 0, p: 2 };

const tv05StatsB = { t: { id: 'B', name: 'B' }, pkt: 4, bz: 1, bs: 2, m: 3, w: 0, r: 0, p: 3 };

const tv05Matches = [mkMatch('X', 'A', 'B', 2, 0)];

const tv05Pair = [tv05StatsA, tv05StatsB];

const tv05Resolved = TiebreakEngine.resolveCluster(tv05Pair, tv05Matches);

if (!TiebreakEngine.isAbsoluteTieCluster(tv05Pair, tv05Matches).absolute) ok('TV-05 pair not absolute (H2H resolves)');

else fail('TV-05 should not be absolute');

if (tv05Resolved.ordered[0].t.id === 'A') ok('TV-05 A ranked above B via H2H');

else fail('TV-05 order', tv05Resolved.ordered.map(function (s) { return s.t.id; }).join(','));

const tv05Group = {

    groups: { X: [{ id: 'L', name: 'L' }, { id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }] },

    matches: [

        mkMatch('X', 'L', 'A', 2, 0), mkMatch('X', 'L', 'B', 2, 0), mkMatch('X', 'L', 'C', 2, 0),

        mkMatch('X', 'A', 'B', 1, 0), mkMatch('X', 'A', 'C', 1, 1), mkMatch('X', 'B', 'C', 2, 2)

    ],

    settings: { advCount: 2 }

};

const tv05State = TiebreakEngine.getGroupTieState('X', ctxFrom(tv05Group, { advCount: 2, numGroups: 1 }));

if (tv05State.state === 'NORMAL' && !tv05State.blocksPlayoff) ok('TV-05 group tie state NORMAL');

else fail('TV-05 group state', tv05State.state);



console.log('\n=== TV-06: 4-team, subcluster 3 ===\n');

const tv06 = {

    groups: { X: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }, { id: 'D', name: 'D' }] },

    matches: [

        mkMatch('X', 'D', 'A', 1, 0), mkMatch('X', 'D', 'B', 1, 0), mkMatch('X', 'D', 'C', 1, 0),

        mkMatch('X', 'A', 'B', 1, 0), mkMatch('X', 'B', 'C', 1, 0), mkMatch('X', 'C', 'A', 1, 0)

    ],

    settings: { advCount: 2 }

};

const tv06Ctx = ctxFrom(tv06, { advCount: 2, numGroups: 1 });

const tv06Standings = TiebreakEngine.getSortedGroupStats('X', tv06Ctx);

const tv06Pkt3 = tv06Standings.filter(function (s) { return s.pkt === 3; });

const tv06Abc = tv06Standings.filter(function (s) { return s.t.id !== 'D'; });

const tv06Resolved = TiebreakEngine.resolveCluster(tv06Pkt3, tv06.matches);



if (tv06Standings[0].t.id === 'D') ok('TV-06 D first');

else fail('TV-06 order', tv06Standings.map(function (s) { return s.t.name; }).join(','));

if (TiebreakEngine.isAbsoluteTieCluster(tv06Abc, tv06.matches).absolute) ok('TV-06 ABC absolute');

else fail('TV-06 ABC');

if (tv06Pkt3.length === 3) ok('TV-06 3-team pkt cluster (D separated at 9 pkt)');

else fail('TV-06 pkt cluster size', tv06Pkt3.length);

if (tv06Resolved.absoluteTieClusters.some(function (c) { return c.length === 3; })) ok('TV-06 subcluster 3');

else fail('TV-06 resolveCluster');



console.log('\n=== TV-REG-01 ===\n');

const state = { groups: fixture.groups, matches: fixture.matches, settings: fixture.settings };

for (const gn of Object.keys(TV_REG_01_EXPECTED)) {

    const top2 = TiebreakEngine.getSortedGroupStats(gn, ctxFrom(state)).slice(0, 2).map(function (s) { return s.t.name; });

    const exp = TV_REG_01_EXPECTED[gn];

    if (top2[0] === exp[0] && top2[1] === exp[1]) ok('TV-REG-01 Gr.' + gn);

    else fail('TV-REG-01 Gr.' + gn, top2.join(','));

}



console.log('\n=== Legacy parity (demo algo) ===\n');

const algoState = { groups: fixture.groups, matches: fixture.matches, settings: { advCount: 8 } };

for (const gn of Object.keys(algoState.groups)) {

    const ref = referenceGetSortedGroupStats(gn, algoState, {});

    const neu = TiebreakEngine.getSortedGroupStats(gn, ctxFrom(algoState));

    if (JSON.stringify(ref.map(snapshotRow)) === JSON.stringify(neu.map(snapshotRow))) ok('Parity Gr.' + gn);

    else fail('Parity Gr.' + gn);

}



console.log('\n=== customOrder / confirmed / tempLocal ===\n');

for (const gn of Object.keys(state.groups)) {

    const ref = referenceGetSortedGroupStats(gn, state, {});

    const neu = TiebreakEngine.getSortedGroupStats(gn, ctxFrom(state));

    if (JSON.stringify(ref.map(snapshotRow)) === JSON.stringify(neu.map(snapshotRow))) ok('customOrder Gr.' + gn);

    else fail('customOrder Gr.' + gn);

}

const conf = TiebreakEngine.getGroupTieState('A', ctxFrom(state));

if (conf.state === 'ABSOLUTE_TIE_CONFIRMED' && !conf.detectRemisAlert) ok('confirmedTableOrder');

else fail('confirmedTableOrder', conf.state);



const refTemp = referenceGetSortedGroupStats('A', algoState, { A: [2, 1, 3, 4] });

const neuTemp = TiebreakEngine.getSortedGroupStats('A', ctxFrom(algoState, { tempLocalOrder: [2, 1, 3, 4] }));

if (JSON.stringify(refTemp.map(snapshotRow)) === JSON.stringify(neuTemp.map(snapshotRow))) ok('tempLocalOrder');

else fail('tempLocalOrder');



console.log('\n--- Summary ---');

console.log('Passed:', passed);

console.log('Failed:', failed);

process.exit(failed > 0 ? 1 : 0);


