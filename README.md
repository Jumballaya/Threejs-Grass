# Grass Rendering

[Simon Dev video](https://www.youtube.com/watch?v=bp7REZBV4P4) explaining the concept.

This was created following the Simon Dev shader course.

## Demo

[Try this out yourself](https://jumballaya.github.io/Threejs-Grass/)

### TODO

1. fix loader issue -- use load manager? full load assets before loading the world
   a. Application -> 1. load assets -> 2. load world and run three js
2. Create a rocks foliage that is based off of the grass that will scatter rocks over the
   the terrain based on the blue channel of the data texture
3. Create a close/medium/far LOD system for the terrain tiles as well as the foliage
   and then conditional render tiles/terrain sections
4. Fix terrain tile gaps
