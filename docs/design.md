# Orbital Survivor — design

## Concept

A compact 3D arena survival game for the Meta Ray-Ban Display. Move a bright wireframe ship around a neon orbital grid, turn to face incoming drones, and fire energy bolts through endless escalating waves and recurring boss fights.

## Player goal

Destroy drones for score and keep advancing through endless waves. A drone touching the ship ends the run. A tap after the result starts a fresh run.

## Core loop

Read the bright drone approach, swipe the D-pad to reposition and face it, tap to fire along that facing, and double-swipe one direction quickly to teleport to that side of the arena. Clear each wave to advance. Every fifth wave replaces the regular group with a larger, multi-hit boss; later bosses become tougher and regular waves grow in size.

## Controls

- D-pad swipe / arrow key: move one step and face that direction.
- Two consecutive swipes in the same direction within a short window: teleport to the arena edge in that direction.
- Index tap / Enter: launch from the title; fire while playing; restart after a result.
- Index drag: unused. The game stays tap-only.

## Visual style

Procedural 3D wireframe ship and drones over a thin orbital grid. Cyan marks the player, rose marks threats, and yellow marks shots. The stage background stays black so it emits no light on the additive display; the HUD has no fill. No external art files or spritesheets are used.

## Sound

Synthesized one-shot effects only: launch, firing, drone hit, collision, and victory. There is no recorded audio, music, or loading screen.

## Persistence and progression

English-only endless progression, with no saved score or settings. Waves grow in size and spawn pace; every fifth wave is a boss wave. Boss health increases on later boss waves. Spawn points use a deterministic cardinal sequence.

## Scope / milestones

1. **Endless arena (built):** title, D-pad movement and facing, double-swipe teleport, tap fire, escalating waves, recurring multi-hit bosses, hit scoring, and collision loss.
2. Later: tune difficulty and add richer enemy patterns after a device playtest.

## Out of scope

Persistent records, power-ups, drag aiming, external art/audio, background music, and online features.

## Target and verification

Local prototype for HTTPS device testing later. Browser verification was requested; the initial plugin probe found no reachable Chrome CDP session, so the visual pass is pending browser availability.
