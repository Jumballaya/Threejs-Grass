import * as THREE from "three";
import { shaders } from "./shaders";

type TerrainTileSettings = {
  patchSize: number;
  grassDensity: number; // grass blade per square meter
  segments: number;
  width: number;
  height: number;
};

const FILE_BASE = import.meta.env.DEV ? "" : "/Threejs-Grass";

export class TerrainTile {
  private settings: TerrainTileSettings = {
    patchSize: 1,
    grassDensity: 10,
    segments: 6,
    width: 0.125,
    height: 2,
  };
  private instanceCount: number;
  private vertexCount: number;

  private grassGeometry!: THREE.InstancedBufferGeometry;
  private grassMesh!: THREE.Mesh;
  private grassMaterial!: THREE.ShaderMaterial;

  private terrainMesh!: THREE.Mesh;
  private terrainMaterial!: THREE.ShaderMaterial;

  private terrainId: number = 0;

  constructor(
    scene: THREE.Scene,
    dataTexture: THREE.DataArrayTexture,
    settings?: Partial<TerrainTileSettings>
  ) {
    this.settings = Object.assign(this.settings, settings);
    this.instanceCount =
      this.settings.patchSize *
      this.settings.patchSize *
      this.settings.grassDensity;
    this.vertexCount = (this.settings.segments + 1) * 2;

    this.setupGround(dataTexture, scene);
    this.setupGrass(dataTexture, scene);
  }

  public set position(pos: THREE.Vector3) {
    this.grassMesh.position.set(pos.x, pos.y, pos.z);
    this.terrainMesh.position.set(pos.x, pos.y, pos.z);
  }

  public set rotation(rad: number) {
    this.grassMesh.rotateY(rad);
    this.terrainMesh.rotateZ(rad);
  }

  public get materials(): THREE.ShaderMaterial[] {
    return [this.grassMaterial, this.terrainMaterial];
  }

  public get id(): number {
    return this.terrainId;
  }

  public set id(tid: number) {
    this.terrainId = tid;
    this.terrainMaterial.uniforms.u_tile_id.value = this.terrainId;
    this.grassMaterial.uniforms.u_tile_id.value = this.terrainId;
  }

  private setupGround(
    tileDataTexture: THREE.DataArrayTexture,
    scene: THREE.Scene
  ) {
    const diffuseTexture = new THREE.TextureLoader().load(
      FILE_BASE + "/grid.png"
    );
    diffuseTexture.wrapS = THREE.RepeatWrapping;
    diffuseTexture.wrapT = THREE.RepeatWrapping;

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      diffuseTexture: { value: diffuseTexture },
      tileDataTexture: { value: tileDataTexture },
      patchSize: { value: this.settings.patchSize },
      u_tile_id: { value: 0 },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shaders.ground.vertex,
      fragmentShader: shaders.ground.fragment,
    });

    const geo = new THREE.PlaneGeometry(1, 1, 512, 512);
    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotateX(-Math.PI / 2);
    terrain.rotateZ(Math.PI);
    terrain.scale.setScalar(this.settings.patchSize * 2);
    scene.add(terrain);
    this.terrainMesh = terrain;
    this.terrainMaterial = mat;
  }

  private setupGrass(
    tileDataTexture: THREE.DataArrayTexture,
    scene: THREE.Scene
  ) {
    const uniforms = {
      grassParams: {
        value: new THREE.Vector4(
          this.settings.segments,
          this.settings.patchSize,
          this.settings.width,
          this.settings.height
        ),
      },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      grassDiffuse: { value: null as null | THREE.DataArrayTexture },
      tileDataTexture: { value: tileDataTexture },
      u_textured: { value: false },
      u_tile_id: { value: 0 },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shaders.grass.vertex,
      fragmentShader: shaders.grass.fragment,
      side: THREE.FrontSide,
    });
    this.grassGeometry = this.createGrassGeometry();
    this.grassMesh = new THREE.Mesh(this.grassGeometry, mat);
    scene.add(this.grassMesh);
    this.grassMaterial = mat;
  }

  private createGrassGeometry(): THREE.InstancedBufferGeometry {
    const indices: number[] = [];
    for (let i = 0; i < this.settings.segments; i++) {
      const vi = i * 2;
      indices[i * 12 + 0] = vi + 0;
      indices[i * 12 + 1] = vi + 1;
      indices[i * 12 + 2] = vi + 2;

      indices[i * 12 + 3] = vi + 2;
      indices[i * 12 + 4] = vi + 1;
      indices[i * 12 + 5] = vi + 3;

      const fi = this.vertexCount + vi;
      indices[i * 12 + 6] = fi + 2;
      indices[i * 12 + 7] = fi + 1;
      indices[i * 12 + 8] = fi + 0;

      indices[i * 12 + 9] = fi + 3;
      indices[i * 12 + 10] = fi + 1;
      indices[i * 12 + 11] = fi + 2;
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = this.instanceCount;
    geo.setIndex(indices);
    geo.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      1 + this.settings.patchSize * 2
    );

    return geo;
  }
}
