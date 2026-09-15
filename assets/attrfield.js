/* ===========================================================================
   attrfield.js — a synthetic stratal slab, and attributes computed from it
   Heather Bedle and April Moreno-Ward / University of Oklahoma

   Every attribute map in this module set is computed here from a synthetic
   seismic slab, which is itself computed from an impedance model. Nothing is
   a stored image and nothing is drawn to look plausible. A reader who moves
   the channel, changes the wavelet or turns up the footprint is changing the
   rocks and the recording, and every attribute downstream responds the way
   it would on real data — including when that response is unhelpful.

   The model is a shallow-marine slab containing two channel systems of
   different age and orientation, a levee wedge, background interbedded
   shale, acquisition footprint and random noise. It is a cartoon of a real
   survey, and the Method tab of each module says which parts are cartoon.

   License: CC BY-SA 4.0.
   =========================================================================== */

var AF = (function () {
  'use strict';

  /* =====================================================================
     DETERMINISTIC NOISE

     A seeded generator rather than Math.random, so that a link to a module
     opens the same survey it opened for whoever sent it.
     ===================================================================== */

  function lcg(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
  }
  function gauss(rnd) {
    var u = Math.max(rnd(), 1e-12), v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* =====================================================================
     FFT — iterative radix-2, in place, for the envelope and the spectrum
     ===================================================================== */

  function fft(re, im, inverse) {
    var n = re.length, i, j, k;
    for (i = 1, j = 0; i < n; i++) {
      var bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        var tr = re[i]; re[i] = re[j]; re[j] = tr;
        var ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = (inverse ? 2 : -2) * Math.PI / len;
      var wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var ar = re[i + k], ai = im[i + k];
          var br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
          var bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ar + br; im[i + k] = ai + bi;
          re[i + k + len / 2] = ar - br; im[i + k + len / 2] = ai - bi;
          var ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
    if (inverse) for (i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  /* Analytic trace by the Fourier method: zero the negative frequencies and
     double the positive ones. The envelope is the magnitude of the result. */
  function envelope(x) {
    var n = x.length, re = new Float64Array(n), im = new Float64Array(n), i;
    for (i = 0; i < n; i++) re[i] = x[i];
    fft(re, im, false);
    for (i = 1; i < n / 2; i++) { re[i] *= 2; im[i] *= 2; }
    for (i = Math.floor(n / 2) + 1; i < n; i++) { re[i] = 0; im[i] = 0; }
    fft(re, im, true);
    var e = new Float64Array(n);
    for (i = 0; i < n; i++) e[i] = Math.hypot(re[i], im[i]);
    return e;
  }

  function ricker(f, dt, nt) {
    var w = new Float64Array(nt), c = (nt - 1) / 2, i;
    for (i = 0; i < nt; i++) {
      var t = (i - c) * dt, a = Math.PI * f * t, a2 = a * a;
      w[i] = (1 - 2 * a2) * Math.exp(-a2);
    }
    return w;
  }

  /* =====================================================================
     THE EARTH MODEL

     Impedances are round numbers for clastic section at a couple of
     kilometers. They set the sign and the rough size of each reflection and
     nothing on the page depends on their exact values.
     ===================================================================== */

  var ROCKS = {
    shale:       { z: 7.20, name: 'Shale' },
    silt:        { z: 7.70, name: 'Silty shale' },
    channelSand: { z: 6.30, name: 'Channel sand' },
    leveeSand:   { z: 6.90, name: 'Levee sand' },
    tightSand:   { z: 8.60, name: 'Cemented sand' }
  };

  function rc(z1, z2) { return (z2 - z1) / (z2 + z1); }

  /* Sinuous centerline. Two harmonics so the planform does not read as a
     single sine wave, which no channel does. */
  function centerline(ix, nx, p) {
    var u = ix / (nx - 1);
    return p.y0 + p.amp * Math.sin(2 * Math.PI * p.freq * u + p.phase)
                + 0.36 * p.amp * Math.sin(2 * Math.PI * 2.3 * p.freq * u + p.phase * 1.7);
  }

  var YOUNG = { y0: 0.40, amp: 0.145, freq: 1.15, phase: 0.6, halfWidth: 0.055, thick: 26 };
  var OLD   = { y0: 0.68, amp: 0.085, freq: 0.75, phase: 2.7, halfWidth: 0.038, thick: 15 };

  /* Fraction of the way across a channel, 0 at the axis and 1 at the margin,
     or null when the sample is outside it. */
  function across(ix, iy, nx, ny, p) {
    var yc = centerline(ix, nx, p) * (ny - 1);
    var d = Math.abs(iy - yc) / (p.halfWidth * (ny - 1));
    return d <= 1 ? d : null;
  }

  /* =====================================================================
     BUILD THE SLAB

     opt.nx, opt.ny    grid size
     opt.freq          wavelet peak frequency, Hz
     opt.noise         random noise as a fraction of the mean reflection
     opt.footprint     acquisition footprint as a fraction, 0 for none
     opt.seed          which realization of the noise
     ===================================================================== */

  /* The acquisition footprint.

     An earlier version multiplied two cosines together, which is a
     checkerboard by construction and looked nothing like acquisition
     footprint. Real footprint is striping that follows the shooting and
     receiver directions, usually stronger along one of them, so this is a sum
     of two stripes on different periods rather than a product. It is exported
     because modules 05 and 11 measure how much of it each component carries,
     and that measurement has to use the same pattern the survey was built
     with. */
  function footprintPattern(ix, iy) {
    return 0.72 * Math.cos(2 * Math.PI * ix / 6 + 0.4)
         + 0.40 * Math.cos(2 * Math.PI * iy / 9);
  }

  /* Put a reflection coefficient at a position that is not a whole sample.

     The reflector depths in this model drift smoothly across the survey.
     Rounding each one to the nearest sample made a smooth horizon snap to the
     sample grid, and the one-sample steps that produced showed up in every
     amplitude map as a fine checkerboard that a reader would reasonably
     mistake for noise or for geology. Splitting the spike between the two
     samples either side, in proportion to where it actually falls, is both
     the physically sensible thing to do and the thing that removes the
     artifact. */
  function spike(refl, pos, amp) {
    var i = Math.floor(pos), f = pos - i;
    if (i >= 0 && i < refl.length) refl[i] += amp * (1 - f);
    if (i + 1 >= 0 && i + 1 < refl.length) refl[i + 1] += amp * f;
  }

  function build(opt) {
    opt = opt || {};
    var nx = opt.nx || 72, ny = opt.ny || 72;
    var dt = 0.002, nt = 64;
    var freq = opt.freq || 30;
    var noise = (opt.noise === undefined) ? 0.12 : opt.noise;
    var foot = (opt.footprint === undefined) ? 0.06 : opt.footprint;
    var rnd = lcg(opt.seed || 2026);

    var wav = ricker(freq, dt, 41);
    var data = new Float32Array(nx * ny * nt);
    var facies = new Uint8Array(nx * ny);       // 0 background 1 young 2 old 3 levee
    var thickMap = new Float32Array(nx * ny);

    var ix, iy, it, k;
    var refl = new Float64Array(nt);

    for (ix = 0; ix < nx; ix++) {
      for (iy = 0; iy < ny; iy++) {
        for (it = 0; it < nt; it++) refl[it] = 0;

        /* Background: a datum reflector plus a few interbeds whose depths
           drift slowly across the survey, so the slab is not layer-cake. */
        var drift = 2.5 * Math.sin(2 * Math.PI * ix / nx) + 1.5 * Math.cos(2 * Math.PI * iy / ny);
        spike(refl, 8 + drift, rc(ROCKS.shale.z, ROCKS.silt.z) * 2.4);
        spike(refl, 20 + drift, rc(ROCKS.silt.z, ROCKS.shale.z) * 1.7);
        spike(refl, 46 + drift, rc(ROCKS.shale.z, ROCKS.tightSand.z) * 1.2);
        spike(refl, 54 + drift, rc(ROCKS.tightSand.z, ROCKS.shale.z) * 1.2);

        var fac = 0, thick = 0;

        /* Older channel first, so the younger one overprints it where they
           cross — which is what gives module 07 a place where two features
           genuinely overlap in the attributes. */
        var dOld = across(ix, iy, nx, ny, OLD);
        if (dOld !== null) {
          var tOld = OLD.thick * Math.sqrt(Math.max(0, 1 - dOld * dOld));
          var topO = 34 + drift;
          var basO = 34 + drift + tOld * 0.5;
          if (tOld > 2) {
            spike(refl, topO, rc(ROCKS.shale.z, ROCKS.leveeSand.z) * 1.4);
            spike(refl, basO, rc(ROCKS.leveeSand.z, ROCKS.shale.z) * 1.4);
            fac = 2; thick = tOld;
          }
        }

        /* Levee wedge either side of the young channel: thin, low contrast,
           and the thing that is hardest to see in any single attribute. */
        var ycY = centerline(ix, nx, YOUNG) * (ny - 1);
        var dy = Math.abs(iy - ycY) / (YOUNG.halfWidth * (ny - 1));
        if (dy > 1 && dy < 2.3) {
          var lev = (2.3 - dy) / 1.3;
          var topL = 28 + drift;
          spike(refl, topL, rc(ROCKS.shale.z, ROCKS.leveeSand.z) * 0.85 * lev);
          spike(refl, topL + 3, rc(ROCKS.leveeSand.z, ROCKS.shale.z) * 0.85 * lev);
          if (fac === 0) { fac = 3; thick = 6 * lev; }
        }

        var dYo = across(ix, iy, nx, ny, YOUNG);
        if (dYo !== null) {
          var tY = YOUNG.thick * Math.sqrt(Math.max(0, 1 - dYo * dYo));
          var topY = 28 + drift;
          var basY = 28 + drift + tY * 0.5;
          if (tY > 2) {
            spike(refl, topY, rc(ROCKS.shale.z, ROCKS.channelSand.z) * 2.0);
            spike(refl, basY, rc(ROCKS.channelSand.z, ROCKS.shale.z) * 2.0);
            fac = 1; thick = tY;
          }
        }

        facies[ix * ny + iy] = fac;
        thickMap[ix * ny + iy] = thick;

        /* Convolve, then add the recording. */
        var fp = 1 + foot * footprintPattern(ix, iy);
        var base = (ix * ny + iy) * nt;
        for (it = 0; it < nt; it++) {
          var s = 0;
          for (k = 0; k < wav.length; k++) {
            var j = it - k + ((wav.length - 1) >> 1);
            if (j >= 0 && j < nt) s += refl[j] * wav[k];
          }
          data[base + it] = s * fp + noise * 0.045 * gauss(rnd);
        }
      }
    }

    return {
      nx: nx, ny: ny, nt: nt, dt: dt, freq: freq,
      data: data, facies: facies, thickness: thickMap,
      noise: noise, footprint: foot,
      trace: function (jx, jy) {
        return data.subarray((jx * ny + jy) * nt, (jx * ny + jy) * nt + nt);
      }
    };
  }

  /* =====================================================================
     ATTRIBUTES

     Each is computed over an analysis window on the slab, one value per
     trace, returned as a map of nx*ny values. These are the standard
     definitions; the module Method tabs name the simplifications.
     ===================================================================== */

  var WIN = { t0: 22, t1: 50 };

  function rms(S, win) {
    win = win || WIN;
    var m = new Float64Array(S.nx * S.ny), ix, iy, it;
    for (ix = 0; ix < S.nx; ix++) for (iy = 0; iy < S.ny; iy++) {
      var tr = S.trace(ix, iy), s = 0, n = 0;
      for (it = win.t0; it < win.t1; it++) { s += tr[it] * tr[it]; n++; }
      m[ix * S.ny + iy] = Math.sqrt(s / n);
    }
    return m;
  }

  function envelopePeak(S, win) {
    win = win || WIN;
    var m = new Float64Array(S.nx * S.ny), ix, iy, it;
    var buf = new Float64Array(64);
    for (ix = 0; ix < S.nx; ix++) for (iy = 0; iy < S.ny; iy++) {
      var tr = S.trace(ix, iy);
      for (it = 0; it < S.nt; it++) buf[it] = tr[it];
      var e = envelope(buf), mx = 0;
      for (it = win.t0; it < win.t1; it++) if (e[it] > mx) mx = e[it];
      m[ix * S.ny + iy] = mx;
    }
    return m;
  }

  /* Peak frequency of the window, from the magnitude spectrum of a tapered
     copy of the window, refined by a parabola through the three samples
     around the mode. */
  function peakFrequency(S, win) {
    win = win || WIN;
    var m = new Float64Array(S.nx * S.ny), ix, iy, it;
    var N = 64;
    for (ix = 0; ix < S.nx; ix++) for (iy = 0; iy < S.ny; iy++) {
      var tr = S.trace(ix, iy);
      var re = new Float64Array(N), im = new Float64Array(N), q = 0;
      for (it = win.t0; it < win.t1; it++, q++) {
        var w = 0.5 - 0.5 * Math.cos(2 * Math.PI * q / (win.t1 - win.t0 - 1));
        re[q] = tr[it] * w;
      }
      fft(re, im, false);
      var best = 1, bv = -1;
      for (q = 1; q < N / 2; q++) {
        var mag = Math.hypot(re[q], im[q]);
        if (mag > bv) { bv = mag; best = q; }
      }
      var a = Math.hypot(re[best - 1], im[best - 1]);
      var b = bv;
      var c = Math.hypot(re[best + 1], im[best + 1]);
      var denom = (a - 2 * b + c);
      var shift = denom !== 0 ? 0.5 * (a - c) / denom : 0;
      m[ix * S.ny + iy] = (best + shift) / (N * S.dt);
    }
    return m;
  }

  /* Coherence by the semblance of a 3x3 trace group over the window: the
     energy of the summed trace divided by the summed energy of the traces.
     One at perfect lateral similarity, low where waveforms disagree. */
  function coherence(S, win) {
    win = win || WIN;
    var m = new Float64Array(S.nx * S.ny), ix, iy, it, dx, dy;
    for (ix = 0; ix < S.nx; ix++) for (iy = 0; iy < S.ny; iy++) {
      var num = 0, den = 0, cnt = 0;
      for (it = win.t0; it < win.t1; it++) {
        var sum = 0, sq = 0;
        cnt = 0;
        for (dx = -1; dx <= 1; dx++) for (dy = -1; dy <= 1; dy++) {
          var jx = Math.min(S.nx - 1, Math.max(0, ix + dx));
          var jy = Math.min(S.ny - 1, Math.max(0, iy + dy));
          var v = S.data[(jx * S.ny + jy) * S.nt + it];
          sum += v; sq += v * v; cnt++;
        }
        num += sum * sum;
        den += cnt * sq;
      }
      m[ix * S.ny + iy] = den > 0 ? num / den : 1;
    }
    return m;
  }

  /* Magnitude of the lateral gradient of RMS amplitude: an edge detector,
     high on channel margins. Computed with a Sobel stencil. */
  function edge(S, win) {
    var a = rms(S, win), nx = S.nx, ny = S.ny;
    var m = new Float64Array(nx * ny), ix, iy;
    var at = function (jx, jy) {
      return a[Math.min(nx - 1, Math.max(0, jx)) * ny + Math.min(ny - 1, Math.max(0, jy))];
    };
    for (ix = 0; ix < nx; ix++) for (iy = 0; iy < ny; iy++) {
      var gx = (at(ix + 1, iy - 1) + 2 * at(ix + 1, iy) + at(ix + 1, iy + 1))
             - (at(ix - 1, iy - 1) + 2 * at(ix - 1, iy) + at(ix - 1, iy + 1));
      var gy = (at(ix - 1, iy + 1) + 2 * at(ix, iy + 1) + at(ix + 1, iy + 1))
             - (at(ix - 1, iy - 1) + 2 * at(ix, iy - 1) + at(ix + 1, iy - 1));
      m[ix * ny + iy] = Math.hypot(gx, gy) / 8;
    }
    return m;
  }

  /* Mean absolute amplitude — deliberately close to RMS, because module 00
     needs a pair that is almost but not quite the same measurement. */
  function meanAbs(S, win) {
    win = win || WIN;
    var m = new Float64Array(S.nx * S.ny), ix, iy, it;
    for (ix = 0; ix < S.nx; ix++) for (iy = 0; iy < S.ny; iy++) {
      var tr = S.trace(ix, iy), s = 0, n = 0;
      for (it = win.t0; it < win.t1; it++) { s += Math.abs(tr[it]); n++; }
      m[ix * S.ny + iy] = s / n;
    }
    return m;
  }

  /* Largest absolute sample in the window. A close relative of RMS and peak
     envelope, and deliberately included so that a correlation matrix has a
     group of three amplitude measurements that nearly agree. */
  function maxAbs(S, win) {
    win = win || WIN;
    var m = new Float64Array(S.nx * S.ny), ix, iy, it;
    for (ix = 0; ix < S.nx; ix++) for (iy = 0; iy < S.ny; iy++) {
      var tr = S.trace(ix, iy), mx = 0;
      for (it = win.t0; it < win.t1; it++) if (Math.abs(tr[it]) > mx) mx = Math.abs(tr[it]);
      m[ix * S.ny + iy] = mx;
    }
    return m;
  }

  /* Sweetness: envelope divided by the square root of the peak frequency.
     Introduced by Radovich and Oliveros (1998) as an indicator of sand in a
     shale section, where the sand is both brighter and lower frequency. */
  function sweetness(S, win) {
    var e = envelopePeak(S, win), f = peakFrequency(S, win);
    var m = new Float64Array(e.length), i;
    for (i = 0; i < e.length; i++) m[i] = e[i] / Math.sqrt(Math.max(1, f[i]));
    return m;
  }

  /* Spectral bandwidth of the window: the amplitude-weighted standard
     deviation of the magnitude spectrum about its own mean frequency. */
  function bandwidth(S, win) {
    win = win || WIN;
    var m = new Float64Array(S.nx * S.ny), ix, iy, it, q;
    var N = 64;
    for (ix = 0; ix < S.nx; ix++) for (iy = 0; iy < S.ny; iy++) {
      var tr = S.trace(ix, iy);
      var re = new Float64Array(N), im = new Float64Array(N);
      q = 0;
      for (it = win.t0; it < win.t1; it++, q++) {
        var w = 0.5 - 0.5 * Math.cos(2 * Math.PI * q / (win.t1 - win.t0 - 1));
        re[q] = tr[it] * w;
      }
      fft(re, im, false);
      var s0 = 0, s1 = 0, s2 = 0;
      for (q = 1; q < N / 2; q++) {
        var mag = Math.hypot(re[q], im[q]);
        var fq = q / (N * S.dt);
        s0 += mag; s1 += mag * fq; s2 += mag * fq * fq;
      }
      var mu = s0 > 0 ? s1 / s0 : 0;
      m[ix * S.ny + iy] = s0 > 0 ? Math.sqrt(Math.max(0, s2 / s0 - mu * mu)) : 0;
    }
    return m;
  }

  /* Gray-level co-occurrence texture on the RMS map, following Haralick et al.
     (1973): the map is quantized into levels, the co-occurrence of neighboring
     levels is counted in a small window, and two standard statistics are
     formed from it. Contrast is large where neighbors differ, homogeneity
     where they agree. */
  function glcm(S, win, want) {
    var a = rms(S, win), nx = S.nx, ny = S.ny;
    var LEV = 16, HW = 3;
    var lo = percentile(a, 0.02), hi = percentile(a, 0.98), rng = (hi - lo) || 1;
    var q = new Uint8Array(nx * ny), i;
    for (i = 0; i < a.length; i++) {
      q[i] = Math.max(0, Math.min(LEV - 1, Math.floor((a[i] - lo) / rng * LEV)));
    }
    var m = new Float64Array(nx * ny), ix, iy, dx, dy;
    var P = new Float64Array(LEV * LEV);
    for (ix = 0; ix < nx; ix++) for (iy = 0; iy < ny; iy++) {
      P.fill(0);
      var n = 0;
      for (dx = -HW; dx <= HW; dx++) for (dy = -HW; dy <= HW; dy++) {
        var jx = ix + dx, jy = iy + dy;
        if (jx < 0 || jx >= nx - 1 || jy < 0 || jy >= ny) continue;
        var a1 = q[jx * ny + jy], a2 = q[(jx + 1) * ny + jy];
        P[a1 * LEV + a2] += 1; P[a2 * LEV + a1] += 1; n += 2;
      }
      if (!n) { m[ix * ny + iy] = 0; continue; }
      var acc = 0, u, v;
      for (u = 0; u < LEV; u++) for (v = 0; v < LEV; v++) {
        var p = P[u * LEV + v] / n;
        if (!p) continue;
        var d = u - v;
        acc += (want === 'homogeneity') ? p / (1 + d * d) : p * d * d;
      }
      m[ix * ny + iy] = acc;
    }
    return m;
  }

  function glcmContrast(S, win) { return glcm(S, win, 'contrast'); }
  function glcmHomogeneity(S, win) { return glcm(S, win, 'homogeneity'); }

  /* RMS amplitude of a window ABOVE the target interval, samples 2 to 16.
     It contains background layering and noise and none of the channel system.
     Included because an attribute set assembled in a hurry often contains one
     like it, and module 03 needs a real example of an attribute that carries
     little about the target rather than a constructed one. */
  function shallowRMS(S) { return rms(S, { t0: 2, t1: 16 }); }

  var CATALOG = {
    shallow:    { fn: shallowRMS,    label: 'RMS above the target', units: 'amplitude' },
    rms:        { fn: rms,           label: 'RMS amplitude',      units: 'amplitude' },
    maxabs:     { fn: maxAbs,        label: 'Peak absolute amplitude', units: 'amplitude' },
    sweetness:  { fn: sweetness,     label: 'Sweetness',          units: 'amplitude per root hertz' },
    bandwidth:  { fn: bandwidth,     label: 'Spectral bandwidth', units: 'Hz' },
    glcmcon:    { fn: glcmContrast,  label: 'GLCM contrast',      units: 'unitless' },
    glcmhom:    { fn: glcmHomogeneity, label: 'GLCM homogeneity', units: 'unitless, 0 to 1' },
    envelope:   { fn: envelopePeak,  label: 'Peak envelope',      units: 'amplitude' },
    meanabs:    { fn: meanAbs,       label: 'Mean absolute amplitude', units: 'amplitude' },
    peakfreq:   { fn: peakFrequency, label: 'Peak frequency',     units: 'Hz' },
    coherence:  { fn: coherence,     label: 'Coherence',          units: 'unitless, 0 to 1' },
    edge:       { fn: edge,          label: 'Amplitude gradient', units: 'amplitude per trace' }
  };

  /* Compute a named set of attributes once and keep them, since every panel
     in a module reads the same maps. */
  function attributes(S, names, win) {
    var out = {}, i;
    for (i = 0; i < names.length; i++) {
      var n = names[i];
      if (!CATALOG[n]) continue;
      out[n] = CATALOG[n].fn(S, win);
    }
    return out;
  }

  function range(m) {
    var lo = Infinity, hi = -Infinity, i;
    for (i = 0; i < m.length; i++) { if (m[i] < lo) lo = m[i]; if (m[i] > hi) hi = m[i]; }
    return { lo: lo, hi: hi };
  }

  function percentile(m, p) {
    var a = Array.prototype.slice.call(m).sort(function (x, y) { return x - y; });
    var i = Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))));
    return a[i];
  }

  return {
    build: build, attributes: attributes, CATALOG: CATALOG, ROCKS: ROCKS,
    rms: rms, envelopePeak: envelopePeak, meanAbs: meanAbs,
    peakFrequency: peakFrequency, coherence: coherence, edge: edge,
    maxAbs: maxAbs, sweetness: sweetness, bandwidth: bandwidth,
    glcmContrast: glcmContrast, glcmHomogeneity: glcmHomogeneity,
    shallowRMS: shallowRMS,
    envelope: envelope, ricker: ricker, fft: fft,
    range: range, percentile: percentile, WIN: WIN,
    footprintPattern: footprintPattern,
    centerline: centerline, YOUNG: YOUNG, OLD: OLD
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = AF;
