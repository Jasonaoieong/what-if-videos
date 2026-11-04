"""Free-fall with altitude-dependent quadratic drag.

Atmosphere: NASA Glenn troposphere model (valid 0-11,000 m)
  T[C] = 15.04 - 0.00649 h
  p[kPa] = 101.29 * ((T+273.1)/288.08)^5.256
  rho[kg/m3] = p / (0.2869 (T+273.1))
Drag: F = 0.5 rho Cd A v^2. Cd*A calibrated so belly-to-earth terminal
velocity at sea level = 55 m/s (commonly cited value), 80 kg body.
"""
import json, math, sys

G = 9.80665


def atmosphere(h):
    """NASA Glenn standard atmosphere: troposphere, lower and upper stratosphere (0-50 km)."""
    h = max(0.0, min(h, 50000.0))
    if h < 11000:
        t = 15.04 - 0.00649 * h
        p = 101.29 * ((t + 273.1) / 288.08) ** 5.256
    elif h < 25000:
        t = -56.46
        p = 22.65 * math.exp(1.73 - 0.000157 * h)
    else:
        t = -131.21 + 0.00299 * h
        p = 2.488 * ((t + 273.1) / 216.6) ** -11.388
    rho = p / (0.2869 * (t + 273.1))
    return t, p, rho


def simulate(h0=10000.0, mass=80.0, vt_sea=55.0, dt=0.01, out_dt=0.1, g=G, h_end=0.0, vacuum=False):
    """g: gravity used for the motion (CdA is a body property, calibrated at normal G).
    h_end: stop at this altitude (e.g. parachute deployment). vacuum: no air at all."""
    _, _, rho0 = atmosphere(0)
    cda = 0.0 if vacuum else 2 * mass * G / (rho0 * vt_sea ** 2)
    h, v, t = h0, 0.0, 0.0
    rows, next_out = [], 0.0
    while h > h_end:
        temp, p, rho = atmosphere(h)
        if vacuum: rho = 0.0
        drag = 0.5 * rho * cda * v * v
        a = g - drag / mass
        vt_local = math.sqrt(2 * mass * g / (rho * cda)) if rho * cda > 0 else 0.0
        if t >= next_out - 1e-9:
            rows.append(dict(t=round(t, 2), h=round(h, 1), v=round(v, 2),
                             a=round(a, 3), drag_N=round(drag, 1),
                             rho=round(rho, 4), temp_C=round(temp, 1),
                             p_kPa=round(p, 2), vt_local=round(vt_local, 2)))
            next_out += out_dt
        # RK2 (midpoint)
        hm, vm = h - v * dt / 2, v + a * dt / 2
        rhom = 0.0 if vacuum else atmosphere(hm)[2]
        am = g - 0.5 * rhom * cda * vm * vm / mass
        h -= vm * dt
        v += am * dt
        t += dt
    temp, p, rho = atmosphere(max(h_end, 0))
    rows.append(dict(t=round(t, 2), h=round(max(h_end, 0.0), 1), v=round(v, 2), a=0, drag_N=0,
                     rho=0.0 if vacuum else round(rho, 4), temp_C=round(temp, 1),
                     p_kPa=0.0 if vacuum else round(p, 2), vt_local=0.0 if vacuum else round(math.sqrt(2 * mass * g / (rho * cda)), 2)))
    return dict(params=dict(h0=h0, mass_kg=mass, vt_sea_ms=vt_sea, g=g, h_end=h_end, vacuum=vacuum,
                            CdA_m2=round(cda, 6)), samples=rows)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "sim.json"
    r = simulate()
    json.dump(r, open(out, "w"), indent=1)
    s = r["samples"]
    vmax = max(s, key=lambda x: x["v"])
    print("CdA", r["params"]["CdA_m2"], "total time", s[-1]["t"], "s")
    print("max speed", vmax["v"], "m/s at t", vmax["t"], "h", vmax["h"])
    print("impact speed", s[-1]["v"], "m/s =", round(s[-1]["v"] * 3.6), "km/h")
    for x in s[::100]:
        print(x["t"], x["h"], x["v"], x["rho"], x["temp_C"])
