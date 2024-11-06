import skyVertex from "./shaders/sky/vertex.glsl?raw";
import skyFragment from "./shaders/sky/fragment.glsl?raw";
import groundVertex from "./shaders/ground/vertex.glsl?raw";
import groundFragment from "./shaders/ground/fragment.glsl?raw";
import grassVertex from "./shaders/grass/vertex.glsl?raw";
import grassFragment from "./shaders/grass/fragment.glsl?raw";

import commonShader from "./shaders/common.glsl?raw";

export const shaders: Record<string, { vertex: string; fragment: string }> = {
  sky: {
    vertex: commonShader + skyVertex,
    fragment: commonShader + skyFragment,
  },
  grass: {
    vertex: commonShader + grassVertex,
    fragment: commonShader + grassFragment,
  },
  ground: {
    vertex: commonShader + groundVertex,
    fragment: commonShader + groundFragment,
  },
};
