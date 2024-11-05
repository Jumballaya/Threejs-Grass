import skyVertex from "./shaders/sky/vertex.glsl?raw";
import skyFragment from "./shaders/sky/fragment.glsl?raw";
import groundVertex from "./shaders/ground/vertex.glsl?raw";
import groundFragment from "./shaders/ground/fragment.glsl?raw";
import grassVertex from "./shaders/grass/vertex.glsl?raw";
import grassFragment from "./shaders/grass/fragment.glsl?raw";

export const shaders: Record<string, { vertex: string; fragment: string }> = {
  sky: {
    vertex: skyVertex,
    fragment: skyFragment,
  },
  grass: {
    vertex: grassVertex,
    fragment: grassFragment,
  },
  ground: {
    vertex: groundVertex,
    fragment: groundFragment,
  },
};
