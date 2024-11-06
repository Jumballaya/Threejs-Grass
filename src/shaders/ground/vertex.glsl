varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

varying vec3 v_color;

uniform float u_tile_id;
uniform sampler2DArray tileDataTexture;
uniform float patchSize;

void main() {
  vec4 terrain = texture(tileDataTexture, vec3(uv, u_tile_id));
  vec4 localSpacePosition = vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * localSpacePosition;
  worldPosition.xyz = terrainHeight(worldPosition.xyz, terrain);

  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vUv = uv;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;

  v_color = terrain.rgb;
}