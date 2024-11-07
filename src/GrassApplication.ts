import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { shaders } from "./shaders";
import { TerrainSection } from "./TerrainSection";

export class GrassApplication {
  private threejs = new THREE.WebGLRenderer();
  private materials: Array<THREE.ShaderMaterial> = [];

  private camera: THREE.PerspectiveCamera;
  private cameraController: OrbitControls;
  private scene = new THREE.Scene();
  private sky!: THREE.Mesh;

  private terrain: TerrainSection;

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

    this.terrain = new TerrainSection(
      this.scene,
      8,
      8,
      {
        patchSize: 10,
        grassDensity: 50,
        segments: 6,
        width: 0.125,
        height: 3,
      },
      Array.from(new Array(64)).map(
        (_, i) => `/tile_data/tile_data_${i + 1}.jpg`
      )
    );

    this.terrain.onLoad = () => {
      this.materials.push(...this.terrain.materials);
    };

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

    this.setupSky();
    this.onWindowResize();
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

  private setupResizer() {
    window.addEventListener("resize", () => {
      this.onWindowResize();
    });
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
