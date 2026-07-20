# FaulkerVerse Engine Specification

Version: Sprint 0

---

# Vision

Build a professional-quality open-world RPG engine that is easy to understand, extend, and maintain.

The engine should support future systems without requiring architectural rewrites.

---

# Core Principles

## 1. Single Responsibility

Every class owns exactly one responsibility.

Examples:

Player
- Movement
- Collision
- State

CameraController
- Orbit
- Zoom
- Camera collision

CharacterManager
- Character loading
- Character attachment
- Equipment

AnimationController
- Animation playback
- Animation transitions

---

## 2. Single Source of Truth

Movement exists only in Player.

Everything else reads Player.

Nothing else moves the player.

---

## 3. Data Flow

Input

↓

Player

↓

Character

↓

Animation

Camera reads Player only.

---

## 4. Gameplay Never Owns Rendering

Gameplay determines state.

Rendering displays state.

Never mix the two.

---

## 5. Small Files

Target file size:

150–300 lines.

Large files should be split into systems.

---

## Folder Structure

assets/
css/
engine/
player/
world/
ui/
entities/

---

## Naming Convention

Classes:

PascalCase

Examples:

Game

Player

Terrain

World

CameraController

AnimationController

CharacterManager

Files match class names.

---

## Sprint Roadmap

Sprint 0
Engine Bootstrap

Sprint 1
Scene
Lighting
Sky

Sprint 2
Terrain

Sprint 3
Input

Sprint 4
Player

Sprint 5
Camera

Sprint 6
Character

Sprint 7
Animation

Sprint 8
Environment

Sprint 9
NPCs

Sprint 10
Vehicles

Sprint 11
Inventory

Sprint 12
Saving

Sprint 13
Networking

---

## Engine Rule

If ownership is unclear,

the architecture is wrong.

Fix the architecture.

Never patch around it.
