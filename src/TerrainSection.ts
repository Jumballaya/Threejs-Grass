import * as THREE from "three";
import { TerrainTile, TerrainTileSettings } from "./TerrainTile";
import { TextureAtlas } from "./TextureAtlas";

const FILE_BASE = import.meta.env.DEV ? "" : "/Threejs-Grass";

export class TerrainSection {
  private width: number;
  private height: number;

  private tileData: TextureAtlas;
  private tiles: TerrainTile[] = [];
  private tileSettings: TerrainTileSettings;

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
    dataTextures: string[]
  ) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.tileData = new TextureAtlas();
    this.tileSettings = tileSettings;

    this.generateDataTexture(dataTextures);
  }

  public set onLoad(handler: () => void) {
    this.listeners.onLoad = handler;
  }

  private generateDataTexture(files: string[]) {
    this.tileData.loadAtlas(
      "tile-data",
      files.map((f) => FILE_BASE + f)
    );
    this.tileData.onLoad = () => {
      this.generateTiles();
    };
  }

  private generateTiles() {
    const dataTexture = this.tileData.Info["tile-data"].atlas;
    if (!dataTexture) return;

    const tileSize = this.tileSettings.patchSize * 2;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = new TerrainTile(
          this.scene,
          dataTexture,
          this.tileSettings
        );
        tile.position = new THREE.Vector3(
          -tileSize * x * 0.98,
          0,
          -tileSize * y * 0.98
        );
        tile.id = y * this.width + x;
        this.tiles.push(tile);
        this.materials.push(...tile.materials);
      }
    }

    this.listeners.onLoad();
  }
}
