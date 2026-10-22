# Orbital Survivor — design

## Concept

A compact 3D arena survival game for the Meta Ray-Ban Display. Move a bright wireframe ship around a neon orbital grid, turn to face incoming drones, and fire energy bolts until the 30-second rescue window closes.

## Player goal

Destroy drones for score and survive for 30 seconds to secure the orbit. A drone touching the ship ends the run. A tap after the result starts a fresh run.

## Core loop

Read the bright drone approach, swipe the D-pad to reposition and face it, tap to fire along that facing, then use the hit feedback and drone count to decide where to move next.

## Controls

- D-pad swipe / arrow key: move one step and face that direction.
- Index tap / Enter: launch from the title; fire while playing; restart after a result.
- Index drag: unused. The game stays tap-only.

## Visual style

Procedural 3D wireframe ship and drones over a thin orbital grid. Cyan marks the player, rose marks threats, and yellow marks shots. The stage background stays black so it emits no light on the additive display; the HUD has no fill. No external art files or spritesheets are used.

## Sound

Synthesized one-shot effects only: launch, firing, drone hit, collision, and victory. There is no recorded audio, music, or loading screen.

## Persistence and progression

English-only, one fixed 30-second run, with no saved score or settings. This first slice has a deterministic cardinal spawn sequence and no difficulty ramp.

## Scope / milestones

1. **Playable slice (built):** title, D-pad movement and facing, tap fire, incoming drones, hit scoring, collision loss, and timed survival win.
2. Later: tune difficulty and add richer enemy patterns after a device playtest.

## Out of scope

Persistent records, waves, power-ups, drag aiming, external art/audio, background music, and online features.

## Target and verification

Local prototype for HTTPS device testing later. Browser verification was requested; the initial plugin probe found no reachable Chrome CDP session, so the visual pass is pending browser availability.
