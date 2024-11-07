varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

varying vec3 v_color;

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
  float skyT = exp(saturate(0.0) * -40.0);
  float sunFactor = pow(saturate(dot(lightDir, viewDir)), 8.0);
  vec3 skyColor = mix(vec3(0.025, 0.065, 0.5), vec3(0.4, 0.5, 1.0), skyT);
  vec3 sunColor = vec3(1.0, 0.9, 0.65);
  vec3 fogColor = mix(skyColor, sunColor, sunFactor);

  // Fog
  float fogDist = distance(cameraPosition, vWorldPosition) / 8.0;
  float inscatter = 1.0 - exp(-fogDist * fogDist * mix(0.0005, 0.001, sunFactor));
  float extinction = exp(-fogDist * fogDist * 0.01);

  vec3 color = dirt.rgb * extinction + fogColor * inscatter;


  gl_FragColor = vec4(pow(color, vec3(1.0 / 1.75)), 1.0);
}