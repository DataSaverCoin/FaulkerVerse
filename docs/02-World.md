# FaulkerVerse World Design

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-07-19

---

# Purpose

This document defines the structure, philosophy, and long-term vision of the world within FaulkerVerse.

The world is the foundation upon which every gameplay system is built. Transportation, businesses, NPCs, events, weather, and player progression all depend on a believable, interconnected environment.

This document defines what the world should become. Technical implementation details belong in the Architecture documentation.

---

# World Philosophy

The world is not simply a map.

It is a living simulation.

Every road, building, business, vehicle, pedestrian, and event should contribute to the illusion that the player is visiting a real city.

The world should continue functioning whether or not the player interacts with it.

---

# Setting

FaulkerVerse is set within an authentic recreation of downtown St. Louis, Missouri.

Rather than inventing a fictional city, the goal is to recreate the recognizable layout, atmosphere, and identity of one of America's most unique downtown districts.

Players familiar with St. Louis should recognize:

- Streets
- Landmarks
- Parks
- Hotels
- Stadiums
- Major intersections
- Public spaces
- Historic architecture

Authenticity strengthens immersion while creating an emotional connection for players who know the city.

---

# World Design Goals

The world should always strive to be:

- Authentic
- Believable
- Dynamic
- Readable
- Fun to explore
- Technically scalable
- Designed for long-term expansion

No individual feature should compromise these goals.

---

# City Structure

The city is organized into districts.

Each district has its own identity, atmosphere, businesses, traffic patterns, and opportunities.

Example districts include:

- Downtown Core
- Stadium District
- Washington Avenue
- Riverfront
- Convention District
- Union Station
- Civic Center

Future expansions may include:

- Soulard
- Midtown
- The Hill
- Central West End
- Forest Park
- Clayton

Districts should feel different without feeling disconnected.

---

# Roads

Roads form the backbone of the simulation.

The road network should closely match real downtown St. Louis wherever practical.

Roads influence:

- Navigation
- Traffic
- Ride requests
- Deliveries
- NPC movement
- Emergency response
- Business access

Players should gradually learn the city just as someone living there would.

Knowledge of the streets becomes a valuable gameplay skill.

---

# Buildings

Buildings define the character of the city.

Not every building requires an interior.

Buildings generally fall into several categories:

## Landmarks

Unique buildings that define the skyline.

Examples include stadiums, hotels, monuments, and historic structures.

---

## Businesses

Locations that provide gameplay.

Examples include:

- Restaurants
- Hotels
- Stores
- Offices
- Entertainment venues

---

## Residential Buildings

Apartments, condominiums, and housing.

Some may contain accessible interiors.

---

## Decorative Buildings

Buildings that primarily create visual authenticity.

These typically do not require interiors.

---

# Interiors

Interiors should exist where they create meaningful gameplay.

Priority should be given to:

- Businesses
- Player-owned properties
- Hotels
- Public buildings
- Important landmarks

The objective is quality rather than quantity.

A smaller number of highly interactive interiors is preferable to hundreds of empty rooms.

---

# Points of Interest

The city should reward exploration.

Points of Interest may include:

- Parks
- Public art
- Rooftops
- Scenic overlooks
- Hidden alleys
- Observation areas
- Historical markers
- Waterfront locations

Players should continually discover places they have never noticed before.

---

# Time of Day

Time is a core simulation system.

Different times of day should naturally change the city.

## Morning

- Commuters
- Coffee shops
- Deliveries
- Office traffic

---

## Afternoon

- Shopping
- Tourism
- Lunch crowds
- Business activity

---

## Evening

- Sporting events
- Entertainment
- Restaurants
- Increased transportation demand

---

## Night

- Nightlife
- Reduced traffic
- Maintenance crews
- Different NPC behavior
- Different atmosphere

The city should feel like four different places over the course of a single day.

---

# Weather

Weather affects far more than visuals.

It influences:

- Lighting
- Pedestrian behavior
- Traffic volume
- Transportation demand
- Outdoor events
- Ambient audio
- Visibility

Weather should make familiar streets feel different every day.

---

# Events

Scheduled events create variation throughout the simulation.

Examples include:

- Cardinals games
- Blues games
- Concerts
- Festivals
- Parades
- Conventions
- Holiday celebrations

Events temporarily reshape the city by affecting:

- Traffic
- Parking
- Businesses
- NPC density
- Ride demand
- Police presence

---

# NPC Population

The city's population should appear to have purpose.

NPCs should:

- Travel between locations
- Work jobs
- Visit businesses
- Attend events
- Return home
- React to weather
- React to time of day

The player should rarely encounter pedestrians who appear to exist only for decoration.

---

# Transportation Network

Transportation connects every major gameplay system.

The city supports:

- Walking
- Personal vehicles
- Golf carts
- Delivery vehicles
- Public transportation (future)
- Emergency vehicles (future)

Transportation should feel like a natural part of the city rather than an isolated mechanic.

---

# Exploration

Exploration should always reward curiosity.

Players may discover:

- Hidden shortcuts
- New businesses
- Scenic locations
- Collectibles
- New opportunities
- Interesting NPC activity
- Future investments

No area of the city should feel meaningless.

---

# World Expansion

The city should be designed for continuous growth.

Expansion should occur by adding:

- New districts
- Additional interiors
- More businesses
- More careers
- More events
- More transportation systems

Existing systems should continue functioning without redesign.

---

# Technical Direction

Although implementation details belong elsewhere, the world should be designed with scalability in mind.

The architecture should support:

- District-based streaming
- Modular assets
- Data-driven businesses
- Expandable road networks
- Dynamic NPC spawning
- Configurable events
- Persistent world state

Future growth should be expected rather than treated as an exception.

---

# Definition of Success

The world succeeds when players stop navigating with the user interface and begin navigating from memory.

Players should remember:

"The shortcut behind the stadium."

"The coffee shop on that corner."

"The alley that avoids post-game traffic."

"The rooftop with the best sunset."

When players develop memories of places instead of simply completing objectives, the world has become believable.

---

# World Vision Statement

The city is not merely the setting of FaulkerVerse.

The city is its greatest character.

Every street should tell a story.

Every district should have a personality.

Every visit should create another memory.