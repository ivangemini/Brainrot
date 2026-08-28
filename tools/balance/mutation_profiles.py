#!/usr/bin/env python3
"""Compare Mutation v1 archetypes using the canonical economy model.

Mutation tuning is read from the runtime TypeScript content module so this
report cannot silently drift from the shipped modifier values.

Usage:
    python tools/balance/mutation_profiles.py
    python tools/balance/mutation_profiles.py --check
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

from clicker_model import DEFAULT_CONFIG, load_config, snapshot

ROOT = Path(__file__).resolve().parents[2]
MUTATION_SOURCE = ROOT / "src" / "content" / "mutation-content.ts"


@dataclass(frozen=True)
class MutationTuning:
    active_tap_multiplier: float = 1.0
    combo_cap_bonus: float = 0.0
    passive_multiplier: float = 1.0
    offline_efficiency_bonus: float = 0.0
    crit_chance_bonus: float = 0.0
    crit_hard_cap: float = 0.25
    crit_multiplier: float = 1.0
    event_reward_multiplier: float = 1.0


@dataclass(frozen=True)
class ProfileResult:
    active_income: float
    passive_income: float
    offline_index: float
    event_index: float


def read_runtime_constant(source: str, name: str) -> float:
    match = re.search(rf"export const {re.escape(name)} = ([0-9]+(?:\.[0-9]+)?);", source)
    if not match:
        raise RuntimeError(f"Missing numeric runtime mutation constant: {name}")
    return float(match.group(1))


def load_mutation_tuning() -> Dict[str, MutationTuning]:
    source = MUTATION_SOURCE.read_text(encoding="utf-8")
    base_crit_cap = read_runtime_constant(source, "BASE_CRIT_CHANCE_CAP")
    return {
        "muscle": MutationTuning(
            active_tap_multiplier=read_runtime_constant(source, "MUSCLE_ACTIVE_TAP_MULTIPLIER"),
            combo_cap_bonus=read_runtime_constant(source, "MUSCLE_COMBO_CAP_BONUS"),
            crit_hard_cap=base_crit_cap,
        ),
        "business": MutationTuning(
            passive_multiplier=read_runtime_constant(source, "BUSINESS_PASSIVE_MULTIPLIER"),
            offline_efficiency_bonus=read_runtime_constant(source, "BUSINESS_OFFLINE_EFFICIENCY_BONUS"),
            crit_hard_cap=base_crit_cap,
        ),
        "chaos": MutationTuning(
            crit_chance_bonus=read_runtime_constant(source, "CHAOS_CRIT_CHANCE_BONUS"),
            crit_hard_cap=read_runtime_constant(source, "MUTATION_CRIT_CHANCE_HARD_CAP"),
            crit_multiplier=read_runtime_constant(source, "CHAOS_CRIT_MULTIPLIER"),
            event_reward_multiplier=read_runtime_constant(source, "CHAOS_EVENT_REWARD_MULTIPLIER"),
        ),
    }


def mutated_snapshot(
    config: dict,
    levels: Dict[str, int],
    taps_per_second: float,
    combo_utilization: float,
    tuning: MutationTuning,
) -> tuple[float, float]:
    base = snapshot(config, levels, taps_per_second, combo_utilization)
    branches = config["branches"]

    wings = branches["wings"]
    normal_combo_cap_addition = min(
        float(wings["comboAdditionalCap"]),
        float(wings["comboCapPerLevel"]) * levels["wings"],
    )
    normal_combo = 1.0 + normal_combo_cap_addition * combo_utilization
    mutated_combo = normal_combo + tuning.combo_cap_bonus * combo_utilization
    combo_ratio = mutated_combo / normal_combo if normal_combo > 0 else 1.0

    swag = branches["swag"]
    normal_crit_chance = min(
        float(swag["critChanceCap"]),
        float(swag["baseCritChance"]) + float(swag["critChancePerLevel"]) * levels["swag"],
    )
    normal_crit_multiplier = float(swag["baseCritMultiplier"]) + (
        float(swag["critMultiplierPerLevel"]) * levels["swag"]
    )
    normal_expected_crit = 1.0 + normal_crit_chance * (normal_crit_multiplier - 1.0)

    mutated_crit_chance = min(tuning.crit_hard_cap, normal_crit_chance + tuning.crit_chance_bonus)
    mutated_crit_multiplier = normal_crit_multiplier * tuning.crit_multiplier
    mutated_expected_crit = 1.0 + mutated_crit_chance * (mutated_crit_multiplier - 1.0)
    crit_ratio = mutated_expected_crit / normal_expected_crit if normal_expected_crit > 0 else 1.0

    mutated_tap_value = (
        base.tap_value
        * tuning.active_tap_multiplier
        * combo_ratio
        * crit_ratio
    )
    mutated_passive = base.passive_per_second * tuning.passive_multiplier
    return mutated_tap_value, mutated_passive


def offline_efficiency(config: dict, levels: Dict[str, int], tuning: MutationTuning) -> float:
    offline = config["offline"]
    base = float(offline["baseEfficiency"]) + (
        float(offline["brainEfficiencyPerLevel"]) * levels["brain"]
    )
    hard_cap = float(offline["efficiencyCap"])
    return min(hard_cap, base + tuning.offline_efficiency_bonus)


def evaluate(config: dict, levels: Dict[str, int], tuning: MutationTuning) -> ProfileResult:
    active_tap, active_passive = mutated_snapshot(config, levels, 4.0, 0.85, tuning)
    active_income = 4.0 * active_tap + active_passive

    _, passive_income = mutated_snapshot(config, levels, 0.0, 0.0, tuning)
    offline_index = passive_income * offline_efficiency(config, levels, tuning)

    event_tap, event_passive = mutated_snapshot(config, levels, 2.0, 0.65, tuning)
    event_income = 2.0 * event_tap + event_passive
    event_index = event_income * tuning.event_reward_multiplier

    return ProfileResult(
        active_income=active_income,
        passive_income=passive_income,
        offline_index=offline_index,
        event_index=event_index,
    )


def winner(results: Dict[str, ProfileResult], field: str) -> str:
    return max(results, key=lambda mutation: getattr(results[mutation], field))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    config = load_config(args.config)
    mutations = load_mutation_tuning()
    # A deterministic Growth Stage 5 / Total Lv 150 comparison point.
    levels = {"beak": 30, "body": 30, "nest": 25, "wings": 25, "swag": 20, "brain": 20}
    if sum(levels.values()) != 150:
        raise RuntimeError("Mutation comparison fixture must remain at Total Lv 150")

    results = {name: evaluate(config, levels, tuning) for name, tuning in mutations.items()}

    print("Mutation v1 representative profile comparison @ Total Lv 150")
    print("mutation     active/sec   passive/sec   offline-index   event-index")
    for name in ("muscle", "business", "chaos"):
        result = results[name]
        print(
            f"{name:<11} {result.active_income:>10.2f} "
            f"{result.passive_income:>13.2f} {result.offline_index:>15.2f} "
            f"{result.event_index:>13.2f}"
        )

    winners = {
        "active": winner(results, "active_income"),
        "passive": winner(results, "passive_income"),
        "offline": winner(results, "offline_index"),
        "event": winner(results, "event_index"),
    }
    print("Winners:", ", ".join(f"{profile}={name}" for profile, name in winners.items()))

    if args.check:
        expected = {"active": "muscle", "passive": "business", "offline": "business", "event": "chaos"}
        mismatches = [
            f"{profile}: expected {expected_name}, got {winners[profile]}"
            for profile, expected_name in expected.items()
            if winners[profile] != expected_name
        ]
        if mismatches:
            raise SystemExit("Mutation profile identity regression:\n" + "\n".join(mismatches))


if __name__ == "__main__":
    main()
