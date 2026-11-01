"""Episode «Касса»: warm follow-up to «Витрина». Stills for the montage (see ep_kassa_edit.py).
Run: SHOTS=a1,tall EV_SAMPLES=24 python3 ep_kassa.py   (SHOTS empty = all)"""
import os, sys, math
sys.argv = [sys.argv[0], os.environ.get('RX', '720'), os.environ.get('RY', '1280')]
os.environ['SHOP_PREVIEW'] = '0'
from bl_shop import *

OD = os.path.join(HERE, 'ep_kassa'); os.makedirs(OD, exist_ok=True)
O = SHOP_OFF
R = (int(os.environ.get('RX', '720')), int(os.environ.get('RY', '1280')))
WANT = [s for s in os.environ.get('SHOTS', '').split(',') if s]


def P_(x, y, z):
    return (x + O.x, y + O.y, z)


def size(rx, ry):
    sc.render.resolution_x, sc.render.resolution_y = rx, ry


def want(n):
    return not WANT or n in WANT


def im(name, alb, es=2.0, rough=0.5):
    return img_mat(name, alb, alb, es, rough, 'xz')


# ---------------- the cashier faces the customer (yaw 0 = face toward -y) and gets two eyes ----------------
CASHIER.rotation_euler = (0, 0, 0)
_s = 1.62 / 1.7
M_EYE = mat('eye', (0.02, 0.02, 0.025), 0.3)
for _sx in (-1, 1):
    _e = sph((_sx * 0.042 * _s, -0.107 * _s, 1.665 * _s), (0.013 * _s, 0.008 * _s, 0.016 * _s), M_EYE, 'cashier', sub=1); _e.parent = CASHIER

# ---------------- price tags on the back shelf (local x 1.55..2.45, tiers 0.25/0.7/1.15/1.6, front edge y=2.425) ----------------
TAGS = {1.6: (389, 459, 329), 1.15: (214, 178, 214), 0.7: (96, 74, 96), 0.25: (38, 29, 22)}
for z, row in TAGS.items():
    for x, price in zip((1.7, 2.0, 2.3), row):
        box(P_(x, 2.405, z - 0.075), (0.17, 0.006, 0.106), im(f'tg{price}_{z}_{x}', f'tag_{price}.png', 0.9, 0.6), 'tags')
promo = box(P_(2.0, 2.36, 0.41), (0.15, 0.008, 0.15), im('promo', 'promo.png', 1.0, 0.5), 'tags')
promo.rotation_euler = (0, 0, 0)

# ---------------- register screen with a price, belt, pack, bread, phone ----------------
regs_obj = [o for o in ALL['static'] if o.data.materials and o.data.materials[0].name == 'regscr'][0]
regs_obj.data.materials[0] = im('regscr29', 'reg_29.png', 2.2, 0.3)
M_BELT = mat('belt', (0.07, 0.07, 0.08), 0.8)
box(P_(2.83, -1.3, 1.016), (0.95, 0.45, 0.03), M_BELT, 'belt')
for i in range(8):
    box(P_(2.4 + i * 0.12, -1.3, 1.034), (0.012, 0.44, 0.006), mat(f'belt_l{i}', (0.18, 0.18, 0.19), 0.7), 'belt')
pack = box(P_(2.88, -1.36, 1.14), (0.15, 0.05, 0.2), im('pack', 'pack_lapsha.png', 0.0, 0.5), 'pack', bevel=0.006)
pack.rotation_euler = (math.radians(-6), 0, math.radians(8))
bread = sph(P_(2.58, -1.32, 1.075), (0.2, 0.07, 0.06), M_BREAD, 'bread')
bread.rotation_euler = (0, 0, math.radians(14))
for k in range(3):
    c = box(P_(2.5 + k * 0.08, -1.37, 1.118), (0.012, 0.004, 0.04), M_BREAD2, 'bread')
    c.rotation_euler = (0, 0, math.radians(-50))
