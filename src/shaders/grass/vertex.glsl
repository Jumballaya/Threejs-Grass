
uniform vec4 grassParams; // [segments, patch_size, width, height]

varying vec3 v_color;

const vec3 BASE_COLOR = vec3(0.1, 0.4, 0.04);
const vec3 TIP_COLOR = vec3(0.5, 0.7, 0.3);

vec2 quickHash(float p) {
  vec2 r = vec2(
    dot(vec2(p), vec2(17.23424, 41.892342)),
    dot(vec2(p), vec2(16.32492, 23.435652)));
  return fract(sin(r) * 1934.392084);
}

vec3 hash( vec3 p ) {
	p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6)));
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

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

float ease_out(float x, float t) {
  return 1.0 - pow(1.0 - x, t);
}

vec3 bezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float oneMinusT = 1.0 - t;
  float omtCubed = oneMinusT * oneMinusT * oneMinusT;
  float omtSquared = oneMinusT * oneMinusT;
  float tCubed = t * t * t;
  float tSquared = t * t;

  return (omtCubed * p0) + (3.0 * omtSquared * t * p1) + (3.0 * oneMinusT * tSquared * p2) + (tCubed * p3);
}

mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(
    vec3(c,   0.0, s),
    vec3(0.0, 1.0, 0.0),
    vec3(-s,  0.0, c));
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

  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash(grassBladeWorldPos);

  const float PI = 3.141596;
  float angle = remap(hashVal.x, -1.0, 1.0, -PI, PI);

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

  mat3 grassMat = rotateY(angle);

  // Bezier curve for bend
  float leanFactor = remap(hashVal.y, -1.0, 1.0, 0.0, 0.5);

  vec3 p1 = vec3(0.0);
  vec3 p2 = vec3(0.0, 0.33, 0.0);
  vec3 p3 = vec3(0.0, 0.66, 0.0);
  vec3 p4 = vec3(0.0, cos(leanFactor), sin(leanFactor));
  vec3 curve = bezier(p1, p2, p3, p4, heightPercent);

  y = curve.y * height;
  z = curve.z * height;

  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(grassLocalPosition, 1.0);

  v_color = mix(BASE_COLOR, TIP_COLOR, heightPercent);
}