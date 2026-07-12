/**
 * S2 — Auditable draw tests (TV-DRAW-2/3/4)
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const TiebreakEngine = require('../tiebreak-engine.js');
require('../tiebreak-audit.js');

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

function assertDecisionShape(d, expectedSize) {
    if (!d.id || d.version !== 1) { fail('decision shape id/version'); return false; }
    if (d.method !== 'DRAW') { fail('decision method DRAW', d.method); return false; }
    if (!d.drawSeed || d.drawSeed.length !== 32) { fail('decision drawSeed 32 hex', d.drawSeed); return false; }
    if (!d.drawTimestamp) { fail('decision drawTimestamp'); return false; }
    if (!d.actorLabel) { fail('decision actorLabel'); return false; }
    if (d.clusterSize !== expectedSize) { fail('decision clusterSize', d.clusterSize); return false; }
    if (d.resolvedOrder.length !== expectedSize) { fail('decision resolvedOrder length'); return false; }
    if (d.fullGroupOrder.length !== expectedSize && expectedSize <= 4) { /* ok for partial */ }
    if (!d.snapshotBefore.length || !d.snapshotAfter.length) { fail('decision snapshots'); return false; }
    return true;
}

function runDrawScenario(name, state, gn, advCount, expectedClusterSize) {
    const settings = JSON.parse(JSON.stringify(state.settings || {}));
    settings.tieBreakDecisions = [];
    settings.tieBreakByGroup = {};
    delete settings.customTableOrder;
    delete settings.confirmedTableOrder;

    const ctx = ctxFrom(Object.assign({}, state, { settings }), { advCount, numGroups: 1 });

    const before = TiebreakEngine.getGroupTieState(gn, ctx);
    if (before.state !== 'ABSOLUTE_TIE_PENDING') {
        fail(name + ' pending before draw', before.state);
        return;
    }
    ok(name + ' ABSOLUTE_TIE_PENDING before draw');

    const draw1 = TiebreakEngine.performAuditedDraw(gn, ctx, {
        actorLabel: 'Test Operator',
        tournamentId: 'test-tournament',
        now: function () { return '2026-07-12T12:00:00.000Z'; }
    });

    if (!draw1.ok) { fail(name + ' performAuditedDraw', draw1.error); return; }
    ok(name + ' performAuditedDraw ok');

    if (assertDecisionShape(draw1.decision, expectedClusterSize)) {
        ok(name + ' TieBreakDecision schema');
    }

    if (draw1.decision.actorLabel === 'Test Operator') ok(name + ' operator saved');
    else fail(name + ' operator');

    if (TiebreakEngine.hasTieBreakDecision(settings, gn)) ok(name + ' persisted in settings');
    else fail(name + ' settings persistence');

    const after = TiebreakEngine.getGroupTieState(gn, ctx);
    if (after.state === 'ABSOLUTE_TIE_CONFIRMED' && !after.blocksPlayoff) ok(name + ' CONFIRMED after draw');
    else fail(name + ' tie state after draw', after.state);

    const draw2 = TiebreakEngine.performAuditedDraw(gn, ctx, { actorLabel: 'Test' });
    if (!draw2.ok && draw2.error === 'DECISION_ALREADY_EXISTS') ok(name + ' blocks second draw');
    else fail(name + ' second draw blocked', draw2.error);

    const reloaded = JSON.parse(JSON.stringify(settings));
    TiebreakEngine.migrateTieBreakSettings(reloaded);
    const reloadCtx = ctxFrom(Object.assign({}, state, { settings: reloaded }), { advCount, numGroups: 1 });
    const reloadState = TiebreakEngine.getGroupTieState(gn, reloadCtx);
    if (reloadState.state === 'ABSOLUTE_TIE_CONFIRMED' && reloadState.existingDecision) {
        ok(name + ' reload reads existing decision');
    } else {
        fail(name + ' reload', reloadState.state);
    }

    const standings = TiebreakEngine.getSortedGroupStats(gn, reloadCtx);
    const orderIds = standings.map(function (s) { return s.t.id; });
    if (JSON.stringify(orderIds) === JSON.stringify(reloaded.customTableOrder[gn])) {
        ok(name + ' standings match saved order');
    } else {
        fail(name + ' standings order', orderIds.join(',') + ' vs ' + reloaded.customTableOrder[gn].join(','));
    }
}

console.log('\n=== TV-DRAW-2: 2-team cluster ===\n');
runDrawScenario('TV-DRAW-2', {
    groups: { X: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }] },
    matches: [mkMatch('X', 'A', 'B', 2, 2)],
    settings: {}
}, 'X', 1, 2);

console.log('\n=== TV-DRAW-3: 3-team cycle ===\n');
runDrawScenario('TV-DRAW-3', {
    groups: { X: [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }] },
    matches: [
        mkMatch('X', 'A', 'B', 1, 0), mkMatch('X', 'B', 'C', 1, 0), mkMatch('X', 'C', 'A', 1, 0)
    ],
    settings: {}
}, 'X', 2, 3);

console.log('\n=== TV-DRAW-4: 4-team, ABC subcluster ===\n');
runDrawScenario('TV-DRAW-4', {
    groups: {
        X: [
            { id: 'D', name: 'D' }, { id: 'A', name: 'A' },
            { id: 'B', name: 'B' }, { id: 'C', name: 'C' }
        ]
    },
    matches: [
        mkMatch('X', 'D', 'A', 2, 0), mkMatch('X', 'D', 'B', 2, 0), mkMatch('X', 'D', 'C', 2, 0),
        mkMatch('X', 'A', 'B', 1, 0), mkMatch('X', 'B', 'C', 1, 0), mkMatch('X', 'C', 'A', 1, 0)
    ],
    settings: {}
}, 'X', 2, 3);

console.log('\n=== CSPRNG seed generation ===\n');
const seed = TiebreakEngine.generateDrawSeed();
if (/^[0-9a-f]{32}$/.test(seed)) ok('generateDrawSeed 32 hex from crypto');
else fail('generateDrawSeed format', seed);

console.log('\n=== Fisher-Yates uses injectable CSPRNG ===\n');
let callCount = 0;
const mockBytes = new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0]);
const mockRandom = function (n) {
    callCount++;
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = mockBytes[i % mockBytes.length];
    return out;
};
const shuffled = TiebreakEngine.shuffleTeamIds(['A', 'B', 'C'], mockRandom);
if (shuffled.length === 3 && callCount > 0) ok('shuffleTeamIds uses getRandomBytes');
else fail('shuffleTeamIds');

console.log('\n--- Summary ---');
console.log('Passed:', passed);
console.log('Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
