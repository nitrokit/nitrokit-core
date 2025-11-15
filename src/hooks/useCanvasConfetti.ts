'use client';

import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

/**
 * Defines the available types of confetti animation effects.
 */
export type ConfettiEffectType =
    | 'none'
    | 'basic'
    | 'burst'
    | 'fireworks'
    | 'stars'
    | 'school-pride'
    | 'realistic'
    | 'snow'
    | 'emoji';

/**
 * Configuration options for the `useCanvasConfetti` hook.
 */
export interface ConfettiOptions {
    /** The type of confetti effect to trigger. */
    effect: ConfettiEffectType;
    /** Whether the confetti effect is currently enabled. */
    enabled: boolean;
    /** The intensity of the effect, controlling particle count and spread. */
    intensity?: 'low' | 'medium' | 'high';
    /** An array of hex color strings to use for the confetti particles. */
    colors?: string[];
    /** An array of emoji strings to use for the 'emoji' effect. */
    emoji?: string[];
}

/**
 * A React hook to trigger canvas-based confetti animations on a component.
 * It provides a ref to attach to a container element and a function to trigger the configured effect.
 *
 * @param options - Configuration for the confetti effect, including type, intensity, and colors.
 * @returns An object containing:
 *  - `containerRef`: A React ref to be attached to the element that will serve as the origin for the confetti.
 *  - `triggerConfetti`: A function to manually trigger the confetti animation.
 */
export const useCanvasConfetti = (options: ConfettiOptions) => {
    const containerRef = useRef<HTMLElement>(null);

    const getIntensitySettings = useCallback((intensity: string) => {
        switch (intensity) {
            case 'low':
                return { particleCount: 30, spread: 45, scalar: 0.6 };
            case 'high':
                return { particleCount: 100, spread: 70, scalar: 1.2 };
            default:
                return { particleCount: 60, spread: 55, scalar: 0.8 };
        }
    }, []);

    const triggerBasic = useCallback(
        (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            const settings = getIntensitySettings(options.intensity || 'medium');

            void confetti({
                ...settings,
                origin: { x, y },
                colors: options.colors || ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b']
            });
        },
        [options, getIntensitySettings]
    );

    const triggerBurst = useCallback(
        (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            const settings = getIntensitySettings(options.intensity || 'medium');

            const count = options.intensity === 'high' ? 3 : options.intensity === 'low' ? 1 : 2;

            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    void confetti({
                        ...settings,
                        origin: { x, y },
                        angle: 90 + (i - 1) * 30,
                        colors: options.colors
                    });
                }, i * 100);
            }
        },
        [options, getIntensitySettings]
    );

    const triggerFireworks = useCallback(
        (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            const duration = options.intensity === 'high' ? 3000 : 2000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min: number, max: number) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                void confetti({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(x - 0.1, x + 0.1),
                        y: randomInRange(y - 0.1, y + 0.1)
                    },
                    colors: options.colors
                });
            }, 250);
        },
        [options]
    );

    const triggerStars = useCallback(
        (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            void confetti({
                particleCount: options.intensity === 'high' ? 80 : 50,
                spread: 80,
                origin: { x, y },
                shapes: ['star'],
                colors: options.colors || ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#9370DB'],
                scalar: options.intensity === 'high' ? 1.2 : 0.8
            });
        },
        [options]
    );

    const triggerSnow = useCallback(
        (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;

            void confetti({
                particleCount: options.intensity === 'high' ? 100 : 60,
                spread: 60,
                origin: { x, y: 0 },
                shapes: ['circle'],
                colors: ['#ffffff', '#e0e7ff', '#dbeafe'],
                scalar: 0.6,
                gravity: 0.4,
                drift: 0.1
            });
        },
        [options]
    );

    const triggerEmoji = useCallback(
        (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            const emojis: string[] = options.emoji || ['🎉', '✨', '🎊', '🥳', '🎈'];

            void confetti({
                particleCount: options.intensity === 'high' ? 80 : 50,
                spread: 70,
                origin: { x, y },
                shapes: emojis as confetti.Shape[], // Burada tip dönüşümü yapıldı
                scalar: options.intensity === 'high' ? 1.5 : 1
            });
        },
        [options]
    );

    const triggerSchoolPride = useCallback(() => {
        const end = Date.now() + (options.intensity === 'high' ? 3000 : 2000);

        (function frame() {
            void confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: options.colors || ['#3b82f6', '#1d4ed8']
            });
            void confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: options.colors || ['#ef4444', '#dc2626']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }, [options]);

    const triggerRealistic = useCallback(
        (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            const count = options.intensity === 'high' ? 200 : 100;

            const defaults: confetti.Options = {
                origin: { x, y },
                colors: options.colors || [
                    '#ff0000',
                    '#00ff00',
                    '#0000ff',
                    '#ffff00',
                    '#ff00ff',
                    '#00ffff'
                ]
            };

            function fire(particleRatio: number, opts: confetti.Options) {
                void confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio)
                });
            }

            fire(0.25, {
                spread: 26,
                startVelocity: 55
            });

            fire(0.2, {
                spread: 60
            });

            fire(0.35, {
                spread: 100,
                decay: 0.91,
                scalar: 0.8
            });

            fire(0.1, {
                spread: 120,
                startVelocity: 25,
                decay: 0.92,
                scalar: 1.2
            });

            fire(0.1, {
                spread: 120,
                startVelocity: 45
            });
        },
        [options]
    );

    const handleTrigger = useCallback(() => {
        if (!containerRef.current || !options.enabled || options.effect === 'none') return;

        const element = containerRef.current;

        switch (options.effect) {
            case 'basic':
                triggerBasic(element);
                break;
            case 'burst':
                triggerBurst(element);
                break;
            case 'fireworks':
                triggerFireworks(element);
                break;
            case 'stars':
                triggerStars(element);
                break;
            case 'school-pride':
                triggerSchoolPride();
                break;
            case 'realistic':
                triggerRealistic(element);
                break;
            case 'snow':
                triggerSnow(element);
                break;
            case 'emoji':
                triggerEmoji(element);
                break;
            default:
                break;
        }
    }, [
        options,
        triggerBasic,
        triggerBurst,
        triggerFireworks,
        triggerStars,
        triggerSchoolPride,
        triggerRealistic,
        triggerSnow,
        triggerEmoji
    ]);

    return {
        containerRef,
        triggerConfetti: handleTrigger
    };
};
