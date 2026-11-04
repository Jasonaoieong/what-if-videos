"""Norbert: a simple 3D stickman hero, built procedurally in Blender.

build_norbert(expr="neutral") returns the root empty. Every face part is its own object so
expressions can be swapped per shot without touching the rest of the model.
Character faces -Y. Units are metres; he is about 1.85 m tall including the hair tuft.
"""
import math

import bpy  # must load before bmesh
import bmesh
from mathutils import Vector

# ---------------------------------------------------------------- materials
_MATS = {}


def _bump(m, scale, strength):
    nt = m.node_tree
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 8
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])


def mat(name, color, rough=0.5, sss=0.0, bump=None, coat=0.0):
    if name in _MATS:
        return _MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (1.0, 0.35, 0.2)
        b.inputs["Subsurface Scale"].default_value = 0.03
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if bump:
        _bump(m, *bump)
    _MATS[name] = m
    return m


def materials():
    return dict(
        skin=mat("skin", (0.86, 0.56, 0.42), 0.5, sss=0.2, bump=(180, 0.12)),
        shirt=mat("shirt", (0.78, 0.50, 0.04), 0.92, bump=(260, 0.25)),
        stain=mat("stain", (0.35, 0.22, 0.08), 0.6),
        shorts=mat("shorts", (0.10, 0.42, 0.14), 0.88, bump=(220, 0.25)),
        hair=mat("hair", (0.07, 0.045, 0.03), 0.32, coat=0.5, bump=(90, 0.35)),
        eye=mat("eye", (0.01, 0.01, 0.012), 0.08),
        white=mat("eyehl", (1, 1, 1), 0.1),
        brow=mat("brow", (0.10, 0.06, 0.035), 0.6),
        mouth=mat("mouth", (0.22, 0.03, 0.04), 0.5),
        lip=mat("lip", (0.70, 0.36, 0.32), 0.45, sss=0.2),
        teeth=mat("teeth", (0.97, 0.94, 0.80), 0.25),
        pimple=mat("pimple", (0.80, 0.10, 0.08), 0.25, sss=0.1),
        shoe=mat("shoe", (0.80, 0.78, 0.72), 0.7, bump=(120, 0.2)),
        stripe=mat("stripe", (0.70, 0.08, 0.08), 0.6),
        sole=mat("sole", (0.35, 0.33, 0.32), 0.8),
        sock=mat("sock", (0.95, 0.95, 0.93), 0.95, bump=(400, 0.2)),
        watch=mat("watch", (0.08, 0.08, 0.09), 0.3),
    )


# ---------------------------------------------------------------- helpers
def _link(ob, parent):
    bpy.context.collection.objects.link(ob) if ob.name not in bpy.context.collection.objects else None
    ob.parent = parent
    return ob


def _smooth(ob, subdiv=0):
    for p in ob.data.polygons:
        p.use_smooth = True
    if subdiv:
        m = ob.modifiers.new("sub", "SUBSURF")
        m.levels = m.render_levels = subdiv
    return ob


def sphere(name, loc, r, m, parent, scale=(1, 1, 1), rot=(0, 0, 0), seg=40):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    ob.rotation_euler = rot
    ob.data.materials.append(m)
    ob.parent = parent
    return _smooth(ob)


def tube(name, pts, r, m, parent, radii=None, caps=True):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 6
    cu.resolution_u = 16
    cu.use_fill_caps = caps
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        bp = sp.bezier_points[i]
        bp.co = p
        bp.handle_left_type = bp.handle_right_type = "AUTO"
        if radii:
            bp.radius = radii[i]
    ob = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(ob)
    cu.materials.append(m)
    ob.parent = parent
    return ob


def cone(name, z0, z1, r0, r1, m, parent, yscale=0.75, y=0.0, verts=48):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r0, radius2=r1, depth=z1 - z0,
                                    location=(0, y, (z0 + z1) / 2))
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (1, yscale, 1)
    ob.data.materials.append(m)
    ob.parent = parent
    bev = ob.modifiers.new("bevel", "BEVEL")
    bev.width = 0.03
    bev.segments = 4
    _smooth(ob, 2)
    return ob


# ---------------------------------------------------------------- the head
HEAD_C = Vector((0, -0.13, 1.45))   # pushed forward: slouch
HEAD_R = Vector((0.30, 0.285, 0.315))


