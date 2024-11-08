
out vec3 v_normal;


const float PATCH_SIZE = 10.0;

void main() {
  vec2 hashedInstanceID = hash21(float(gl_InstanceID)) * 2.0 - 1.0;
  vec3 rockWorldPos = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y) * PATCH_SIZE;
  vec3 hashVal = hash(rockWorldPos);

  float scale_amount = remap(hashVal.x, -1.0, 1.0, 0.05, 0.333);
  mat4 scale = scale4(scale_amount, scale_amount, scale_amount);

  gl_Position = projectionMatrix * viewMatrix * (modelMatrix * scale) * vec4(position + rockWorldPos, 1.0);

  v_normal = (modelMatrix * vec4(normal, 0.0)).xyz;
}