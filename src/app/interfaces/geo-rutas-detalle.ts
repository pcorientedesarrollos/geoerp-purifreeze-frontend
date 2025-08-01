export interface GeoRutasDetalle {
    idRutaDetalle: number;
    idRuta: number;
    idServicioEquipo: number;
    noSerie: string;
    nombreEquipo: string;
    fechaServicio: string;
    hora: string;
    tipoServicio: string;
    descripcion: string;
    observacionesServicio: string;
    idContrato: number;
    nombreComercio: string;
    status: number;

}


export interface ServicioDisponible {
  idServicioEquipo: number;
  NoSerie: string | null;
  nombreEquipo: string;
  fechaServicio: string;
  hora: string;
  tipo_servicio: string;
  descripcion: string;
  observaciones_servicio: string;
  idContrato: number;
  nombreComercio: string;
}


export interface GeoRutaDetallePayload {
  idRuta: number;
  idServicioEquipo: number;
  noSerie?: string;
  nombreEquipo: string;
  fechaServicio: string;
  hora: string;
  tipoServicio: string;
  descripcion?: string;
  observacionesServicio?: string;
  idContrato: number;
  nombreComercio: string;
  status: number;
}