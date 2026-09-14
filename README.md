# How PCA and ICA Actually Work

Interactive teaching modules on dimension reduction, built for geologists and
interpreters who have been handed a set of components and asked what they mean.

**https://hbedle-subsurface.github.io/pca-ica/**

Principal component analysis and independent component analysis sit underneath
a great deal of what is done with seismic attributes — attribute selection, RGB
blending, the inputs to unsupervised classification — and they are usually met
as a button rather than as an idea. The vocabulary makes it worse. A geologist
opening a paper on the subject meets *feature*, *sample*, *dimension*,
*loading*, *score*, *whitening*, *latent variable* and *explained variance* in
the first two pages, and none of them are defined there.

These modules start with a teapot. Look at one from the front and the spout
points at you; from the side the handle folds against the body; from above it
is a circle. The view that shows the most is none of those — it is a mixture of
all three directions at once. That is dimension reduction, and module 00 does
nothing but that, with no seismic data in it for the first three steps.

From there they build both methods from a crossplot upward. The first four name
no method at all; they establish the picture and the words. The eigenvector
arithmetic arrives only after the thing it computes has already been found by
hand, by dragging a line through a cloud of points and writing down numbers.

Every panel is computed live in the browser from a synthetic seismic slab that
you can change while a method is running on it. Nothing is a stored image and
nothing is drawn to look plausible, which means a panel can disagree with the
textbook version of the same figure — and in two places, it does.

## The modules

| | | |
|---|---|---|
| 00 | Looking at it from the right direction | a teapot, and why the good view is a mixture of axes |
| 01 | A direction through a cloud | projection and variance, found by hand |
| 02 | Spread, and the shape of the cloud | covariance, correlation, redundancy |
| 03 | Units, and why they decide the answer | standardization |
| 04 | Eigenvectors, loadings and scores | where the shortcut comes from |
| 05 | How many components to keep | scree, retained variance, the residual |
| 06 | Where PCA stops | orthogonality is arithmetic, not geology |
| 07 | Independence is not decorrelation | higher-order statistics, whitening |
| 08 | ICA: whiten, then rotate | what the algorithm searches for |
| 09 | The two, side by side | one dataset, both methods, one set of sliders |
| 10 | What counts as a dimension in seismic data | attribute, waveform, spectrum |
| 11 | Components are not geology | and where SOM, GTM and UMAP sit |

## Using them in a course

The state of every control is held in the address bar, so a link opens a module
in an exact configuration and can be distributed as a starting point. Each
module carries five exercises, each stating what to change, what to watch, and
what to conclude, with the answers behind a *Hint* toggle and every quoted
number read out of the running page.

Nothing you do in a module leaves your browser. There is no server, no account,
no upload. A single shared script records that a page was opened, so that the
university can see the modules are being used; no cookie, no identifier,
nothing about you. Saved to disk, every module runs with no network at all.

## Citing

H. Bedle and A. Moreno-Ward, 2026, *How PCA and ICA Actually Work: Interactive
Browser-Based Modules for Learning Dimension Reduction*: SSRN working paper,
University of Oklahoma.

## License

Licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Free
to use, adapt and share, including inside a company, provided the source is
credited and any adaptation is released under the same license. If you use this
in a course or a talk, a credit line and a link back are all that is asked.
