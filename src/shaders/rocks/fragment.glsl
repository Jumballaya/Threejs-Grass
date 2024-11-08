
in vec3 v_normal;
in vec3 v_worldPosition;

const vec3 LIGHT_COLOR = vec3(0.58, 0.62, 0.47);
const vec3 DARK_COLOR = vec3(0.07, 0.07, 0.015);

void main() {  
  vec3 up = vec3(0.0, 1.0, 0.0);
  float dNU = dot(v_normal, up);

  vec3 normal = normalize(v_normal);
  vec3 viewDir = normalize(cameraPosition - v_worldPosition);

  // Fake AO
  float ao = remap(pow(dNU, 2.0), 0.0, 1.0, 0.125, 1.0);

  // base color
  vec3 baseColor = mix(DARK_COLOR, LIGHT_COLOR, ao);

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
    getSkyColor(0.0, lightDir, viewDir),
    COLOR_SUN
  );

  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}
