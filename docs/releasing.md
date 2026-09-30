# Stable releases

Stable versions use the npm `latest` dist-tag. Publication starts from a non-prerelease GitHub Release and uses the reviewed artifact produced by the release workflow; local machines do not publish the package.

1. Update `package.json`, `package-lock.json`, and `CHANGELOG.md` to the same stable version.
2. Run `npm run release:check -- --dry-run` and the full verification suite.
3. Merge the reviewed release commit to `main`.
4. Publish a GitHub Release whose tag is exactly `v<package version>`, such as `v1.0.0`.
5. Confirm the Release workflow publishes the package and then deploys the website.

The Release workflow requires the release commit to belong to `main`, the GitHub tag to match the package and lockfile versions, the release to be non-prerelease, and the version to be absent from npm. It tests React 18.3.1 and 19.3.0 through CI, reruns the complete release gate, and preserves an exact tarball plus its signed-off manifest. The publishing job downloads only that artifact, validates its name, inventory, version, channel, and SHA-512 digest, then publishes it with public access, `latest`, and provenance. Existing versions are immutable; prepare a new version for every subsequent release.

npm trusted publishing is configured for organization `NIPE-Solutions`, repository `react-data-inspector`, workflow `release.yml`, and environment `npm`. GitHub-hosted runners obtain short-lived credentials through OIDC. Do not add an npm token or publish a locally built archive.

After npm accepts the artifact, the workflow rebuilds the production website against registry metadata and deploys it. Registry propagation is retried for a bounded period; publication or metadata verification failures prevent deployment. Ordinary verified branch pushes continue to deploy website updates without publishing a package.

Stable describes the documented API and compatibility contract. Human screen-reader, current mobile Safari, application dogfooding, and retained-browser-heap audits remain explicit adopter qualification work in [release readiness](release-readiness.md).
