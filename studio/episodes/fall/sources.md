# Episode 001 — Science research: falling from 10,000 m

## Model
- Body: 80 kg adult, belly-to-earth, no wingsuit, no parachute.
- Drag: F = ½·ρ·CdA·v². CdA calibrated so sea-level terminal velocity = 55 m/s (≈200 km/h), the commonly cited belly-to-earth value. → **CdA = 0.423 m²**.
- Atmosphere: NASA Glenn troposphere model (0–11 km): T = 15.04 − 0.00649·h, p = 101.29·[(T+273.1)/288.08]^5.256, ρ = p / [0.2869·(T+273.1)].
- Integrator: RK2, dt = 0.01 s. Code: `src/physics/fall_sim.py`, output `sim.json`.

## Results (simulated)
| Quantity | Value | Status |
|---|---|---|
| Air temp at 10 km | −50 °C | Standard atmosphere (real days vary ±10 °C) |
| Pressure at 10 km | 26.5 kPa (26 % of sea level) | Standard atmosphere |
| Density at 10 km | 0.41 kg/m³ (34 % of sea level) | Standard atmosphere |
| Speed at t = 10 s | 72.9 m/s = 262 km/h | Simulated |
| Peak speed | 87.3 m/s = 314 km/h at t ≈ 20.6 s, h ≈ 8,700 m | Simulated |
| Local terminal velocity at 10 km | ~95 m/s | Simulated |
| Speed at impact | 55.4 m/s ≈ 200 km/h | Simulated (by construction ≈ sea-level Vt) |
| Total fall time | 146.6 s ≈ 2 min 27 s | Simulated |
| Equivalent vacuum drop for impact speed | v²/2g ≈ 157 m | Calculated |

## Claims used in narration → source
1. Everest 8,849 m — 2020 China/Nepal joint survey (widely reported).
2. −50 °C, ¼ oxygen per breath — NASA Glenn atmosphere model: https://www.grc.nasa.gov/www/k-12/airplane/atmosmet.html (O₂ fraction is constant ~21 %; partial pressure scales with total pressure, 26 %).
3. Terminal velocity ~55 m/s belly-down; 50 % in ~3 s, 90 % in ~8 s at sea level — https://en.wikipedia.org/wiki/Terminal_velocity
4. Faster at altitude, then slowing as air thickens — follows from the drag equation + density profile (simulated). Real-world parallel: high-altitude jumps (e.g. Kittinger, Baumgartner) peak high, then decelerate.
5. Hypoxia: FAA time of useful consciousness ≈ 30–60 s at 35,000 ft, 1–2 min at 30,000 ft (AC 61-107) — https://en.wikipedia.org/wiki/Time_of_useful_consciousness. **Not stated as a hard number in narration** (individual variance is large).
6. Vesna Vulović, 10,160 m, 26 Jan 1972, Guinness record — https://www.guinnessworldrecords.com/world-records/highest-fall-survived-without-parachute. **Caveat:** a 2009 journalistic investigation argued the breakup happened lower; evidence circumstantial. She fell inside a section of fuselage — not comparable to an open-air fall.

## Assumptions / uncertainty
- Stable belly-down posture whole way; a tumbling or head-down body falls faster (head-down Vt can exceed 90 m/s).
- Standard atmosphere, no wind, no updrafts.
- Ground at sea level.
- Survival framed as "almost unheard of" — not "impossible" — because rare survivals exist (snow, trees, slopes).

## Video timing honesty
Real fall: 146.6 s. Video: ~65 s. The altitude counter shows real simulated values; a small "T+" clock shows real elapsed fall time so the time compression is visible.
