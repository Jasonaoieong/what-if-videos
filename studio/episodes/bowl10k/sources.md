# Sources — bowling ball from 10 km
- Same ball model as `bowling`: 7.26 kg (16 lb), 21.8 cm, Cd 0.47 → sea-level terminal ≈ 81.4 m/s. Atmosphere: NASA Glenn standard atmosphere (pipeline/sim.py).
- Sim `simulate(10000, 7.26, 81.4)`: 303 km/h at 10 s, 428 km/h at 20 s, peak 440.6 km/h at 25.8 s (h 7,787 m), 367 km/h at 60 s, impact 298 km/h after 102.8 s. Speed of sound at peak altitude ≈ 1,112 km/h (Mach ≈ 0.4, compressibility negligible).
- From 828 m (bowling episode sim): 282 km/h after 15.6 s.
- Air at 10 km (model): −49.9 °C, ρ ≈ 0.41 kg/m³ vs 1.225 at sea level (≈ ⅓).
- Impact energy ½·7.26·82.8² ≈ 24.9 kJ; 7.62×51 mm rifle muzzle energy ≈ 3.3–3.6 kJ → ≈ 7.
- Burj Khalifa 828 m; 10,000/828 ≈ 12.
- Caveat: Cd 0.47 is the textbook subcritical sphere value; at these Reynolds numbers (~10⁶) a very smooth sphere could see lower drag, so the speeds are model values (stated as SIMULATION on screen).
