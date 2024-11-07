import * as THREE from "three";

export type TerrainTileSettings = {
  patchSize: number;
  grassDensity: number; // grass blade per square meter
  segments: number;
  width: number;
  height: number;
};

export class TerrainTile {
  private settings: TerrainTileSettings = {
    patchSize: 1,
    grassDensity: 10,
    segments: 6,
    width: 0.125,
    height: 2,
  };

  private grassGeometry: THREE.InstancedBufferGeometry;
  private grassMesh!: THREE.Mesh;
  private grassMaterial!: THREE.ShaderMaterial;

  private terrainMesh!: THREE.Mesh;
  private terrainMaterial!: THREE.ShaderMaterial;

  private terrainId: number = 0;

  constructor(
    scene: THREE.Scene,
    terrainMaterial: THREE.ShaderMaterial,
    grassMaterial: THREE.ShaderMaterial,
    grassGeometry: THREE.InstancedBufferGeometry,
    settings?: Partial<TerrainTileSettings>
  ) {
    this.grassGeometry = grassGeometry;
    this.settings = Object.assign(this.settings, settings);
    this.setupGround(terrainMaterial, scene);
    this.setupGrass(grassMaterial, scene);
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

  public set visible(v: boolean) {
    this.terrainMesh.visible = v;
    this.grassMesh.visible = v;
  }

  private setupGround(
    terrainMaterial: THREE.ShaderMaterial,
    scene: THREE.Scene
  ) {
    const mat = terrainMaterial.clone();
    const geo = new THREE.PlaneGeometry(1, 1, 128, 128);
    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotateX(-Math.PI / 2);
    terrain.rotateZ(Math.PI);
    terrain.scale.setScalar(this.settings.patchSize * 2);
    scene.add(terrain);
    this.terrainMesh = terrain;
    this.terrainMaterial = mat;
  }

  private setupGrass(grassMaterial: THREE.ShaderMaterial, scene: THREE.Scene) {
    const mat = grassMaterial.clone();
    const grassGeometry = this.grassGeometry.clone();
    this.grassMesh = new THREE.Mesh(grassGeometry, mat);
    scene.add(this.grassMesh);
    this.grassMaterial = mat;
  }
}
