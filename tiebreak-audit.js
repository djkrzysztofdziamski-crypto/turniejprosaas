/**
 * TurniejPro SaaS — Tiebreak Audit & Draw (S2)
 * Extends TiebreakEngine with auditable CSPRNG drawing.
 */
(function (root, factory) {
    const api = factory(root.TiebreakEngine);
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root.TiebreakEngine) {
        Object.assign(root.TiebreakEngine, api);
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (TB) {
    'use strict';

    if (!TB) {
        throw new Error('tiebreak-audit.js requires tiebreak-engine.js loaded first');
    }

    const DECISION_VERSION = 1;

    function defaultGetRandomBytes(length) {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const buf = new Uint8Array(length);
            crypto.getRandomValues(buf);
            return buf;
        }
        throw new Error('CSPRNG unavailable: crypto.getRandomValues required');
    }

    function randomUint32(getRandomBytes) {
        const bytes = getRandomBytes(4);
        return ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    }

    function generateDrawSeed(getRandomBytes) {
        const fn = getRandomBytes || defaultGetRandomBytes;
        const bytes = fn(16);
        return Array.from(bytes).map(function (b) {
            return b.toString(16).padStart(2, '0');
        }).join('');
    }

    function generateDecisionId(getRandomBytes) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'tb-' + Date.now() + '-' + generateDrawSeed(getRandomBytes).slice(0, 8);
    }

    /**
     * Fisher-Yates shuffle using CSPRNG (independent of seed; seed stored for audit).
     * @param {Array<number|string>} teamIds
     * @param {Function} getRandomBytes
     * @returns {Array<number|string>}
     */
    function shuffleTeamIds(teamIds, getRandomBytes) {
        const fn = getRandomBytes || defaultGetRandomBytes;
        const arr = teamIds.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = randomUint32(fn) % (i + 1);
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function snapshotStanding(s) {
        return {
            teamId: s.t.id,
            teamName: s.t.name,
            rank: s.rank,
            pkt: s.pkt,
            bz: s.bz,
            bs: s.bs,
            h2h_pkt: s.h2h_pkt || 0,
            h2h_bz: s.h2h_bz || 0,
            h2h_bs: s.h2h_bs || 0
        };
    }

    function ensureTieBreakSettings(settings) {
        if (!settings) return { tieBreakDecisions: [], tieBreakByGroup: {} };
        if (!settings.tieBreakDecisions) settings.tieBreakDecisions = [];
        if (!settings.tieBreakByGroup) settings.tieBreakByGroup = {};
        return settings;
    }

    function getTieBreakDecisionForGroup(settings, groupName) {
        if (!settings || !settings.tieBreakDecisions) return null;
        const id = settings.tieBreakByGroup && settings.tieBreakByGroup[groupName];
        if (id) {
            return settings.tieBreakDecisions.find(function (d) { return d.id === id; }) || null;
        }
        return settings.tieBreakDecisions.find(function (d) { return d.groupName === groupName; }) || null;
    }

    function hasTieBreakDecision(settings, groupName) {
        return !!getTieBreakDecisionForGroup(settings, groupName);
    }

    function buildFullGroupOrder(algorithmicStandings, clusterTeamIds, resolvedClusterOrder) {
        const clusterSet = new Set(clusterTeamIds.map(String));
        const result = [];
        let clusterInserted = false;

        algorithmicStandings.forEach(function (s) {
            if (clusterSet.has(String(s.t.id))) {
                if (!clusterInserted) {
                    resolvedClusterOrder.forEach(function (id) { result.push(id); });
                    clusterInserted = true;
                }
            } else {
                result.push(s.t.id);
            }
        });

        return result;
    }

    function createTieBreakDecision(params) {
        return {
            id: params.id,
            version: DECISION_VERSION,
            tournamentId: params.tournamentId || '',
            groupName: params.groupName,
            clusterTeamIds: params.clusterTeamIds.slice(),
            clusterTeamNames: params.clusterTeamNames.slice(),
            clusterSize: params.clusterSize,
            cutoffRank: params.cutoffRank,
            advPerGroup: params.advPerGroup,
            resolvedOrder: params.resolvedOrder.slice(),
            fullGroupOrder: params.fullGroupOrder.slice(),
            method: params.method || 'DRAW',
            criteriaExhausted: (params.criteriaExhausted || []).slice(),
            drawSeed: params.drawSeed || null,
            drawTimestamp: params.drawTimestamp,
            actorUserId: params.actorUserId || null,
            actorLabel: params.actorLabel || 'Organizator',
            note: params.note || null,
            snapshotBefore: params.snapshotBefore || [],
            snapshotAfter: params.snapshotAfter || []
        };
    }

    function createLegacyManualDecision(groupName, settings) {
        const order = (settings.customTableOrder && settings.customTableOrder[groupName]) || [];
        return createTieBreakDecision({
            id: 'legacy-' + groupName + '-' + DECISION_VERSION,
            groupName: groupName,
            clusterTeamIds: order,
            clusterTeamNames: order.map(function () { return '?'; }),
            clusterSize: order.length,
            cutoffRank: 0,
            advPerGroup: 0,
            resolvedOrder: order,
            fullGroupOrder: order,
            method: 'MANUAL',
            criteriaExhausted: ['LEGACY_MANUAL'],
            drawSeed: null,
            drawTimestamp: new Date(0).toISOString(),
            actorLabel: 'Migracja systemu',
            note: 'Kolejność zatwierdzona przed wdrożeniem modułu tie-break (migracja automatyczna).',
            snapshotBefore: [],
            snapshotAfter: []
        });
    }

    function migrateTieBreakSettings(settings) {
        if (!settings) return settings;
        ensureTieBreakSettings(settings);

        settings.tieBreakDecisions.forEach(function (d) {
            if (d.groupName) settings.tieBreakByGroup[d.groupName] = d.id;
        });

        Object.keys(settings.confirmedTableOrder || {}).forEach(function (gn) {
            if (settings.confirmedTableOrder[gn] && !settings.tieBreakByGroup[gn]) {
                const legacy = createLegacyManualDecision(gn, settings);
                settings.tieBreakDecisions.push(legacy);
                settings.tieBreakByGroup[gn] = legacy.id;
            }
        });

        return settings;
    }

    function applyTieBreakDecision(settings, decision) {
        ensureTieBreakSettings(settings);

        if (hasTieBreakDecision(settings, decision.groupName)) {
            return { ok: false, error: 'DECISION_ALREADY_EXISTS' };
        }

        settings.tieBreakDecisions.push(decision);
        settings.tieBreakByGroup[decision.groupName] = decision.id;

        if (!settings.customTableOrder) settings.customTableOrder = {};
        if (!settings.confirmedTableOrder) settings.confirmedTableOrder = {};

        settings.customTableOrder[decision.groupName] = decision.fullGroupOrder.slice();
        settings.confirmedTableOrder[decision.groupName] = true;

        return { ok: true, decision: decision };
    }

    function removeTieBreakDecision(settings, groupName) {
        if (!settings || !settings.tieBreakDecisions) return;
        const id = settings.tieBreakByGroup && settings.tieBreakByGroup[groupName];
        settings.tieBreakDecisions = settings.tieBreakDecisions.filter(function (d) {
            return d.groupName !== groupName && d.id !== id;
        });
        if (settings.tieBreakByGroup) delete settings.tieBreakByGroup[groupName];
    }

    function formatTieBreakLogMessage(decision) {
        const names = (decision.clusterTeamNames || []).join(', ');
        if (decision.method === 'DRAW') {
            return 'Gr. ' + decision.groupName + ': remis absolutny (' + names + ') — kolejność ustalona losowaniem.';
        }
        return 'Gr. ' + decision.groupName + ': remis absolutny (' + names + ') — kolejność ustalona ręcznie.';
    }

    /**
     * Perform auditable draw for absolute tie cluster.
     * @param {string} gn
     * @param {Object} ctx
     * @param {Object} [options]
     * @returns {{ ok: boolean, error?: string, decision?: Object }}
     */
    function performAuditedDraw(gn, ctx, options) {
        options = options || {};
        const settings = ctx.settings || {};
        const getRandomBytes = options.getRandomBytes || defaultGetRandomBytes;
        const now = options.now || function () { return new Date().toISOString(); };

        if (hasTieBreakDecision(settings, gn)) {
            return { ok: false, error: 'DECISION_ALREADY_EXISTS' };
        }

        const tieState = TB.getGroupTieState(gn, ctx);

        if (tieState.state !== 'ABSOLUTE_TIE_PENDING') {
            return { ok: false, error: 'NO_DRAW_REQUIRED', tieState: tieState.state };
        }

        if (!tieState.criticalCluster || !tieState.criticalCluster.absoluteTie) {
            return { ok: false, error: 'NO_ABSOLUTE_CLUSTER' };
        }

        const cluster = tieState.criticalCluster;
        const standingsBefore = TB.buildAlgorithmicStandings(gn, ctx);
        const snapshotBefore = standingsBefore.map(snapshotStanding);

        const drawSeed = generateDrawSeed(getRandomBytes);
        const resolvedOrder = shuffleTeamIds(cluster.teamIds, getRandomBytes);
        const fullGroupOrder = buildFullGroupOrder(standingsBefore, cluster.teamIds, resolvedOrder);

        const ctxAfter = Object.assign({}, ctx, {
            settings: Object.assign({}, settings, {
                customTableOrder: Object.assign({}, settings.customTableOrder || {}, { [gn]: fullGroupOrder }),
                confirmedTableOrder: Object.assign({}, settings.confirmedTableOrder || {}, { [gn]: true })
            })
        });
        const standingsAfter = TB.getSortedGroupStats(gn, ctxAfter);
        const snapshotAfter = standingsAfter.map(snapshotStanding);

        const decision = createTieBreakDecision({
            id: generateDecisionId(getRandomBytes),
            tournamentId: options.tournamentId || '',
            groupName: gn,
            clusterTeamIds: cluster.teamIds,
            clusterTeamNames: cluster.teamNames,
            clusterSize: cluster.size,
            cutoffRank: tieState.cutoffIndex + 1,
            advPerGroup: tieState.advPerGroup,
            resolvedOrder: resolvedOrder,
            fullGroupOrder: fullGroupOrder,
            method: 'DRAW',
            criteriaExhausted: cluster.criteriaExhausted || TB.CRITERIA_ALL.slice(),
            drawSeed: drawSeed,
            drawTimestamp: now(),
            actorUserId: options.actorUserId || null,
            actorLabel: options.actorLabel || 'Organizator',
            snapshotBefore: snapshotBefore,
            snapshotAfter: snapshotAfter
        });

        const applied = applyTieBreakDecision(settings, decision);
        if (!applied.ok) return applied;

        return { ok: true, decision: decision, resolvedOrder: resolvedOrder, drawSeed: drawSeed };
    }

    /** Patch getGroupTieState to honour persisted DRAW/MANUAL decisions */
    const _origGetGroupTieState = TB.getGroupTieState;
    TB.getGroupTieState = function (gn, ctx) {
        ctx = ctx || {};
        const settings = ctx.settings || {};
        const existing = getTieBreakDecisionForGroup(settings, gn);
        const numGroups = ctx.numGroups || Object.keys(ctx.groups || {}).length || 1;
        const advCount = ctx.advCount != null ? ctx.advCount : (settings.advCount || 4);
        const cutoff = TB.computeCutoff(advCount, numGroups);

        if (existing && (existing.method === 'DRAW' || existing.method === 'MANUAL')) {
            return {
                groupName: gn,
                state: 'ABSOLUTE_TIE_CONFIRMED',
                cutoffIndex: cutoff.cutoffIndex,
                advPerGroup: cutoff.advPerGroup,
                isConfirmed: true,
                groupIncomplete: false,
                detectRemisAlert: false,
                blocksPlayoff: false,
                pairAtCutoffAbsolute: false,
                criticalCluster: null,
                existingDecision: {
                    id: existing.id,
                    method: existing.method,
                    drawSeed: existing.drawSeed || null,
                    drawTimestamp: existing.drawTimestamp,
                    resolvedOrder: (existing.resolvedOrder || []).slice(),
                    actorLabel: existing.actorLabel
                }
            };
        }

        return _origGetGroupTieState(gn, ctx);
    };

    return {
        DECISION_VERSION: DECISION_VERSION,
        defaultGetRandomBytes: defaultGetRandomBytes,
        generateDrawSeed: generateDrawSeed,
        shuffleTeamIds: shuffleTeamIds,
        getTieBreakDecisionForGroup: getTieBreakDecisionForGroup,
        hasTieBreakDecision: hasTieBreakDecision,
        createTieBreakDecision: createTieBreakDecision,
        migrateTieBreakSettings: migrateTieBreakSettings,
        applyTieBreakDecision: applyTieBreakDecision,
        removeTieBreakDecision: removeTieBreakDecision,
        performAuditedDraw: performAuditedDraw,
        formatTieBreakLogMessage: formatTieBreakLogMessage,
        buildFullGroupOrder: buildFullGroupOrder,
        snapshotStanding: snapshotStanding
    };
});
