export interface GeoRecorrido {
  idRecorrido: number;
  idRuta: number; // CORREGIDO
  latitud: number;
  longitud: number;
  fechaHora: string;
}

export type CreateGeoRecorrido = Omit<
  GeoRecorrido,
  'idRecorrido' | 'fechaHora'
>;
