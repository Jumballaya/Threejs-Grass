import * as THREE from "three";
import { TextureAtlas } from "./TextureAtlas";
import { shaders } from "./shaders";
import { FILE_BASE } from "./common";

export class Library {
  private textures: Map<string, THREE.Texture> = new Map();
  private arrayTextures: Map<string, THREE.DataArrayTexture> = new Map();
  private shaderMaterials: Map<string, THREE.ShaderMaterial> = new Map();

  private instancedGeometry: Map<string, THREE.InstancedBufferGeometry> =
    new Map();

  private textureLoader: THREE.TextureLoader;
  private textureAtlas: TextureAtlas;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.textureAtlas = new TextureAtlas();
  }

  public loadTexture(name: string, path: string): THREE.Texture {
    const texture = this.textureLoader.load(FILE_BASE + path);
    this.textures.set(name, texture);
    return texture;
  }

  public getTexture(name: string): THREE.Texture | null {
    return this.textures.get(name) ?? null;
  }

  public getArrayTexture(name: string): THREE.DataArrayTexture | null {
    return this.arrayTextures.get(name) ?? null;
  }

  public async loadArrayTextureFromBinary(
    name: string,
    file: string,
    w: number,
    h: number,
    d: number
  ) {
    const res = await fetch(file);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const data = new Uint8Array(buffer);
    const tex = this.textureAtlas.loadAtlasFromBinary(name, data, w, h, d);
    this.arrayTextures.set(name, tex);
    return tex;
  }

  public async loadArrayTextureFromImages(name: string, files: string[]) {
    const tex = await this.textureAtlas.loadAtlasFromImages(
      name,
      files.map((f) => FILE_BASE + f)
    );
    this.arrayTextures.set(name, tex);
    return tex;
  }

  // Name matches the shader names in shaders.ts
  public loadShaderMaterial(
    name: string,
    uniforms: THREE.ShaderMaterial["uniforms"] = {}
  ) {
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shaders[name]?.vertex ?? "",
      fragmentShader: shaders[name]?.fragment ?? "",
    });

    this.shaderMaterials.set(name, mat);
  }

  public getShaderMaterial(name: string): THREE.ShaderMaterial | null {
    return this.shaderMaterials.get(name) ?? null;
  }

  public loadInstancedGeometry(
    name: string,
    geo: THREE.InstancedBufferGeometry
  ) {
    this.instancedGeometry.set(name, geo);
  }

  public getInstancedGeometry(
    name: string
  ): THREE.InstancedBufferGeometry | null {
    return this.instancedGeometry.get(name) ?? null;
  }
}
