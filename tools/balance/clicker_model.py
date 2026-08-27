#!/usr/bin/env python3
"""Deterministic pre-production progression simulator for Pigeon Maxxing.

This is a design tool, not runtime gameplay code. It loads the canonical
pre-production tuning set and models an active player who repeatedly buys the
available upgrade with the shortest simple payback time.

Usage:
    python tools/balance/clicker_model.py
    python tools/balance/clicker_model.py --minutes 180 --taps 4
    python tools/balance/clicker_model.py --combo-utilization 0.85
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = ROOT / "design" / "balance" / "economy-v0.1.json"


@dataclass
class EconomySnapshot:
    tap_value: float
    passive_per_second: float
    total_per_second: float


@dataclass
class PurchaseEvent:
    seconds: float
    branch: str
    branch_level: int
    total_level: int
    cost: int
    income_per_second: float


def load_config(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def milestone_multiplier(level: int, milestones: dict) -> float:
    result = 1.0
    for threshold, factor in sorted(
        ((int(key), float(value)) for key, value in milestones.items()),
        key=lambda pair: pair[0],
    ):
        if level >= threshold:
            result *= factor
    return result


def next_cost(branch: dict, current_level: int) -> int:
    return math.ceil(float(branch["baseCost"]) * float(branch["costGrowth"]) ** current_level)


def snapshot(
    config: dict,
    levels: Dict[str, int],
    taps_per_second: float,
    combo_utilization: float,
) -> EconomySnapshot:
    branches = config["branches"]

    beak = branches["beak"]
    beak_level = levels["beak"]
    raw_tap = float(config["baseTap"]) + float(beak["perLevelRawTap"]) * beak_level
    beak_power = raw_tap * milestone_multiplier(beak_level, beak.get("milestones", {}))

    body = branches["body"]
    body_level = levels["body"]
    body_multiplier = (
        1.0 + float(body["perLevelGlobalMultiplier"]) * body_level
    ) * milestone_multiplier(body_level, body.get("milestones", {}))

    wings = branches["wings"]
    wings_level = levels["wings"]
    additional_combo_cap = min(
        float(wings["comboAdditionalCap"]),
        float(wings["comboCapPerLevel"]) * wings_level,
    )
    combo_multiplier = 1.0 + additional_combo_cap * combo_utilization

    swag = branches["swag"]
    swag_level = levels["swag"]
    crit_chance = min(
        float(swag["critChanceCap"]),
        float(swag["baseCritChance"]) + float(swag["critChancePerLevel"]) * swag_level,
    )
    crit_multiplier = float(swag["baseCritMultiplier"]) + float(
        swag["critMultiplierPerLevel"]
    ) * swag_level
    expected_crit_multiplier = 1.0 + crit_chance * (crit_multiplier - 1.0)

    tap_value = beak_power * body_multiplier * combo_multiplier * expected_crit_multiplier

    nest = branches["nest"]
    nest_level = levels["nest"]
    nest_rate = (
        float(nest["perLevelPassivePerSecond"])
        * nest_level
        * milestone_multiplier(nest_level, nest.get("milestones", {}))
        * body_multiplier
    )

    brain = branches["brain"]
    brain_level = levels["brain"]
    auto_taps_per_second = (
        float(brain["autoTapsPerSecondPerLevel"])
        * brain_level
        * milestone_multiplier(brain_level, brain.get("milestones", {}))
    )

    # Automation deliberately does not inherit active combo or per-tap crit rolls.
    automated_tap_value = beak_power * body_multiplier
    passive_per_second = nest_rate + auto_taps_per_second * automated_tap_value

    return EconomySnapshot(
        tap_value=tap_value,
        passive_per_second=passive_per_second,
        total_per_second=taps_per_second * tap_value + passive_per_second,
    )


def simulate(
    config: dict,
    duration_seconds: float,
    taps_per_second: float,
    combo_utilization: float,
) -> tuple[Dict[str, int], List[PurchaseEvent]]:
    levels = {branch_id: 0 for branch_id in config["branches"]}
    feathers = 0.0
    elapsed = 0.0
    events: List[PurchaseEvent] = []

    while elapsed < duration_seconds:
        total_level = sum(levels.values())
        current = snapshot(config, levels, taps_per_second, combo_utilization)
        if current.total_per_second <= 0:
            break

        candidates = []
        for branch_id, branch in config["branches"].items():
            if total_level < int(branch["unlockTotalLevel"]):
                continue

            cost = next_cost(branch, levels[branch_id])
            candidate_levels = dict(levels)
            candidate_levels[branch_id] += 1
            after = snapshot(config, candidate_levels, taps_per_second, combo_utilization)
            delta = after.total_per_second - current.total_per_second
            if delta <= 0:
                continue

            simple_payback_seconds = cost / delta
            candidates.append((simple_payback_seconds, cost, branch_id))

        if not candidates:
            break

        _, cost, branch_id = min(candidates)
        wait_seconds = max(0.0, (cost - feathers) / current.total_per_second)
        if elapsed + wait_seconds > duration_seconds:
            break

        feathers += wait_seconds * current.total_per_second
        elapsed += wait_seconds
        feathers -= cost
        levels[branch_id] += 1

        after_purchase = snapshot(config, levels, taps_per_second, combo_utilization)
        events.append(
            PurchaseEvent(
                seconds=elapsed,
                branch=branch_id,
                branch_level=levels[branch_id],
                total_level=sum(levels.values()),
                cost=cost,
                income_per_second=after_purchase.total_per_second,
            )
        )

    return levels, events


def first_event_at_or_above(events: List[PurchaseEvent], total_level: int) -> PurchaseEvent | None:
    return next((event for event in events if event.total_level >= total_level), None)


def format_time(seconds: float | None) -> str:
    if seconds is None:
        return "not reached"
    if seconds < 120:
        return f"{seconds:.1f}s"
    if seconds < 7200:
        return f"{seconds / 60:.1f}m"
    return f"{seconds / 3600:.2f}h"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--minutes", type=float, default=90.0)
    parser.add_argument("--taps", type=float, default=None)
    parser.add_argument("--combo-utilization", type=float, default=0.85)
    args = parser.parse_args()

    config = load_config(args.config)
    taps = args.taps if args.taps is not None else float(config["modelActiveTapsPerSecond"])
    combo_utilization = min(1.0, max(0.0, args.combo_utilization))

    levels, events = simulate(
        config,
        duration_seconds=args.minutes * 60.0,
        taps_per_second=taps,
        combo_utilization=combo_utilization,
    )

    print(f"Balance: {config['balanceVersion']}")
    print(f"Modeled duration: {args.minutes:.1f}m")
    print(f"Active taps/sec: {taps:.2f}")
    print(f"Combo utilization: {combo_utilization:.2f}")
    print(f"Purchases: {len(events)} | Total level: {sum(levels.values())}")
    print("Branch levels:")
    for branch_id, level in levels.items():
        print(f"  {branch_id:>6}: {level}")

    print("Growth timing:")
    for stage in config["growthStages"][1:]:
        event = first_event_at_or_above(events, int(stage["threshold"]))
        print(
            f"  {stage['id']:<28} L{stage['threshold']:>3}: "
            f"{format_time(event.seconds if event else None)}"
        )

    if events:
        final = events[-1]
        print(f"Final modeled income/sec: {final.income_per_second:,.2f}")


if __name__ == "__main__":
    main()
