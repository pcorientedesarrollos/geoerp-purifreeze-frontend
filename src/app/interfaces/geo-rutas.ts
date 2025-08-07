import { GeoRutasParada } from './geo-rutas-parada';

export enum RutaStatus {
  PLANEADA = 'PLANEADA',
  EN_CURSO = 'EN_CURSO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export interface GeoRutas {
  idRuta: number;
  idUsuario: number;
  idUnidadTransporte: number;
  fechaHora: Date | string;
  kmInicial: string;
  status: RutaStatus; // <--- AÑADIR ESTA LÍNEA
  detalles: any[]; // Asumiendo que `detalles` viene en la respuesta
}

export interface CreateGeoRutaPayload {
  idUsuario: number;
  idUnidadTransporte: number;
  kmInicial: string;
}
