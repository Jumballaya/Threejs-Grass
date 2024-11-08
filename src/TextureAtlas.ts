import * as THREE from "three";

function getImageData(image: THREE.Texture["image"]) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d")!;
  context.translate(0, image.height);
  context.scale(1, -1);
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

export class TextureAtlas {
  private manager: THREE.LoadingManager;
  private loader: THREE.TextureLoader;
  private textures: Record<string, THREE.DataArrayTexture> = {};

  private listeners = {
    onLoad: () => {},
  };

  constructor() {
    this.manager = new THREE.LoadingManager();
    this.loader = new THREE.TextureLoader(this.manager);
  }

  public set onLoad(handler: () => void) {
    this.listeners.onLoad = handler;
  }

  public get Info() {
    return this.textures;
  }

  // public loadAtlasFromImage(
  //   atlas: string,
  //   file: string,
  //   rowCount: number,
  //   colCount: number
  // ) {
  //   // TODO
  // }

  public async loadAtlasFromImages(
    atlas: string,
    files: string[]
  ): Promise<THREE.DataArrayTexture> {
    const [binary, width, height] = await this.getBinaryFromImages(files);
    this.textures[atlas] = this.createDataArrayTexture(
      binary,
      width,
      height,
      files.length
    );
    return this.textures[atlas];
  }

  public loadAtlasFromBinary(
    atlas: string,
    binary: Uint8Array,
    width: number,
    height: number,
    depth: number
  ): THREE.DataArrayTexture {
    this.textures[atlas] = this.createDataArrayTexture(
      binary,
      width,
      height,
      depth
    );
    this.listeners.onLoad();
    return this.textures[atlas];
  }

  private async getBinaryFromImages(
    files: string[]
  ): Promise<[Uint8Array, number, number]> {
    let x = -1;
    let y = -1;
    let data: Uint8Array = new Uint8Array();

    for (let t = 0; t < files.length; t++) {
      const curData = await this.loadType(files[t]);
      const h = curData.height;
      const w = curData.width;

      if (x == -1) {
        x = w;
        y = h;
        data = new Uint8Array(files.length * 4 * x * y);
      }

      if (w !== x || h !== y) {
        throw new Error("Texture dimensions do not match");
      }
      const offset = t * (4 * w * h);
      data.set(curData.data, offset);
    }

    return [data, x, y];
  }

  private async loadType(t: string | ImageData): Promise<ImageData> {
    if (typeof t === "string") {
      const texture = await this.loader.loadAsync(t);
      return getImageData(texture.image);
    }
    return t;
  }

  private createDataArrayTexture(
    data: Uint8Array,
    w: number,
    h: number,
    depth: number
  ) {
    const texture = new THREE.DataArrayTexture(data, w, h, depth);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }
}
