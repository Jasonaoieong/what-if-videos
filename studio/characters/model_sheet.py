"""Render Norbert's model sheet: front / side / back turnaround plus expression close-ups.

python3 studio/characters/model_sheet.py <out_dir> [--fast]
"""
import math
import os
import sys

import bpy  # must load before bmesh
import bmesh
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import norbert  # noqa: E402

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
FAST = "--fast" in sys.argv
os.makedirs(OUT, exist_ok=True)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    norbert._MATS.clear()


def studio():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 24 if FAST else 128
    sc.cycles.use_denoising = True
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.45, 0.5, 0.58, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35

    # Curved cyclorama backdrop
    prof = [(y, 0.0) for y in (-8, -4, 0, 1.5)]
    for i in range(1, 13):
        t = i / 12 * math.pi / 2
        prof.append((1.5 + 2 * math.sin(t), 2 - 2 * math.cos(t)))
    prof.append((3.5, 8))
    me = bpy.data.meshes.new("cyc")
    bm = bmesh.new()
    rows = [[bm.verts.new((x, y, z)) for x in (-10, 10)] for y, z in prof]
    for a, b in zip(rows, rows[1:]):
        bm.faces.new((a[0], a[1], b[1], b[0]))
    bm.to_mesh(me)
    bm.free()
    cyc = bpy.data.objects.new("cyc", me)
    sc.collection.objects.link(cyc)
    for p in me.polygons:
        p.use_smooth = True
    cyc.data.materials.append(norbert.mat("cyc", (0.30, 0.36, 0.42), 0.95))

    def area(name, loc, target, energy, size, color):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy, ld.size, ld.color = energy, size, color
        ob = bpy.data.objects.new(name, ld)
        sc.collection.objects.link(ob)
        ob.location = loc
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        return ob

    area("key", (-2.6, -3.2, 3.4), (0, 0, 1.0), 420, 2.5, (1.0, 0.93, 0.84))
    area("fill", (3.0, -2.6, 1.8), (0, 0, 1.0), 120, 3.0, (0.82, 0.89, 1.0))
    area("rim", (1.2, 2.8, 3.2), (0, 0, 1.3), 450, 1.5, (1.0, 1.0, 1.0))


def camera(name, loc, target, ortho=None, lens=50):
    cd = bpy.data.cameras.new(name)
    if ortho:
        cd.type = "ORTHO"
        cd.ortho_scale = ortho
    else:
        cd.lens = lens
    ob = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob


def render(cam, path, w, h):
    sc = bpy.context.scene
    sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("wrote", path, flush=True)


# Turnaround
reset()
studio()
root = norbert.build_norbert()
cam = camera("ortho", (0, -9, 2.0), (0, 0, 0.92), ortho=2.25)
for label, rz in (("front", 0.0), ("side", math.pi / 2), ("back", math.pi)):
    root.rotation_euler = (0, 0, rz)
    render(cam, os.path.join(OUT, f"view_{label}.png"), 800 if FAST else 1100, 1100 if FAST else 1500)

# Expressions (close-ups)
for expr in norbert.EXPRESSIONS:
    reset()
    studio()
    norbert.build_norbert(expr=expr)
    c = camera("close", (0.45, -2.3, 1.45), (0, -0.12, 1.47), lens=80)
    render(c, os.path.join(OUT, f"expr_{expr}.png"), 400 if FAST else 640, 400 if FAST else 640)
