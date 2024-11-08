
in vec3 v_normal;

const vec3 LIGHT_COLOR = vec3(0.58, 0.62, 0.47);
const vec3 DARK_COLOR = vec3(0.17, 0.17, 0.075);

void main() {  
  vec3 up = vec3(0.0, 1.0, 0.0);
  float dNU = dot(v_normal, up);

  float ao = remap(pow(dNU, 2.0), 0.0, 1.0, 0.125, 1.0);


  vec3 color = mix(DARK_COLOR, LIGHT_COLOR, ao);


  gl_FragColor = vec4(color, 1.0);
}
