"""One-piece low-poly models for «Морозилка» v2: a pelmen (flat brim + round belly + pinched ear, after the author's reference),
a deep soup bowl, a water surface, and a volumetric steam column (no transparent balls — those read as bubbles).
All coordinates are ABSOLUTE engine coordinates (x, y up, z)."""
import math
import numpy as np
import bpy
from bkit import P, link, grp_add, simple_mat, noise_mat


def _mesh(name, verts, faces, m, g, subsurf=1, smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(P(v)) for v in verts], [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); link(o)
    o.data.materials.append(m)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    if subsurf:
        md = o.modifiers.new('s', 'SUBSURF'); md.levels = subsurf; md.render_levels = subsurf
    grp_add(g, o); return o


def pelmen(c, m, g, yaw=0.0, R=0.034, H=0.017, NR=14, NA=36):
    """Flat round brim (radius R) with a domed belly shifted towards one side and an ear pinched on the other."""
    cx, cy, cz = c
    ca, sa = math.cos(yaw), math.sin(yaw)
    Rd, off = 0.64 * R, 0.2 * R            # belly radius and shift
    ear = np.array((-0.62 * R, 0.0))        # where the edges are pinched together
    top, bot = [], []
    for i in range(NR + 1):
        r = R * i / NR
        for j in range(NA):
            a = 2 * math.pi * j / NA
            x, z = r * math.cos(a), r * math.sin(a) * 0.9
            dx, dz = x - off, z
            d = math.hypot(dx, dz) / Rd
            y = 0.0045 + (H * (1 - d * d) ** 0.55 if d < 1 else 0.0)
            # pinched ear: a fold running from the ear point into the belly
            de = np.array((x, z)) - ear
            along = max(0.0, 1 - np.linalg.norm(de) / (0.75 * R))
            across = abs(de[1] * 0.9 - de[0] * 0.25) / (0.12 * R)
            y -= 0.75 * H * along * math.exp(-across * across) * (1 if d < 1 else 0.3)
            y += 0.35 * H * along * math.exp(-((de[1] + 0.18 * R) / (0.1 * R)) ** 2) * (1 if d < 1 else 0)   # the curled lobe
            if i == NR:
                y = 0.0025
            X, Z = x * ca - z * sa, x * sa + z * ca
            top.append((cx + X, cy + max(y, 0.002), cz + Z)); bot.append((cx + X, cy, cz + Z))
    verts = top + bot
    n = len(top); faces = []
    for i in range(NR):
        for j in range(NA):
            a, b = i * NA + j, i * NA + (j + 1) % NA
            c_, d_ = (i + 1) * NA + (j + 1) % NA, (i + 1) * NA + j
            faces.append((a, b, c_, d_))                       # top
            faces.append((n + d_, n + c_, n + b, n + a))       # bottom
    o = NR * NA
    for j in range(NA):                                        # rim edge
        a, b = o + j, o + (j + 1) % NA
        faces.append((a, b, n + b, n + a))
    return _mesh('pelmen', verts, faces, m, g, 1)


def deep_bowl(c, m, g, R=0.115, Hh=0.075, N=48):
    """Revolved soup bowl: foot, steep wall, wide lip; inside a deep well."""
    cx, cy, cz = c
    prof = [(0.0, 0.0), (0.055, 0.0), (0.06, 0.006), (0.08, 0.018), (0.104, 0.05), (R, Hh - 0.004), (R + 0.012, Hh), (R + 0.012, Hh + 0.004),
            (R - 0.005, Hh + 0.003), (0.096, 0.05), (0.068, 0.018), (0.0, 0.012)]
    verts, faces = [], []
    for j in range(N):
        a = 2 * math.pi * j / N
        for r, y in prof:
            verts.append((cx + r * math.cos(a), cy + y, cz + r * math.sin(a)))
    K = len(prof)
    for j in range(N):
        for k in range(K - 1):
            a, b = j * K + k, ((j + 1) % N) * K + k
            faces.append((a, b, b + 1, a + 1))
    return _mesh('bowl', verts, faces, m, g, 1)


def water(c, r, m, g, N=48):
    cx, cy, cz = c
    verts = [(cx, cy, cz)] + [(cx + r * math.cos(2 * math.pi * j / N), cy, cz + r * math.sin(2 * math.pi * j / N)) for j in range(N)]
    faces = [(0, 1 + j, 1 + (j + 1) % N) for j in range(N)]
    return _mesh('water', verts, faces, m, g, 0)


