uniform vec2 resolution;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

vec3 COLOR_LIGHT_BLUE = vec3(0.42, 0.65, 0.85);
vec3 COLOR_BRIGHT_BLUE = vec3(0.01, 0.2, 1.0);
vec3 COLOR_LIGHT_RED = vec3(0.85, 0.28, 0.28);
vec3 COLOR_DARK_YELLOW = vec3(0.25, 0.25, 0.0625);

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 lightDir = normalize(vec3(-1.0, 0.5, 1.0));

  float skyT = exp(saturate(viewDir.y) * -40.0);
  float sunFactor = pow(saturate(dot(lightDir, vec3(viewDir.x, -viewDir.y, viewDir.z))), 8.0);
  vec3 skyColor = mix(vec3(0.025, 0.065, 0.5), vec3(0.4, 0.5, 1.0), skyT);
  vec3 sunColor = vec3(1.0, 0.9, 0.65);
  vec3 color = mix(skyColor, sunColor, sunFactor);

  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}