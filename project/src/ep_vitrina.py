import os, sys, math
sys.argv = [sys.argv[0], os.environ.get('RX', '720'), os.environ.get('RY', '1280')]
os.environ['SHOP_PREVIEW'] = '0'
from bl_shop import *

OD = os.path.join(HERE, 'ep_vit'); os.makedirs(OD, exist_ok=True)
O = SHOP_OFF
TUBES = [o for o in ALL['static'] if o.data.materials and o.data.materials[0].name == 'tube']
M_TOFF = mat('tube_off', (0.7, 0.7, 0.7), 0.4)
SIGNM = bpy.data.materials['sign']; REGS = bpy.data.materials['regscr']


def section_off(k):
    """0 all on; 1 back row off; 2 + left half off; 3 everything off"""
    for o in TUBES:
        x, y = o.location.x - O.x, o.location.y - O.y
        off = (k >= 1 and y > 0) or (k >= 2 and x < -1) or k >= 3
        o.data.materials[0] = M_TOFF if off else bpy.data.materials['tube']
    for o in ALL['interior']:
        x, y = o.location.x - O.x, o.location.y - O.y
        o.hide_render = (k >= 1 and y > 0) or (k >= 2 and x < 0) or k >= 3
    for o in ALL['spill']:
        x = o.location.x - O.x
        o.hide_render = (k >= 2 and x < 0) or k >= 3
    SIGNM.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0 if k >= 3 else 3.0
    REGS.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0 if k >= 3 else 3.0


def P_(x, y, z):
    return (x + O.x, y + O.y, z)


# phone in front of the camera (hidden by default)
M_PH = mat('ph_body', (0.03, 0.03, 0.035), 0.3, 0.3)
phone = box(P_(0.0, -5.0, 1.3), (0.075, 0.009, 0.155), M_PH, 'phone')
pm = bpy.data.materials.new('ph_scr'); pm.use_nodes = True; nt = pm.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0, 0, 0, 1)
tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); cb = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(tc.outputs['Generated'], sp.inputs[0])
nt.links.new(sp.outputs['X'], cb.inputs['X']); nt.links.new(sp.outputs['Z'], cb.inputs['Y'])
tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(os.path.join(SH, 'phone_bank.png')); nt.links.new(cb.outputs[0], tx.inputs['Vector'])
nt.links.new(tx.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = 1.4
scr = box(P_(0.0, -5.0055, 1.3), (0.068, 0.001, 0.145), pm, 'phone')
for o in ALL['phone']:
    o.hide_render = True


def wide(rx, ry):
    sc.render.resolution_x, sc.render.resolution_y = rx, ry


R = (int(os.environ.get('RX', '720')), int(os.environ.get('RY', '1280')))
section_off(0)
wide(*R); cam(P_(2.0, -21.0, 1.65), P_(0.1, 0, 2.0), 0.5); shoot(os.path.join(OD, 'a1.png'))                       # street approach
wide(R[1] * 2, R[1]); cam(P_(1.0, -5.6, 1.62), P_(1.0, 0, 1.55), 0.42); shoot(os.path.join(OD, 'a2_wide.png'))   # facade pan source
wide(*R)
for o in ALL['spill']: o.hide_render = True
cam(P_(-0.2, -3.75, 1.58), P_(-0.25, 0.5, 1.2), 0.55); shoot(os.path.join(OD, 'a4.png'))                          # through the glass
for o in ALL['spill']: o.hide_render = False
# phone shot: phone held 0.35 m in front of the camera, shop blurred behind
for o in ALL['phone']:
    o.hide_render = False
cpos = P_(0.6, -5.4, 1.62)
phone.location = P_(0.6, -5.05, 1.42); scr.location = P_(0.6, -5.0555, 1.42)
for o in (phone, scr):
    o.rotation_euler = (math.radians(-35), 0, 0)
cd.dof.use_dof = True; cd.dof.focus_distance = 0.4; cd.dof.aperture_fstop = 1.4
cam(cpos, P_(0.6, -5.0, 1.42), 0.5); shoot(os.path.join(OD, 'a3.png'))
cd.dof.use_dof = False
for o in ALL['phone']:
    o.hide_render = True
# lights going off, mid distance view
for k in range(4):
    section_off(k)
    cam(P_(0.9, -6.5, 1.62), P_(0.9, 0, 1.75), 0.55); shoot(os.path.join(OD, f'a6_{k}.png'))
# dark glass close-up
section_off(3)
cam(P_(-0.2, -3.75, 1.58), P_(-0.25, 0.5, 1.2), 0.55); shoot(os.path.join(OD, 'a7.png'))
