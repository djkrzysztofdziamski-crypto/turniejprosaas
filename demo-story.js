/**

 * Demo Story MVP — Loader + Controller (Sprint A, Faza 3)

 * Powiązane: demo-story-scenario/, SPRINT_A_DEMO_STORY.md

 */

(function (global) {

    'use strict';



    const STEPS = [

        { id: 0, key: 'entry', name: 'Wejście', progress: null },

        { id: 1, key: 'hook', name: 'Hook', progress: '1 / 6' },

        { id: 2, key: 'fan', name: 'Widok Kibica', progress: '2 / 6' },

        { id: 3, key: 'organizer', name: 'Panel Organizatora', progress: '3 / 6' },

        { id: 4, key: 'final', name: 'Finał', progress: '4 / 6' },

        { id: 5, key: 'podium', name: 'Podium', progress: '5 / 6' },

        { id: 6, key: 'conversion', name: 'Konwersja', progress: '6 / 6' },

        { id: 7, key: 'archive', name: 'Archiwum', progress: null }

    ];



    const FAN_TABS = [

        { id: 'mecze', label: 'Mecze' },

        { id: 'tabele', label: 'Tabele' },

        { id: 'playoff', label: 'Play-Off' }

    ];



    const EMBED_NODES = {

        fan: ['match-filter-bar', 'matches-container', 'tables-container', 'playoff-container'],

        organizer: ['tournament-dashboard'],

        live: ['nazywo'],

        hall: ['hall-screen'],

        podium: ['podium-view']

    };



    const SCREEN_COPY = {

        entry: {

            eyebrow: 'Turniejomat',

            h1: 'Zobacz finał turnieju — bez chaosu w dniu zawodów',

            sub: '2 minuty. Jedna historia. Twój turniej może wyglądać tak samo.',

            cta: 'Zobacz finał turnieju',

            ctaSecondary: 'Mam klucz — aktywuj licencję',

            micro: 'Bez rejestracji · Demo nie wymaga klucza'

        },

        hook: {

            h1: 'Turniej 16 drużyn. 32 mecze. Finał za chwilę.',

            sub: 'Został jeden mecz. Cały obiekt czeka na wynik.',

            cta: 'Zobacz, co widzą rodzice'

        },

        fan: {

            label: 'Widok kibica — to widzą rodzice na telefonie',

            h1: 'Rodzice sami sprawdzają wyniki',

            sub: 'Terminarz, wyniki, tabela i play-off — bez dzwonienia do Ciebie.',

            cta: 'Wróć do stołu organizatora'

        },

        organizer: {

            h1: 'Cały turniej za Tobą. Został finał.',

            sub: 'Jeden wpis. Koniec turnieju. Reszta zrobi się sama.',

            cta: 'Wpisz wynik finału'

        },

        final: {

            h1: 'WIELKI FINAŁ',

            cta: 'Zapisz wynik finału',

            micro: 'Po zapisie system wyliczy podium i statystyki automatycznie'

        },

        podium: {

            h1: 'Turniej zamknięty',

            sub: 'Po finałe nie liczysz na kartce. Podium jest gotowe.',

            cta: 'Chcę taki turniej u siebie'

        },

        conversion: {

            h1: 'Twój turniej może wyglądać tak samo',

            sub: '16 drużyn · wyniki live dla rodziców · podium po finałe — bez chaosu na boisku',

            bullets: [

                'Rodzice sami sprawdzają terminarz i wyniki',

                'Ty wpisujesz wyniki — tabela i play-off się aktualizują',

                'Po finałe: podium, król strzelców, bramkarz — automatycznie'

            ],

            ctaLanding: 'Zobacz prezentację na turniejomat.pl',

            ctaLandingSub: 'Cennik, funkcje i jak uruchomić turniej u siebie',

            ctaPrimary: 'Aktywuj licencję na mój turniej',

            ctaSecondary: 'Zamów klucz na weekend turnieju',

            ctaTertiary: 'Wyślij mi ofertę',

            microPackages: 'Pakiety: weekend 79 zł · miesiąc 149 zł',

            microNext: 'Po aktywacji: wpisujesz klucz → tworzysz drużyny → grasz',

            ctaNext: 'Zobacz archiwum turnieju'

        },

        archive: {

            h1: 'Turniej zakończony. Wyniki zostają.',

            sub: 'Protokół i archiwum gotowe — dla klubów, rodziców i sponsorów.',

            cta: 'Aktywuj licencję'

        }

    };



    let isDemoStoryMode = false;

    let demoStoryStep = 0;

    let demoSessionId = null;

    let demoStoryCompleted = false;

    let demoScenarioState = null;

    let demoStoryEvents = [];

    let demoFanTab = 'mecze';

    let embedRestoreMap = new Map();

    let activeEmbedKind = null;

    let demoPodiumViewedAt = null;

    let demoStoryStartAt = null;

    const DEMO_SESSION_KEY = 'tp_demo_story_session';

    const SALES_EMAIL = 'admin@turniejomat.pl';
    const APP_URL = 'https://app.turniejomat.pl/';
    const LANDING_URL = 'https://turniejomat.pl/';



    function isDemoStoryAutoContext() {

        return new URLSearchParams(global.location.search).get('demo') === 'story'

            || global.location.hostname === 'demo.turniejomat.pl';

    }



    function buildSalesMailto(subject) {

        const body = 'Dzień dobry,\n\nChcę dowiedzieć się więcej o Turniejomat.\n\n';

        return 'mailto:' + SALES_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

    }



    function buildDemoSessionSnapshot() {

        const fin = getFinalMatch();

        return {

            step: demoStoryStep,

            isActive: isDemoStoryMode,

            completed: demoStoryCompleted,

            fanTab: demoFanTab,

            final: fin ? { g1: fin.g1, g2: fin.g2, pen1: fin.pen1, pen2: fin.pen2, played: fin.played } : null

        };

    }



    function saveDemoStorySession() {

        if (!isDemoStoryAutoContext()) return;

        if (!isDemoStoryMode || demoStoryStep < 1) {

            try { global.sessionStorage.removeItem(DEMO_SESSION_KEY); } catch (e) { /* ignore */ }

            return;

        }

        try {

            global.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(buildDemoSessionSnapshot()));

        } catch (e) { /* ignore */ }

    }



    function clearDemoStorySession() {

        try { global.sessionStorage.removeItem(DEMO_SESSION_KEY); } catch (e) { /* ignore */ }

    }



    function applyFinalSessionPatch(patch) {

        if (!patch || !demoScenarioState) return;

        const fin = getFinalMatch();

        if (!fin) return;

        fin.g1 = patch.g1;

        fin.g2 = patch.g2;

        fin.pen1 = patch.pen1;

        fin.pen2 = patch.pen2;

        fin.played = !!patch.played;

        if (fin.played && demoScenarioState._demoStory && demoScenarioState._demoStory.status) {

            demoScenarioState._demoStory.status.label = '32 / 32';

        }

    }



    function tryRestoreDemoStorySession() {

        if (!isDemoStoryAutoContext()) return false;

        if (getUrlDemoStep() != null) return false;

        let sess;

        try {

            const raw = global.sessionStorage.getItem(DEMO_SESSION_KEY);

            if (!raw) return false;

            sess = JSON.parse(raw);

        } catch (e) {

            return false;

        }

        if (!sess || !sess.isActive || sess.step < 1) return false;

        const bundle = global.DEMO_SCENARIO_BUNDLE;

        if (!bundle) return false;

        isDemoStoryMode = true;

        demoStoryStep = sess.step;

        demoStoryCompleted = !!sess.completed;

        demoFanTab = sess.fanTab || 'mecze';

        demoStoryStartAt = Date.now();

        demoScenarioState = loadScenarioToState(bundle);

        applyFinalSessionPatch(sess.final);

        applyStateToApp();

        ensureRenderBridge();

        showViewDemoStory();

        renderCurrentStep();

        return true;

    }



    function teamIdToNum(scenarioTeamId) {

        return parseInt(String(scenarioTeamId).replace(/^t/, ''), 10);

    }



    function kickoffToTime(kickoff) {

        if (!kickoff) return '—';

        try {

            const d = new Date(kickoff);

            return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

        } catch (e) {

            return '—';

        }

    }



    function playerFullName(p) {
        if (!p) return '';
        const full = ((p.firstName || '') + ' ' + (p.lastName || '')).trim();
        return full || p.displayName || '';
    }

    function mapScorers(scorers, playersById, sideTeamId) {

        if (!scorers || !scorers.length) return [];

        const result = [];

        scorers.forEach(function (s) {

            if (s.teamId !== sideTeamId) return;

            const p = playersById[s.playerId];

            const name = p ? (playerFullName(p) || 'Strzelec') : 'Strzelec';

            (s.goals || []).forEach(function () {

                result.push({ name: name });

            });

        });

        return result;

    }



    function playoffLabel(phase, label, bracketPosition) {

        if (label) return label.toUpperCase();

        const map = {

            quarterfinal: 'Ćwierćfinał ' + (bracketPosition || '').replace('QF', ''),

            semifinal: 'Półfinał ' + (bracketPosition || '').replace('SF', ''),

            third_place: 'MECZ O 3. MIEJSCE',

            final: 'WIELKI FINAŁ'

        };

        return map[phase] || phase;

    }



    /** DemoScenarioLoader — mapuje bundle → state aplikacji */

    function loadScenarioToState(bundle) {

        if (!bundle || !bundle.teams || !bundle.matches) {

            throw new Error('DEMO_SCENARIO_BUNDLE nie załadowany');

        }



        const playersById = {};

        (bundle.players && bundle.players.players || []).forEach(function (p) {

            playersById[p.id] = p;

        });



        const teamsByScenarioId = {};

        const teams = (bundle.teams.teams || []).map(function (t) {

            const numId = teamIdToNum(t.id);

            const gkPlayer = (bundle.players.players || []).find(function (p) {

                return p.teamId === t.id && p.role === 'goalkeeper';

            });

            const gkName = gkPlayer ? (playerFullName(gkPlayer) || gkPlayer.displayName || '—') : '—';

            const entry = {

                id: numId,

                name: t.name,

                gk: gkName,

                cap: '—'

            };

            teamsByScenarioId[t.id] = entry;

            return entry;

        });



        const groups = {};

        (bundle.groups && bundle.groups.groups || []).forEach(function (g) {

            groups[g.id] = g.teamIds.map(function (tid) {

                const team = teamsByScenarioId[tid];

                return { id: team.id, name: team.name };

            });

        });



        let matchNumId = 1;

        const matches = (bundle.matches.matches || [])

            .filter(function (m) { return m.phase === 'group'; })

            .map(function (m) {

                const t1 = teamsByScenarioId[m.homeTeamId];

                const t2 = teamsByScenarioId[m.awayTeamId];

                const played = m.status === 'played';

                return {

                    id: matchNumId++,

                    _scenarioId: m.id,

                    group: m.group,

                    time: kickoffToTime(m.kickoff),

                    t1: { id: t1.id, name: t1.name },

                    t2: { id: t2.id, name: t2.name },

                    g1: played ? m.homeScore : 0,

                    g2: played ? m.awayScore : 0,

                    played: played,

                    s1: mapScorers(m.scorers, playersById, m.homeTeamId),

                    s2: mapScorers(m.scorers, playersById, m.awayTeamId),

                    cleanSheetGoalkeeperId: m.cleanSheetGoalkeeperId || null

                };

            });



        let poNumId = 101;

        const playoffs = (bundle.matches.matches || [])

            .filter(function (m) { return m.phase !== 'group'; })

            .map(function (m) {

                const t1 = teamsByScenarioId[m.homeTeamId];

                const t2 = teamsByScenarioId[m.awayTeamId];

                const played = m.status === 'played';

                const entry = {

                    id: poNumId++,

                    _scenarioId: m.id,

                    n: playoffLabel(m.phase, m.label, m.bracketPosition),

                    time: kickoffToTime(m.kickoff),

                    t1: { id: t1.id, name: t1.name },

                    t2: { id: t2.id, name: t2.name },

                    g1: played ? m.homeScore : 0,

                    g2: played ? m.awayScore : 0,

                    played: played,

                    s1: mapScorers(m.scorers, playersById, m.homeTeamId),

                    s2: mapScorers(m.scorers, playersById, m.awayTeamId),

                    cleanSheetGoalkeeperId: m.cleanSheetGoalkeeperId || null

                };

                if (m.isDemoInteraction) entry.isDemoFinal = true;

                return entry;

            });



        const meta = bundle.meta || {};

        const goalkeepersById = {};

        (bundle.players && bundle.players.players || []).forEach(function (p) {

            if (p.role !== 'goalkeeper') return;

            const team = teamsByScenarioId[p.teamId];

            goalkeepersById[p.id] = {

                id: p.id,

                displayName: p.displayName,

                fullName: playerFullName(p) || p.displayName,

                teamId: p.teamId,

                teamName: team ? team.name : '—',

                isGoalkeeperOfTournament: !!p.isGoalkeeperOfTournament

            };

        });

        const standingsData = bundle.standings && bundle.standings.standings;
        const customTableOrder = {};
        const qualifiedTeamIds = [];
        if (standingsData) {
            Object.keys(standingsData).forEach(function (gn) {
                const table = standingsData[gn].table || [];
                customTableOrder[gn] = table.map(function (row) {
                    const team = teamsByScenarioId[row.teamId];
                    if (row.qualified && team) qualifiedTeamIds.push(team.id);
                    return team ? team.id : null;
                }).filter(function (id) { return id != null; });
            });
        }

        const format = meta.format || {};
        const groupsCount = format.groupsCount || Object.keys(groups).length;
        const advCount = format.playoffTeams || (format.teamsPerGroup || 2) * groupsCount;

        return {

            settings: {

                bracketSize: advCount,

                advCount: advCount,

                customTableOrder: customTableOrder,

                qualifiedTeamIds: qualifiedTeamIds,

                start: '08:00',

                gDur: 12,

                gBreak: 3,

                afterG: 15,

                poDur: 15,

                finDur: 20

            },

            teams: teams,

            groups: groups,

            matches: matches,

            playoffs: playoffs,

            logs: [

                '[08:00:00] Demo Story: załadowano scenariusz Memoriał Wiosenny 2026.',

                '[19:15:00] 31/32 meczów rozegranych. WIELKI FINAŁ czeka na wynik.'

            ],

            meta: {

                tournamentName: meta.name || 'Memoriał Wiosenny 2026'

            },

            _demoStory: {

                tournamentId: meta.id || 'DEMO-STORY-2026',

                name: meta.name,

                venue: meta.venue,

                dateLabel: meta.dateLabel,

                heroMetrics: meta.heroMetrics,

                phase: meta.phase,

                status: meta.status,

                bundle: bundle,

                goalkeepersById: goalkeepersById

            }

        };

    }



    function track(eventName, props) {

        const payload = Object.assign({ session_id: demoSessionId, step: demoStoryStep, timestamp: Date.now() }, props || {});

        demoStoryEvents.push({ event: eventName, payload: payload });

        if (typeof console !== 'undefined' && console.log) {

            console.log('[DemoStory]', eventName, payload);

        }

    }



    function newSessionId() {

        return 'ds-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

    }



    function getStepDef(step) {

        return STEPS.find(function (s) { return s.id === step; }) || STEPS[0];

    }



    function getFinalMatch() {

        return (demoScenarioState && demoScenarioState.playoffs || []).find(function (m) { return m.isDemoFinal; });

    }



    function showViewDemoStory() {

        document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });

        const el = document.getElementById('view-demo-story');

        if (el) el.classList.add('active');

    }



    function showViewLogin() {

        teardownActiveEmbed();

        document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });

        const el = document.getElementById('view-login');

        if (el) el.classList.add('active');

    }



    function updateChrome(stepDef) {

        const chrome = document.getElementById('demo-story-chrome');

        const progress = document.getElementById('demo-story-progress');

        if (!chrome) return;

        if (stepDef.id === 0 || stepDef.id === 7) {

            chrome.style.display = 'none';

        } else {

            chrome.style.display = 'flex';

            if (progress) progress.textContent = stepDef.progress ? ('Krok ' + stepDef.progress) : '';

        }

    }



    function ensureRenderBridge() {

        if (!global._appRenderBridgeReady && typeof global.initAppModuleBridge === 'function') {

            global.initAppModuleBridge();

        }

    }



    function saveNodePlacement(id) {

        if (embedRestoreMap.has(id)) return;

        const el = document.getElementById(id);

        if (!el || !el.parentNode) return;

        embedRestoreMap.set(id, { parent: el.parentNode, next: el.nextSibling });

    }



    function mountNodes(nodeIds, hostEl) {

        nodeIds.forEach(function (id) {

            const el = document.getElementById(id);

            if (!el || !hostEl) return;

            saveNodePlacement(id);

            hostEl.appendChild(el);

        });

    }



    function restoreNodes(nodeIds) {

        nodeIds.forEach(function (id) {

            const el = document.getElementById(id);

            const saved = embedRestoreMap.get(id);

            if (el && saved && saved.parent) {

                saved.parent.insertBefore(el, saved.next);

            }

        });

    }



    function setFanPanelVisibility(tab) {

        const map = {

            mecze: ['match-filter-bar', 'matches-container'],

            tabele: ['tables-container'],

            playoff: ['match-filter-bar', 'playoff-container']

        };

        EMBED_NODES.fan.forEach(function (id) {

            const el = document.getElementById(id);

            if (!el) return;

            const show = (map[tab] || []).indexOf(id) !== -1;

            el.style.display = show ? '' : 'none';

        });

        const filterBar = document.getElementById('match-filter-bar');

        if (filterBar) {

            const showFilters = tab === 'mecze' || tab === 'playoff';

            filterBar.classList.toggle('fan-filters-visible', showFilters);

            if (!showFilters) filterBar.innerHTML = '';

        }

        const poBtn = document.getElementById('btn-start-po');

        if (poBtn) poBtn.style.display = 'none';

    }



    function renderFanTabContent(tab) {

        demoFanTab = tab;

        global._demoStoryFanTab = tab;

        setFanPanelVisibility(tab);

        if (tab === 'mecze') {

            if (global.renderFilterBar) global.renderFilterBar();

            if (global.filterAndRenderMatches) global.filterAndRenderMatches();

        } else if (tab === 'tabele') {

            if (global.calcTables) global.calcTables();

        } else if (tab === 'playoff') {

            if (global.renderFilterBar) global.renderFilterBar();

            if (global.renderPlayoffTree) global.renderPlayoffTree();

        }

        track('demo_story_fan_tab_switched', { tab_name: tab });

        saveDemoStorySession();

    }



    function teardownActiveEmbed() {

        if (activeEmbedKind === 'fan') {

            restoreNodes(EMBED_NODES.fan);

            global._demoStoryFanEmbed = false;

            global._demoStoryFanTab = null;

        } else if (activeEmbedKind === 'organizer') {

            teardownHallDemoSixteen();

            restoreNodes(EMBED_NODES.organizer);

            restoreNodes(EMBED_NODES.live);

            restoreNodes(EMBED_NODES.hall);

            global._demoStoryOrganizerEmbed = false;

        } else if (activeEmbedKind === 'podium') {

            restoreNodes(EMBED_NODES.podium);

            global._demoStoryPodiumEmbed = false;

        }

        activeEmbedKind = null;

    }



    function buildCtaZone(copy, stepDef) {

        let html = '<div class="demo-cta-zone">';

        if (stepDef.key === 'final') {

            html += '<button type="button" class="demo-btn-primary" data-demo-action="save-final">' + copy.cta + '</button>';

        } else {

            html += '<button type="button" class="demo-btn-primary" data-demo-action="next">' + (copy.cta || 'Dalej') + '</button>';

        }

        if (copy.ctaSecondary && stepDef.key === 'entry') {

            html += '<button type="button" class="demo-btn-link" data-demo-action="license">' + copy.ctaSecondary + '</button>';

        }

        if (copy.micro) {

            html += '<p class="demo-micro">' + copy.micro + '</p>';

        }

        html += '</div>';

        return html;

    }



    function renderStaticScreen(stepDef, copy, bodyExtra) {

        const meta = demoScenarioState && demoScenarioState._demoStory;

        const metaLine = stepDef.key === 'hook' && meta ? '<p class="demo-meta-line">' + meta.dateLabel + '</p>' : '';

        return '<div class="demo-screen-inner">' +

            (copy.eyebrow ? '<p class="demo-eyebrow">' + copy.eyebrow + '</p>' : '') +

            (copy.label ? '<p class="demo-label">' + copy.label + '</p>' : '') +

            '<h1 class="demo-h1">' + (copy.h1 || stepDef.name) + '</h1>' +

            (copy.sub ? '<p class="demo-sub">' + copy.sub + '</p>' : '') +

            (bodyExtra || '') +

            metaLine +

            buildCtaZone(copy, stepDef) +

            '</div>';

    }



    function renderHookBody() {

        const meta = demoScenarioState && demoScenarioState._demoStory;

        const hm = meta && meta.heroMetrics;

        if (!hm) return '';

        return '<div class="demo-hero-metrics">' +

            '<div class="demo-metric"><span class="demo-metric-val">' + hm.teams + '</span><span class="demo-metric-lbl">drużyn</span></div>' +

            '<div class="demo-metric"><span class="demo-metric-val">' + hm.matchesTotal + '</span><span class="demo-metric-lbl">meczów</span></div>' +

            '<div class="demo-metric"><span class="demo-metric-val">' + hm.matchesPlayed + '</span><span class="demo-metric-lbl">rozegranych</span></div>' +

            '</div>';

    }



    function renderOrganizerBody() {

        const meta = demoScenarioState && demoScenarioState._demoStory;

        const fin = getFinalMatch();

        let html = '';

        if (meta) {

            html += '<div class="demo-status-block">' +

                '<div class="demo-status-big">' + (meta.status && meta.status.label || '31 / 32') + '</div>' +

                '<div class="demo-phase-line">' +

                '<span class="demo-phase-done">Faza grupowa <span class="demo-check" aria-hidden="true">✓</span></span>' +

                '<span class="demo-phase-sep">·</span>' +

                '<span class="demo-phase-done">Play-off <span class="demo-check" aria-hidden="true">✓</span></span>' +

                '</div>' +

                '</div>';

        }

        const t1 = (fin && fin.t1 && fin.t1.name) || 'FC Orły Poznań';

        const t2 = (fin && fin.t2 && fin.t2.name) || 'United Luboń';

        html += '<div class="demo-final-live-card" role="status">' +

            '<div class="demo-final-live-title-row">' +

            '<span class="demo-phase-final-pulse" aria-hidden="true"></span>' +

            '<span class="demo-phase-final-label">WIELKI FINAŁ</span>' +

            '</div>' +

            '<div class="demo-final-live-matchup">' +

            '<span class="demo-final-live-team">' + t1 + '</span>' +

            '<span class="demo-final-live-vs">vs</span>' +

            '<span class="demo-final-live-team">' + t2 + '</span>' +

            '</div>' +

            '</div>';

        html += '<div id="demo-organizer-embed-host" class="demo-embed-app"></div>';

        html += '<p class="demo-micro" style="margin-top:18px;">Na żywo — harmonogram i tabele obok siebie (desktop organizatora):</p>';

        html += '<div id="demo-live-embed-host" class="demo-embed-app"></div>';

        html += '<p class="demo-micro" style="margin-top:14px;">Tryb Hala — duży ekran / projektor na obiekcie:</p>';

        html += '<div id="demo-hall-embed-host" class="demo-hall-embed-host"></div>';

        return html;

    }



    function renderFanBody() {

        const tabsHtml = FAN_TABS.map(function (t) {

            const active = t.id === demoFanTab ? ' active' : '';

            return '<button type="button" class="demo-fan-tab' + active + '" data-demo-fan-tab="' + t.id + '">' + t.label + '</button>';

        }).join('');

        return '<div class="demo-fan-tabs">' + tabsHtml + '</div>' +

            '<div id="demo-fan-embed-host" class="demo-embed-app"></div>';

    }



    function renderFinalBody() {

        const fin = getFinalMatch();

        if (!fin) return '<p class="demo-micro">Brak meczu finałowego w scenariuszu.</p>';

        return '<div class="demo-final-card">' +

            '<div class="demo-final-teams">' +

            '<div class="demo-final-team">' + fin.t1.name + '</div>' +

            '<div class="demo-final-inputs">' +

            '<input type="number" id="demo-final-g1" min="0" max="20" inputmode="numeric" placeholder="0" aria-label="Gole ' + fin.t1.name + '">' +

            '<span style="font-size:22px;font-weight:bold;">:</span>' +

            '<input type="number" id="demo-final-g2" min="0" max="20" inputmode="numeric" placeholder="0" aria-label="Gole ' + fin.t2.name + '">' +

            '</div>' +

            '<div class="demo-final-team">' + fin.t2.name + '</div>' +

            '</div>' +

            '<div id="demo-final-penalty-section" class="demo-final-penalty">' +

            '<div class="demo-final-penalty-title">🥅 Rozstrzygnięcie (Rzuty Karne)</div>' +

            '<span class="demo-final-penalty-hint">Finał zakończył się remisem. Wpisz <b>końcowy</b> wynik serii karnych — seria trwa do rozstrzygnięcia (np. 5:4, nie 4:4 ani 3:3).</span>' +

            '<div class="demo-final-inputs">' +

            '<input type="number" id="demo-final-pen1" min="0" max="20" inputmode="numeric" placeholder="0" aria-label="Karne ' + fin.t1.name + '">' +

            '<span style="font-size:22px;font-weight:bold;">:</span>' +

            '<input type="number" id="demo-final-pen2" min="0" max="20" inputmode="numeric" placeholder="0" aria-label="Karne ' + fin.t2.name + '">' +

            '</div>' +

            '</div>' +

            '<p class="demo-validation" id="demo-final-validation">Wpisz wynik finału, aby zamknąć turniej.</p>' +

            '</div>';

    }



    function renderPodiumBody() {

        return '<div class="demo-callout">✓ Podium i statystyki wyliczone automatycznie po zapisie finału</div>' +

            '<div id="demo-podium-embed-host" class="demo-embed-app"></div>';

    }



    function getPodiumNames() {

        const fin = global.findGrandFinalMatch ? global.findGrandFinalMatch() : getFinalMatch();

        const m3 = (demoScenarioState && demoScenarioState.playoffs || []).find(function (m) { return m.n.indexOf('3. MIEJSCE') !== -1; });

        const getW = function (m) { return m.g1 > m.g2 ? m.t1 : (m.g1 < m.g2 ? m.t2 : (m.pen1 > m.pen2 ? m.t1 : m.t2)); };

        const getL = function (m) { return m.g1 > m.g2 ? m.t2 : (m.g1 < m.g2 ? m.t1 : (m.pen1 > m.pen2 ? m.t2 : m.t1)); };

        if (!fin || !isMatchDecided(fin)) return { first: '—', second: '—', third: '—' };

        return {

            first: getW(fin).name,

            second: getL(fin).name,

            third: m3 && m3.played ? getW(m3).name : '—'

        };

    }



    function getAwardsSummary() {

        applyStateToApp();

        if (!global.calcStats) return { scorer: '—', goalkeeper: '—' };

        const s = global.calcStats();

        const scorerLabel = s.scorer
            ? (s.scorer[0].split(' (')[0] + ' — ' + (typeof global.formatPolishGoals === 'function'
                ? global.formatPolishGoals(s.scorer[1])
                : (s.scorer[1] + ' bramek')))
            : '—';

        const gkLabel = s.gk ? (s.gk.n + ' (' + s.gk.t + ') — ' + (s.gk.ck > 0 ? s.gk.ck + ' czyste konta' : s.gk.lost + ' straconych')) : '—';

        return { scorer: scorerLabel, goalkeeper: gkLabel };

    }



    function renderConversionScreen() {

        const copy = SCREEN_COPY.conversion;

        const bullets = (copy.bullets || []).map(function (b) { return '<li>' + b + '</li>'; }).join('');

        return '<div class="demo-screen-inner demo-conversion">' +

            '<h1 class="demo-h1">' + copy.h1 + '</h1>' +

            '<p class="demo-sub">' + copy.sub + '</p>' +

            '<ul class="demo-conversion-bullets">' + bullets + '</ul>' +

            '<div class="demo-cta-zone">' +

            '<div class="demo-landing-cta-wrap">' +

            '<p class="demo-landing-cta-label">' + copy.ctaLandingSub + '</p>' +

            '<a href="' + LANDING_URL + '" class="demo-btn-landing" data-demo-action="landing" data-cta-id="CTA-LANDING" target="_blank" rel="noopener noreferrer">' + copy.ctaLanding + '</a>' +

            '</div>' +

            '<button type="button" class="demo-btn-primary" data-demo-action="license-cta" data-cta-id="CTA-08">' + copy.ctaPrimary + '</button>' +

            '<a href="' + buildSalesMailto('Zamówienie klucza na weekend — Turniejomat') + '" class="demo-btn-secondary" data-demo-action="mailto" data-cta-id="CTA-09">' + copy.ctaSecondary + '</a>' +

            '<a href="' + buildSalesMailto('Prośba o ofertę — Turniejomat') + '" class="demo-btn-link" data-demo-action="mailto" data-cta-id="CTA-10">' + copy.ctaTertiary + '</a>' +

            '<p class="demo-micro">' + copy.microPackages + '</p>' +

            '<p class="demo-micro">' + copy.microNext + '</p>' +

            '<button type="button" class="demo-btn-secondary demo-btn-outline" data-demo-action="next">' + copy.ctaNext + '</button>' +

            '</div></div>';

    }



    function renderArchiveScreen() {

        const copy = SCREEN_COPY.archive;

        const arch = (demoScenarioState && demoScenarioState._demoStory && demoScenarioState._demoStory.bundle && demoScenarioState._demoStory.bundle.archive) || {};

        const archData = arch.archive || arch;

        const fin = getFinalMatch();

        const podium = getPodiumNames();

        const awards = getAwardsSummary();

        const cardTitle = archData.card && archData.card.title || archData.title || 'Memoriał Wiosenny 2026';

        const cardMeta = archData.card && archData.card.metaLine || (archData.meta && archData.meta.teamsCount + ' drużyn · ' + archData.meta.matchesTotal + ' meczów · Zakończono dziś');

        const finalLabel = fin && fin.played ? (fin.t1.name + ' ' + fin.g1 + ' : ' + fin.g2 + ' ' + fin.t2.name) : '—';

        const docCallout = (archData.documents && archData.documents[0] && archData.documents[0].callout) || 'Raport turnieju dostępny w archiwum';

        return '<div class="demo-screen-inner demo-archive">' +

            '<h1 class="demo-h1">' + copy.h1 + '</h1>' +

            '<p class="demo-sub">' + copy.sub + '</p>' +

            '<div class="demo-archive-card">' +

            '<div class="demo-archive-card-title">📁 ' + cardTitle + '</div>' +

            '<div class="demo-archive-card-meta">' + cardMeta + '</div>' +

            '<div class="demo-archive-final">🏆 Finał: ' + finalLabel + '</div>' +

            '<div class="demo-archive-podium">' +

            '🥇 ' + podium.first + '<br>🥈 ' + podium.second + '<br>🥉 ' + podium.third +

            '</div>' +

            '<div class="demo-archive-awards">' +

            '<span>⚽ ' + awards.scorer + '</span>' +

            '<span>🧤 ' + awards.goalkeeper + '</span>' +

            '</div>' +

            '</div>' +

            '<div class="demo-callout">' + docCallout + '</div>' +

            '<div class="demo-cta-zone">' +

            '<button type="button" class="demo-btn-primary demo-btn-sm" data-demo-action="license-cta" data-cta-id="CTA-08">' + copy.cta + '</button>' +

            '</div></div>';

    }



    function mountFanEmbed(hostEl) {

        teardownActiveEmbed();

        ensureRenderBridge();

        applyStateToApp();

        if (global.resetDemoMatchFilters) global.resetDemoMatchFilters();

        global._demoStoryFanEmbed = true;

        activeEmbedKind = 'fan';

        mountNodes(EMBED_NODES.fan, hostEl);

        renderFanTabContent(demoFanTab);

        track('demo_story_fan_view_viewed', { default_tab: demoFanTab });

    }



    function resetHallViewCache() {

        window._hallHeaderSig = '';

        window._hallLiveRenderSig = '';

        window._hallPlayedSig = '';

        window._hallTablesHtml = '';

        window._hallRulesHtml = '';

        window._hallLiveScoreKey = '';

        window._hallDemoListsSig = '';

    }



    let hallDemoClockTimer = null;



    function getUrlDemoStep() {

        const params = new URLSearchParams(global.location.search);

        const raw = (params.get('step') || params.get('demoStep') || '').trim().toLowerCase();

        if (!raw) return null;

        if (raw === 'fan' || raw === 'kibic') return 2;

        const n = parseInt(raw, 10);

        if (isNaN(n) || n < 1 || n > 7) return null;

        return n;

    }



    function buildDemoFanDeepLink() {

        const u = new URL(global.location.href);

        u.hash = '';

        Array.from(u.searchParams.keys()).forEach(function (k) { u.searchParams.delete(k); });

        if (global.location.hostname === 'demo.turniejomat.pl') {

            u.searchParams.set('step', '2');

        } else {

            u.searchParams.set('id', 'DEMO-2026');

            u.searchParams.set('step', '2');

        }

        return u.toString();

    }



    function formatHallDemoClock(d) {

        const hh = String(d.getHours()).padStart(2, '0');

        const mm = String(d.getMinutes()).padStart(2, '0');

        return hh + ':' + mm;

    }



    function stopHallDemoClock() {

        if (hallDemoClockTimer) {

            clearInterval(hallDemoClockTimer);

            hallDemoClockTimer = null;

        }

    }



    function startHallDemoClock() {

        const el = document.getElementById('hall-demo-clock');

        if (!el) return;

        stopHallDemoClock();

        const tick = function () {

            el.textContent = formatHallDemoClock(new Date());

        };

        tick();

        hallDemoClockTimer = setInterval(tick, 1000);

    }



    function teardownHallDemoSixteen() {

        stopHallDemoClock();

        if (typeof global.stopHallSixteenClock === 'function') global.stopHallSixteenClock();

        const grid = document.getElementById('hall-grid');

        if (grid) grid.classList.remove('hall-grid--sixteen');

        const qrCell = document.getElementById('hall-demo-qr-cell');

        const clockCell = document.getElementById('hall-demo-clock-cell');

        const nextPanel = document.getElementById('hall-demo-next-panel');

        const donePanel = document.getElementById('hall-demo-done-panel');

        if (qrCell) qrCell.setAttribute('aria-hidden', 'true');

        if (clockCell) clockCell.setAttribute('aria-hidden', 'true');

        if (nextPanel) nextPanel.setAttribute('aria-hidden', 'true');

        if (donePanel) donePanel.setAttribute('aria-hidden', 'true');

        const qr = document.getElementById('hall-demo-qr');

        if (qr) qr.innerHTML = '';

        const nextList = document.getElementById('hall-demo-next-list');

        const doneList = document.getElementById('hall-demo-done-list');

        if (nextList) nextList.innerHTML = '';

        if (doneList) doneList.innerHTML = '';

        global._hallDemoListsSig = '';

    }



    function setupHallDemoSixteen() {

        if (typeof global.setupHallSixteenLayout === 'function') {

            global.setupHallSixteenLayout({ qrUrl: buildDemoFanDeepLink() });

            return;

        }

        const grid = document.getElementById('hall-grid');

        if (!grid) return;

        grid.classList.add('hall-grid--sixteen');

        const qrCell = document.getElementById('hall-demo-qr-cell');

        const clockCell = document.getElementById('hall-demo-clock-cell');

        const nextPanel = document.getElementById('hall-demo-next-panel');

        const donePanel = document.getElementById('hall-demo-done-panel');

        if (qrCell) qrCell.setAttribute('aria-hidden', 'false');

        if (clockCell) clockCell.setAttribute('aria-hidden', 'false');

        if (nextPanel) nextPanel.setAttribute('aria-hidden', 'false');

        if (donePanel) donePanel.setAttribute('aria-hidden', 'false');

        const fanUrl = buildDemoFanDeepLink();

        if (typeof global.renderShareQr === 'function') {

            global.renderShareQr('hall-demo-qr', fanUrl);

        } else {

            const qr = document.getElementById('hall-demo-qr');

            if (qr) {

                qr.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +

                    encodeURIComponent(fanUrl) + '" alt="QR kibic" style="display:inline-block;">';

            }

        }

        startHallDemoClock();

        if (typeof global.renderHallDemoSixteenLists === 'function') {

            global._hallDemoListsSig = '';

            global.renderHallDemoSixteenLists();

        }

    }



    function renderDemoHallEmbed() {

        if (typeof global.syncDemoStoryState === 'function') global.syncDemoStoryState();

        resetHallViewCache();

        if (global.renderHallView) global.renderHallView();

        setupHallDemoSixteen();

        const body = document.getElementById('hall-live-body');

        if (body && /Oczekiwanie na terminarz|Brak zaplanowanych meczów/.test(body.textContent || '')) {

            if (typeof global.syncDemoStoryState === 'function') global.syncDemoStoryState();

            resetHallViewCache();

            if (global.renderHallView) global.renderHallView();

            setupHallDemoSixteen();

        }

    }



    function mountOrganizerEmbed(hostEl) {

        teardownActiveEmbed();

        ensureRenderBridge();

        applyStateToApp();

        if (typeof global.syncDemoStoryState === 'function') global.syncDemoStoryState();

        global._demoStoryOrganizerEmbed = true;

        activeEmbedKind = 'organizer';

        mountNodes(EMBED_NODES.organizer, hostEl);

        const liveHost = document.getElementById('demo-live-embed-host');

        if (liveHost) {

            mountNodes(EMBED_NODES.live, liveHost);

            const nazywo = document.getElementById('nazywo');

            if (nazywo) nazywo.classList.add('active');

            if (global.renderFilterBar) global.renderFilterBar();

            if (global.filterAndRenderMatches) global.filterAndRenderMatches();

            if (global.calcTables) global.calcTables();

        }

        const hallHost = document.getElementById('demo-hall-embed-host');

        if (hallHost) {

            mountNodes(EMBED_NODES.hall, hallHost);

            renderDemoHallEmbed();

            if (typeof global.requestAnimationFrame === 'function') {

                global.requestAnimationFrame(function () {

                    if (global._demoStoryOrganizerEmbed) renderDemoHallEmbed();

                });

            }

        }

        if (global.renderDashboard) global.renderDashboard();

        const hm = demoScenarioState && demoScenarioState._demoStory && demoScenarioState._demoStory.heroMetrics;

        track('demo_story_organizer_view_viewed', {

            matches_played: hm ? hm.matchesPlayed : 31,

            matches_total: hm ? hm.matchesTotal : 32

        });

    }



    function mountPodiumEmbed(hostEl) {

        teardownActiveEmbed();

        applyStateToApp();

        global._demoStoryPodiumEmbed = true;

        activeEmbedKind = 'podium';

        mountNodes(EMBED_NODES.podium, hostEl);

        if (global.renderPodium) global.renderPodium();

        demoPodiumViewedAt = Date.now();

        const fin = global.findGrandFinalMatch ? global.findGrandFinalMatch() : getFinalMatch();

        const s = global.calcStats ? global.calcStats() : {};

        const getW = function (m) {

            return m.g1 > m.g2 ? m.t1 : (m.g1 < m.g2 ? m.t2 : (m.pen1 > m.pen2 ? m.t1 : m.t2));

        };

        const getL = function (m) {

            return m.g1 > m.g2 ? m.t2 : (m.g1 < m.g2 ? m.t1 : (m.pen1 > m.pen2 ? m.t2 : m.t1));

        };

        const m3 = (demoScenarioState.playoffs || []).find(function (m) { return m.n.indexOf('3. MIEJSCE') !== -1; });

        let p1 = '—', p2 = '—', p3 = '—';

        if (fin && isMatchDecided(fin)) {

            p1 = getW(fin).name;

            p2 = getL(fin).name;

            p3 = m3 && m3.played ? getW(m3).name : '—';

        }

        track('demo_story_podium_viewed', {

            time_from_start: Date.now(),

            winner: p1,

            podium_1: p1,

            podium_2: p2,

            podium_3: p3,

            top_scorer: s.scorer ? s.scorer[0] : null,

            top_gk: s.gk ? s.gk.n : null

        });

    }



    function renderCurrentStep() {

        ensureRenderBridge();

        const stepDef = getStepDef(demoStoryStep);

        const copy = SCREEN_COPY[stepDef.key] || {};



        teardownActiveEmbed();



        document.querySelectorAll('#view-demo-story .demo-screen').forEach(function (screen) {

            const step = parseInt(screen.getAttribute('data-step'), 10);

            screen.classList.toggle('active', step === demoStoryStep);

            if (step !== demoStoryStep) return;



            let html = '';

            if (stepDef.key === 'hook') {

                html = renderStaticScreen(stepDef, copy, renderHookBody());

            } else if (stepDef.key === 'fan') {

                html = renderStaticScreen(stepDef, copy, renderFanBody());

            } else if (stepDef.key === 'organizer') {

                html = renderStaticScreen(stepDef, copy, renderOrganizerBody());

            } else if (stepDef.key === 'final') {

                html = renderStaticScreen(stepDef, copy, renderFinalBody());

                track('demo_story_final_form_opened', {});

            } else if (stepDef.key === 'podium') {

                html = renderStaticScreen(stepDef, copy, renderPodiumBody());

            } else if (stepDef.key === 'conversion') {

                html = renderConversionScreen();

            } else if (stepDef.key === 'archive') {

                html = renderArchiveScreen();

            } else {

                html = renderStaticScreen(stepDef, copy, '');

            }

            screen.innerHTML = html;



            if (stepDef.key === 'fan') {

                const host = screen.querySelector('#demo-fan-embed-host');

                if (host) mountFanEmbed(host);

            } else if (stepDef.key === 'organizer') {

                const host = screen.querySelector('#demo-organizer-embed-host');

                if (host) mountOrganizerEmbed(host);

            } else if (stepDef.key === 'podium') {

                const host = screen.querySelector('#demo-podium-embed-host');

                if (host) mountPodiumEmbed(host);

            } else if (stepDef.key === 'final') {

                const g1 = screen.querySelector('#demo-final-g1');

                if (g1) setTimeout(function () { g1.focus(); checkDemoFinalPenaltyVisibility(); }, 50);

            } else if (stepDef.key === 'conversion') {

                track('demo_story_conversion_viewed', { time_from_podium: demoPodiumViewedAt ? Date.now() - demoPodiumViewedAt : null });

            } else if (stepDef.key === 'archive') {

                track('demo_story_archive_viewed', {});

                DemoStoryController.complete();

            }

        });



        updateChrome(stepDef);

        track('demo_story_step_viewed', { step_id: demoStoryStep, step_name: stepDef.key });

        saveDemoStorySession();

    }



    function applyStateToApp() {

        if (!demoScenarioState) return;

        if (typeof global.applyDemoScenarioState === 'function') {

            global.applyDemoScenarioState(demoScenarioState);

        }

    }



    function isMatchDecided(m) {

        if (!m || !m.played) return false;

        if (m.g1 !== m.g2) return true;

        const p1 = m.pen1;

        const p2 = m.pen2;

        return p1 != null && p2 != null && !isNaN(p1) && !isNaN(p2) && p1 !== p2;

    }



    function checkDemoFinalPenaltyVisibility() {

        const g1El = document.getElementById('demo-final-g1');

        const g2El = document.getElementById('demo-final-g2');

        const sec = document.getElementById('demo-final-penalty-section');

        if (!g1El || !g2El || !sec) return;

        const g1Raw = g1El.value.trim();

        const g2Raw = g2El.value.trim();

        const g1 = parseInt(g1Raw, 10);

        const g2 = parseInt(g2Raw, 10);

        const isDraw = g1Raw !== '' && g2Raw !== '' && !isNaN(g1) && !isNaN(g2) && g1 === g2;

        sec.style.display = isDraw ? 'block' : 'none';

        if (!isDraw) {

            const p1El = document.getElementById('demo-final-pen1');

            const p2El = document.getElementById('demo-final-pen2');

            if (p1El) p1El.value = '';

            if (p2El) p2El.value = '';

        }

    }



    function validateFinalScore(g1Raw, g2Raw, pen1Raw, pen2Raw) {

        if (g1Raw === '' || g2Raw === '') {

            return { ok: false, error_type: 'empty', message: 'Wpisz wynik finału, aby zamknąć turniej.' };

        }

        const g1 = parseInt(g1Raw, 10);

        const g2 = parseInt(g2Raw, 10);

        if (isNaN(g1) || isNaN(g2) || g1 < 0 || g2 < 0) {

            return { ok: false, error_type: 'invalid', message: 'Wpisz poprawne liczby całkowite (0 lub więcej).' };

        }

        if (g1 > 20 || g2 > 20) {

            return { ok: false, error_type: 'max', message: 'W demo maksymalnie 20 bramek na drużynę.' };

        }

        if (g1 === g2) {

            if (pen1Raw === '' || pen2Raw === '') {

                return { ok: false, error_type: 'draw_penalties', message: 'Remis w finale wymaga rzutów karnych. Wpisz wynik serii karnych poniżej.' };

            }

            const pen1 = parseInt(pen1Raw, 10);

            const pen2 = parseInt(pen2Raw, 10);

            if (isNaN(pen1) || isNaN(pen2) || pen1 < 0 || pen2 < 0) {

                return { ok: false, error_type: 'penalties_invalid', message: 'Wpisz poprawne liczby całkowite w polach rzutów karnych.' };

            }

            if (pen1 > 20 || pen2 > 20) {

                return { ok: false, error_type: 'penalties_max', message: 'W demo maksymalnie 20 trafień w serii karnych na drużynę.' };

            }

            if (pen1 === pen2) {

                return { ok: false, error_type: 'penalties_tie', message: 'Seria karnych musi mieć zwycięzcę — wpisz końcowy wynik z przewagą jednej drużyny (np. 5:4, nie 4:4 ani 3:3).' };

            }

            return { ok: true, g1: g1, g2: g2, pen1: pen1, pen2: pen2 };

        }

        return { ok: true, g1: g1, g2: g2, pen1: null, pen2: null };

    }



    function showFinalValidation(msg, show) {

        const el = document.getElementById('demo-final-validation');

        if (!el) return;

        el.textContent = msg;

        el.style.display = show ? 'block' : 'none';

    }



    const DemoStoryController = {

        isActive: function () { return isDemoStoryMode; },

        getStep: function () { return demoStoryStep; },

        getState: function () { return demoScenarioState; },

        getSessionId: function () { return demoSessionId; },

        getEvents: function () { return demoStoryEvents.slice(); },



        tryRestoreSession: function () {

            return tryRestoreDemoStorySession();

        },



        start: function (entryPoint) {

            const bundle = global.DEMO_SCENARIO_BUNDLE;

            if (!bundle) {

                console.error('Brak DEMO_SCENARIO_BUNDLE — załaduj demo-story-scenario.bundle.js');

                return false;

            }

            isDemoStoryMode = true;

            demoStoryCompleted = false;

            demoSessionId = newSessionId();

            demoStoryEvents = [];

            demoFanTab = 'mecze';

            demoPodiumViewedAt = null;

            demoStoryStartAt = Date.now();

            demoScenarioState = loadScenarioToState(bundle);

            applyStateToApp();

            ensureRenderBridge();

            demoStoryStep = 1;

            showViewDemoStory();

            renderCurrentStep();

            saveDemoStorySession();

            track('demo_story_started', { entry_point: entryPoint || 'login' });

            track('demo_story_hook_viewed', { teams_count: 16, matches_total: 32, matches_played: 31 });

            return true;

        },



        goTo: function (step) {

            if (!isDemoStoryMode) return false;

            if (step < 0 || step > 7) return false;

            if (step >= 5 && !this.isFinalSaved()) {

                console.warn('DemoStory: nie można przejść do kroku ' + step + ' bez zapisu finału');

                return false;

            }

            demoStoryStep = step;

            renderCurrentStep();

            return true;

        },



        next: function () {

            if (!isDemoStoryMode) return;

            if (demoStoryStep >= 7) {

                this.complete();

                return;

            }

            if (demoStoryStep === 4) return;

            this.goTo(demoStoryStep + 1);

        },



        isFinalSaved: function () {

            if (!demoScenarioState) return false;

            const fin = getFinalMatch();

            return fin && isMatchDecided(fin);

        },



        saveFinalScore: function (g1, g2, pen1, pen2) {

            if (!demoScenarioState) return false;

            const fin = getFinalMatch();

            if (!fin) return false;

            fin.g1 = g1;

            fin.g2 = g2;

            if (g1 === g2) {

                fin.pen1 = pen1;

                fin.pen2 = pen2;

            } else {

                fin.pen1 = null;

                fin.pen2 = null;

            }

            fin.played = true;

            if (demoScenarioState._demoStory && demoScenarioState._demoStory.status) {

                demoScenarioState._demoStory.status.label = '32 / 32';

            }

            if (demoScenarioState.logs) {

                const penNote = g1 === g2 ? ' (k. ' + pen1 + ':' + pen2 + ')' : '';

                demoScenarioState.logs.push('[19:45:00] WIELKI FINAŁ rozstrzygnięty: ' + fin.t1.name + ' ' + g1 + ':' + g2 + penNote + ' ' + fin.t2.name);

            }

            applyStateToApp();

            track('demo_story_final_score_saved', {

                score_home: g1,

                score_away: g2,

                penalties_home: g1 === g2 ? pen1 : null,

                penalties_away: g1 === g2 ? pen2 : null

            });

            demoStoryStep = 5;

            renderCurrentStep();

            return true;

        },



        exitToLicense: function (opts) {

            opts = opts || {};

            const ctaId = opts.cta_id || 'CTA-02';

            const sourceStep = opts.source_step != null ? opts.source_step : demoStoryStep;

            track('demo_story_license_redirect', { source_step: sourceStep, cta_id: ctaId });

            if (opts.cta_id) {

                track('demo_story_cta_clicked', { cta_id: ctaId, step_id: sourceStep, cta_copy: opts.cta_copy || '' });

            }

            teardownActiveEmbed();

            isDemoStoryMode = false;

            demoStoryStep = 0;

            clearDemoStorySession();

            try { global.sessionStorage.setItem('tp_demo_source', 'demo_story'); } catch (e) { /* ignore */ }

            if (global.location.hostname === 'demo.turniejomat.pl') {
                global.location.href = APP_URL;
                return;
            }

            showViewLogin();

            const input = document.getElementById('license-input');

            if (input) input.focus();

        },



        complete: function () {

            if (demoStoryCompleted) return;

            demoStoryCompleted = true;

            track('demo_story_completed', {

                total_duration: demoStoryStartAt ? Date.now() - demoStoryStartAt : null,

                final_score_saved: this.isFinalSaved()

            });

        },



        showEntry: function () {

            const urlStep = getUrlDemoStep();

            if (urlStep != null) {

                if (!this.start('deep_link')) return;

                if (urlStep >= 5 && !this.isFinalSaved()) {

                    this.goTo(1);

                    return;

                }

                this.goTo(urlStep);

                return;

            }

            clearDemoStorySession();

            isDemoStoryMode = false;

            demoStoryStep = 0;

            teardownActiveEmbed();

            showViewDemoStory();

            const stepDef = getStepDef(0);

            document.querySelectorAll('#view-demo-story .demo-screen').forEach(function (screen) {

                const step = parseInt(screen.getAttribute('data-step'), 10);

                screen.classList.toggle('active', step === 0);

                if (step === 0) {

                    screen.innerHTML = renderStaticScreen(stepDef, SCREEN_COPY.entry, '');

                }

            });

            updateChrome(stepDef);

        }

    };



    function handleSaveFinal() {

        const g1El = document.getElementById('demo-final-g1');

        const g2El = document.getElementById('demo-final-g2');

        const pen1El = document.getElementById('demo-final-pen1');

        const pen2El = document.getElementById('demo-final-pen2');

        if (!g1El || !g2El) return;

        checkDemoFinalPenaltyVisibility();

        const result = validateFinalScore(

            g1El.value.trim(),

            g2El.value.trim(),

            pen1El ? pen1El.value.trim() : '',

            pen2El ? pen2El.value.trim() : ''

        );

        if (!result.ok) {

            showFinalValidation(result.message, true);

            track('demo_story_final_validation_error', { error_type: result.error_type });

            return;

        }

        showFinalValidation('', false);

        const btn = document.querySelector('[data-demo-action="save-final"]');

        if (btn) {

            btn.disabled = true;

            btn.textContent = 'Zapisuję wynik finału…';

        }

        setTimeout(function () {

            DemoStoryController.saveFinalScore(result.g1, result.g2, result.pen1, result.pen2);

        }, 400);

    }



    function initDemoStoryUI() {

        const root = document.getElementById('view-demo-story');

        if (!root) return;



        root.addEventListener('click', function (e) {

            const fanTab = e.target.closest('[data-demo-fan-tab]');

            if (fanTab) {

                renderFanTabContent(fanTab.getAttribute('data-demo-fan-tab'));

                root.querySelectorAll('.demo-fan-tab').forEach(function (btn) {

                    btn.classList.toggle('active', btn === fanTab);

                });

                return;

            }



            const btn = e.target.closest('[data-demo-action]');

            if (!btn) return;

            const action = btn.getAttribute('data-demo-action');

            if (action === 'mailto' || action === 'landing') {

                track('demo_story_cta_clicked', {

                    cta_id: btn.getAttribute('data-cta-id') || (action === 'landing' ? 'CTA-LANDING' : 'CTA-MAIL'),

                    step_id: demoStoryStep,

                    cta_copy: btn.textContent.trim()

                });

                return;

            }

            if (action === 'next') {

                if (demoStoryStep === 0) DemoStoryController.start('entry');

                else {

                    if (demoStoryStep === 5) {

                        track('demo_story_cta_clicked', { cta_id: 'CTA-07', step_id: 5, cta_copy: SCREEN_COPY.podium.cta });

                    }

                    DemoStoryController.next();

                }

            } else if (action === 'license') {

                DemoStoryController.exitToLicense({ cta_id: 'CTA-02', source_step: demoStoryStep });

            } else if (action === 'license-cta') {

                DemoStoryController.exitToLicense({

                    cta_id: btn.getAttribute('data-cta-id') || 'CTA-08',

                    source_step: demoStoryStep,

                    cta_copy: btn.textContent.trim()

                });

            } else if (action === 'save-final') {

                handleSaveFinal();

            }

        });



        root.addEventListener('input', function (e) {

            const t = e.target;

            if (!t) return;

            if (t.id === 'demo-final-g1' || t.id === 'demo-final-g2' || t.id === 'demo-final-pen1' || t.id === 'demo-final-pen2') {

                checkDemoFinalPenaltyVisibility();

                showFinalValidation('', false);

            }

        });



        root.addEventListener('keydown', function (e) {

            if (e.key === 'Enter' && demoStoryStep === 4) {

                const t = e.target;

                if (t && (t.id === 'demo-final-g1' || t.id === 'demo-final-g2' || t.id === 'demo-final-pen1' || t.id === 'demo-final-pen2')) {

                    e.preventDefault();

                    handleSaveFinal();

                }

            }

        });



        global.addEventListener('beforeunload', function () {

            if (isDemoStoryMode && demoStoryStep > 0 && demoStoryStep < 5 && !DemoStoryController.isFinalSaved()) {

                track('demo_story_abandoned', {

                    last_step: demoStoryStep,

                    duration: demoStoryStartAt ? Date.now() - demoStoryStartAt : null

                });

            }

        });

    }



    global.DemoStoryLoader = { loadScenarioToState: loadScenarioToState };

    global.DemoStoryController = DemoStoryController;



    Object.defineProperty(global, 'isDemoStoryMode', {

        get: function () { return isDemoStoryMode; },

        configurable: true

    });



    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', initDemoStoryUI);

    } else {

        initDemoStoryUI();

    }

})(typeof window !== 'undefined' ? window : this);


