import * as THREE from "three";
import { GrassFoliage } from "./foliage/GrassFoliage";

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

  private foliage = {
    grass: null as GrassFoliage | null,
    rocks: null,
  };

  private boundingSphere: THREE.Sphere;

  private grassMaterial: THREE.ShaderMaterial | null = null;
  private terrainMesh: THREE.Mesh | null = null;
  private terrainMaterial: THREE.ShaderMaterial | null = null;

  private terrainId: number = 0;

  constructor(
    scene: THREE.Scene,
    terrainMaterial: THREE.ShaderMaterial,
    grassMaterial: THREE.ShaderMaterial,
    settings?: Partial<TerrainTileSettings>
  ) {
    this.settings = Object.assign(this.settings, settings);
    const boundingRadius = 1 + this.settings.patchSize * 2;
    this.boundingSphere = new THREE.Sphere(this.position, boundingRadius);
    this.setupGround(terrainMaterial, scene);
    this.setupGrass(grassMaterial, scene);
  }

  public set position(pos: THREE.Vector3) {
    this.terrainMesh?.position.set(pos.x, pos.y, pos.z);
    if (this.foliage.grass) {
      this.foliage.grass.position = pos;
    }
  }

  public get materials(): THREE.ShaderMaterial[] {
    const mats: THREE.ShaderMaterial[] = [];
    if (this.grassMaterial) {
      mats.push(this.grassMaterial);
    }
    if (this.terrainMaterial) {
      mats.push(this.terrainMaterial);
    }
    return mats;
  }

  public get id(): number {
    return this.terrainId;
  }

  public set id(tid: number) {
    this.terrainId = tid;
    if (this.terrainMaterial) {
      this.terrainMaterial.uniforms.u_tile_id.value = this.terrainId;
    }
    if (this.foliage.grass) {
      this.foliage.grass.id = this.terrainId;
    }
  }

  public set visible(v: boolean) {
    if (this.terrainMesh) {
      this.terrainMesh.visible = v;
    }
    if (this.foliage.grass) {
      this.foliage.grass.visible = v;
    }
  }

  private setupGround(
    terrainMaterial: THREE.ShaderMaterial,
    scene: THREE.Scene
  ) {
    const mat = terrainMaterial.clone();
    mat.uniforms.patchSize.value = this.settings.patchSize;
    mat.uniforms.u_tile_id.value = this.terrainId;
    const geo = new THREE.PlaneGeometry(1.05, 1.05, 128, 128);
    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotateX(-Math.PI / 2);
    terrain.rotateZ(Math.PI);
    terrain.scale.setScalar(this.settings.patchSize * 2);
    scene.add(terrain);
    this.terrainMesh = terrain;
    this.terrainMaterial = mat;
  }

  private setupGrass(grassMaterial: THREE.ShaderMaterial, scene: THREE.Scene) {
    this.foliage.grass = new GrassFoliage(
      grassMaterial,
      this.boundingSphere,
      this.terrainId,
      this.settings
    );
    scene.add(this.foliage.grass.getMesh());
  }
}
