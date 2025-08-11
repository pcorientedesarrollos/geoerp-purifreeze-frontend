// Contenido para copiar y pegar
export interface Servicio {
  idServicioEquipo: number;
  NoSerie: string | null;
  nombreEquipo: string | null;
  fechaServicio: string;
  hora: string;
  status: string;
  tipo_servicio: string;
  descripcion: string;
  observaciones_servicio: string;
  idContrato: number;
  idCliente: number;
  nombreComercio: string;
}