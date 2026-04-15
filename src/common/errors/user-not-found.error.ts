export class UserNotFoundError extends Error {
  readonly providerName: string;

  constructor(providerName: string, message?: string) {
    super(
      message ??
        `No se encontró información del usuario en el proveedor ${providerName}`,
    );
    this.name = 'UserNotFoundError';
    this.providerName = providerName;
  }
}
