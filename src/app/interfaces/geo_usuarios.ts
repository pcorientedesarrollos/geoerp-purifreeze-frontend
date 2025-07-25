export interface GeoUsuario {
    idUsuario: number;
    usuario: string;
    clave: string;
    permiso: number;
    descriptor_facial?: string | null; // El '?' hace la propiedad opcional
}