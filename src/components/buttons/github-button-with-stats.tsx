'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, Star, GitFork, ExternalLink } from 'lucide-react';
import { useGithubStats } from '../../hooks/useGithubStats';
import { useCanvasConfetti } from '../../hooks/useCanvasConfetti';
import { formatCompactNumber } from '../../lib/utils/formatters/number';

export interface GithubButtonWithStatsProps {
    /** GitHub repository URL (e.g., 'https://github.com/owner/repo') */
    githubUrl: string;
    /** Button text labels */
    labels?: {
        buttonTitle?: string;
        loading?: string;
        starTitle?: string;
        starDescription?: string;
        forkTitle?: string;
        forkDescription?: string;
        viewTitle?: string;
        viewDescription?: string;
        viewBadge?: string;
    };
}

const defaultLabels = {
    buttonTitle: 'GitHub',
    loading: '...',
    starTitle: 'Star on GitHub',
    starDescription: 'Support the project',
    forkTitle: 'Fork Repository',
    forkDescription: 'Create your own copy',
    viewTitle: 'View on GitHub',
    viewDescription: 'Explore the codebase',
    viewBadge: 'Open'
};

export function GithubButtonWithStats({ githubUrl, labels }: GithubButtonWithStatsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { stargazers_count, forks_count, isStatsLoading } = useGithubStats();

    const t = { ...defaultLabels, ...labels };

    const { containerRef, triggerConfetti } = useCanvasConfetti({
        effect: 'stars',
        enabled: true,
        intensity: 'high',
        colors: ['#000000', '#ffffff', '#0070f3', '#ff0080', '#7928ca']
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleMenuClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="group flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-medium text-gray-800 shadow-sm transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-500 dark:hover:bg-gray-700"
            >
                <div className="flex size-8 items-center justify-center rounded-lg transition-colors">
                    <Github size={24} className="text-gray-900 dark:text-white" />
                </div>

                <span className="font-medium text-gray-800 dark:text-white">{t.buttonTitle}</span>

                <div className="flex items-center gap-2">
                    {isStatsLoading ? (
                        <>
                            <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                <Star size={10} className="text-gray-400 dark:text-gray-500" />
                                <span className="animate-pulse text-xs text-gray-500 dark:text-gray-400">
                                    {t.loading}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2 py-1 dark:border-gray-600 dark:bg-gray-700">
                                <GitFork size={10} className="text-gray-400 dark:text-gray-500" />
                                <span className="animate-pulse text-xs text-gray-500 dark:text-gray-400">
                                    {t.loading}
                                </span>
                            </div>
                        </>
                    ) : stargazers_count ? (
                        <>
                            <div className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 dark:border-yellow-600 dark:bg-yellow-900/30">
                                <Star
                                    size={10}
                                    className="fill-current text-orange-500 dark:text-yellow-400"
                                />
                                <span className="text-xs font-medium text-orange-600 dark:text-yellow-300">
                                    {formatCompactNumber(stargazers_count)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 dark:border-blue-600 dark:bg-blue-900/30">
                                <GitFork size={10} className="text-indigo-500 dark:text-blue-400" />
                                <span className="text-xs font-medium text-indigo-600 dark:text-blue-300">
                                    {formatCompactNumber(forks_count)}
                                </span>
                            </div>
                        </>
                    ) : null}
                </div>

                <svg
                    className={`size-4 text-gray-500 transition-transform duration-300 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
                    <div className="p-1">
                        <button
                            ref={containerRef as any}
                            onMouseEnter={() => triggerConfetti()}
                            onClick={() => handleMenuClick(githubUrl + '/stargazers')}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-gray-700 transition-all duration-200 hover:bg-orange-50 dark:text-gray-200 dark:hover:bg-yellow-900/20"
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-yellow-900/40">
                                <Star
                                    className="fill-current text-orange-500 dark:text-yellow-400"
                                    size={16}
                                />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {t.starTitle}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {t.starDescription}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isStatsLoading ? (
                                    <div className="inline-flex animate-pulse items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                        {t.loading}
                                    </div>
                                ) : stargazers_count ? (
                                    <div className="inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
                                        <Star className="mr-1 size-3 fill-current" />
                                        {formatCompactNumber(stargazers_count)}
                                    </div>
                                ) : null}
                                <ExternalLink
                                    className="text-gray-400 dark:text-gray-500"
                                    size={12}
                                />
                            </div>
                        </button>
                        <button
                            onClick={() => handleMenuClick(githubUrl + '/fork')}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-gray-700 transition-all duration-200 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-blue-900/20"
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-blue-900/40">
                                <GitFork className="text-indigo-500 dark:text-blue-400" size={16} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {t.forkTitle}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {t.forkDescription}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isStatsLoading ? (
                                    <div className="inline-flex animate-pulse items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                        {t.loading}
                                    </div>
                                ) : stargazers_count ? (
                                    <div className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                        <GitFork className="mr-1 size-3" />
                                        {formatCompactNumber(forks_count)}
                                    </div>
                                ) : null}
                                <ExternalLink
                                    className="text-gray-400 dark:text-gray-500"
                                    size={12}
                                />
                            </div>
                        </button>
                        <button
                            onClick={() => handleMenuClick(githubUrl)}
                            className="flex w-full items-center gap-3 rounded-lg p-2 text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                                <Github className="text-gray-600 dark:text-gray-300" size={16} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {t.viewTitle}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {t.viewDescription}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    <Github className="mr-1 size-3" />
                                    {t.viewBadge}
                                </div>
                                <ExternalLink
                                    className="text-gray-400 dark:text-gray-500"
                                    size={12}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GithubButtonWithStats;
