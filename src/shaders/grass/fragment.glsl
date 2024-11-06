uniform vec2 resolution;
uniform float time;

varying vec3 v_worldPosition;
varying vec3 v_color;
varying vec3 v_normal;
varying vec4 v_grassData; // [x pos, -, -, -]

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

vec3 phongSpecular(vec3 normal, vec3 viewDir, vec3 lightDir) {
  float dotNL = saturate(dot(normal, lightDir));
  vec3 r = normalize(reflect(-lightDir, normal));
  float phongValue = max(0.0, dot(viewDir, r));
  phongValue = pow(phongValue, 32.0);
  vec3 specular = dotNL * vec3(phongValue);
  return specular;
}

vec3 lambertLight(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 lightColor) {
  float wrap = 0.5;
  float dotNL = saturate((dot(normal, lightDir) + wrap) / (1.0 + wrap));
  vec3 lighting = vec3(dotNL);
  float backLight = saturate((dot(viewDir, -lightDir) + wrap) / (1.0 + wrap));
  vec3 scatter = vec3(pow(backLight, 2.0));
  lighting += scatter;
  return lighting * lightColor;
}

vec3 hemiLight(vec3 normal, vec3 groundColor, vec3 skyColor) {
  return mix(groundColor, skyColor, 0.5 * normal.y + 0.5);
}

void main() {
  vec3 baseColor = mix(v_color * 0.75, v_color, smoothstep(0.125, 0.0, abs(v_grassData.x)));
  vec3 normal = normalize(v_normal);
  vec3 viewDir = normalize(cameraPosition - v_worldPosition);

  // Hemi lighting
  vec3 c1 = vec3(1.0, 1.0, 0.75);
  vec3 c2 = vec3(0.05, 0.05, 0.25);
  vec3 ambientLighting = hemiLight(normal, c2, c1);

  // Directional light
  vec3 lightDir = normalize(vec3(-1.0, 0.5, 1.0));
  vec3 lightColor = vec3(1.0);
  vec3 diffuseLighting = lambertLight(normal, viewDir, lightDir, lightColor);

  // Specular lighting
  vec3 specular = phongSpecular(normal, viewDir, lightDir);

  // Fake AO
  float ao = remap(pow(v_grassData.y, 2.0), 0.0, 1.0, 0.125, 1.0);

  vec3 lighting = (ao * (diffuseLighting * 0.5 + ambientLighting)) + 2.0 * specular;

  vec3 color = baseColor * lighting;

  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}
