
uniform vec4 rockParams; // [patch_size, scale, -, -]
uniform float u_tile_id;
uniform float time;
uniform sampler2DArray tileDataTexture;

out vec4 v_rockData; // [patch_size, scale, -, -]
out vec3 v_normal;
out vec3 v_worldPosition;

out vec3 v_color;

const float ROCK_PATCH_SIZE = 10.0;
float ROCK_SCALE = 1.0;

void main() {
  // Calculate position and hash
  vec2 hashedInstanceID = hash21(float(gl_InstanceID)) * 2.0 - 1.0;
  vec3 rockWorldPos = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y) * ROCK_PATCH_SIZE;

  // Get terrain data
  vec2 uv = (vec2(-rockWorldPos.x, rockWorldPos.z) / ROCK_PATCH_SIZE) * 0.5 + 0.5;
  vec4 tileData = texture2D(tileDataTexture, vec3(uv, u_tile_id));
  vec4 tileData2 = texture2D(tileDataTexture, vec3(vec2(uv.x + 2.0, uv.y), u_tile_id));
  vec4 tileData3 = texture2D(tileDataTexture, vec3(vec2(uv.x, uv.y + 2.0), u_tile_id));
  vec3 rockWorldPos2 = terrainHeight(rockWorldPos, tileData2);
  rockWorldPos = terrainHeight(rockWorldPos, tileData);
  vec3 hashVal = hash(rockWorldPos);

  // Y rotation
  float angle = remap(hashVal.x, -1.0, 1.0, -PI, PI);
  mat3 rot_y_mat = rotateY(angle);

  // Scale amount
  float scale_amount = tileData.b;
  mat3 scale_mat = scale3(scale_amount, scale_amount, scale_amount);
  vec3 pos = scale_mat * position;

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos + rockWorldPos, 1.0);
  v_normal = (modelMatrix * vec4(normal, 0.0)).xyz;
  v_rockData = vec4(ROCK_PATCH_SIZE, ROCK_SCALE, 0.0, 0.0);
  v_worldPosition = (modelMatrix * vec4(pos + rockWorldPos, 1.0)).xyz;
}