
uniform vec4 grassParams; // [segments, patch_size, width, height]

varying vec3 v_color;
varying vec4 v_grassData;
varying vec3 v_normal;
varying vec3 v_worldPosition;

uniform float time;
uniform sampler2D tileDataTexture;

const vec3 BASE_COLOR = vec3(0.1, 0.4, 0.04);
const vec3 TIP_COLOR = vec3(0.5, 0.7, 0.3);

vec2 quickHash(float p) {
  vec2 r = vec2(
    dot(vec2(p), vec2(17.23424, 41.892342)),
    dot(vec2(p), vec2(16.32492, 23.435652)));
  return fract(sin(r) * 1934.392084);
}

uvec2 murmurHash21(uint src) {
  const uint M = 0x5bd1e995u;
  uvec2 h = uvec2(1190494759u, 2147483647u);
  src *= M;
  src ^= src >> 24u;
  src *= M;
  h *= M;
  h ^= src;
  h ^= h >> 13u;
  h *= M;
  h ^= h >> 15u;
  return h;
}

vec2 hash21(float src) {
  uvec2 h = murmurHash21(floatBitsToUint(src));
  return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

vec3 hash(vec3 p) {
	p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6)));
	return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise( in vec3 p ) {
  vec3 i = floor( p );
  vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

  return mix( mix( mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                        dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                   mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                        dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
              mix( mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                        dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                   mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                        dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

vec3 terrainHeight(vec3 worldPos) {
  return vec3(worldPos.x, noise(worldPos * 0.02) * 10.0, worldPos.z);
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

vec3 bezierGradient(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float oneMinusT = 1.0 - t;
  float omtSquared = oneMinusT * oneMinusT;
  float tSquared = t * t;
  return (3.0 * omtSquared * (p1 - p0)) + (6.0 * oneMinusT * t * (p2 - p1)) + (3.0 * tSquared * (p3 - p2));
}

mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(
    vec3(c,   0.0, s),
    vec3(0.0, 1.0, 0.0),
    vec3(-s,  0.0, c));
}

mat3 rotateAxis(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
  );
}

void main() {
  int GRASS_SEGMENTS = int(grassParams.x);
  int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
  float GRASS_PATCH_SIZE = grassParams.y;
  float GRASS_WIDTH = grassParams.z;
  float GRASS_HEIGHT = grassParams.w;

  // calculate offset
  vec2 hashedInstanceID = hash21(float(gl_InstanceID)) * 2.0 - 1.0;
  vec3 grassOffset = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y) * GRASS_PATCH_SIZE;

  grassOffset = terrainHeight(grassOffset);

  vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
  vec3 hashVal = hash(grassBladeWorldPos);

  // Grass Rotation
  const float PI = 3.141596;
  float angle = remap(hashVal.x, -1.0, 1.0, -PI, PI);

  // TILE DATA
  vec4 tileData = texture2D(tileDataTexture, (vec2(-grassBladeWorldPos.x, grassBladeWorldPos.z) / GRASS_PATCH_SIZE) * 0.5 + 0.5);
  float stiffness = 1.0 - tileData.r * 0.85;
  float tileGrassHeight = tileData.r * 1.05;

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

  vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset;
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
  gl_Position.w = tileGrassHeight > 0.95 ? 0.0 : gl_Position.w;

  vec3 c1 = mix(BASE_COLOR, TIP_COLOR, heightPercent);
  vec3 c2 = mix(vec3(0.4, 0.4, 0.2), vec3(0.78, 0.77, 0.46), heightPercent);
  float noiseValue = noise(grassBladeWorldPos * 0.1);
  v_color = mix(c1, c2, smoothstep(-1.0, 1.0, noiseValue));
  v_normal = normalize(modelMatrix * vec4(grassLocalNormal, 0.0)).xyz;
  v_worldPosition = (modelMatrix * vec4(grassLocalPosition, 1.0)).xyz;

  v_grassData = vec4(x, heightPercent, 0.0, 0.0);
}