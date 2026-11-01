import ctypes, wave, array, espeakng_loader as e
lib = ctypes.CDLL(e.get_library_path())
CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
buf = array.array('h')
def cb(wav, n, ev):
    if wav and n > 0:
        buf.extend(wav[:n])
    return 0
cbf = CB(cb)
sr = lib.espeak_Initialize(1, 0, e.get_data_path().encode(), 0)
lib.espeak_SetSynthCallback(cbf)
lib.espeak_SetParameter(1, 115, 0)
text = b"The fridge. Three in the morning. Just one lemon."
out = array.array('h')
gap = array.array('h', [0]) * int(sr * 0.8)
for v in [b'en-us+m3', b'en-us+f3', b'en-us+whisper', b'en-us+croak', b'en-gb+m7']:
    buf = array.array('h')
    lib.espeak_SetVoiceByName(v)
    lib.espeak_Synth(text, len(text) + 1, 0, 0, 0, 1, None, None)
    lib.espeak_Synchronize()
    out.extend(buf); out.extend(gap)
with wave.open('voices_demo.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(out.tobytes())
print(len(out) / sr)
