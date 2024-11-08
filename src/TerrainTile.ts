import * as THREE from "three";
import { GrassFoliage, GrassFoliageSettings } from "./foliage/GrassFoliage";
import { RockFoliage, RockFoliageSettings } from "./foliage/RockFoliage";
import { Library } from "./Library";

export type TerrainTileSettings = {
  patchSize: number;
  grassDensity: number;
  grassSegments: number;
  grassWidth: number;
  grassHeight: number;
  rockDensity: number;
  rockScale: number;
};

export class TerrainTile {
  private settings: TerrainTileSettings = {
    patchSize: 1,
    grassDensity: 25,
    grassSegments: 6,
    grassWidth: 0.125,
    grassHeight: 2,
    rockDensity: 10,
    rockScale: 1,
  };

  private foliage = {
    grass: null as GrassFoliage | null,
    rocks: null as RockFoliage | null,
  };

  private boundingSphere: THREE.Sphere;

  private grassMaterial: THREE.ShaderMaterial | null = null;
  private terrainMesh: THREE.Mesh | null = null;
  private terrainMaterial: THREE.ShaderMaterial | null = null;
  private rockMaterial: THREE.ShaderMaterial | null = null;

  private terrainId: number = 0;

  constructor(
    scene: THREE.Scene,
    library: Library,
    settings?: Partial<TerrainTileSettings>
  ) {
    this.settings = Object.assign(this.settings, settings);
    const boundingRadius = 1 + this.settings.patchSize * 2;
    this.boundingSphere = new THREE.Sphere(this.position, boundingRadius);
    this.setupGround(scene, library);
    this.setupGrass(scene, library);
    this.setupRocks(scene, library);
  }

  public set position(pos: THREE.Vector3) {
    this.terrainMesh?.position.set(pos.x, pos.y, pos.z);
    if (this.foliage.grass) {
      this.foliage.grass.position = pos;
    }
    if (this.foliage.rocks) {
      this.foliage.rocks.position = pos;
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
    if (this.rockMaterial) {
      mats.push(this.rockMaterial);
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
    if (this.foliage.rocks) {
      this.foliage.rocks.id = this.terrainId;
    }
  }

  public set visible(v: boolean) {
    if (this.terrainMesh) {
      this.terrainMesh.visible = v;
    }
    if (this.foliage.grass) {
      this.foliage.grass.visible = v;
    }
    if (this.foliage.rocks) {
      this.foliage.rocks.visible = v;
    }
  }

  private setupGround(scene: THREE.Scene, library: Library) {
    const terrainMaterial = library.getShaderMaterial("ground");
    if (!terrainMaterial) throw new Error("Ground shader material not loaded");

    this.terrainMaterial = terrainMaterial.clone();
    this.terrainMaterial.uniforms.patchSize.value = this.settings.patchSize;
    this.terrainMaterial.uniforms.u_tile_id.value = this.terrainId;
    const geo = new THREE.PlaneGeometry(1.05, 1.05, 128, 128);
    const terrain = new THREE.Mesh(geo, this.terrainMaterial);
    terrain.rotateX(-Math.PI / 2);
    terrain.rotateZ(Math.PI);
    terrain.scale.setScalar(this.settings.patchSize * 2);
    scene.add(terrain);
    this.terrainMesh = terrain;
  }

  private setupGrass(scene: THREE.Scene, library: Library) {
    const grassMaterial = library.getShaderMaterial("grass");
    if (!grassMaterial) throw new Error("Grass shader material not loaded");
    this.grassMaterial = grassMaterial.clone();

    this.foliage.grass = new GrassFoliage(
      this.grassMaterial,
      this.boundingSphere,
      this.terrainId,
      this.grassSettings()
    );
    scene.add(this.foliage.grass.getMesh());
  }

  private setupRocks(scene: THREE.Scene, library: Library) {
    const rockMaterial = library.getShaderMaterial("rocks");
    if (!rockMaterial) throw new Error("Rock shader material not loaded");
    this.rockMaterial = rockMaterial.clone();

    this.foliage.rocks = new RockFoliage(
      this.rockMaterial,
      this.boundingSphere,
      library,
      this.terrainId,
      this.rockSettings()
    );
    scene.add(this.foliage.rocks.getMesh());
  }

  private grassSettings(): GrassFoliageSettings {
    return {
      patchSize: this.settings.patchSize,
      grassDensity: this.settings.grassDensity,
      segments: this.settings.grassSegments,
      width: this.settings.grassWidth,
      height: this.settings.grassHeight,
    };
  }

  private rockSettings(): RockFoliageSettings {
    return {
      patchSize: this.settings.patchSize,
      rockDensity: this.settings.rockDensity,
      scale: this.settings.rockScale,
    };
  }
}
