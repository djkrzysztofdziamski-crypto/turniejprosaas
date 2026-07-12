#!/usr/bin/env python3
"""Scenariusz demo: faza grupowa = pojedyncza runda (bez rewanżów)."""
import json
import os
import re
from copy import deepcopy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENARIO = os.path.join(ROOT, 'demo-story-scenario')


def load(name):
    with open(os.path.join(SCENARIO, name), encoding='utf-8') as f:
        return json.load(f)


def save(name, data):
    with open(os.path.join(SCENARIO, name), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def replace_match_ids(obj, id_map):
    if isinstance(obj, str):
        return id_map.get(obj, obj)
    if isinstance(obj, list):
        return [replace_match_ids(x, id_map) for x in obj]
    if isinstance(obj, dict):
        return {k: replace_match_ids(v, id_map) for k, v in obj.items()}
    return obj


def replace_counts(text, total, played):
    text = re.sub(r'\b56\b', str(total), text)
    text = re.sub(r'\b55\b', str(played), text)
    text = re.sub(r'\b48\b', '24', text)
    text = re.sub(r'\b12\b', '6', text)
    return text


def deep_replace_counts(obj, total, played):
    if isinstance(obj, str):
        return replace_counts(obj, total, played)
    if isinstance(obj, list):
        return [deep_replace_counts(x, total, played) for x in obj]
    if isinstance(obj, dict):
        return {k: deep_replace_counts(v, total, played) for k, v in obj.items()}
    return obj


def compute_standings(group_matches, groups_data, teams_by_id):
    standings = {}
    for g in groups_data['groups']:
        gn = g['id']
        team_ids = g['teamIds']
        stats = {
            tid: {
                'teamId': tid,
                'played': 0,
                'won': 0,
                'drawn': 0,
                'lost': 0,
                'goalsFor': 0,
                'goalsAgainst': 0,
                'points': 0,
            }
            for tid in team_ids
        }

        for m in group_matches:
            if m.get('group') != gn or m.get('status') != 'played':
                continue
            h, a = m['homeTeamId'], m['awayTeamId']
            hg, ag = m['homeScore'], m['awayScore']
            stats[h]['played'] += 1
            stats[a]['played'] += 1
            stats[h]['goalsFor'] += hg
            stats[h]['goalsAgainst'] += ag
            stats[a]['goalsFor'] += ag
            stats[a]['goalsAgainst'] += hg
            if hg > ag:
                stats[h]['won'] += 1
                stats[h]['points'] += 3
                stats[a]['lost'] += 1
            elif hg < ag:
                stats[a]['won'] += 1
                stats[a]['points'] += 3
                stats[h]['lost'] += 1
            else:
                stats[h]['drawn'] += 1
                stats[a]['drawn'] += 1
                stats[h]['points'] += 1
                stats[a]['points'] += 1

        table = []
        for tid in team_ids:
            s = stats[tid]
            table.append({
                'position': 0,
                'teamId': tid,
                'teamName': teams_by_id[tid]['name'],
                'played': s['played'],
                'won': s['won'],
                'drawn': s['drawn'],
                'lost': s['lost'],
                'goalsFor': s['goalsFor'],
                'goalsAgainst': s['goalsAgainst'],
                'goalDifference': s['goalsFor'] - s['goalsAgainst'],
                'points': s['points'],
                'qualified': None,
            })
        table.sort(key=lambda x: (-x['points'], -x['goalDifference'], -x['goalsFor']))
        for i, row in enumerate(table, 1):
            row['position'] = i
            if i <= 2:
                row['qualified'] = 'quarterfinal'
        standings[gn] = {
            'groupId': gn,
            'groupName': f'Grupa {gn}',
            'table': table,
        }
    return standings


def compute_player_stats(matches, players_data):
    kowalski_goals = 0
    kowalski_match_ids = []
    nowak_clean = 0
    nowak_match_ids = []

    for m in matches:
        if m.get('status') != 'played':
            continue
        mid = m['id']
        for s in m.get('scorers') or []:
            if s.get('playerId') == 'p001':
                goals = len(s.get('goals') or [])
                kowalski_goals += goals
                if goals:
                    kowalski_match_ids.append(mid)
        if m.get('cleanSheetGoalkeeperId') == 'p002':
            nowak_clean += 1
            nowak_match_ids.append(mid)

    p001 = next(p for p in players_data['players'] if p['id'] == 'p001')
    p002 = next(p for p in players_data['players'] if p['id'] == 'p002')
    team01 = p001['teamId']

    team_goals = {}
    team_against = {}
    for m in matches:
        if m.get('status') != 'played':
            continue
        for tid, gf, ga in (
            (m['homeTeamId'], m['homeScore'], m['awayScore']),
            (m['awayTeamId'], m['awayScore'], m['homeScore']),
        ):
            team_goals[tid] = team_goals.get(tid, 0) + gf
            team_against[tid] = team_against.get(tid, 0) + ga

    played_count = sum(1 for m in matches if m.get('status') == 'played')
    top_team = max(team_goals, key=team_goals.get)
    least_against_team = min(team_against, key=team_against.get)

    return {
        'computedAfterMatches': played_count,
        'topScorers': [{
            'rank': 1,
            'playerId': 'p001',
            'displayName': p001['displayName'],
            'fullName': f"{p001.get('firstName', '')} {p001.get('lastName', '')}".strip(),
            'teamId': team01,
            'teamName': 'FC Orły Poznań',
            'goals': kowalski_goals,
            'isTopScorer': True,
            'label': 'Król strzelców',
            'source': 'matches.json — jedyne indywidualnie śledzone bramki w scenariuszu demo',
        }],
        'goalkeepers': [{
            'rank': 1,
            'playerId': 'p002',
            'displayName': p002['displayName'],
            'fullName': f"{p002.get('firstName', '')} {p002.get('lastName', '')}".strip(),
            'teamId': team01,
            'teamName': 'FC Orły Poznań',
            'cleanSheets': nowak_clean,
            'matchesPlayed': nowak_clean,
            'isGoalkeeperOfTournament': True,
            'label': 'Bramkarz turnieju',
            'cleanSheetMatchIds': nowak_match_ids,
        }],
        'teamStats': {
            'mostGoalsScored': {
                'teamId': top_team,
                'teamName': 'FC Orły Poznań' if top_team == 't01' else top_team,
                'goals': team_goals[top_team],
                'note': 'Suma bramek drużyny we wszystkich rozegranych meczach (mecze grupowe + play-off)',
            },
            'leastGoalsConceded': {
                'teamId': least_against_team,
                'teamName': least_against_team,
                'goalsAgainst': team_against[least_against_team],
            },
        },
        'scorerTrackingPolicy': load('player-stats.json')['scorerTrackingPolicy'],
        'validation': {
            'kowalskiGoalsInMatches': kowalski_goals,
            'nowakCleanSheetsInMatches': nowak_clean,
            'kowalskiGoalMatchIds': kowalski_match_ids,
            'note': f'Statystyki wyliczone z matches.json (m001–m{played_count:03d}). Po zapisie finału silnik aplikacji przelicza ponownie.',
        },
    }


def main():
    matches_data = load('matches.json')
    all_matches = matches_data['matches']

    group_matches = [deepcopy(m) for m in all_matches if m.get('phase') == 'group' and m.get('leg') == 1]
    playoff_matches = [deepcopy(m) for m in all_matches if m.get('phase') != 'group']
    group_matches.sort(key=lambda m: (m['group'], m.get('round', 0)))
    playoff_matches.sort(key=lambda m: int(m['id'][1:]))

    new_matches = group_matches + playoff_matches
    id_map = {}
    for i, m in enumerate(new_matches, 1):
        old_id = m['id']
        new_id = f'm{i:03d}'
        id_map[old_id] = new_id
        m['id'] = new_id
        if m.get('phase') == 'group':
            m['leg'] = 1

    matches_data['matches'] = new_matches
    save('matches.json', matches_data)

    teams_data = load('teams.json')
    teams_by_id = {t['id']: t for t in teams_data['teams']}
    groups_data = load('groups.json')
    save('standings.json', {'standings': compute_standings(new_matches, groups_data, teams_by_id)})

    total = len(new_matches)
    played = sum(1 for m in new_matches if m.get('status') == 'played')
    final_id = id_map['m056']

    meta = load('tournament.meta.json')
    meta['format']['groupStage'] = 'single_round_robin'
    meta['format']['groupMatchesPerGroup'] = 6
    meta['format']['groupMatchesTotal'] = 24
    meta['scale']['matchesTotal'] = total
    meta['scale']['matchesPlayed'] = played
    meta['heroMetrics']['matchesTotal'] = total
    meta['heroMetrics']['matchesPlayed'] = played
    meta['status']['label'] = f'{played} / {total} meczów rozegranych'
    meta['finalMatchId'] = final_id
    save('tournament.meta.json', meta)

    for fname in ['playoff-bracket.json', 'archive.json', 'expected-podium.json']:
        data = load(fname)
        data = replace_match_ids(data, id_map)
        data = deep_replace_counts(data, total, played)
        if fname == 'expected-podium.json':
            data['expectedAfterSave']['individualAwards']['topScorer']['note'] = (
                f'{data["expectedAfterSave"]["individualAwards"]["topScorer"]["goals"]} bramek w {played} meczach przed finałem; '
                'bramki z finału przypisane opcjonalnie do Kowalskiego nie zmieniają rankingu w MVP'
            )
            for check in data.get('qaChecks', []):
                if check.get('id') == 'QA-6':
                    check['expected'] = total
                if check.get('id') == 'QA-3':
                    check['assertion'] = check['assertion'].replace('m055', id_map['m055'])
        if fname == 'archive.json':
            data['archive']['preFinalState']['matchesPlayed'] = played
        save(fname, data)

    players_data = load('players.json')
    stats = compute_player_stats(new_matches, players_data)
    teams_by_id = {t['id']: t for t in teams_data['teams']}
    stats['teamStats']['mostGoalsScored']['teamName'] = teams_by_id[stats['teamStats']['mostGoalsScored']['teamId']]['name']
    stats['teamStats']['leastGoalsConceded']['teamName'] = teams_by_id[stats['teamStats']['leastGoalsConceded']['teamId']]['name']
    save('player-stats.json', stats)

    print(f'OK: {len(group_matches)} meczów grupowych + {len(playoff_matches)} pucharowych = {total} total')
    print(f'ID map: m056 -> {final_id}')
    print(f'Played: {played}/{total}')


if __name__ == '__main__':
    main()
