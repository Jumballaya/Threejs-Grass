
uniform vec4 grassParams; // [segments, patch_size, width, height]
uniform float u_tile_id;
uniform float time;
uniform sampler2DArray tileDataTexture;

varying vec3 v_color;
varying vec4 v_grassData;
varying vec3 v_normal;
varying vec3 v_worldPosition;


const vec3 BASE_COLOR = vec3(0.1, 0.4, 0.04);
const vec3 TIP_COLOR = vec3(0.5, 0.7, 0.3);

void main() {
  int GRASS_SEGMENTS = int(grassParams.x);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = grassParams.y;
  float GRASS_WIDTH = grassParams.z;
  float GRASS_HEIGHT = grassParams.w;

  // calculate offset
  vec2 hashedInstanceID = hash21(float(gl_InstanceID)) * 2.0 - 1.0;
  vec3 grassBladeWorldPos = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y) * GRASS_PATCH_SIZE;

  // Get terrain data
  vec2 uv = (vec2(-grassBladeWorldPos.x, grassBladeWorldPos.z) / GRASS_PATCH_SIZE) * 0.5 + 0.5;
  vec4 tileData = texture2D(tileDataTexture, vec3(uv, u_tile_id));
  grassBladeWorldPos = terrainHeight(grassBladeWorldPos, tileData);
  vec3 hashVal = hash(grassBladeWorldPos);

  // Grass Rotation
  const float PI = 3.141596;
  float angle = remap(hashVal.x, -1.0, 1.0, -PI, PI);

  // Grass Data
  float stiffness = 1.0 - tileData.r * 0.85;
  float tileGrassHeight = (1.0 - tileData.r) * 1.1;

  // Figue out vertex id
  int vertFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
  int vertID = vertFB_ID % GRASS_VERTICES;

  // 0 = left side, 1 = right
  int xTest = vertID & 0x1;
  int zTest = (vertFB_ID >= GRASS_VERTICES) ? 1 : -1;
  float xSide = float(xTest);
  float zSide = float(zTest);
  float heightPercent = float(vertID - xTest) / (float(GRASS_SEGMENTS) * 2.0);

  // No grass diffuse texture
  float width = GRASS_WIDTH * ease_out(1.0 - heightPercent, 2.0);
  float height = GRASS_HEIGHT - (tileGrassHeight * GRASS_HEIGHT);

  // calculate the vertex position
  float x = (xSide - 0.5) * width;
  float y = heightPercent * height;
  float z = 0.0;

  // Wind effect
  float windStrength = noise(vec3(grassBladeWorldPos.xz * 0.05, 0.0) + time);
  float windAngle = 0.0;
  vec3 windAxis = vec3(cos(windAngle), 0.0, sin(windAngle));
  float windLeanAngle = windStrength * 1.25 * heightPercent * stiffness;

  // Bezier curve for bend
  float randomLeanAnim = noise(vec3(grassBladeWorldPos.xz, time * 4.0)) * (windStrength * 0.5 + 0.125);
  float leanFactor = remap(hashVal.y, -1.0, 1.0, 0.0, 0.45) + randomLeanAnim;

  vec3 p1 = vec3(0.0);
  vec3 p2 = vec3(0.0, 0.33, 0.0);
  vec3 p3 = vec3(0.0, 0.66, 0.0);
  vec3 p4 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  vec3 curve = bezier(p1, p2, p3, p4, heightPercent);

  // calculate normal
  vec3 curveGrad = bezierGradient(p1, p2, p3, p4, heightPercent);
  mat2 curveRot90 = mat2(0.0, 1.0, -1.0, 0.0) * -zSide;

  y = curve.y * height;
  z = curve.z * height;

  // grass rotation
  mat3 grassMat = rotateAxis(windAxis, windLeanAngle) * rotateY(angle);

  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassBladeWorldPos;
  vec3 grassLocalNormal = grassMat * vec3(0.0, curveRot90 * curveGrad.yz);

  // blend normal
  float distanceBlend = smoothstep(0.0, 10.0, distance(cameraPosition, grassBladeWorldPos));
  grassLocalNormal = mix(grassLocalNormal, vec3(0.0, 1.0, 0.0), distanceBlend * 0.5);
  grassLocalNormal = normalize(grassLocalNormal);

  // Viewspace thickening
  vec4 mvPosition = modelViewMatrix * vec4(grassLocalPosition, 1.0);
  vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
  vec3 grassFaceNormal = (grassMat * vec3(0.0, 0.0, -zSide));
  float viewDotNormal = saturate(dot(grassFaceNormal, viewDir));
  float viewspaceThickenFactor = ease_out(1.0 - viewDotNormal, 4.0) * smoothstep(0.0, 0.2, viewDotNormal);

  mvPosition.x += viewspaceThickenFactor * (xSide - 0.5) * width * 0.5 * -zSide;

  gl_Position = projectionMatrix * mvPosition;
  gl_Position.w = tileGrassHeight > 0.9 ? 0.0 : gl_Position.w;

  vec3 c1 = mix(BASE_COLOR, TIP_COLOR, heightPercent);
  vec3 c2 = mix(vec3(0.4, 0.4, 0.2), vec3(0.78, 0.77, 0.46), heightPercent);
  float noiseValue = noise(grassBladeWorldPos * 0.1);
  v_color = mix(c1, c2, smoothstep(-1.0, 1.0, noiseValue));
  v_normal = normalize(modelMatrix * vec4(grassLocalNormal, 0.0)).xyz;
  v_worldPosition = (modelMatrix * vec4(grassLocalPosition, 1.0)).xyz;

  v_grassData = vec4(x, heightPercent, xSide, 0.0);
}