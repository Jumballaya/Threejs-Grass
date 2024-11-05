
uniform vec4 grassParams; // [segments, patch_size, width, height]

vec2 quickHash(float p) {
  vec2 r = vec2(
    dot(vec2(p), vec2(17.23424, 41.892342)),
    dot(vec2(p), vec2(16.32492, 23.435652)));
  return fract(sin(r) * 1934.392084);
}

float ease_out(float x, float t) {
  return 1.0 - pow(1.0 - x, t);
}

void main() {
  int GRASS_SEGMENTS = int(grassParams.x);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = grassParams.y;
  float GRASS_WIDTH = grassParams.z;
  float GRASS_HEIGHT = grassParams.w;

  // calculate offset
  vec2 hashedInstanceID = quickHash(float(gl_InstanceID)) * 2.0 - 1.0;
  vec3 grassOffset = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y) * GRASS_PATCH_SIZE;

  // vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  // vec3 hashVal = hash(grassBladeWorldPos);

  // Figue out vertex id
  int vertFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
  int vertID = vertFB_ID % GRASS_VERTICES;

  // 0 = left side, 1 = right
  int xTest = vertID & 0x1;
  int zTest = (vertFB_ID >= GRASS_VERTICES) ? 1 : -1;
  float xSide = float(xTest);
  float zSide = float(zTest);
  float heightPercent = float(vertID - xTest) / (float(GRASS_SEGMENTS) * 2.0);

  float width = GRASS_WIDTH * ease_out(1.0 - heightPercent, 2.0);
  float height = GRASS_HEIGHT;

  // calculate the vertex position
  float x = (xSide - 0.5) * width;
  float y = heightPercent * height;
  float z = 0.0;

  vec3 grassLocalPosition = vec3(x, y, z) + grassOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(grassLocalPosition, 1.0);
}