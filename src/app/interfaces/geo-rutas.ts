import { GeoRutasParada } from './geo-rutas-parada';

export interface GeoRutas {
  idRuta: number;
  idUsuario: number;
  idUnidadTransporte: number;
  fecha_hora: Date | string;
  kmlInicial?: string;
  paradas: GeoRutasParada[];
}
