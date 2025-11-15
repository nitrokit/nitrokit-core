# 1.0.0 (2025-11-15)


### Features

* Set up core application infrastructure ([f0f19ca](https://github.com/nitrokit/nitrokit-core/commit/f0f19cab8f844f0a57cf5b0da36c390edd8e6849))

# [4.0.0](https://github.com/nitrokit/nitrokit-core/compare/v3.1.0...v4.0.0) (2025-11-15)


* refactor!: Streamlines package exports and build process ([f1060da](https://github.com/nitrokit/nitrokit-core/commit/f1060da2683d8f16fc9521e1884e75fd953db45c))


### Features

* Refine module exports and type definitions ([a69f5f0](https://github.com/nitrokit/nitrokit-core/commit/a69f5f0ac17bec317da37ac6aab2e9fb0e264e35))


### BREAKING CHANGES

* The module export structure in `package.json` has been significantly revised. Consumers relying on specific `node` conditional exports or explicit `.d.ts` type paths may need to update their import statements. This also removes legacy path aliases and simplifies type declaration paths.
* Modules exposed under `/env`, `/actions`, and `/services` are now exclusively available for Node.js environments via conditional exports. Consumers targeting non-Node environments must adjust their imports or usage accordingly.

# [3.1.0](https://github.com/nitrokit/nitrokit-core/compare/v3.0.0...v3.1.0) (2025-11-15)


### Features

* Introduces GitHub actions and metadata helpers ([7e20354](https://github.com/nitrokit/nitrokit-core/commit/7e20354211ad8e6e11c502da74a85fd67b3714f1))

# [3.0.0](https://github.com/nitrokit/nitrokit-core/compare/v2.0.0...v3.0.0) (2025-11-15)


### Features

* **core:** Enhance rate limiting and module exports ([51706b6](https://github.com/nitrokit/nitrokit-core/commit/51706b6d5c0a68f6230532479db19813285a6cee))
* Improves module exports and internal structure ([473356f](https://github.com/nitrokit/nitrokit-core/commit/473356f2c04da3cee1bc16b2d47b62229418be71))


### BREAKING CHANGES

* Consumers must now import `config` and `services` using their new dedicated subpath exports (e.g., `package-name/config`, `package-name/services`). Direct imports from the main package or `package-name/lib` for these modules are no longer supported.
* **core:** Package exports and entry points have been updated, which may require adjustments in consumer projects for module imports.

# [2.0.0](https://github.com/nitrokit/nitrokit-core/compare/v1.6.1...v2.0.0) (2025-11-15)

### Features

- Configures package for proper distribution ([6bc6d5e](https://github.com/nitrokit/nitrokit-core/commit/6bc6d5e261082fd8e9637f3a0bf8eba6cf1346e8))
- Prepares for v2.0.0 release ([8e8223b](https://github.com/nitrokit/nitrokit-core/commit/8e8223b929f35cc4c40ca2a0bdea9fe06ab58a0c))
- Set up core application infrastructure ([c6a9e44](https://github.com/nitrokit/nitrokit-core/commit/c6a9e4403d4ceac77cbcdcf41bf4155647afd82d))

### BREAKING CHANGES

- The package has been updated to v2.0.0. Refer to release notes for details on potential breaking changes.
- Updates package exports and migrates several direct dependencies to peerDependencies, requiring adjustments in consumer projects.

# [2.0.0](https://github.com/nitrokit/nitrokit-core/compare/v1.6.1...v2.0.0) (2025-11-15)

### Features

- Set up core application infrastructure ([c6a9e44](https://github.com/nitrokit/nitrokit-core/commit/c6a9e4403d4ceac77cbcdcf41bf4155647afd82d))

### BREAKING CHANGES

- Updates package exports and migrates several direct dependencies to peerDependencies, requiring adjustments in consumer projects.

## [1.6.1](https://github.com/nitrokit/nitrokit-core/compare/v1.6.0...v1.6.1) (2025-11-15)

### Bug Fixes

- **tooling:** Stabilize build, lint, and test configurations ([67c68cf](https://github.com/nitrokit/nitrokit-core/commit/67c68cfebf8810a978f0fe66ee5db6f084320ad2))

# 1.0.0 (2025-11-15)

### Features

- Add messaging, security, and rate limit features ([26dffc3](https://github.com/nitrokit/nitrokit-core/commit/26dffc3c39abdf0233b7e42789baa56de4db14a6))
- Adds GitHub API service and robust logging ([fa55624](https://github.com/nitrokit/nitrokit-core/commit/fa55624d34744e116e48f160e542968a7a5ec988))
- Adds logo and badges to README ([93ccaba](https://github.com/nitrokit/nitrokit-core/commit/93ccaba694a86d0add55eb7be8da672b9338a1de))
- Expands core utilities and introduces new hooks ([382b385](https://github.com/nitrokit/nitrokit-core/commit/382b385fe096e6786a0af60c7ded0237025496d7))
- Initializes core package structure ([36115ed](https://github.com/nitrokit/nitrokit-core/commit/36115ed9fc871fbbfc0b1e2a7155f7b8b045087b))
- Introduce extensive type definitions ([543e806](https://github.com/nitrokit/nitrokit-core/commit/543e80680e9f8ae89fc87971980613c5c24287bd))
- **tests:** Improve utility test coverage ([2adb7cb](https://github.com/nitrokit/nitrokit-core/commit/2adb7cbbfea884eb1e08e5327832e73a6a6aeb6a))

### BREAKING CHANGES

- Updates package.json to use 'exports' field, providing modular entry points. This changes how the package is imported and may require adjustments in consumer projects.
- Migrates several direct dependencies to peerDependencies (e.g., class-variance-authority, zod), requiring consumers to install these packages explicitly.

Introduces a comprehensive set of new React hooks for common UI interactions and states, including confetti effects, cookie consent management, global keyboard shortcuts, hover animations, mobile device detection, theme management, and sticky navbar behavior.

Adds new utility functions for conditionally merging Tailwind classes, creating asynchronous delays, robust error handling, and formatting numbers and phone numbers.

Integrates environment variable management using `@t3-oss/env-nextjs` and provides a builder for Vercel deploy URLs.

Refactors the module entry points and updates build configuration for improved modularity and modern development practices.
