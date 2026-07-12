#!/usr/bin/env python3
"""Regeneruje demo-story-scenario.bundle.js z plików JSON w demo-story-scenario/."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENARIO = os.path.join(ROOT, 'demo-story-scenario')
OUT = os.path.join(ROOT, 'demo-story-scenario.bundle.js')

FILES = {
    'meta': 'tournament.meta.json',
    'teams': 'teams.json',
    'groups': 'groups.json',
    'players': 'players.json',
    'matches': 'matches.json',
    'standings': 'standings.json',
    'playoffBracket': 'playoff-bracket.json',
    'playerStats': 'player-stats.json',
    'expectedPodium': 'expected-podium.json',
    'archive': 'archive.json',
}

bundle = {}
for key, fname in FILES.items():
    with open(os.path.join(SCENARIO, fname), encoding='utf-8') as f:
        bundle[key] = json.load(f)

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('window.DEMO_SCENARIO_BUNDLE = ')
    json.dump(bundle, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print('OK:', OUT, os.path.getsize(OUT), 'bytes')
