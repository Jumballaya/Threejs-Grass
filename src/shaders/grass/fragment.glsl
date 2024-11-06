uniform vec3 u_camera_direction;
uniform vec2 resolution;
uniform float time;
uniform sampler2DArray grassDiffuse;
uniform bool u_textured;


varying vec3 v_worldPosition;
varying vec3 v_color;
varying vec3 v_normal;
varying vec4 v_grassData; // [x pos, height percent, xSide, grass type]

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

  vec2 uv = v_grassData.zy;
  vec3 normal = normalize(v_normal);
  vec3 viewDir = normalize(cameraPosition - v_worldPosition);
  float grassType = v_grassData.w;

  // texture base
  vec4 diffuseColor = texture2D(grassDiffuse, vec3(uv, grassType));
  vec3 baseColor = mix(v_color * 0.75, v_color, smoothstep(0.125, 0.0, abs(v_grassData.x)));
  
  if (u_textured) {
   baseColor = diffuseColor.rgb;
   if (diffuseColor.w < 0.5) discard;
  }


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

  /// Sun
  float skyT = exp(saturate(0.0) * -40.0);
  float sunFactor = pow(saturate(dot(lightDir, viewDir)), 8.0);
  vec3 skyColor = mix(vec3(0.025, 0.065, 0.5), vec3(0.4, 0.5, 1.0), skyT);
  vec3 sunColor = vec3(1.0, 0.9, 0.65);
  vec3 fogColor = mix(skyColor, sunColor, sunFactor);

  // Fog
  float fogDist = distance(cameraPosition, v_worldPosition) / 8.0;
  float inscatter = 1.0 - exp(-fogDist * fogDist * mix(0.0005, 0.001, sunFactor));
  float extinction = exp(-fogDist * fogDist * 0.01);


  vec3 color = baseColor.xyz * lighting;
  color = color * extinction + fogColor * inscatter;

  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}
