# AGENTS.md

# FaulkerVerse AI Development Guide

This file defines the engineering standards for every AI agent
working on the FaulkerVerse project.

Every task should follow these rules.

---

# Project

Name:
FaulkerVerse

Engine:
BabylonJS

Language:
JavaScript (ES Modules)

Repository Philosophy:

The project is an existing game engine.

DO NOT rebuild it.

DO NOT scaffold a new project.

Extend what already exists.

---

# Primary Goal

Build a playable open-world RPG one sprint at a time.

Every completed sprint must leave the project in a runnable state.

Working software is always preferred over perfect architecture.

---

# Architecture

Existing folders:

assets/
engine/
player/
world/
entities/
ui/
css/

Do not introduce alternate folder structures.

Do not create:

src/
public/
dist/
build/

unless explicitly requested.

---

# Entry Point

The project already contains an entry point.

Never replace:

index.html

Never create a second entry point.

Never scaffold a new application.

---

# Existing Systems

These systems already exist and should be preserved whenever possible.

AssetManager

EntityManager

Player

CameraController

DeveloperHUD

World

Input

Engine

Extend these systems instead of replacing them.

---

# Asset Rules

Characters live in:

assets/characters/

Example:

assets/characters/corey/player.glb

Future examples:

assets/characters/nicole/
assets/characters/npc_male01/
assets/characters/npc_female01/

Never duplicate assets.

Never move existing assets.

---

# Character System

The player should eventually support:

Idle

Walk

Run

Jump

Fall

Land

Death

Additional animation states should be added through the animation
system rather than hardcoded.

---

# Sprint Philosophy

Each sprint should accomplish ONE gameplay goal.

Examples:

Sprint 6.2

Replace the white capsule with Corey.

Sprint 6.3

Idle animation.

Sprint 6.4

Walking animation.

Sprint 6.5

Running animation.

Sprint 6.6

Jumping.

Do not combine multiple gameplay systems into one sprint.

---

# Engineering Philosophy

Small commits.

Small pull requests.

Small refactors.

Working game after every sprint.

Never redesign the architecture unless specifically requested.

---

# Coding Style

Use ES Modules.

Use existing formatting.

Use descriptive names.

Avoid unnecessary abstraction.

Prefer readable code over clever code.

Split classes when they become difficult to understand.

Target approximately:

150–250 lines per class.

Instead of:

Player.js
(700 lines)

Prefer:

Player.js

PlayerMovement.js

PlayerCharacter.js

PlayerAnimation.js

PlayerInventory.js

---

# Modification Rules

Before editing:

Understand the existing implementation.

Modify the minimum number of files required.

Do not rename files unnecessarily.

Do not move folders unnecessarily.

Do not introduce new frameworks.

---

# Implementation Rules

Always preserve:

WASD movement

Third-person camera

Developer HUD

EntityManager update loop

AssetManager

Input handling

Only change what is required for the current sprint.

---

# Forbidden Changes

Do NOT:

Create a new project.

Replace index.html.

Create src/.

Create public/.

Introduce React.

Introduce Vue.

Introduce Angular.

Introduce TypeScript.

Introduce Vite.

Introduce Webpack.

Introduce Rollup.

Introduce npm dependencies unless explicitly requested.

---

# Assets

GLB is the preferred runtime format.

FBX files are source assets only.

The engine should load GLB files.

---

# AI Expectations

Before modifying code:

Understand the project.

Explain the implementation approach.

Modify only the required files.

After implementation:

Summarize:

Files changed

Reason for each change

Anything requiring testing

Known limitations

---

# Long-Term Vision

FaulkerVerse should eventually support:

Large streaming world

NPCs

Vehicles

Inventory

Combat

Quests

Multiplayer (future)

Weather

Day/night cycle

Wildlife

Buildings

Save/load

All new systems should integrate with the existing architecture rather
than replacing it.

---

# Final Rule

If there is a choice between:

A clever solution

or

A simple solution that keeps the game working

Always choose the simple solution.

A playable game is the highest priority.