def on_head(u, v, out=0.0):
    """Point on the head surface. u: radians around from the front (+ = viewer's right), v: up."""
    d = Vector((math.sin(u) * math.cos(v), -math.cos(u) * math.cos(v), math.sin(v)))
    p = Vector((d.x * HEAD_R.x, d.y * HEAD_R.y, d.z * HEAD_R.z))
    n = Vector((p.x / HEAD_R.x ** 2, p.y / HEAD_R.y ** 2, p.z / HEAD_R.z ** 2)).normalized()
    return HEAD_C + p + n * out


EXPRESSIONS = {
    # eye scale z, brow lift L/R, brow tilt L/R, mouth curve (+smile), mouth open, teeth show
    "neutral": dict(eye=1.25, bl=(0.00, 0.00), bt=(0.0, 0.0), smile=0.03, open=0.0),
    "happy":   dict(eye=0.75, bl=(0.03, 0.03), bt=(0.1, -0.1), smile=0.07, open=0.04),
    "panic":   dict(eye=1.7, bl=(0.08, 0.07), bt=(-0.25, 0.25), smile=-0.05, open=0.10),
    "awkward": dict(eye=1.15, bl=(0.05, -0.01), bt=(-0.2, 0.05), smile=0.02, open=0.02),
    "shocked": dict(eye=1.9, bl=(0.10, 0.10), bt=(0.0, 0.0), smile=0.0, open=0.13),
    "sad":     dict(eye=1.0, bl=(0.02, 0.02), bt=(-0.3, 0.3), smile=-0.06, open=0.0),
}


def build_face(parent, M, expr="neutral"):
    e = EXPRESSIONS[expr]
    # Eyes: uneven heights, small and close-set.
    for side, u, v in ((-1, -0.29, 0.13), (1, 0.27, 0.095)):
        p = on_head(u, v, -0.012)
        sphere(f"eye_{side}", p, 0.042, M["eye"], parent, scale=(1, 0.6, e["eye"]))
        hl = on_head(u - 0.04, v + 0.04 * e["eye"], 0.012)
        sphere(f"eyehl_{side}", hl, 0.011, M["white"], parent)
    # Brows: left thick and high, right thin and low.
    for side, u, v, r in ((-1, -0.29, 0.34, 0.024), (1, 0.27, 0.25, 0.012)):
        i = 0 if side < 0 else 1
        lift, tilt = e["bl"][i], e["bt"][i]
        pts = [on_head(u - 0.11, v + lift - tilt * 0.06 * side, 0.01),
               on_head(u, v + lift + 0.015, 0.012),
               on_head(u + 0.11, v + lift + tilt * 0.06 * side, 0.01)]
        tube(f"brow_{side}", pts, r, M["brow"], parent, radii=[0.6, 1.0, 0.7])
    # Crooked nose: big, off-centre, bent, with a bump.
    sphere("nose", on_head(0.07, -0.03, 0.03), 0.06, M["skin"], parent,
           scale=(0.8, 1.15, 0.95), rot=(0.2, 0, 0.35))
    sphere("nose_bump", on_head(0.085, 0.05, 0.018), 0.026, M["skin"], parent)
    sphere("nostril", on_head(0.04, -0.08, 0.025), 0.018, M["mouth"], parent, scale=(1.2, 0.6, 0.6))
    # Mouth: lips, a dark line, and an oval when open.
    mv, s = -0.33, e["smile"]
    if e["open"] > 0:
        sphere("mouth", on_head(0.0, mv - e["open"] * 0.35, -0.03), 0.09, M["mouth"], parent,
               scale=(1.15, 0.55, 0.3 + e["open"] * 4.5))
    tube("lip_upper", [on_head(-0.21, mv + s + 0.02, 0.008), on_head(0, mv - s * 0.4 + 0.025, 0.014),
                       on_head(0.21, mv + s * 0.8 + 0.02, 0.008)], 0.016, M["lip"], parent, radii=[0.5, 1, 0.5])
    tube("mouth_line", [on_head(-0.22, mv + s, 0.006), on_head(0, mv - s * 0.4, 0.01),
                        on_head(0.22, mv + s * 0.8, 0.006)], 0.013, M["mouth"], parent, radii=[0.6, 1, 0.6])
    tube("lip_lower", [on_head(-0.17, mv + s * 0.7 - 0.05 - e["open"], 0.006),
                       on_head(0, mv - s * 0.3 - 0.07 - e["open"], 0.012),
                       on_head(0.17, mv + s * 0.6 - 0.05 - e["open"], 0.006)], 0.018, M["lip"], parent,
         radii=[0.5, 1, 0.5])
    # Buck teeth: two huge uneven front teeth hanging over the lower lip, one chipped.
    for name, u, h, w, rot, tilt in (("tooth_L", -0.062, 0.1, 0.058, 0.1, 0.35),
                                     ("tooth_R", 0.058, 0.08, 0.05, -0.16, 0.25)):
        p = on_head(u, mv - 0.055, 0.04)
        bpy.ops.mesh.primitive_cube_add(size=1, location=p)
        t = bpy.context.active_object
        t.name = name
        t.scale = (w, 0.035, h)
        t.rotation_euler = (tilt, rot, 0)
        t.data.materials.append(M["teeth"])
        t.parent = parent
        b = t.modifiers.new("bevel", "BEVEL")
        b.width, b.segments = 0.014, 4
        _smooth(t)
    # Pimples.
    for i, (u, v, r) in enumerate([(-0.55, -0.08, 0.016), (-0.48, 0.0, 0.012), (-0.62, -0.18, 0.011),
                                   (0.52, -0.05, 0.017), (0.6, -0.14, 0.012), (0.45, -0.2, 0.01),
                                   (0.12, 0.52, 0.015), (-0.18, 0.58, 0.012), (0.28, 0.45, 0.011),
                                   (0.05, -0.5, 0.013)]):
        sphere(f"pimple_{i}", on_head(u, v, 0.0), r, M["pimple"], parent, seg=16)
    # The shiny one on the tip of the nose.
    sphere("pimple_nose", on_head(0.08, -0.04, 0.095), 0.015, M["pimple"], parent, seg=16)


