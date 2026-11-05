# Sources — what if Earth's air were 10× thicker? (terminal velocity in thin vs thick air)
- Model: 80 kg, belly-to-earth, CdA calibrated to 55 m/s sea-level terminal velocity in real air (same as fall/gravity2 episodes; https://en.wikipedia.org/wiki/Terminal_velocity). NASA Glenn standard atmosphere with density × 10 at every height (pipeline/sim.py rho_mul). Exit 4,000 m.
- Sim, air × 10: 74.8 km/h at 5 s, top 76.0 km/h at ~8 s, ground at 210 s (3.5 min), impact 62.7 km/h. v²/2g = 15.5 m ("a fall from fifteen meters", ignoring drag).
- Same jump, normal air: top 231 km/h, ground at 70.1 s, impact 200 km/h.
- Terminal velocity ∝ 1/√ρ (drag = ½ρCdAv²): 231/76 = 3.0 ≈ √10 = 3.16 ("only three times slower").
- Venus: surface density ≈ 65 kg/m³ (53× Earth's 1.225), surface gravity 8.87 m/s² — NASA NSSDC https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html . Same body: Vt = 55·√((8.87/9.81)/(65/1.225)) ≈ 7.2 m/s; with buoyancy (65/985 ≈ 6.6%) ≈ 6.9 m/s ≈ 25 km/h. Heat/pressure ignored.

- Hypothetical: breathing, weather etc. not addressed.
