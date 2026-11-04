# Sources — golf ball from the Burj Khalifa
- Burj Khalifa 828 m.
- Regulation ball: mass ≤ 45.93 g, diameter ≥ 42.67 mm (USGA/R&A Equipment Rules) — https://www.usga.org/content/dam/usga/pdf/Equipment/Equipment%20Rules%20Final.pdf (cited in COMSOL blog below).
- Dimples trigger an early drag crisis: above Re ≈ 0.6–0.9×10⁵ a dimpled sphere's drag coefficient drops to roughly half a smooth sphere's — Choi, Jeon & Choi 2006, Phys. Fluids 18, 041702 (https://research.engineering.ucdavis.edu/biosport/wp-content/uploads/sites/24/2014/06/Choi-et-al-2006-Mechanism-of-drag-reduction-by-dimples-on-a-sphere.pdf); COMSOL "Why do golf balls have dimples?" (https://www.comsol.com/blogs/why-do-golf-balls-have-dimples); subcritical golf-ball Cd ≈ 0.51 (Li, Tsubokura & Tsunoda 2017, https://pmc.ncbi.nlm.nih.gov/articles/PMC6044256/).
- Model: non-spinning, Cd 0.25 (dimpled, supercritical) vs 0.5 (smooth, same size). Vt = 45.3 m/s vs 32.0 m/s at sea level; Re at Vt ≈ 1.3×10⁵ (inside the low-drag range).
- Sim (pipeline/sim.py, std atmosphere): 163 km/h at 10 s; peak 166 km/h; impact 164 km/h after 21.2 s; KE ≈ ½·0.0459·45.5² ≈ 48 J. Smooth ball tops out ≈ 116 km/h (stated "around 115").
- Bounce after impact is illustrative only (no restitution claim).
