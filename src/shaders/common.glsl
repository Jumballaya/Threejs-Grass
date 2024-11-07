/**
 *     MATH
 */

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

/**
 *     Randomness/Hashing/Noise
 */
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

float hashv2(vec2 p)  {
    p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
    return -1.0+2.0*fract( p.x*p.y*(p.x+p.y) );
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

/**
 *     LIGHTING
 */

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

/**
 *         General Application Stuff
 */

const vec3 COLOR_SUN = vec3(1.0, 0.9, 0.65);
const vec3 COLOR_SKY_DARK = vec3(0.025, 0.065, 0.5);
const vec3 COLOR_SKY_LIGHT = vec3(0.4, 0.5, 1.0);

vec3 terrainHeight(vec3 worldPos, vec4 terrain) {
  return vec3(worldPos.x, terrain.g * 10.0, worldPos.z);
}

vec3 applyFog(
  vec3 cameraPosition,
  vec3 worldPosition,
  vec3 lightDir,
  vec3 viewDir,
  float falloff,
  vec3 baseColor,
  vec3 skyColor,
  vec3 sunColor
) {
  float sunFactor = pow(saturate(dot(lightDir, vec3(viewDir.x, -viewDir.y, viewDir.z))), 8.0);
  vec3 fogColor = mix(skyColor, sunColor, sunFactor);
  float fogDist = distance(cameraPosition, worldPosition) / falloff;
  float inscatter = 1.0 - exp(-fogDist * fogDist * mix(0.0005, 0.001, sunFactor));
  float extinction = exp(-fogDist * fogDist * 0.01);
  return baseColor * extinction + fogColor * inscatter;
}

vec3 getSkyColor(float t, vec3 lightDir, vec3 viewDir) {
  float skyT = exp(saturate(t) * -40.0);
  float sunFactor = pow(saturate(dot(lightDir, vec3(viewDir.x, -viewDir.y, viewDir.z))), 8.0);
  vec3 skyColor = mix(COLOR_SKY_DARK, COLOR_SKY_LIGHT, skyT);
  return mix(skyColor, COLOR_SUN, sunFactor);
}