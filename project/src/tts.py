import ctypes, wave, array, espeakng_loader as e
lib = ctypes.CDLL(e.get_library_path())
CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
buf = array.array('h')
def cb(wav, n, ev):
    if wav and n > 0:
        buf.extend(wav[:n])
    return 0
cbf = CB(cb)
lib.espeak_Initialize.restype = ctypes.c_int
sr = lib.espeak_Initialize(1, 0, e.get_data_path().encode(), 0)
lib.espeak_SetSynthCallback(cbf)
print('rate', sr, 'voice', lib.espeak_SetVoiceByName(b'ru'))
lib.espeak_SetParameter(1, 115, 0)   # speed
lib.espeak_SetParameter(3, 28, 0)    # pitch
lib.espeak_SetParameter(4, 30, 0)    # range
phr = ["Холодильник. Три часа ночи.", "Внутри — тишина.", "Только один лимон.", "Он ждёт. Но никто не придёт."]
for i, t in enumerate(phr):
    buf = array.array('h')
    b = t.encode('utf-8')
    lib.espeak_Synth(b, len(b) + 1, 0, 0, 0, 1, None, None)
    lib.espeak_Synchronize()
    with wave.open(f'v{i}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(buf.tobytes())
    print(i, len(buf) / sr, 's')
