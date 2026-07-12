/**
 * S3 — Tie-break UI helpers (presentation only; no algorithm / persistence changes).
 */
(function (global) {
    'use strict';

    function formatTieBreakDisplayTime(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return String(iso);
        }
    }

    function formatSeedDisplay(seed, fanMode) {
        if (!seed) return '—';
        if (fanMode && seed.length > 12) return seed.slice(0, 8) + '…';
        return seed;
    }

    function formatDecisionOrder(decision, escFn) {
        const esc = escFn || function (s) { return String(s); };
        if (!decision || !decision.resolvedOrder || !decision.resolvedOrder.length) return '—';
        const nameById = {};
        (decision.clusterTeamIds || []).forEach(function (id, i) {
            nameById[id] = (decision.clusterTeamNames || [])[i] || id;
        });
        return decision.resolvedOrder.map(function (id, i) {
            return (i + 1) + '. ' + esc(nameById[id] || id);
        }).join(' · ');
    }

    function buildTablesIntro() {
        return '<div class="tiebreak-tables-intro">' +
            '🟩 Na zielono zaznaczono drużyny premiowane awansem.<br>' +
            '⚖️ Przy remisie punktowym decydują między sobą bezpośrednie starcia.<br>' +
            '🎲 Przy remisie absolutnym kolejność ustala audytowalne losowanie w systemie.' +
            '</div>';
    }

    function buildPoBlockedBanner() {
        return '<div class="tiebreak-po-blocked-banner" role="status">' +
            '🔒 Play-off zablokowany do czasu rozstrzygnięcia remisu absolutnego.' +
            '</div>';
    }

    function buildGroupBanner(gn, tieState, opts) {
        opts = opts || {};
        const esc = opts.esc || function (s) { return String(s); };
        const fanRo = !!opts.fanRo;

        if (!tieState) return '';

        if (tieState.state === 'ABSOLUTE_TIE_PENDING') {
            const names = (tieState.criticalCluster && tieState.criticalCluster.teamNames) || [];
            const teamLine = names.map(function (n) { return '<b>' + esc(n) + '</b>'; }).join(', ');
            let html = '<div class="tiebreak-group-banner tiebreak-pending" data-state="ABSOLUTE_TIE_PENDING">' +
                '<div class="tiebreak-banner-title">⚖ Remis absolutny</div>';
            if (teamLine) {
                html += '<div class="tiebreak-banner-teams">Drużyny: ' + teamLine + '</div>';
            }
            if (fanRo) {
                html += '<div class="tiebreak-banner-msg">Klasyfikacja grupy ' + esc(gn) + ' zostanie uzupełniona po rozstrzygnięciu przez organizatora.</div>';
            } else {
                html += '<div class="tiebreak-banner-msg">Play-off zablokowany do czasu rozstrzygnięcia.</div>' +
                    '<button type="button" class="tiebreak-draw-btn tiebreak-action-btn" onclick="openTieBreakDrawModal(\'' + esc(gn) + '\')">🎲 Losuj kolejność</button>';
            }
            html += '</div>';
            return html;
        }

        if (tieState.state === 'ABSOLUTE_TIE_CONFIRMED' && tieState.existingDecision) {
            const d = tieState.existingDecision;
            const fullOrder = opts.resolveOrderNames
                ? opts.resolveOrderNames(gn, d.resolvedOrder)
                : formatDecisionOrder({
                    resolvedOrder: d.resolvedOrder,
                    clusterTeamIds: d.resolvedOrder,
                    clusterTeamNames: (d.resolvedOrder || []).map(function (id) { return id; })
                }, esc);
            const meta = formatTieBreakDisplayTime(d.drawTimestamp) + ' · ' + esc(d.actorLabel || 'Organizator');
            const seed = formatSeedDisplay(d.drawSeed, fanRo);
            return '<div class="tiebreak-group-banner tiebreak-confirmed" data-state="ABSOLUTE_TIE_CONFIRMED">' +
                '<div class="tiebreak-banner-title">⚖ Remis absolutny — rozstrzygnięty</div>' +
                '<div class="tiebreak-banner-order">Kolejność: ' + fullOrder + '</div>' +
                '<div class="tiebreak-banner-meta">Losowanie: ' + meta + '</div>' +
                (fanRo ? '' : '<div class="tiebreak-banner-seed">Seed: <code class="tiebreak-seed-code">' + esc(seed) + '</code></div>') +
                (fanRo ? '<div class="tiebreak-banner-msg">⚖ Kolejność w Gr. ' + esc(gn) + ' ustalona losowaniem.</div>' : '') +
                '</div>';
        }

        if (tieState.state === 'GROUP_INCOMPLETE') {
            return '<div class="tiebreak-group-banner tiebreak-incomplete" data-state="GROUP_INCOMPLETE">' +
                '<div class="tiebreak-banner-title">⏳ Grupa ' + esc(gn) + ' — oczekiwanie na wyniki</div>' +
                '<div class="tiebreak-banner-msg">Remis może wymagać losowania po rozegraniu wszystkich meczów grupowych.</div>' +
                '</div>';
        }

        return '';
    }

    function buildModalConfirmBody(gn, tieState, escFn) {
        const esc = escFn || function (s) { return String(s); };
        const names = (tieState.criticalCluster && tieState.criticalCluster.teamNames) || [];
        const teamLine = names.map(function (n) { return '<b>' + esc(n) + '</b>'; }).join(', ');
        return {
            groupLabel: esc(gn),
            teamLine: teamLine || '—',
            advPerGroup: tieState.advPerGroup != null ? tieState.advPerGroup : '—'
        };
    }

    function buildModalResultBody(decision, escFn) {
        const esc = escFn || function (s) { return String(s); };
        if (!decision) {
            return { order: '—', meta: '—', seed: '—' };
        }
        return {
            order: formatDecisionOrder(decision, esc),
            meta: formatTieBreakDisplayTime(decision.drawTimestamp) + ' · ' + esc(decision.actorLabel || 'Organizator'),
            seed: decision.drawSeed || '—'
        };
    }

    global.TiebreakUI = {
        formatTieBreakDisplayTime: formatTieBreakDisplayTime,
        formatSeedDisplay: formatSeedDisplay,
        formatDecisionOrder: formatDecisionOrder,
        buildTablesIntro: buildTablesIntro,
        buildPoBlockedBanner: buildPoBlockedBanner,
        buildGroupBanner: buildGroupBanner,
        buildModalConfirmBody: buildModalConfirmBody,
        buildModalResultBody: buildModalResultBody
    };
})(typeof window !== 'undefined' ? window : global);
