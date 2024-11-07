uniform vec2 resolution;
uniform float time;

varying vec3 v_worldPosition;
varying vec3 v_color;
varying vec3 v_normal;
varying vec4 v_grassData; // [x pos, height percent, xSide, - ]

void main() {
  vec2 uv = v_grassData.zy;
  vec3 normal = normalize(v_normal);
  vec3 viewDir = normalize(cameraPosition - v_worldPosition);

  // base color
  vec3 baseColor = mix(v_color * 0.75, v_color, smoothstep(0.125, 0.0, abs(v_grassData.x)));

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
  vec3 color = baseColor.xyz * lighting;

  // Fog
  color = applyFog(
    cameraPosition,
    v_worldPosition,
    lightDir,
    viewDir,
    4.0,
    color,
    getSkyColor(remap(cos(time / 20.0), -1.0, 1.0, 0.0, 0.1), lightDir, viewDir),
    COLOR_SUN
  );

  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}
