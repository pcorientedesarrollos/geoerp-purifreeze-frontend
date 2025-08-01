import { GeoRutasParada } from './geo-rutas-parada';

export interface GeoRutas {
  idRuta: number;
  idUsuario: number;
  idUnidadTransporte: number;
  fechaHora: Date | string;
  kmInicial: string;
}


export interface CreateGeoRutaPayload {
  idUsuario: number;
  idUnidadTransporte: number;
  kmInicial: string;
}