M_PH = mat('ph_body', (0.03, 0.03, 0.035), 0.3, 0.3)
pm = bpy.data.materials.new('ph_scr'); pm.use_nodes = True; nt = pm.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0, 0, 0, 1)
tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); cb = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(tc.outputs['Generated'], sp.inputs[0])
nt.links.new(sp.outputs['X'], cb.inputs['X']); nt.links.new(sp.outputs['Z'], cb.inputs['Y'])
tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(os.path.join(SH, 'phone_bank.png')); nt.links.new(cb.outputs[0], tx.inputs['Vector'])
nt.links.new(tx.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 3.0
PHX, PHY = 3.95, -1.3
ph = box(P_(PHX, PHY, 1.0045), (0.075, 0.009, 0.155), M_PH, 'phone'); ph.rotation_euler = (math.radians(-90), 0, math.radians(-8))
phs = box(P_(PHX, PHY, 1.0105), (0.068, 0.001, 0.145), pm, 'phone'); phs.rotation_euler = (math.radians(-90), 0, math.radians(-8))

# ---------------- plastic bag carried at the camera (hidden by default) ----------------
M_BAG = mat('bag', (0.86, 0.9, 0.95), 0.25, alpha=0.8)
M_BAGH = mat('bagh', (0.8, 0.84, 0.9), 0.3)
bag_parts = [sph((0, 0, 0), (0.11, 0.075, 0.15), M_BAG, 'bag', sub=2)]
bag_parts.append(sph((0.02, -0.01, 0.03), (0.075, 0.05, 0.09), M_BREAD2, 'bag', sub=1))
bag_parts.append(sph((-0.035, 0.0, 0.17), (0.035, 0.03, 0.1), M_BREAD, 'bag', sub=1))
bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.007, location=(0, 0, 0.215), rotation=(math.radians(90), 0, 0))
_h = bpy.context.object; _h.data.materials.append(M_BAGH); ALL.setdefault('bag', []).append(_h); bag_parts.append(_h)
bag_light = light('POINT', (0, 0, 0), 40, (1.0, 0.85, 0.65), 0.2, gname='bag')
bag_root = bpy.data.objects.new('bagroot', None); sc.collection.objects.link(bag_root)
for o in bag_parts + [bag_light]:
    o.parent = bag_root


def bag_on(cam_pos, tgt, dx=0.2, dz=-0.36, dist=0.55):
    """put the bag in the lower right of the frame, `dist` metres in front of the camera"""
    fwd = (Vector(tgt) - Vector(cam_pos)).normalized(); right = fwd.cross(Vector((0, 0, 1))).normalized(); up = right.cross(fwd).normalized()
    bag_root.location = Vector(cam_pos) + fwd * dist + right * dx + up * dz
    bag_root.rotation_euler = (math.radians(12), 0, math.atan2(fwd.y, fwd.x) - math.pi / 2)
    bag_light.location = (0, 0.15, 0.2)
    for o in bag_parts + [bag_light]:
        o.hide_render = False


def bag_off():
    for o in bag_parts + [bag_light]:
        o.hide_render = True


def show(group, on):
    for o in ALL.get(group, []):
        o.hide_render = not on


def dof(dist=None, f=1.6):
    cd.dof.use_dof = dist is not None
    if dist is not None:
        cd.dof.focus_distance = dist; cd.dof.aperture_fstop = f


def state(pack_on=True, bread_on=False, phone_on=False, tags=True):
    show('buyer', False); show('pack', pack_on); show('bread', bread_on); show('phone', phone_on); show('tags', tags)


CEIL = [o for o in ALL['static'] if o.data.materials and o.data.materials[0].name == 'inwall' and abs(o.scale.z - 0.02) < 1e-6][0]
CEIL.data.materials[0] = mat('ceil', (0.8, 0.78, 0.7), 0.9, emit=(0.55, 0.5, 0.38), es=0.7)
bag_off(); show('bag', False)
# the `show('bag')` above hid the group the bag parts live in; keep them under bag_off()/bag_on() control only
dof(None)
OUT = lambda n: os.path.join(OD, n + '.png')

# CUSTOMER_POS: where he stands in front of the counter
CP = (3.3, -2.25, 1.55)

