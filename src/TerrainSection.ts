import * as THREE from "three";
import { TerrainTile, TerrainTileSettings } from "./TerrainTile";
import { TextureAtlas } from "./TextureAtlas";
import { shaders } from "./shaders";
import { FILE_BASE } from "./common";

export class TerrainSection {
  private width: number;
  private height: number;

  private position: THREE.Vector3;

  private tileData: TextureAtlas;
  private tiles: TerrainTile[] = [];
  private tileSettings: TerrainTileSettings;

  private terrainTexture: THREE.Texture;

  private groundMaterial?: THREE.ShaderMaterial;
  private grassMaterial?: THREE.ShaderMaterial;

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
    tileData: string,
    position = new THREE.Vector3(0, 0, 0)
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileData = new TextureAtlas();
    this.tileSettings = tileSettings;
    this.position = position;

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
      this.generateTiles();
    };
    this.tileData.loadAtlasFromBinary("tile-data", data, 256, 256, 64);
  }

  private generateTiles() {
    const dataTexture = this.tileData.Info["tile-data"].atlas;
    if (!dataTexture || !this.groundMaterial || !this.grassMaterial) {
      return;
    }

    const tileSize = this.tileSettings.patchSize * 2;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = new TerrainTile(
          this.scene,
          this.groundMaterial,
          this.grassMaterial,
          this.tileSettings
        );
        tile.position = new THREE.Vector3(
          this.position.x + -tileSize * x,
          this.position.y,
          this.position.z + -tileSize * y
        );
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
}
