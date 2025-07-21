export interface GeoRutasParada {
  idParada?: number; //opcional, solo existira en paradas ya guardadas
  idCliente: number;
  idSucursal: number;
  idTipoServicio: number;
  direccion: string;
  notas?: string;
}