def build_hair(parent, M):
    # Greasy cap: upper part of a slightly larger head, low at the back, high at the front.
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=64, ring_count=32, location=HEAD_C)
    cap = bpy.context.active_object
    cap.name = "hair_cap"
    bm = bmesh.new()
    bm.from_mesh(cap.data)
    kill = [v for v in bm.verts if v.co.z < 0.38 - 0.55 * max(0.0, v.co.y) - 0.15 * abs(v.co.x)]
    bmesh.ops.delete(bm, geom=kill, context="VERTS")
    bm.to_mesh(cap.data)
    bm.free()
    cap.scale = HEAD_R * 1.045
    cap.data.materials.append(M["hair"])
    cap.parent = parent
    sol = cap.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = 0.02
    _smooth(cap, 2)
    tex = bpy.data.textures.new("greasy", "CLOUDS")
    tex.noise_scale = 0.3
    disp = cap.modifiers.new("clumps", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.022
    disp.mid_level = 0.5
    # Greasy clumps stuck to the forehead.
    for i, (u, length, r) in enumerate([(-0.42, 0.22, 0.034), (-0.08, 0.3, 0.04), (0.2, 0.12, 0.03),
                                        (0.5, 0.26, 0.034), (-0.75, 0.2, 0.03), (0.85, 0.24, 0.03)]):
        top = on_head(u, 0.7, 0.02)
        mid = on_head(u + 0.05, 0.6 - length * 0.4, 0.02)
        tip = on_head(u + 0.09 + 0.04 * ((i * 7) % 3 - 1), 0.56 - length * 0.75, 0.012)
        tube(f"clump_{i}", [top, mid, tip], r, M["hair"], parent, radii=[1.0, 0.8, 0.25])
    # Signature: the question-mark cowlick.
    base = HEAD_C + Vector((0.0, 0.03, HEAD_R.z * 0.98))
    q = [(0, 0, 0), (0.0, 0, 0.13), (0.04, 0, 0.24), (0.12, 0, 0.27), (0.18, 0, 0.21),
         (0.16, 0, 0.13), (0.1, 0, 0.1)]
    tube("cowlick", [base + Vector(p) for p in q], 0.038, M["hair"], parent,
         radii=[1.3, 1.0, 0.9, 0.8, 0.7, 0.55, 0.3])
    # A couple of stray strands.
    for i, (dx, dy) in enumerate(((-0.12, 0.08), (0.13, 0.12))):
        b2 = HEAD_C + Vector((dx * 0.8, dy, HEAD_R.z * 0.93))
        tube(f"stray_{i}", [b2, b2 + Vector((dx * 0.4, 0.02, 0.09)), b2 + Vector((dx * 0.9, 0.05, 0.11))],
             0.016, M["hair"], parent, radii=[1, 0.7, 0.2])


def build_norbert(name="Norbert", expr="neutral", location=(0, 0, 0), rot_z=0.0):
    M = materials()
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)

    # Head, ears, neck
    sphere("head", HEAD_C, 1.0, M["skin"], root, scale=HEAD_R, seg=64)
    for s in (-1, 1):
        sphere(f"ear_{s}", HEAD_C + Vector((s * 0.295, 0.01, -0.01)), 1.0, M["skin"], root,
               scale=(0.035, 0.065, 0.085), rot=(0, s * 0.25, 0))
    tube("neck", [Vector((0, 0.0, 1.13)), Vector((0, -0.03, 1.22)), HEAD_C + Vector((0, 0.03, -0.24))],
         0.034, M["skin"], root)

    # Oversized t-shirt hanging off a stick body
    cone("shirt", 0.66, 1.19, 0.25, 0.15, M["shirt"], root, y=-0.01)
    sphere("shirt_shoulders", (0, -0.01, 1.17), 1.0, M["shirt"], root, scale=(0.19, 0.115, 0.06))
    sphere("stain", (0.06, -0.165, 0.97), 1.0, M["stain"], root, scale=(0.045, 0.012, 0.032), rot=(0.1, 0, 0.4))
    sphere("stain2", (0.1, -0.168, 0.93), 1.0, M["stain"], root, scale=(0.016, 0.01, 0.014))

    # Arms: thin tubes coming out of droopy sleeves, ball hands
    for s in (-1, 1):
        sh = Vector((s * 0.165, -0.01, 1.14))
        el = Vector((s * 0.235, 0.01, 0.92))
        ha = Vector((s * 0.255, -0.03, 0.72))
        tube(f"sleeve_{s}", [sh, sh + (el - sh) * 0.55], 0.062, M["shirt"], root, radii=[1.0, 1.05])
        tube(f"arm_{s}", [sh, el, ha], 0.026, M["skin"], root)
        sphere(f"hand_{s}", ha + Vector((0, 0, -0.03)), 0.05, M["skin"], root, scale=(1, 1, 1.15))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.03, minor_radius=0.012, location=(-0.252, -0.027, 0.77))
    w = bpy.context.active_object
    w.name = "watch"
    w.rotation_euler = (0, -0.1, 0)
    w.data.materials.append(M["watch"])
    w.parent = root
    _smooth(w)
    sphere("watch_face", (-0.252, -0.06, 0.77), 0.02, M["watch"], root, scale=(1, 0.5, 1))

    # Baggy shorts, stick legs, mismatched socks, huge shoes
    cone("shorts", 0.55, 0.74, 0.215, 0.205, M["shorts"], root, yscale=0.8)
    for s in (-1, 1):
        hip = Vector((s * 0.085, 0.0, 0.6))
        knee = Vector((s * 0.095, -0.025, 0.34))
        ank = Vector((s * 0.1, 0.0, 0.1))
        tube(f"leg_{s}", [hip, knee, ank], 0.03, M["skin"], root)
        if s < 0:   # tall sock pulled up to the knee
            tube("sock_tall", [ank, Vector((s * 0.0975, -0.022, 0.31))], 0.036, M["sock"], root)
        else:       # sock bunched at the ankle
            for k in range(3):
                bpy.ops.mesh.primitive_torus_add(major_radius=0.038, minor_radius=0.014,
                                                 location=ank + Vector((0, 0, 0.02 + k * 0.022)))
                t = bpy.context.active_object
                t.name = f"sock_bunch_{k}"
                t.rotation_euler = (0.05 * k, 0.08 * (k - 1), 0)
                t.data.materials.append(M["sock"])
                t.parent = root
                _smooth(t)
        sphere(f"shoe_{s}", ank + Vector((s * 0.01, -0.07, -0.045)), 1.0, M["shoe"], root,
               scale=(0.085, 0.16, 0.065))
        sphere(f"stripe_{s}", ank + Vector((s * 0.088, -0.06, -0.04)), 1.0, M["stripe"], root,
               scale=(0.01, 0.07, 0.022), rot=(0.25, 0, 0))
        sphere(f"sole_{s}", ank + Vector((s * 0.01, -0.07, -0.085)), 1.0, M["sole"], root,
               scale=(0.09, 0.165, 0.025))
        if s > 0:   # untied lace
            tube("lace", [ank + Vector((0.01, -0.13, -0.0)), ank + Vector((0.05, -0.2, -0.06)),
                          ank + Vector((0.03, -0.27, -0.1))], 0.006, M["sock"], root)

    build_face(root, M, expr)
    build_hair(root, M)

    root.location = location
    root.rotation_euler = (0, 0, rot_z)
    return root
