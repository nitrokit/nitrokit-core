import { describe, it, expect } from 'vitest';
import { VercelDeployUrlBuilder } from './vercel-deploy-url.builder';

describe('VercelDeployUrlBuilder', () => {
    const BASE_URL = 'https://vercel.com/new/clone';

    it('should build the base URL with a trailing question mark when no parameters are provided', () => {
        const builder = new VercelDeployUrlBuilder();
        // URLSearchParams adds a '?' even if there are no parameters.
        expect(builder.build()).toBe(`${BASE_URL}?`);
    });

    it('should correctly add a single parameter like repository URL', () => {
        const repoUrl = 'https://github.com/user/repo';
        const builder = new VercelDeployUrlBuilder().withRepositoryUrl(repoUrl);
        const expected = `${BASE_URL}?repository-url=${encodeURIComponent(repoUrl)}`;
        expect(builder.build()).toBe(expected);
    });

    it('should correctly add a single environment variable', () => {
        const builder = new VercelDeployUrlBuilder().withEnv('VAR1');
        expect(builder.build()).toBe(`${BASE_URL}?env=VAR1`);
    });

    it('should correctly add and comma-separate multiple environment variables', () => {
        const builder = new VercelDeployUrlBuilder().withEnv('VAR1', 'VAR2', 'VAR3');
        // URLSearchParams encodes the comma (,) as %2C.
        expect(builder.build()).toBe(`${BASE_URL}?env=VAR1%2CVAR2%2CVAR3`);
    });

    it('should correctly add a project name', () => {
        const projectName = 'my-awesome-project';
        const builder = new VercelDeployUrlBuilder().withProjectName(projectName);
        expect(builder.build()).toBe(`${BASE_URL}?project-name=my-awesome-project`);
    });

    it('should correctly add a repository name', () => {
        const repoName = 'new-repo-name';
        const builder = new VercelDeployUrlBuilder().withRepositoryName(repoName);
        expect(builder.build()).toBe(`${BASE_URL}?repository-name=new-repo-name`);
    });

    it('should correctly add demo-related parameters', () => {
        const demoTitle = 'My Demo';
        const demoDesc = 'This is a great demo.';
        const demoUrl = 'https://example.com/demo';
        const demoImage = 'https://example.com/image.png';

        const builder = new VercelDeployUrlBuilder()
            .withDemoTitle(demoTitle)
            .withDemoDescription(demoDesc)
            .withDemoUrl(demoUrl)
            .withDemoImage(demoImage);

        const url = new URL(builder.build());
        expect(url.searchParams.get('demo-title')).toBe(demoTitle);
        expect(url.searchParams.get('demo-description')).toBe(demoDesc);
        expect(url.searchParams.get('demo-url')).toBe(demoUrl);
        expect(url.searchParams.get('demo-image')).toBe(demoImage);
    });

    it('should chain all methods together and build the correct URL', () => {
        const repoUrl = 'https://github.com/nitrokit/nitrokit-core';
        const projectName = 'nitrokit-project';
        const demoTitle = 'NitroKit Demo';

        const builder = new VercelDeployUrlBuilder()
            .withRepositoryUrl(repoUrl)
            .withProjectName(projectName)
            .withDemoTitle(demoTitle)
            .withEnv('DATABASE_URL', 'API_KEY');

        const url = new URL(builder.build());
        expect(url.origin + url.pathname).toBe(BASE_URL);
        expect(url.searchParams.get('repository-url')).toBe(repoUrl);
        expect(url.searchParams.get('project-name')).toBe(projectName);
        expect(url.searchParams.get('demo-title')).toBe(demoTitle);
        expect(url.searchParams.get('env')).toBe('DATABASE_URL,API_KEY');
    });
});
