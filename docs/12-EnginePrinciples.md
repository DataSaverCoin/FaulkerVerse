# Engine Principles

- Player owns movement.
- Camera never owns movement.
- Input never modifies transforms directly.
- Gameplay drives animation.
- Animation never drives gameplay.
- World owns terrain.
- EntityManager owns entities.