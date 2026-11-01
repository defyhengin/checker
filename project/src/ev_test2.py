import bpy, time
bpy.ops.wm.read_factory_settings(use_empty=False)
sc=bpy.context.scene; sc.render.engine='BLENDER_EEVEE'
sc.render.resolution_x,sc.render.resolution_y=1280,720
try: sc.eevee.taa_render_samples=16
except Exception as e: print(e)
for i in range(3):
    sc.frame_set(i+1)
    sc.render.filepath=f'/tmp/claude-0/-home-claude/66a2284d-bd4d-52ab-83b0-b87187a0a2d5/scratchpad/ev_t{i}.png'
    t=time.time(); bpy.ops.render.render(write_still=True); print('frame',i,round(time.time()-t,1),flush=True)
