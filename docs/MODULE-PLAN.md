# Module plan

The spine: **dimension reduction is a rule for choosing a direction.** Every
module either builds that picture, gives a rule, or shows what a rule cannot
know. Seismic is what the demonstrations are made of; the set is not about
seismic PCA programs.

Each module depends only on those before it. The question each one answers is
written here before any of it is built.

## Fundamentals — no method named

**00 · Too many measurements.** *Twenty volumes and three color channels. Now
what?* A channel system through a dozen attributes, several visibly redundant.
Interactive: add features one at a time, watch the correlation matrix fill in.
Introduces sample, feature, dimension, feature space.

**01 · A direction through a cloud.** *What is the best single number to
replace two attributes with?* Crossplot, a rotating line, the projected
histogram, and the variance-against-angle curve. The first principal component
found by hand. **Built.**

**02 · Spread, and the shape of the cloud.** *Is this attribute adding
anything?* Covariance from the products of deviations, the gain test that
separates covariance from correlation, the ellipse, a correlation matrix for
eleven attributes, and two cases where one number misleads. **Built.**

Two findings recorded here because later modules reuse them. First, the
crossplot convention has to change between modules 01 and 02: module 01 draws
both axes in matched amplitude units into a square box so the angle on screen
is the angle in the data, and module 02 draws each axis in its own standard
deviations so any pair can be shown. In the second convention the ellipse ratio
is sqrt((1+|r|)/(1-|r|)) and depends on r alone, so no angle read off it means
anything. Both modules say which convention they are using.

Second, amplitude against true bed thickness inside the young channel gives a
clean tuning arch: the binned mean rises from 71.4 to a maximum of 104.4 at
12.7 ms and falls to about 74 at 26 ms. Correlation over the whole range is
-0.667, +0.866 below 13 ms and -0.777 above it. That is the non-monotonic case
for step 5 and it is real physics rather than a constructed example.

**03 · Units, and why they decide the answer.** *Why is my first component the
loudest attribute?* The covariance route against the correlation route on six
attributes, the rescaling test, the variance auction, the two-attribute
degeneracy, and what an equal share costs. **Built.**

Measured results this module rests on. Native units, covariance route: PC1 is
0.950 bandwidth, -0.274 GLCM contrast, -0.150 peak frequency, and -0.001,
-0.001 and 0.006 on RMS, envelope and coherence — three of six attributes
absent. Standardized: all six present, largest loading 0.509 on RMS, the
attribute the other route ignored. Variances span 1.05e-4 to 74.4, a factor of
709,700.

Rescaling RMS alone: covariance-route loading goes -0.001, -0.008, -0.083,
0.768 at 1x, 10x, 100x, 1000x, and PC1's share moves 69.55% to 72.84%.
Correlation route: 0.509 and 52.19% at every stop.

The two-attribute degeneracy is taught here: standardized, the angle is 45 or
135 for every pair (measured across four pairs with r from -0.72 to +0.65),
while native angles run 58.99, 93.65, 99.45, 90.85. This is why module 01 works
in matched amplitude units instead of standardizing.

The weak attribute (RMS on samples 2-16, above the target; mean 0.04559 in the
channel against 0.04660 in the background, versus 0.08126 and 0.05571 for the
same attribute on the target) takes over PC2 outright once standardized, with a
loading of 0.528, and drags PC1 from 52.19% to 44.83% and the 90% component
count from 4 to 5. The covariance route gives it loading 0.000 on PC1 and does
not move at all; it lands alone on PC7 with a loading of 0.993.

Note on internal consistency: this module computes in native units, because the
x1000 display gain modules 01 and 02 apply to amplitude attributes would itself
change the covariance-route answer. With that gain applied to RMS and envelope,
PC1 becomes 0.776 envelope and 0.507 RMS — a third distinct answer from the
same rocks. The Method tab says so.

**04 · Eigenvectors, loadings and scores.** *Is the principal component the
weights or the volume?* The sweep against the solved answer, the direction
sphere for three attributes, deflation, loadings against scores, and the sign
ambiguity. **Built.**

Identities verified in the running page, all to machine precision: the six
standardized eigenvalues sum to 6.000000; each eigenvalue equals the variance
of its score (agreement to about 1e-14); the residual on Cv - lambda*v is
around 1e-16 for every component; and the score vectors are mutually orthogonal
at about 1e-15. That last one is the measured refutation of the claim in
real_pca_waveform and pca_waveform_classification that the principal components
are not orthogonal.

