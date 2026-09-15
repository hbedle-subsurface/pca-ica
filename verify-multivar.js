/* verify-multivar.js — check assets/multivar.js against cases with known
   answers, before any teaching text is written on top of it.
   Run: node verify-multivar.js                                             */

var MV = require('./assets/multivar.js');

var fails = 0, checks = 0;
function ok(name, got, want, tol) {
  checks++;
  var pass = Math.abs(got - want) <= (tol === undefined ? 1e-9 : tol);
  if (!pass) fails++;
  console.log((pass ? '  ok   ' : '  FAIL ') + name +
    '   got ' + (+got).toPrecision(8) + '  want ' + (+want).toPrecision(8));
}
function head(s) { console.log('\n' + s); }

/* Deterministic pseudo-random generators, so the test is repeatable. */
function lcg(seed) {
  var s = seed >>> 0;
  return function () { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}
function gaussians(n, seed) {
  var r = lcg(seed), o = new Float64Array(n);
  for (var i = 0; i < n; i++) {
    var u = Math.max(r(), 1e-12), v = r();
    o[i] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  return o;
}
function uniforms(n, seed) {
  var r = lcg(seed), o = new Float64Array(n);
  for (var i = 0; i < n; i++) o[i] = r() - 0.5;
  return o;
}
function sawtooth(n, period) {
  var o = new Float64Array(n);
  for (var i = 0; i < n; i++) o[i] = ((i % period) / period) - 0.5;
  return o;
}
function sinewave(n, period) {
  var o = new Float64Array(n);
  for (var i = 0; i < n; i++) o[i] = Math.sin(2 * Math.PI * i / period);
  return o;
}
function absCorr(a, b) {
  var ma = MV.mean(a), mb = MV.mean(b), sa = MV.std(a, ma), sb = MV.std(b, mb), s = 0;
  for (var i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
  return Math.abs(s / a.length / (sa * sb));
}
function bestMatch(sources, found) {
  // highest absolute correlation achievable, matching each source to a component
  return sources.map(function (s) {
    return Math.max.apply(null, found.map(function (f) { return absCorr(s, f); }));
  });
}

var N = 6000;

/* ===================================================================
   1. EIGENSOLVER AGAINST CLOSED FORMS
   =================================================================== */
head('1. Eigensolver on matrices whose answers are known exactly');

var I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
var e = MV.jacobi(I3);
ok('identity: first eigenvalue', e.values[0], 1);
ok('identity: third eigenvalue', e.values[2], 1);

/* A diagonal matrix rotated by a known angle must give back the diagonal as
   eigenvalues and the angle as the first eigenvector. */
var lam1 = 4, lam2 = 1, th = 30 * Math.PI / 180;
var c = Math.cos(th), s = Math.sin(th);
var A = [
  [lam1 * c * c + lam2 * s * s, (lam1 - lam2) * c * s],
  [(lam1 - lam2) * c * s, lam1 * s * s + lam2 * c * c]
];
e = MV.jacobi(A);
ok('rotated ellipse: largest eigenvalue', e.values[0], 4, 1e-10);
ok('rotated ellipse: smallest eigenvalue', e.values[1], 1, 1e-10);
var ang = Math.atan2(e.vectors[0][1], e.vectors[0][0]) * 180 / Math.PI;
ok('rotated ellipse: recovered angle (deg)', ang, 30, 1e-8);

/* Eigenvectors must be orthonormal. */
var dot01 = e.vectors[0][0] * e.vectors[1][0] + e.vectors[0][1] * e.vectors[1][1];
ok('eigenvectors orthogonal', dot01, 0, 1e-12);
ok('eigenvector unit length',
  Math.hypot(e.vectors[0][0], e.vectors[0][1]), 1, 1e-12);

/* Trace and determinant are invariant under the decomposition. */
var M4 = [
  [6, 2, 1, 0], [2, 5, 3, 1], [1, 3, 7, 2], [0, 1, 2, 4]
];
e = MV.jacobi(M4);
var tr = 6 + 5 + 7 + 4, sum = e.values.reduce(function (a, b) { return a + b; }, 0);
ok('4x4: trace preserved', sum, tr, 1e-9);

head('   matrix inverse, from the same decomposition');
var Minv = MV.inverse(M4);
var prod = [];
for (i = 0; i < 4; i++) {
  prod.push([]);
  for (j = 0; j < 4; j++) {
    var s2 = 0;
    for (k = 0; k < 4; k++) s2 += M4[i][k] * Minv[k][j];
    prod[i].push(s2);
  }
}
ok('inverse: diagonal of A.Ainv', prod[0][0], 1, 1e-10);
ok('inverse: diagonal of A.Ainv', prod[3][3], 1, 1e-10);
ok('inverse: off-diagonal of A.Ainv', prod[1][2], 0, 1e-10);
ok('inverse: off-diagonal of A.Ainv', prod[2][0], 0, 1e-10);
var I2 = MV.inverse([[4, 0], [0, 0.25]]);
ok('inverse of a diagonal matrix', I2[0][0], 0.25, 1e-12);
ok('inverse of a diagonal matrix', I2[1][1], 4, 1e-12);

/* ===================================================================
   2. PCA ON A CLOUD BUILT TO ORDER
   =================================================================== */
head('2. PCA on clouds with known shape');

/* Isotropic: no direction should win. */
var iso = [gaussians(N, 11), gaussians(N, 97)];
var P = MV.pca(iso);
ok('isotropic cloud: eigenvalue ratio', P.values[0] / P.values[1], 1, 0.06);

/* Two features built by rotating independent variances 9 and 1 by 25 deg. */
var g1 = gaussians(N, 3), g2 = gaussians(N, 5);
var a = 25 * Math.PI / 180;
var fx = new Float64Array(N), fy = new Float64Array(N);
for (var i = 0; i < N; i++) {
  var p1 = 3 * g1[i], p2 = 1 * g2[i];
  fx[i] = p1 * Math.cos(a) - p2 * Math.sin(a);
  fy[i] = p1 * Math.sin(a) + p2 * Math.cos(a);
}
ok('rotated cloud: principal angle (deg)', MV.principalAngle([fx, fy]), 25, 0.8);

/* Perfectly redundant pair: the second eigenvalue must vanish. */
var base = gaussians(N, 21);
var copy = new Float64Array(N);
for (i = 0; i < N; i++) copy[i] = 2.5 * base[i] + 7;
P = MV.pca([base, copy]);
ok('redundant pair: second eigenvalue', P.values[1], 0, 1e-9);
ok('redundant pair: first explains all', P.explained[0], 1, 1e-9);

/* Explained variance must sum to one. */
var many = [gaussians(N, 1), gaussians(N, 2), gaussians(N, 4), gaussians(N, 8)];
P = MV.pca(many, { standardize: true });
ok('explained sums to 1', P.cumulative[P.cumulative.length - 1], 1, 1e-12);
ok('standardized: total variance = p', P.values.reduce(function (x, y) { return x + y; }, 0), 4, 1e-9);

/* THE CLAIM FROM THE AASPI DOCUMENT: are the score vectors orthogonal?
   With the means removed, the covariance of the scores is diagonal, so the
   scores are uncorrelated — and because they are also mean-zero, that makes
   them orthogonal as vectors. Checked rather than asserted. */
head('   the documented claim: "the principal components are not orthogonal"');
var d01 = 0, d02 = 0;
for (i = 0; i < N; i++) { d01 += P.scores[0][i] * P.scores[1][i]; d02 += P.scores[0][i] * P.scores[2][i]; }
ok('score 1 . score 2  (per sample)', d01 / N, 0, 1e-12);
ok('score 1 . score 3  (per sample)', d02 / N, 0, 1e-12);
ok('score means are zero', MV.mean(P.scores[1]), 0, 1e-12);

/* ===================================================================
   3. STANDARDIZATION CHANGES THE ANSWER
   =================================================================== */
head('3. Standardization is not cosmetic');

/* Same two features, one rescaled by 1000. Without standardization the big
   one takes the first component; with it, neither does. */
var u1 = gaussians(N, 31), u2 = gaussians(N, 37);
var big = new Float64Array(N), small = new Float64Array(N);
for (i = 0; i < N; i++) { big[i] = 1000 * u1[i]; small[i] = u2[i]; }
var raw = MV.pca([big, small]);
var zed = MV.pca([big, small], { standardize: true });
ok('unstandardized: loading on the large feature', Math.abs(raw.vectors[0][0]), 1, 1e-4);
ok('unstandardized: explained by PC1', raw.explained[0], 1, 1e-4);
ok('standardized: explained by PC1 near half', zed.explained[0], 0.5, 0.05);

/* ===================================================================
   4. RECONSTRUCTION AND WHITENING
   =================================================================== */
head('4. Reconstruction and whitening');

var X4 = [gaussians(N, 41), gaussians(N, 43), gaussians(N, 47)];
for (i = 0; i < N; i++) X4[2][i] = 0.8 * X4[0][i] + 0.2 * X4[2][i] + 5;
P = MV.pca(X4, { standardize: true });
var R = MV.reconstruct(P, 3);
var maxErr = 0;
for (var j = 0; j < 3; j++) for (i = 0; i < N; i++) maxErr = Math.max(maxErr, Math.abs(R[j][i] - X4[j][i]));
ok('all components: exact reconstruction', maxErr, 0, 1e-9);

var Rk = MV.reconstruct(P, 2);
var res = MV.residual(X4, Rk);
var resVar = res.reduce(function (t, f, jj) { return t + MV.variance(f) / (P.sd[jj] * P.sd[jj]); }, 0);
ok('2 of 3 components: residual matches last eigenvalue', resVar, P.values[2], 1e-8);

var W = MV.whiten(X4, { standardize: true });
var Cw = MV.cov(W.Z);
ok('whitened: variance of direction 1', Cw[0][0], 1, 1e-9);
ok('whitened: variance of direction 3', Cw[2][2], 1, 1e-9);
ok('whitened: cross term 1-2', Cw[0][1], 0, 1e-12);

/* ===================================================================
   5. HIGHER-ORDER STATISTICS
   =================================================================== */
head('5. Kurtosis and negentropy against known distributions');

ok('uniform: excess kurtosis (exact -1.2)', MV.kurtosis(uniforms(40000, 7)), -1.2, 0.05);
ok('gaussian: excess kurtosis (exact 0)', MV.kurtosis(gaussians(40000, 9)), 0, 0.12);
var sine = sinewave(40000, 173);
ok('sine: excess kurtosis (exact -1.5)', MV.kurtosis(sine), -1.5, 0.02);

var ng = MV.negentropy(gaussians(40000, 13));
var nu = MV.negentropy(uniforms(40000, 17));
var ns = MV.negentropy(sine);
ok('gaussian: negentropy near zero', ng, 0, 2e-5);
console.log('  note  negentropy  gaussian ' + ng.toExponential(3) +
  '   uniform ' + nu.toExponential(3) + '   sine ' + ns.toExponential(3));
checks++;
if (!(nu > 20 * ng && ns > nu)) { fails++; console.log('  FAIL negentropy ordering'); }
else console.log('  ok   negentropy ordering: gaussian << uniform < sine');

/* ===================================================================
   6. FastICA AGAINST A MIXING MATRIX WE CHOSE
   =================================================================== */
head('6. FastICA recovering sources from a known mix');

var s1 = sawtooth(N, 97), s2 = sinewave(N, 41);
var mixA = new Float64Array(N), mixB = new Float64Array(N);
for (i = 0; i < N; i++) {
  mixA[i] = 0.6 * s1[i] + 0.4 * s2[i];
  mixB[i] = 0.35 * s1[i] - 0.75 * s2[i];
}
var mixed = [mixA, mixB];

['logcosh', 'kurtosis'].forEach(function (ct) {
  var ica = MV.fastICA(mixed, 2, { contrast: ct });
  var m = bestMatch([s1, s2], ica.S);
  ok(ct + ': source 1 recovered |r|', m[0], 1, 0.02);
  ok(ct + ': source 2 recovered |r|', m[1], 1, 0.02);
});

/* PCA ON THE SAME MIXTURE.

   Two drafts of this test failed, and both failures are design findings for
   module 09 rather than bugs.

   The first asserted flatly that PCA cannot unmix. It reached |r| = 0.98,
   because the two sources had very different variances (a sawtooth at 1/12
   against a sine at 1/2) and the direction of greatest variance then lies
   close to the stronger source. So PCA partially unmixes whenever one source
   dominates.

   The second gave the sources equal variance and still reached |r| = 0.96.
   With two uncorrelated sources, any orthonormal pair of directions scores
   well unless it sits near 45 degrees away from them, and the mixing matrix
   chosen happened to put PCA close to the right rotation.

   Whether PCA appears to work is therefore a property of the mixing matrix,
   not of PCA. The demonstration dataset has to be built so that the
   direction of greatest variance is NOT a source direction, which is what
   A = diag(a,b) . R(45 deg) does: the two mixtures have clearly unequal
   variances, so PCA has a decisive answer, and that answer sits at 45
   degrees to both sources. The ceiling for PCA is then 1/sqrt(2). */
function mixWith(srcA, srcB, a, b, degrees) {
  var th = degrees * Math.PI / 180, ca = Math.cos(th), sa = Math.sin(th);
  var n = srcA.length, x1 = new Float64Array(n), x2 = new Float64Array(n), q;
  var eA = MV.std(srcA), eB = MV.std(srcB);
  for (q = 0; q < n; q++) {
    var p1 = srcA[q] / eA, p2 = srcB[q] / eB;
    x1[q] = a * (ca * p1 - sa * p2);
    x2[q] = b * (sa * p1 + ca * p2);
  }
  return [x1, x2];
}

var nrm1 = new Float64Array(N), nrm2 = new Float64Array(N);
var sd1 = MV.std(s1), sd2 = MV.std(s2);
for (i = 0; i < N; i++) { nrm1[i] = s1[i] / sd1; nrm2[i] = s2[i] / sd2; }

var demo = mixWith(s1, s2, 1.6, 0.8, 45);
var Pdemo = MV.pca(demo, { standardize: true });
var mpDemo = bestMatch([nrm1, nrm2], Pdemo.scores);
console.log('  note  demo mixture, PCA:  |r| = ' +
  mpDemo.map(function (v) { return v.toFixed(3); }).join(', ') +
  '   (ceiling 1/sqrt(2) = 0.707)');
ok('PCA on the demo mixture, source 1', mpDemo[0], Math.SQRT1_2, 0.05);
ok('PCA on the demo mixture, source 2', mpDemo[1], Math.SQRT1_2, 0.05);

var icaDemo = MV.fastICA(demo, 2, { contrast: 'logcosh' });
var miDemo = bestMatch([nrm1, nrm2], icaDemo.S);
ok('ICA on the demo mixture, source 1', miDemo[0], 1, 0.02);
ok('ICA on the demo mixture, source 2', miDemo[1], 1, 0.02);

/* Repeatability: the deterministic start returns identical components. */
var r1 = MV.fastICA(demo, 2, { contrast: 'logcosh' });
var r2 = MV.fastICA(demo, 2, { contrast: 'logcosh' });
ok('repeatability: identical first loading', r1.W[0][0], r2.W[0][0], 0);

/* START DEPENDENCE.

   A third assertion, that ICA cannot separate Gaussian sources, also failed
   when measured against the true sources: whitening a mixture of two
   independent Gaussians already returns a rotation of them, and with only
   two components a lucky rotation scores well. The claim that holds, and the
   one worth teaching, is that with Gaussian sources the answer is not
   determined by the data. Change the starting rotation and the components
   change. On non-Gaussian data they do not. */
head('   start dependence: the same data from four different starts');
var gmix = mixWith(gaussians(N, 51), gaussians(N, 53), 1.6, 0.8, 45);
function spreadOverStarts(data) {
  var runs = [1, 2, 3, 4].map(function (sd) {
    return MV.fastICA(data, 2, { contrast: 'logcosh', seed: sd * 7919 });
  });
  var worst = 1;
  runs.forEach(function (r) {
    var m = Math.max(absCorr(r.S[0], runs[0].S[0]), absCorr(r.S[0], runs[0].S[1]));
    worst = Math.min(worst, m);
  });
  return worst;
}
var agreeNG = spreadOverStarts(demo);
var agreeG = spreadOverStarts(gmix);
console.log('  note  agreement between starts: non-gaussian ' + agreeNG.toFixed(4) +
  '   gaussian ' + agreeG.toFixed(4));
ok('non-gaussian: starts agree', agreeNG, 1, 0.02);
checks++;
if (!(agreeG < 0.95)) { fails++; console.log('  FAIL gaussian sources should not give a repeatable direction'); }
else console.log('  ok   gaussian: the direction depends on the start');

/* ===================================================================
   7. HISTOGRAM
   =================================================================== */
head('7. Histogram');
var h = MV.hist(uniforms(10000, 61), -0.5, 0.5, 10);
var tot = 0;
for (i = 0; i < 10; i++) tot += h.counts[i];
ok('all samples binned', tot, 10000, 0);
var hclip = MV.hist(gaussians(10000, 63), -0.5, 0.5, 10);
tot = 0;
for (i = 0; i < 10; i++) tot += hclip.counts[i];
ok('out-of-range samples clamped, not dropped', tot, 10000, 0);
head('Scalings: two linear ones and one that reshapes');
(function scalings() {
  var n = 4000, i;
  var r = lcg(31);
  var a = new Float64Array(n), b = new Float64Array(n);
  for (i = 0; i < n; i++) {
    var g = Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r());
    a[i] = Math.exp(0.8 * g);                       // log-normal: strongly skewed
    b[i] = 0.6 * a[i] + 0.9 * (r() - 0.5);
  }
  var X = [a, b], r0 = MV.corr(X)[0][1];

  var mm = MV.minmax(X);
  ok('minmax lower bound', Math.min.apply(null, Array.from(mm[0])), 0, 1e-12);
  ok('minmax upper bound', Math.max.apply(null, Array.from(mm[0])), 1, 1e-12);
  ok('minmax leaves the correlation alone', MV.corr(mm)[0][1], r0, 1e-12);
  ok('minmax leaves the shape alone', MV.kurtosis(mm[0]), MV.kurtosis(X[0]), 1e-9);

  ok('zscore leaves the correlation alone', MV.corr(MV.zscore(X))[0][1], r0, 1e-12);
  ok('minmax and zscore agree on the correlation route',
    Math.abs(MV.pca(mm, { standardize: true }).vectors[0][0]),
    Math.abs(MV.pca(X, { standardize: true }).vectors[0][0]), 1e-9);

  var gs = MV.normalScore(X);
  ok('normal score has mean zero', MV.mean(gs[0]), 0, 1e-9);
  ok('normal score has unit spread', MV.std(gs[0]), 1, 0.01);
  ok('normal score comes out Gaussian in shape', MV.kurtosis(gs[0]), 0, 0.05);
  var mono = 1;
  for (i = 1; i < 400; i++) {
    if ((X[0][i * 7] < X[0][i * 7 + 3]) !== (gs[0][i * 7] < gs[0][i * 7 + 3])) mono = 0;
  }
  ok('normal score keeps the ordering', mono, 1, 0);
  ok('normal score DOES move the correlation',
    Math.abs(MV.corr(gs)[0][1] - r0) > 0.01 ? 1 : 0, 1, 0);
  ok('normalQuantile at the median', MV.normalQuantile(0.5), 0, 1e-9);
  ok('normalQuantile at 97.5 percent', MV.normalQuantile(0.975), 1.959964, 1e-4);
  ok('normalQuantile at 2.5 percent', MV.normalQuantile(0.025), -1.959964, 1e-4);
  ok('scale dispatches minmax', MV.scale(X, 'minmax')[0][0], mm[0][0], 1e-12);
  ok('scale dispatches gauss', MV.scale(X, 'gauss')[0][0], gs[0][0], 1e-12);
})();


console.log('\n' + (fails ? fails + ' FAILED of ' : 'all ') + checks + ' checks' +
  (fails ? '' : ' passed'));
process.exit(fails ? 1 : 0);
