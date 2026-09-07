# Beta releases

The package uses versions such as `0.1.0-beta.0` and the npm `beta` dist-tag. It does not promote prereleases to `latest`.

1. Update `package.json` and the lockfile with `npm version 0.1.0-beta.N --no-git-tag-version`.
2. Commit the reviewed change to `main`.
3. Push a matching tag: `git tag v0.1.0-beta.N` then `git push origin v0.1.0-beta.N`.

The Verify workflow runs the complete React 18.3.1/19 matrix, including unit, browser, SSR, package and website checks. Its publication job requires the tag to equal the package version, the lockfile to match, the commit to belong to main, and the version to be absent from npm. Publication uses public access, `beta`, and provenance. Existing versions are never overwritten; bump the version for another release.

npm trusted publishing is configured for organization `NIPE-Solutions`, repository `react-data-inspector`, workflow `ci.yml`, environment `npm`, with direct publish allowed. GitHub-hosted runners supply OIDC credentials. The bootstrap credential used for first publication has been retired. Future releases use OIDC without a stored npm token. Never commit credentials.

A successful tag publication is followed by a production website build, which checks npm dist-tag endpoints and displays the real installation command. Deployment retries briefly while the registry propagates a new package, then fails rather than deploying unpublished-package copy. Failed publication blocks that release deployment. Ordinary main pushes continue to deploy verified website updates without publishing a package.

The beta channel is a release designation. It does not imply that the manual screen-reader, current mobile Safari, dogfooding and retained-browser-heap audits in [release readiness](release-readiness.md) are complete.
