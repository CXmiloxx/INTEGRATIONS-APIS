import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.initializeUploadsDirectory();
  }

  /**
   * Inicializa el directorio de uploads si no existe
   */
  private initializeUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      this.logger.log(`📁 Directorio uploads creado: ${this.uploadsDir}`);
    }
  }

  //Buscar archivo en la carpeta uploads
  async getFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(this.uploadsDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${fileName}`);
    }
    return fs.promises.readFile(filePath);
  }

  /**
   * Guarda un buffer de imagen en la carpeta uploads
   */
  async saveImage(
    imageBuffer: Buffer,
    fileName: string,
  ): Promise<{ filePath: string; fileName: string }> {
    try {
      // Agregar timestamp para evitar conflictos
      const timestamp = Date.now();
      const nameWithoutExt = path.parse(fileName).name;
      const ext = path.parse(fileName).ext || '.png';
      const finalFileName = `${nameWithoutExt}-${timestamp}${ext}`;

      const filePath = path.join(this.uploadsDir, finalFileName);

      await fs.promises.writeFile(filePath, imageBuffer);

      this.logger.log(
        `✅ Imagen guardada: ${finalFileName} (${imageBuffer.length} bytes)`,
      );

      return {
        filePath,
        fileName: finalFileName,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error al guardar imagen: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Lee una imagen desde el directorio uploads
   */
  readImage(fileName: string): Buffer {
    try {
      const filePath = path.join(this.uploadsDir, fileName);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo no encontrado: ${fileName}`);
      }

      const imageBuffer = fs.readFileSync(filePath);
      this.logger.log(`✅ Imagen leída: ${fileName}`);

      return imageBuffer;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error al leer imagen: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Elimina un archivo del directorio uploads
   */
  async deleteImage(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, fileName);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`🗑️ Imagen eliminada: ${fileName}`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`⚠️ Error al eliminar imagen: ${errorMessage}`);
    }
  }

  /**
   * Obtiene la ruta de uploads
   */
  getUploadsDirectory(): string {
    return this.uploadsDir;
  }
}
