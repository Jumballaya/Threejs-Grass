import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { shaders } from "./shaders";

const FILE_BASE = import.meta.env.DEV ? "" : "/Threejs-Grass";

const GRASS_INSTANCES = 250;
const GRASS_SEGMENTS = 6;
const GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
const GRASS_PATCH_SIZE = 5;
const GRASS_WIDTH = 0.25;
const GRASS_HEIGHT = 2;

export class GrassApplication {
  private threejs = new THREE.WebGLRenderer();
  private materials: Array<THREE.ShaderMaterial> = [];

  private camera: THREE.PerspectiveCamera;
  private cameraController: OrbitControls;
  private scene = new THREE.Scene();
  private sky!: THREE.Mesh;
  private grassGeometry!: THREE.InstancedBufferGeometry;
  private grassMesh!: THREE.Mesh;

  private totalTime = 0;

  constructor() {
    document.body.appendChild(this.threejs.domElement);

    this.scene.background = new THREE.Color(0.7, 0.8, 1.0);

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 10000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.cameraController = new OrbitControls(
      this.camera,
      this.threejs.domElement
    );

    this.setupProject();
    this.setupResizer();
  }

  public step(deltaTime: number) {
    this.totalTime += deltaTime;
    for (let m of this.materials) {
      m.uniforms.time.value = this.totalTime;
    }
    this.cameraController.update(deltaTime / 1000);
    this.threejs.render(this.scene, this.camera);
  }

  private setupProject() {
    this.camera.position.set(10, 5, 5);

    const light = new THREE.DirectionalLight(0xffffffff, 1.0);
    light.position.set(1, 1, 1);
    light.lookAt(0, 0, 0);
    this.scene.add(light);

    this.cameraController.target.set(0, 0, 0);
    this.cameraController.update();
    this.cameraController.enableDamping = true;

    this.setupGround();
    this.setupSky();
    this.setupGrass();
    this.onWindowResize();
  }

  private setupGround() {
    const diffuseTexture = new THREE.TextureLoader().load(
      FILE_BASE + "/grid.png"
    );
    diffuseTexture.wrapS = THREE.RepeatWrapping;
    diffuseTexture.wrapT = THREE.RepeatWrapping;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
        diffuseTexture: { value: diffuseTexture },
      },
      vertexShader: shaders.ground.vertex,
      fragmentShader: shaders.ground.fragment,
    });

    const geo = new THREE.PlaneGeometry(1, 1, 512, 512);
    const plane = new THREE.Mesh(geo, mat);
    plane.rotateX(-Math.PI / 2);
    plane.scale.setScalar(10);
    this.scene.add(plane);
    this.materials.push(mat);
  }

  private setupSky() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: shaders.sky.vertex,
      fragmentShader: shaders.sky.fragment,
      side: THREE.BackSide,
    });
    const geo = new THREE.SphereGeometry(5000, 32, 15);

    this.sky = new THREE.Mesh(geo, mat);
    this.sky.castShadow = false;
    this.sky.receiveShadow = false;
    this.scene.add(this.sky);
    this.materials.push(mat);
  }

  private setupGrass() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        grassParams: {
          value: new THREE.Vector4(
            GRASS_SEGMENTS,
            GRASS_PATCH_SIZE,
            GRASS_WIDTH,
            GRASS_HEIGHT
          ),
        },
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: shaders.grass.vertex,
      fragmentShader: shaders.grass.fragment,
      side: THREE.FrontSide,
    });
    this.grassGeometry = this.createGeometry();
    this.grassMesh = new THREE.Mesh(this.grassGeometry, mat);
    this.grassMesh.position.set(0, 0, 0);
    this.scene.add(this.grassMesh);

    this.materials.push(mat);
  }

  private setupResizer() {
    window.addEventListener("resize", () => {
      this.onWindowResize();
    });
  }

  private createGeometry(): THREE.InstancedBufferGeometry {
    const indices: number[] = [];
    for (let i = 0; i < GRASS_SEGMENTS; i++) {
      const vi = i * 2;
      indices[i * 12 + 0] = vi + 0;
      indices[i * 12 + 1] = vi + 1;
      indices[i * 12 + 2] = vi + 2;

      indices[i * 12 + 3] = vi + 2;
      indices[i * 12 + 4] = vi + 1;
      indices[i * 12 + 5] = vi + 3;

      const fi = GRASS_VERTICES + vi;
      indices[i * 12 + 6] = fi + 2;
      indices[i * 12 + 7] = fi + 1;
      indices[i * 12 + 8] = fi + 0;

      indices[i * 12 + 9] = fi + 3;
      indices[i * 12 + 10] = fi + 1;
      indices[i * 12 + 11] = fi + 2;
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = GRASS_INSTANCES;
    geo.setIndex(indices);
    geo.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      1 + GRASS_PATCH_SIZE * 2
    );

    return geo;
  }

  private onWindowResize() {
    const dpr = window.devicePixelRatio;
    const canvas = this.threejs.domElement;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.threejs.setSize(w * dpr, h * dpr, false);

    for (const m of this.materials) {
      m.uniforms.resolution.value.set(w * dpr, h * dpr);
    }
  }
}
