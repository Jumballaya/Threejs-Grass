varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

uniform sampler2D diffuseTexture;

float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float hash(vec2 p)  // replace this by something better
{
    p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
    return -1.0+2.0*fract( p.x*p.y*(p.x+p.y) );
}

void main() {

  // Grid
  float grid1 = texture(diffuseTexture, vWorldPosition.xz * 0.1).r;
	float grid2 = texture(diffuseTexture, vWorldPosition.xz * 1.0).r;

	float gridHash1 = hash(floor(vWorldPosition.xz * 1.0));

	vec3 gridcolor = mix(vec3(0.5 + remap(gridHash1, -1.0, 1.0, -0.2, 0.2)), vec3(0.0625), grid2);
	gridcolor = mix(gridcolor, vec3(0.00625), grid1);

  vec3 color = gridcolor;

  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}