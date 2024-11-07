varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

varying vec3 v_color;

uniform float time;
uniform sampler2D diffuseTexture;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Dirt
  float groundHash = hashv2(floor(vWorldPosition.xz * 2.0));
  mat3 rot = rotateY(3.141596 / 3.0 * groundHash);
	vec4 dirt1 = texture(diffuseTexture, (rot * vWorldPosition).xz);
	vec4 dirt2 = texture(diffuseTexture, vWorldPosition.xz * 3.0);
  vec4 dirt = mix(dirt1, dirt2, saturate(groundHash));

  // Lighting
  vec3 lightDir = normalize(vec3(-1.0, 0.5, 1.0));
  vec3 lightColor = vec3(1.0);

  // Fog
  vec3 color = applyFog(
    cameraPosition,
    vWorldPosition,
    lightDir,
    viewDir,
    4.0,
    dirt.rgb,
    getSkyColor(remap(cos(time / 20.0), -1.0, 1.0, 0.0, 0.1), lightDir, viewDir),
    COLOR_SUN
  );

  gl_FragColor = vec4(pow(color, vec3(1.0 / 1.75)), 1.0);
}