Deflation: the original eigenvalues 3.1317, 1.2860, 0.7386, 0.4476, 0.2649,
0.1313 become, after removing one component, the same list shifted one place
with a zero at the end, and the residual's first eigenvector matches the
original second to 0.0000 degrees. The residual is divided by the ORIGINAL
standard deviations rather than re-standardized, because re-standardizing
rescales each attribute by whatever survived and is not what deflation means.

Step 2's direction sphere uses u'Cu rather than projecting all 5184 traces per
direction, which makes a 180x90 grid cheap. The counting argument the module
quotes: two attributes need 180 directions swept, three need 32,400, six need
five angles and about 1.9e11.

## PCA

**05 · How many components to keep.** *Ninety percent. Is that enough?* Scree,
five competing rules, the residual as a set of maps, per-attribute shortfall,
and the variance ranking set against a usefulness ranking. **Built.**

The five rules return five different answers on the same six attributes:
broken stick 1 (52.19% retained), Kaiser 2 (73.63%), 80% rule 3 (85.94%), 90%
rule 4 (93.40%), 95% rule 5 (97.81%). The eigenvalues are 3.13, 1.29, 0.74,
0.45, 0.26, 0.13 with no break in them.

At the 90% cut the shortfall is very unevenly distributed: residual as a
fraction of each attribute's own spread reads 0.289 RMS, 0.194 envelope, 0.114
peak frequency, 0.088 bandwidth, 0.348 coherence, 0.365 GLCM contrast. Two
attributes are more than a third missing inside a reconstruction reported as
93.40% complete. Going to five collapses GLCM contrast to 0.005, because the
fifth component is largely that attribute.

The punchline for step 5, and the setup for modules 06 and 11: ranking the
components by channel separation gives 0.33, 2.81, 2.57, 0.28, 0.42, 0.99
against a variance ranking of 52.19%, 21.43%, 12.31%, 7.46%, 4.41%, 2.19%. The
largest component is the worst of the six at the job. Broken stick would keep
only that one. And peak frequency on its own separates at 5.97, twice the best
component — for this target the dimension reduction did not beat its own best
input, which the module says plainly.

Footprint goes the other way and is worth keeping straight: it enters mainly
through peak envelope (0.272) and RMS (0.140), and among the components
concentrates in PC4 (0.213), which the 90% rule keeps and the 80% rule drops.
An early draft of the exercise claimed PC4 carried the most footprint of
anything; peak envelope carries more, and the text was corrected.

**06 · Where PCA stops.** *Why does my first component look like two things?*
Both channel systems across all six components, the supervised ceiling, the
37-degree constraint, rotation inside the PC2-PC3 plane, and the non-Gaussian
structure PCA cannot see. **Built.**

The central measurement: Fisher discriminant directions for the two channel
systems sit 37.14 degrees apart in standardized attribute space. Principal
components are 90 degrees apart by construction, so no pair of them can point
along both — the geometry forbids it before any data is considered. The closest
any component comes to either target is PC3 at 36.9 degrees from the older
channel's direction and PC2 at 50.4 from the younger's; PC1, holding 52.19% of
the variance, sits at 85.4 and 87.9 degrees and shows neither.

Ceilings: the best direction for the younger channel reaches a separation of
8.973, against 2.812 for the best component and 5.972 for peak frequency alone
— the unsupervised result recovered under a third of what was available. For
the older channel the ceiling is only 1.615 against 1.030, which says the six
attributes carry little about it and no method could have fixed that.

Rotating inside the PC2-PC3 plane is the sharpest panel in the module: at 0
degrees (component 2) the younger channel separates at 2.812 with variance
1.286; at 45 degrees it separates at 7.421 with variance 1.012. The map nearly
triples while the quantity PCA ranks by falls, so the ranking points away from
the useful direction, and every one of those directions was already inside the
span of the components PCA returned. Both targets improve together rather than
trading off, which follows from the 37 degrees.

The handoff to module 07: score excess kurtosis is 5.11, 3.73, 3.85, -0.18,
5.13, 2.78 while every pair of scores is uncorrelated at about 1e-15. Second-
order statistics are exhausted and the data is still visibly structured. PC4,
at -0.18, is the one close to Gaussian, and it is also the component carrying
most of the acquisition footprint.

MV.inverse was added to the library for the discriminant, verified against
A.Ainv = I on a 4x4 and against a diagonal matrix.

## ICA

**07 · Independence is not decorrelation.** *PCA removed the correlation. What
is left?* Dependence without correlation, whitening, the shape statistics
calibrated against known distributions, the central limit, and a first
unsupervised search. **Built.**

Dependence without correlation, measured on the real scores: PC2 and PC3 are
uncorrelated at -2.2e-15 while the spread of PC3 within bins of PC2, as a
fraction of its own overall spread, runs 1.324, 2.364, 1.331, 0.675, 0.558,
0.855 — a factor of 4.24.

