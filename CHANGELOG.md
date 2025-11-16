# [4.4.0](https://github.com/nitrokit/nitrokit-core/compare/v4.3.1...v4.4.0) (2025-11-16)


### Features

* Introduce GitHub hooks and i18n types ([cd23187](https://github.com/nitrokit/nitrokit-core/commit/cd231873aed43f98d70e730a65ca5d022c872600))

## [4.3.1](https://github.com/nitrokit/nitrokit-core/compare/v4.3.0...v4.3.1) (2025-11-16)


### Bug Fixes

* **ci:** ensure package.json version updates propagate to dist\n\n- remove pkgRoot from semantic-release config\n- disable automatic npm publish in semantic-release\n- rebuild after semantic-release updates version\n- manually publish to both registries from dist\n- fix env test to handle .env file values ([5b30f0a](https://github.com/nitrokit/nitrokit-core/commit/5b30f0ac9b1352bd564586f0e0648683220b8396))

# [4.3.0](https://github.com/nitrokit/nitrokit-core/compare/v4.2.0...v4.3.0) (2025-11-16)


### Features

* Integrate Codecov for code coverage ([e118eee](https://github.com/nitrokit/nitrokit-core/commit/e118eeed5c7f00c1a43ee979fb43b6e8f6412c08))

# [4.2.0](https://github.com/nitrokit/nitrokit-core/compare/v4.1.1...v4.2.0) (2025-11-16)


### Features

* Add GitHub data hooks and i18n utilities ([aa54667](https://github.com/nitrokit/nitrokit-core/commit/aa54667bad40edd0b66ec709470caf1b28f5bd43))

## [4.1.1](https://github.com/nitrokit/nitrokit-core/compare/v4.1.0...v4.1.1) (2025-11-16)

### Bug Fixes

- **build:** correct dist publish + GPR flow\n\n- prepare dist/package.json (main/types/exports)\n- fix exports: ./urls\n- semantic-release: publish to npmjs only\n- workflow: add GitHub Packages publish step\n\nResolves post-publish 'module not found' issues. ([8157b9c](https://github.com/nitrokit/nitrokit-core/commit/8157b9c7f69e70a0cbeede52f6b7641780c07e13))

# [4.1.0](https://github.com/nitrokit/nitrokit-core/compare/v4.0.0...v4.1.0) (2025-11-15)

### Features

- **cli:** add --dry-run flag to simulate a release ([e284704](https://github.com/nitrokit/nitrokit-core/commit/e284704e1dc097bdb18a108f7b7e8f6c54092245))
- Set up core application infrastructure ([f0f19ca](https://github.com/nitrokit/nitrokit-core/commit/f0f19cab8f844f0a57cf5b0da36c390edd8e6849))
