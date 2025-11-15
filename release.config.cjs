module.exports = {
    pkgRoot: 'dist',
    branches: ['main', { name: 'beta', prerelease: true }, { name: 'next', prerelease: true }],
    plugins: [
        [
            '@semantic-release/commit-analyzer',
            {
                preset: 'angular',
                rules: [
                    { type: 'feat', release: 'minor' },
                    { type: 'fix', release: 'patch' },
                    { type: 'perf', release: 'patch' },
                    { type: 'revert', release: 'patch' },
                    { type: 'docs', release: false },
                    { type: 'style', release: false },
                    { type: 'chore', release: false },
                    { type: 'refactor', release: false },
                    { type: 'test', release: false }
                ]
            }
        ],
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/changelog',
            {
                changelogFile: 'CHANGELOG.md'
            }
        ],
        [
            '@semantic-release/npm',
            {
                npmPublish: true,
                access: 'public',
                registry: 'https://registry.npmjs.org/'
            }
        ],
        [
            '@semantic-release/npm',
            {
                npmPublish: true,
                access: 'public',
                registry: 'https://npm.pkg.github.com/'
            }
        ],
        [
            '@semantic-release/git',
            {
                assets: ['package.json', 'CHANGELOG.md'],
                message:
                    'chore(release): version ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
            }
        ],
        '@semantic-release/github'
    ]
};