Whitening: variance along a direction in the PC2-PC3 plane runs 1.2860, 1.1491,
0.8754, 0.7386 before, and 1.000000 at every angle after.

Shape references from 40,000 seeded draws: uniform -1.201 (exact -1.2),
Gaussian -0.013 (exact 0), Laplace 2.935 (exact 3). Score kurtoses 5.11, 3.73,
3.85, -0.18, 5.13, 2.78 — five of six more peaked than a Laplace. PC4, the one
near Gaussian, is the footprint component from module 05.

Central limit, sum of k independent uniforms: -1.2006, -0.5895, -0.3937,
-0.2934, -0.2380, -0.2025, -0.1633, -0.1513 against the exact -1.2/k.

THE RESULT THE SET HAS BEEN BUILDING TO. Inside the whitened PC2-PC3 plane,
negentropy peaks at 40 degrees where the excess kurtosis is 8.37. The channel
separation there is 7.327 — against the supervised ceiling of 7.421 that module
06 obtained with the channel positions in hand, and against 2.812 at component
2 where PCA left the direction. An unsupervised criterion that was told nothing
except "look as un-Gaussian as possible" landed within about one percent of a
direction chosen while looking at the answer. Maximum kurtosis peaks at 45
rather than 40, which is a real if small disagreement between two defensible
contrasts and is flagged for module 08.

Note: three sets of quoted numbers had to be corrected against the running page
— the bin spreads are normalized on the page and were not in the draft, and the
source sums use a different random stream than the scratch measurement did.

**08 · ICA: whiten, then rotate.** *Why did my components come back in a
different order?* The search, and the order, sign and scale ambiguities.

**09 · The two, side by side.** *Which should I run?* One dataset, one set of
sliders, both methods live.

Design constraint found while verifying: whether PCA appears to unmix is a
property of the mixing matrix, not of PCA. Sources of unequal variance let PCA
reach |r| = 0.98 against them; a badly chosen equal-variance mixture still
reached 0.96. The demonstration mixture has to put the direction of greatest
variance away from any source direction, which A = diag(a,b) · R(45 degrees)
does: the mixtures have clearly unequal variances so PCA is decisive, and its
answer sits 45 degrees from both sources, capping it at 1/sqrt(2) = 0.707.
The teaching text has to carry that qualification rather than claim PCA simply
cannot unmix.

## Into seismic

**10 · What counts as a dimension in seismic data.** *Waveform PCA and
attribute PCA are the same method. Why do they look nothing alike?* Attribute
vector, waveform vector, spectral vector. Eigenvectors as wavelets. Complex PCA
on spectra. Sources: Guo et al. (2009); AASPI documentation for
`pca_waveform_classification`, `real_pca_waveform`, `complex_pca_spectra`.

**11 · Components are not geology.** *Which component is the reservoir?*
Footprint as a component, a real feature below the cut, and where linear
dimension reduction sits next to SOM, GTM, t-SNE, UMAP and autoencoders. Hands
off to the SOM/GTM set.

## References the set is built on

- Pearson (1901); Hotelling (1933); Jolliffe (2002) — PCA
- Hyvärinen and Oja (2000) — FastICA, negentropy approximation
- Guo, Marfurt and Liu (2009) — principal component spectral analysis
- Lubo-Robles and Marfurt (2019) — ICA on seismic attributes, Taranaki Basin
- Lubo-Robles, Bedle, Marfurt and Pranter (2023) — PCA for attribute selection

## Errors found in the AASPI documentation supplied as source material

To be reported rather than reproduced:

- `pca_waveform_classification` and `real_pca_waveform` have their GUI menu
  paths swapped, and both name their log and error files `real_pca_spectra_*`.
- `real_pca_waveform` reads "While the eigenvectors are orthogonal, the
  eigenvectors are not"; the parallel document says "the principal components
  are not". Measured: with the means removed the score vectors are orthogonal
  to machine precision, so the claim is wrong in both documents.
- `complex_pca_spectra` equation 4 writes **P** = Σ eⱼ pⱼ pⱼᵀ having already
  set **P** = **V**. That sum is C_X, not **V**. Equation 6 then truncates it
  and calls the result a partial sum of **Y**, when a truncated Σ eⱼ pⱼ pⱼᵀ
  acting on X is a filtered reconstruction of the data. The eigenvalue
  weighting does not belong in the projection.
- The 3500–4500 Hz band in the `pca_waveform_classification` example is
  implausible for a 1.2–2.2 s window, and those fields appear to belong to the
  spectral program rather than the waveform one.
