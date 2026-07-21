/*
========================================================

FaulkerVerse Engine

File:
    Version.js

Purpose:
    Centralized build information
    and startup performance metrics.

========================================================
*/

"use strict";

import { BuildInfo } from "./build-info.generated.js";

export const Version = Object.freeze(
    {
        Number: BuildInfo.version,
        Sprint: BuildInfo.sprint,
        Branch: BuildInfo.branch,
        Commit: BuildInfo.commit,
        BuildDate: BuildInfo.date,

        get Label()
        {
            return `FaulkerVerse v${this.Number}`;
        },

        get ShortLabel()
        {
            return `v${this.Number} · ${this.Sprint}`;
        }
    }
);

export class StartupMetrics
{
    static timings = new Map();
    static groups = new Map();

    static now()
    {
        return globalThis.performance
            ? globalThis.performance.now()
            : Date.now();
    }

    static begin(name)
    {
        const startedAt =
            this.now();
        let completed = false;

        return () =>
        {
            if (completed)
            {
                return;
            }

            completed = true;
            this.add(
                name,
                this.now() - startedAt
            );
        };
    }

    static beginGroup(name)
    {
        let group =
            this.groups.get(name);

        if (!group)
        {
            group = {
                active: 0,
                startedAt: 0
            };
            this.groups.set(
                name,
                group
            );
        }

        if (group.active === 0)
        {
            group.startedAt =
                this.now();
        }

        group.active += 1;
        let completed = false;

        return () =>
        {
            if (completed)
            {
                return;
            }

            completed = true;
            group.active -= 1;

            if (group.active === 0)
            {
                this.add(
                    name,
                    this.now() - group.startedAt
                );
            }
        };
    }

    static add(name, milliseconds)
    {
        const current =
            this.timings.get(name) || 0;

        this.timings.set(
            name,
            current + milliseconds
        );
    }

    static logBuild()
    {
        console.info(
            `[FaulkerVerse] ${Version.Label}`
        );
        console.info(
            `[FaulkerVerse] ${Version.Sprint} | ` +
            `branch ${Version.Branch} | ` +
            `commit ${Version.Commit} | ` +
            `built ${Version.BuildDate}`
        );
    }

    static logSummary()
    {
        console.groupCollapsed(
            "[FaulkerVerse] Startup timings"
        );

        for (const [name, milliseconds] of this.timings)
        {
            console.info(
                `${name}: ${milliseconds.toFixed(2)} ms`
            );
        }

        console.groupEnd();
    }
}
