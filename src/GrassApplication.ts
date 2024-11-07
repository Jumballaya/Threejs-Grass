import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { shaders } from "./shaders";
import { TerrainSection } from "./TerrainSection";
import { FILE_BASE } from "./common";
import { Library } from "./Library";

export class GrassApplication {
  private threejs = new THREE.WebGLRenderer();
  private materials: Array<THREE.ShaderMaterial> = [];

  private camera: THREE.PerspectiveCamera;
  private cameraController: OrbitControls;
  private scene = new THREE.Scene();
  private sky!: THREE.Mesh;

  private terrain: TerrainSection[] = [];

  private library = new Library();

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

    this.library
      .loadArrayTextureFromBinary(
        "tile-data-0",
        "/tile_data/tile-group-0.data",
        256,
        256,
        64
      )
      .then(() => {
        const dirt = this.library.loadTexture("dirt", "/dirt1.png");
        dirt.wrapS = THREE.RepeatWrapping;
        dirt.wrapT = THREE.RepeatWrapping;

        this.library.loadShaderMaterial("ground", {
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(1, 1) },
          diffuseTexture: { value: dirt },
          tileDataTexture: {
            value: this.library.getArrayTexture("tile-data-0"),
          },
          patchSize: { value: 0 },
          u_tile_id: { value: 0 },
        });

        this.library.loadShaderMaterial("grass", {
          grassParams: {
            value: new THREE.Vector4(0, 0, 0, 0),
          },
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(1, 1) },
          tileDataTexture: {
            value: this.library.getArrayTexture("tile-data-0"),
          },
          u_tile_id: { value: 0 },
        });

        this.library.loadShaderMaterial("sky", {
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(1, 1) },
        });

        const t1 = new TerrainSection(this.scene, this.library, 8, 8, {
          patchSize: 10,
          grassDensity: 25,
          segments: 6,
          width: 0.125,
          height: 3,
        });
        this.terrain.push(t1);
        this.setupProject();
        this.setupResizer();
      });
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
    const mat = this.library.getShaderMaterial("sky");
    if (!mat) throw new Error("unable to load sky shader material");

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
