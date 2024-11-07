import * as THREE from "three";
import { TerrainTile, TerrainTileSettings } from "./TerrainTile";
import { Library } from "./Library";

export class TerrainSection {
  private width: number;
  private height: number;

  private position: THREE.Vector3;

  private tiles: TerrainTile[] = [];
  private tileSettings: TerrainTileSettings;

  private scene: THREE.Scene;
  private library: Library;

  public readonly materials: Array<THREE.ShaderMaterial> = [];

  constructor(
    scene: THREE.Scene,
    library: Library,
    width: number,
    height: number,
    tileSettings: TerrainTileSettings,
    position = new THREE.Vector3(0, 0, 0)
  ) {
    this.scene = scene;
    this.library = library;
    this.width = width;
    this.height = height;
    this.tileSettings = tileSettings;
    this.position = position;
    this.generateTiles();
  }

  public enable(id: number) {
    this.tiles[id].visible = true;
  }

  public disable(id: number) {
    this.tiles[id].visible = false;
  }

  private generateTiles() {
    const groundMaterial = this.library.getShaderMaterial("ground");
    const grassMaterial = this.library.getShaderMaterial("grass");

    if (!groundMaterial || !grassMaterial) {
      throw new Error("Ground and grass materials not loaded");
    }

    const tileSize = this.tileSettings.patchSize * 2;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = new TerrainTile(
          this.scene,
          groundMaterial,
          grassMaterial,
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
  }
}
