import * as THREE from "three";
import { Library } from "../Library";

export type RockFoliageSettings = {
  patchSize: number;
  rockDensity: number; // rock per square meter
  scale: number;
};

const DEFAULT_SETTINGS: RockFoliageSettings = {
  patchSize: 1,
  rockDensity: 10,
  scale: 1,
};

export class RockFoliage {
  private material: THREE.ShaderMaterial;
  private geometry: THREE.InstancedBufferGeometry;
  private mesh: THREE.Mesh;

  private settings: RockFoliageSettings;

  constructor(
    material: THREE.ShaderMaterial,
    boundingSphere: THREE.Sphere,
    library: Library,
    id = 0,
    settings = DEFAULT_SETTINGS
  ) {
    this.settings = settings;
    this.material = material;
    this.geometry = this.createGeometry(library);
    this.geometry.boundingSphere = boundingSphere;
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.material.uniforms.u_tile_id.value = id;
    this.material.uniforms.rockParams.value = new THREE.Vector4(
      this.settings.patchSize,
      this.settings.scale,
      0,
      0
    );
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public set position(pos: THREE.Vector3) {
    this.mesh.position.copy(pos);
  }

  public set visible(v: boolean) {
    this.mesh.visible = v;
  }

  public set id(id: number) {
    this.material.uniforms.u_tile_id.value = id;
  }

  private createGeometry(library: Library): THREE.InstancedBufferGeometry {
    const instanceCount =
      this.settings.patchSize *
      this.settings.patchSize *
      this.settings.rockDensity;

    const geo = library.getInstancedGeometry("rocks");
    if (!geo) throw new Error("Rock instanced geometry not loaded");

    const geometry = geo.clone();
    geometry.instanceCount = instanceCount;
    return geometry;
  }
}