# a1: entering through the door, warm interior, cashier at the far counter
if want('a1'):
    state(pack_on=False); size(*R)
    cam(P_(-3.0, -1.45, 1.6), P_(3.3, -1.0, 1.25), 0.5); shoot(OUT('a1'))

# tall shelf source for the vertical pan (720x2560, level camera, rectilinear)
if want('tall'):
    state(pack_on=False); size(R[0], R[1] * 2)
    cam(P_(2.0, 1.15, 1.0), P_(2.0, 2.6, 1.0), 0.349 * (R[1] * 2) / R[0]); shoot(OUT('tall'))
    size(*R)

# promo wobbler and the 29 tag, two quick cuts
if want('p1'):
    state(pack_on=False); size(*R)
    cam(P_(2.0, 1.35, 0.52), P_(2.0, 2.6, 0.5), 0.2); dof(1.0, 2.8); shoot(OUT('p1')); dof(None)
if want('p2'):
    state(pack_on=False); size(*R)
    cam(P_(1.95, 1.4, 0.32), P_(2.0, 2.6, 0.2), 0.2); dof(1.05, 2.8); shoot(OUT('p2')); dof(None)

# counter: wide, register close-up, phone close-up (pack on the belt)
if want('c1'):
    state(pack_on=True, phone_on=True); size(*R)
    cam(P_(3.1, -2.45, 1.62), P_(3.1, -1.3, 1.05), 0.5); shoot(OUT('c1'))
if want('c2'):
    state(pack_on=True, phone_on=True); size(*R)
    cam(P_(3.62, -2.05, 1.33), P_(3.62, -1.42, 1.25), 0.5); dof(0.63, 2.8); shoot(OUT('c2')); dof(None)
if want('c3'):
    state(pack_on=True, phone_on=True); size(*R)
    cam(P_(3.92, -1.72, 1.55), P_(3.95, -1.3, 1.0), 0.2); dof(0.7, 2.0); shoot(OUT('c3')); dof(None)

# pack removed, then he turns toward the exit
if want('t1'):
    state(pack_on=False, phone_on=True); size(*R)
    cam(P_(3.1, -2.45, 1.62), P_(3.1, -1.3, 1.05), 0.5); shoot(OUT('t1'))
if want('t2'):
    state(pack_on=False, phone_on=False); size(*R)
    cam(P_(2.6, -1.6, 1.6), P_(-3.0, -1.3, 1.45), 0.5); shoot(OUT('t2'))
if want('t3'):
    state(pack_on=False, phone_on=False); size(*R)
    cam(P_(-1.0, -1.5, 1.6), P_(-3.1, -3.0, 1.35), 0.5); shoot(OUT('t3'))

# cashier calls out, pack comes back with yesterday's loaf
if want('k1'):
    state(pack_on=False, phone_on=False); size(*R)
    cam(P_(3.25, -2.2, 1.55), P_(3.25, -0.65, 1.35), 0.42); shoot(OUT('k1'))
if want('k2'):
    state(pack_on=True, bread_on=True, phone_on=False); size(*R)
    cam(P_(2.73, -2.0, 1.45), P_(2.73, -1.34, 1.1), 0.33); dof(0.8, 4.0); shoot(OUT('k2')); dof(None)
if want('k3'):
    state(pack_on=True, bread_on=True, phone_on=False); size(*R)
    cam(P_(3.1, -2.2, 1.55), P_(3.25, -0.65, 1.3), 0.42); shoot(OUT('k3'))

# exit with the bag: from inside the door, then outside toward the lit windows
if want('e1'):
    state(pack_on=False, phone_on=False); size(*R)
    pos, tgt = (-10.5, -31.5, 1.6), (-27.5, -13.0, 5.5); cam(pos, tgt, 0.55); bag_on(pos, tgt, 0.16, -0.3, 0.5); shoot(OUT('e1')); bag_off()
if want('e2'):
    state(pack_on=False, phone_on=False); size(*R)
    pos, tgt = (-10.5, -31.5, 1.6), (-27.5, -8.0, 8.5); cam(pos, tgt, 0.3); shoot(OUT('e2'))
print('all done')
