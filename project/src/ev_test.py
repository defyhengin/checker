import bpy, time
bpy.ops.wm.read_factory_settings(use_empty=False)
sc=bpy.context.scene
items=[e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
print('engines',items,flush=True)
eng=[e for e in items if 'EEVEE' in e][0]
sc.render.engine=eng
sc.render.resolution_x,sc.render.resolution_y=320,180
sc.render.filepath='/tmp/claude-0/-home-claude/66a2284d-bd4d-52ab-83b0-b87187a0a2d5/scratchpad/ev_test.png'
t=time.time()
bpy.ops.render.render(write_still=True)
print('EEVEE OK',eng,round(time.time()-t,1),flush=True)
