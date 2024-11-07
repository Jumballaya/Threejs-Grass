import * as THREE from "three";

export type GrassFoliageSettings = {
  patchSize: number;
  grassDensity: number; // grass blade per square meter
  segments: number;
  width: number;
  height: number;
};

const DEFAULT_SETTINGS: GrassFoliageSettings = {
  patchSize: 1,
  grassDensity: 10,
  segments: 6,
  width: 0.125,
  height: 2,
};

export class GrassFoliage {
  private material: THREE.ShaderMaterial;
  private geometry: THREE.InstancedBufferGeometry;
  private mesh: THREE.Mesh;

  private settings: GrassFoliageSettings;

  constructor(
    material: THREE.ShaderMaterial,
    boundingSphere: THREE.Sphere,
    id = 0,
    settings = DEFAULT_SETTINGS
  ) {
    this.settings = settings;
    this.material = material.clone();
    this.geometry = this.createGeometry();
    this.geometry.boundingSphere = boundingSphere;
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.material.uniforms.u_tile_id.value = id;
    this.material.uniforms.grassParams.value = new THREE.Vector4(
      this.settings.segments,
      this.settings.patchSize,
      this.settings.width,
      this.settings.height
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

  private createGeometry(): THREE.InstancedBufferGeometry {
    const instanceCount =
      this.settings.patchSize *
      this.settings.patchSize *
      this.settings.grassDensity;
    const vertexCount = (this.settings.segments + 1) * 2;
    const indices: number[] = [];
    for (let i = 0; i < this.settings.segments; i++) {
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

    return geo;
  }
}
