import * as THREE from "three";
import { TerrainTile, TerrainTileSettings } from "./TerrainTile";
import { TextureAtlas } from "./TextureAtlas";
import { shaders } from "./shaders";
import { FILE_BASE } from "./common";

export class TerrainSection {
  private width: number;
  private height: number;

  private tileData: TextureAtlas;
  private tiles: TerrainTile[] = [];
  private tileSettings: TerrainTileSettings;

  private boundingSphere: THREE.Sphere;
  private terrainTexture: THREE.Texture;

  private groundMaterial?: THREE.ShaderMaterial;
  private grassMaterial?: THREE.ShaderMaterial;
  private grassGeometry?: THREE.InstancedBufferGeometry;

  private scene: THREE.Scene;

  public readonly materials: Array<THREE.ShaderMaterial> = [];

  private listeners = {
    onLoad: () => {},
  };

  constructor(
    scene: THREE.Scene,
    width: number,
    height: number,
    tileSettings: TerrainTileSettings,
    tileData: string
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileData = new TextureAtlas();
    this.tileSettings = tileSettings;

    this.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      1 + tileSettings.patchSize * 2 * width
    );

    this.terrainTexture = new THREE.TextureLoader().load(
      FILE_BASE + "/dirt1.png"
    );
    this.terrainTexture.wrapS = THREE.RepeatWrapping;
    this.terrainTexture.wrapT = THREE.RepeatWrapping;

    this.generateDataTexture(tileData);
  }

  public set onLoad(handler: () => void) {
    this.listeners.onLoad = handler;
  }

  public enable(id: number) {
    this.tiles[id].visible = true;
  }

  public disable(id: number) {
    this.tiles[id].visible = false;
  }

  private async generateDataTexture(file: string) {
    const res = await fetch(file);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const data = new Uint8Array(buffer);

    this.tileData.onLoad = () => {
      this.groundMaterial = this.createGroundMaterial();
      this.grassMaterial = this.createGrassMaterial();
      this.grassGeometry = this.createGrassGeometry();
      this.generateTiles();
    };
    this.tileData.loadAtlasFromBinary("tile-data", data, 256, 256, 64);
  }

  private generateTiles() {
    const dataTexture = this.tileData.Info["tile-data"].atlas;
    if (
      !dataTexture ||
      !this.groundMaterial ||
      !this.grassMaterial ||
      !this.grassGeometry
    ) {
      return;
    }

    const tileSize = this.tileSettings.patchSize * 2;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = new TerrainTile(
          this.scene,
          this.groundMaterial,
          this.grassMaterial,
          this.grassGeometry,
          this.tileSettings
        );
        tile.position = new THREE.Vector3(-tileSize * x, 0, -tileSize * y);
        tile.id = y * this.width + x;
        this.tiles.push(tile);
        this.materials.push(...tile.materials);
      }
    }

    this.listeners.onLoad();
  }

  private createGroundMaterial(): THREE.ShaderMaterial {
    const tileDataTexture = this.tileData.Info["tile-data"].atlas;
    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      diffuseTexture: { value: this.terrainTexture },
      tileDataTexture: { value: tileDataTexture },
      patchSize: { value: this.tileSettings.patchSize },
      u_tile_id: { value: 0 },
      u_camera_origin: { value: new THREE.Vector3(0, 0, 0) },
      u_camera_direction: { value: new THREE.Vector3(0, 0, 0) },
    };

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shaders.ground.vertex,
      fragmentShader: shaders.ground.fragment,
    });
  }

  private createGrassMaterial(): THREE.ShaderMaterial {
    const tileDataTexture = this.tileData.Info["tile-data"].atlas;
    const uniforms = {
      grassParams: {
        value: new THREE.Vector4(
          this.tileSettings.segments,
          this.tileSettings.patchSize,
          this.tileSettings.width,
          this.tileSettings.height
        ),
      },
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(1, 1) },
      grassDiffuse: { value: null as null | THREE.DataArrayTexture },
      tileDataTexture: { value: tileDataTexture },
      u_textured: { value: false },
      u_tile_id: { value: 0 },
      u_camera_origin: { value: new THREE.Vector3(0, 0, 0) },
      u_camera_direction: { value: new THREE.Vector3(0, 0, 0) },
    };

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shaders.grass.vertex,
      fragmentShader: shaders.grass.fragment,
      side: THREE.FrontSide,
    });
  }

  private createGrassGeometry(): THREE.InstancedBufferGeometry {
    const instanceCount =
      this.tileSettings.patchSize *
      this.tileSettings.patchSize *
      this.tileSettings.grassDensity;
    const vertexCount = (this.tileSettings.segments + 1) * 2;
    const indices: number[] = [];
    for (let i = 0; i < this.tileSettings.segments; i++) {
      const vi = i * 2;
      indices[i * 12 + 0] = vi + 0;
      indices[i * 12 + 1] = vi + 1;
      indices[i * 12 + 2] = vi + 2;

      indices[i * 12 + 3] = vi + 2;
      indices[i * 12 + 4] = vi + 1;
      indices[i * 12 + 5] = vi + 3;

      const fi = vertexCount + vi;
      indices[i * 12 + 6] = fi + 2;
      indices[i * 12 + 7] = fi + 1;
      indices[i * 12 + 8] = fi + 0;

      indices[i * 12 + 9] = fi + 3;
      indices[i * 12 + 10] = fi + 1;
      indices[i * 12 + 11] = fi + 2;
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = instanceCount;
    geo.setIndex(indices);
    geo.boundingSphere = this.boundingSphere;

    return geo;
  }
}
