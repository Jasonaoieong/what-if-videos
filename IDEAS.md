# Idea queue — 5 per day (verify every fact before use)

## Nov 1
- [ ] Falling from the Burj Khalifa (person, 828 m): how long, how fast (main)
- [ ] What if Earth spun backwards? Sun rises in the west; climate-model study of a reversed Earth (spin)
- [ ] Golf-ball hail vs softball hail: fall speeds (penny, hail)
- [ ] A smartphone dropped from the tallest building: does it survive? (penny, new flat-slab object)
- [ ] Head-down vs belly-down: how body position changes falling speed (main)

## Nov 2
- [ ] What if a raindrop fell from 10 km? (penny, drop, high start)
- [ ] Skydiver vs penny vs bowling ball: who lands first? (penny, multi-object variant)
- [ ] What if you fell from a passenger jet at cruising altitude, inside a cold thin sky (main)
- [ ] What if Earth's day were 48 hours? (spin)
- [ ] Why don't big raindrops get bigger forever? (they break apart ~ size limit) (penny, drop)

## Nov 3
- [ ] What if you dropped a coin from space (100 km)? (main/penny, very high start)
- [ ] A snowflake from a cloud: how slow it falls (penny, new flake object)
- [ ] What if you fell from Mount Everest's summit? (main, 8,849 m)
- [ ] Why the Moon doesn't fall to Earth (spin/globe)
- [ ] The highest skydive with a parachute vs without (main)

## Nov 4
- [x] A watermelon from the Burj Khalifa (penny, new object + splat) → `melon`
- [x] What if gravity were twice as strong for a falling skydiver? (main, g×2) → `gravity2` (exit 4,000 m, ends at 1,500 m parachute height; no impact)
- [x] What if Earth had no air? A penny vs a feather (penny, vacuum mode) → `noair`
- [x] Equator vs poles: where you weigh less (spin, latitude) → `equator` (spin_mode normal)
- [x] How fast does a golf ball fall from the Burj? (penny) → `golf`

## Nov 5
- [x] What if Earth's oceans drained? (spin, oceans morph) → `drain` (new sea-level drain + seafloor/ridges + USGS water ball in spin engine)
- [x] A water balloon from 828 m (penny, splash) → `balloon` (new balloon object + water splash; raindrop comparison)
- [x] Terminal velocity of a human in thin vs thick air (main) → `thickair`: reframed as "what if air were 10× thicker" (sim.py rho_mul) + Venus, because thin-air falling from altitude was already covered by `fall`/`space`
- [x] What if a day lasted a year? (spin, day) → `dayyear` (spin_mode slow; Moon, North Pole, Venus facts)
- [x] A basketball from the Burj Khalifa: would it bounce? (penny) → `bball` (new basketball object + bounce; FIBA rebound test, measured basketball Cd)

## Nov 6
- [x] What if you fell from the cruising height of a hot-air balloon (main) → `hotair` (1,000 m, inside the 1,000–9,000 ft ride range; new balloon model in main engine via `balloon` option)
- [x] What if Earth spun 10x faster? (spin, faster) → `spin10x` (weight vs latitude computed from ω², Coriolis ×10, Haumea 4 h day ending; spin engine: hard `cut`, no odometer roll across units, `latw` counter)
- [x] Largest raindrops on record (penny, drop) → `bigdrop` (≥ 8 mm drops, UW/GRL 2004; new `object.rad` override in penny engine)
- [x] A bowling ball from 10 km (penny/main, high start) → `bowl10k` (peaks 440 km/h at 7.8 km, lands ≈ 300 km/h)
- [x] Why hailstones have layers like an onion (penny, hail) → `hailayers`: reframed around NSSL's current explanation (layers are NOT simply up-and-down trips; clear vs cloudy ice from slow vs instant freezing)

## Nov 7
- [ ] What if you jumped from the world's tallest bridge? (main)
- [ ] A penny from a cruising plane (penny, 10 km start)
- [ ] What if Earth suddenly sped up for one second? (spin)
- [ ] Ice from a plane: how fast does a chunk fall? (penny, hail-like)
- [ ] Recap: which falling object is the deadliest? (penny)
