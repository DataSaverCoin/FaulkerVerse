/*
========================================================

FaulkerVerse Engine

File:
    AnimationController.js

Purpose:
    Owns player animation loading
    and state transitions.

========================================================
*/

"use strict";

import { StartupMetrics } from "../engine/Version.js";

export class AnimationController
{
    constructor(assetManager, input)
    {
        this.assetManager =
            assetManager;
        this.input = input;

        this.animations = new Map();
        this.currentState = null;
        this.currentAnimation = null;

        this.jumpWasDown = false;
        this.ready = false;
    }

    async initialize(
        characterName,
        skeletons,
        characterAnimations = []
    )
    {
        const finishAnimationStartup =
            StartupMetrics.begin(
                "Animations"
            );

        try
        {
            for (const animation of characterAnimations)
            {
                animation.stop();
            }

            const animationFiles = {
                Idle: "Idle",
                Walk: "Walking",
                Run: "Running",
                Jump: "Jump"
            };

            await Promise.all(
                Object.entries(
                    animationFiles
                ).map(
                    async ([state, fileName]) =>
                    {
                        const animation =
                            await this.loadAnimation(
                                characterName,
                                fileName,
                                skeletons
                            );

                        this.animations.set(
                            state,
                            animation
                        );
                    }
                )
            );

            this.ready = true;
            this.setState(
                "Idle"
            );
        }
        finally
        {
            finishAnimationStartup();
        }
    }

    update()
    {
        if (!this.ready)
        {
            return;
        }

        const jumpIsDown =
            this.input.isDown(
                "Space"
            );
        const jumpStarted =
            jumpIsDown &&
            !this.jumpWasDown;

        this.jumpWasDown =
            jumpIsDown;

        if (jumpStarted)
        {
            this.setState(
                "Jump"
            );
            return;
        }

        if (
            this.currentState === "Jump" &&
            this.currentAnimation.isPlaying
        )
        {
            return;
        }

        const movement =
            this.input.getMoveVector();
        const isMoving =
            movement.x !== 0 ||
            movement.z !== 0;

        if (!isMoving)
        {
            this.setState(
                "Idle"
            );
        }
        else if (this.input.isRunning())
        {
            this.setState(
                "Run"
            );
        }
        else
        {
            this.setState(
                "Walk"
            );
        }
    }

    async loadAnimation(
        characterName,
        animationName,
        skeletons
    )
    {
        const result =
            await this.assetManager.loadCharacterAnimation(
                characterName,
                animationName
            );

        const sourceAnimation =
            result.animationGroups[0];

        if (!sourceAnimation)
        {
            throw new Error(
                `${animationName}.glb does not contain an animation group.`
            );
        }

        const animation = sourceAnimation.clone(
            `${characterName}_${animationName}`,
            target =>
            {
                const transformNode =
                    this.assetManager.findSkeletonTransformNode(
                        skeletons,
                        target.name
                    );

                if (!transformNode)
                {
                    throw new Error(
                        `Unable to bind animation target ${target.name}.`
                    );
                }

                return transformNode;
            }
        );

        this.removeRootMotion(
            animation
        );

        return animation;
    }

    removeRootMotion(animationGroup)
    {
        const hipsPositionAnimation =
            animationGroup.targetedAnimations.find(
                targetedAnimation =>
                    targetedAnimation.target.name.endsWith(
                        "mixamorig:Hips"
                    ) &&
                    targetedAnimation.animation.targetProperty ===
                        "position"
            );

        if (!hipsPositionAnimation)
        {
            return;
        }

        const animation =
            hipsPositionAnimation.animation;
        const keys = animation.getKeys();

        if (keys.length < 2)
        {
            return;
        }

        const firstKey = keys[0];
        const lastKey = keys[keys.length - 1];
        const frameRange =
            lastKey.frame - firstKey.frame;

        if (frameRange === 0)
        {
            return;
        }

        const rootDisplacement =
            lastKey.value.subtract(
                firstKey.value
            );

        animation.setKeys(
            keys.map(
                key =>
                {
                    const progress =
                        (key.frame - firstKey.frame) /
                        frameRange;

                    return {
                        ...key,
                        value: key.value.subtract(
                            rootDisplacement.scale(
                                progress
                            )
                        )
                    };
                }
            )
        );
    }

    setState(state)
    {
        if (state === this.currentState)
        {
            return;
        }

        const nextAnimation =
            this.animations.get(
                state
            );

        if (!nextAnimation)
        {
            return;
        }

        if (this.currentAnimation)
        {
            this.currentAnimation.stop();
        }

        this.currentState = state;
        this.currentAnimation =
            nextAnimation;

        this.currentAnimation.start(
            state !== "Jump"
        );
    }
}