def steam_volume(c, g, w=0.16, h=0.32, dens=24.0):
    """A box of soft rising mist: noise density × fade towards the top and the sides. Animate with set_steam_phase().
    EEVEE volumes need a short near/far range and small tiles, otherwise the mist is cut by the table and smeared."""
    ee = bpy.context.scene.eevee
    for k, v in (('volumetric_start', 0.2), ('volumetric_end', 4.0), ('volumetric_tile_size', '2'), ('volumetric_samples', 128),
                 ('volumetric_sample_distribution', 0.3)):
        try:
            setattr(ee, k, v)
        except Exception as e:
            print('vol setting', k, e)
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; link(o)
    o.scale = (w, w, h); o.location = P((c[0], c[1] + h / 2, c[2]))
    mat = bpy.data.materials.new('steam_vol'); mat.use_nodes = True; nt = mat.node_tree
    for nd in list(nt.nodes):
        if nd.type != 'OUTPUT_MATERIAL':
            nt.nodes.remove(nd)
    out = [nd for nd in nt.nodes if nd.type == 'OUTPUT_MATERIAL'][0]
    vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Color'].default_value = (0.95, 0.95, 0.97, 1)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    maps, noises = [], []
    for k in range(2):
        mp = nt.nodes.new('ShaderNodeMapping')
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.2; nz.inputs['Detail'].default_value = 3.0
        nz.noise_dimensions = '4D'
        nz.inputs['Distortion'].default_value = 0.8; nz.inputs['W'].default_value = 3.7 * k
        nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
        maps.append(mp); noises.append(nz)
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'FLOAT'; mix.name = 'mix'
    nt.links.new(noises[0].outputs['Fac'], mix.inputs[2]); nt.links.new(noises[1].outputs['Fac'], mix.inputs[3])
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs[0])
    # wisps: noise pushed through a steep ramp
    rp = nt.nodes.new('ShaderNodeMapRange'); rp.inputs['From Min'].default_value = 0.45; rp.inputs['From Max'].default_value = 0.7
    nt.links.new(mix.outputs[0], rp.inputs['Value'])
    # fades: height (object z from -1..1 in blender = bottom..top) and radius
    hz = nt.nodes.new('ShaderNodeMapRange'); hz.inputs['From Min'].default_value = 0.5; hz.inputs['From Max'].default_value = -0.15
    nt.links.new(sep.outputs['Z'], hz.inputs['Value'])
    lx = nt.nodes.new('ShaderNodeVectorMath'); lx.operation = 'LENGTH'
    cxy = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(sep.outputs['X'], cxy.inputs['X']); nt.links.new(sep.outputs['Y'], cxy.inputs['Y'])
    nt.links.new(cxy.outputs[0], lx.inputs[0])
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['From Min'].default_value = 0.34; rr.inputs['From Max'].default_value = 0.06
    nt.links.new(lx.outputs['Value'], rr.inputs['Value'])
    m1 = nt.nodes.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; nt.links.new(rp.outputs['Result'], m1.inputs[0]); nt.links.new(hz.outputs['Result'], m1.inputs[1])
    m2 = nt.nodes.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; nt.links.new(m1.outputs[0], m2.inputs[0]); nt.links.new(rr.outputs['Result'], m2.inputs[1])
    m3 = nt.nodes.new('ShaderNodeMath'); m3.operation = 'MULTIPLY'; m3.inputs[1].default_value = dens; nt.links.new(m2.outputs[0], m3.inputs[0])
    nt.links.new(m3.outputs[0], vol.inputs['Density'])
    nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
    o.data.materials.append(mat); grp_add(g, o)
    return o, (maps, mix)


def set_steam_phase(h, t, T=2.0, speed=0.5):
    """Seamless loop of period T seconds: two drifting copies of the noise, each reset while the other is fully shown."""
    maps, mix = h
    for k, mp in enumerate(maps):
        u = ((t / T) + 0.5 * k) % 1.0
        mp.inputs['Location'].default_value = (0.0, 0.0, -speed * T * u)
    u0 = (t / T) % 1.0
    mix.inputs[0].default_value = abs(2 * u0 - 1)       # weight of layer 1: 1 when layer 0 resets (u0=0), 0 at u0=0.5
