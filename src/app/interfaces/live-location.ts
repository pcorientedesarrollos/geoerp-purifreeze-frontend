export interface LiveLocation {
  idUnidadTransporte: number;
  latitud: string; // La DB devuelve string para decimal
  longitud: string;
  ultimaActualizacion: string | Date;
  nombreUnidad: string;
}
