"""Synthesize an original, royalty-free 30s upbeat music bed for the reel."""
import numpy as np, wave, sys

SR = 44100
DUR = 30.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
BPM = 120
BEAT = 60 / BPM
TRANSITIONS = [3.0, 6.6, 10.0, 13.4, 16.8, 20.0, 24.6]
DROP = 3.0

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

def lowpass(x, cutoff):
    # one-pole low-pass; cutoff can be scalar or array
    a = np.exp(-2 * np.pi * np.broadcast_to(cutoff, x.shape) / SR)
    y = np.empty_like(x); prev = 0.0
    for i in range(len(x)):
        prev = (1 - a[i]) * x[i] + a[i] * prev
        y[i] = prev
    return y

def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a*SR), int(d*SR), int(r*SR)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    e[na:na+nd] = np.linspace(1, s, nd, endpoint=False)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e

L = np.zeros(N); R = np.zeros(N)
def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.414
    R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.414

# Progression: D - A - Bm - G (I V vi IV), one bar (2s) each
CHORDS = [[62, 66, 69], [61, 64, 69], [59, 62, 66], [59, 62, 67]]
ROOTS = [38, 45, 47, 43]

# --- Pad: detuned saws, filtered, swells open after the drop
pad = np.zeros(N)
for bar in range(15):
    st = bar * 2.0
    n = int(2.0 * SR) + int(0.3 * SR)
    tt = np.arange(n) / SR
    ch = CHORDS[bar % 4]
    s = np.zeros(n)
    for m in ch:
        for det in (-0.12, 0.12):
            f = midi(m + det)
            s += 2 * ((tt * f) % 1.0) - 1
    s *= env_adsr(n, 0.25, 0.3, 0.8, 0.35) / 6
    i = int(st * SR); j = min(N, i + n)
    pad[i:j] += s[: j - i]
cut = np.where(t < DROP, 500 + 2200 * (t / DROP) ** 2, 1900)
pad = lowpass(pad, cut)
add(pad, 0, 0.32, 0)

# --- Marimba-ish arpeggio (8ths), starts at 1.0s
def pluck(f, dur=0.4):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = np.sin(2*np.pi*f*tt) + 0.35*np.sin(2*np.pi*4*f*tt)*np.exp(-tt*40) + 0.15*np.sin(2*np.pi*2*f*tt)
    return s * np.exp(-tt * 9) * np.minimum(1, tt * 400)
pattern = [0, 1, 2, 1, 2, 0, 1, 2]
step = BEAT / 2
k = 0; tm = 1.0
while tm < DUR - 1.2:
    bar = int(tm // 2.0)
    ch = CHORDS[bar % 4]
    note = ch[pattern[k % 8]] + 12
    add(pluck(midi(note)), tm, 0.16 if tm >= DROP else 0.10, -0.35 if k % 2 else 0.35)
    k += 1; tm += step

# --- Bass (after drop): root on beats with octave bounce
def bass(f, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = np.sin(2*np.pi*f*tt) + 0.3*np.sin(2*np.pi*2*f*tt)
    return np.tanh(1.5 * s) * np.exp(-tt * 3.5) * np.minimum(1, tt * 300)
tm = DROP
while tm < DUR - 1.0:
    bar = int(tm // 2.0)
    beat_in_bar = round((tm % 2.0) / BEAT)
    r = ROOTS[bar % 4] + (12 if beat_in_bar in (1, 3) else 0)
    add(bass(midi(r), BEAT * 0.95), tm, 0.30)
    tm += BEAT

# --- Drums
def kick():
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 50 + 110 * np.exp(-tt * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 9)
def clap():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = nz - lowpass(nz, 900)
    e = np.exp(-tt * 18) * (1 + 0.6 * (np.sin(2*np.pi*90*tt) > 0.6))
    return nz * e * 0.6
def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR); tt = np.arange(n) / SR
    nz = rng.standard_normal(n); nz = nz - lowpass(nz, 6000)
    return nz * np.exp(-tt * (25 if open_ else 90))
K, C = kick(), clap()
tm = DROP; b = 0
while tm < DUR - 1.0:
    add(K, tm, 0.65)
    if b % 2 == 1 and tm >= 6.6: add(C, tm, 0.35, 0.1)
    add(hat(), tm + BEAT / 2, 0.12, 0.4)
    if tm >= 6.6: add(hat(), tm, 0.06, -0.4)
    b += 1; tm += BEAT

# --- Riser into the drop + whooshes on each scene transition
def riser(dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    nz = rng.standard_normal(n)
    filt = lowpass(nz, 300 + 7000 * (tt / dur) ** 2)
    return filt * (tt / dur) ** 2
add(riser(1.6), DROP - 1.6, 0.5)
def whoosh(dur=0.55):
    n = int(dur * SR); tt = np.arange(n) / SR
    nz = rng.standard_normal(n)
    cut = 400 + 5000 * np.sin(np.pi * tt / dur)
    return (nz - lowpass(nz, 150)) * 0 + lowpass(nz, cut) * np.sin(np.pi * tt / dur) ** 2
for tr in TRANSITIONS[1:]:
    add(whoosh(), tr - 0.2, 0.40, 0.0)
# Impact on the drop and on the CTA
def impact():
    n = int(1.2 * SR); tt = np.arange(n) / SR
    f = 45 + 60 * np.exp(-tt * 12)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-tt * 3.5)
add(impact(), DROP, 0.55)
add(impact(), 24.6, 0.45)

# Final sustained chord (D major) ringing out
n = int(3.0 * SR); tt = np.arange(n) / SR
fin = sum(pluck(midi(m + 12), 3.0) for m in [62, 66, 69, 74]) * 0.5
add(fin, 27.0, 0.25)

# --- Master: soft clip, normalise, fades
mix = np.stack([L, R])
mix = np.tanh(mix * 1.3)
mix /= np.max(np.abs(mix)) / 0.89
fade_in = np.minimum(1, t / 0.05)
fade_out = np.clip((DUR - t) / 1.5, 0, 1)
mix *= fade_in * fade_out
pcm = (mix.T * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', sys.argv[1])
