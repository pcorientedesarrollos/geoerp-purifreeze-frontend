import { GeoRutasParada } from './geo-rutas-parada';

export interface GeoRutas {
  idRuta: number;
  idUsuario: number;
  idUnidadTransporte: number;
  fecha_hora: Date | string;
  kmlInicial?: string;

  // ¡CAMBIO QUE HICE!
  //elimie idCliente y idTipoServicio de aquí.
  // por que lo añadi en el arreglo de paradas.
  paradas: GeoRutasParada[];

  // La relación con los detalles de rastreo también puede ir aquí para el futuro
  // detalles?: any[];
}
