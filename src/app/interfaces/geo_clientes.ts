export interface GeoCliente {

  idcliente: number;
  nombreComercial?: string; // Opcional porque es nullable
  razon_social?: string; // Opcional porque es nullable
  rfc: string;
  nombreEncargado?: string;
  regimen?: string;
  idMetodoPago?: number;
  direccionFiscal?: string;
  usuarioCaptura?: string;
  usuarioModifica?: string;
  estado: string;
  codigoPostal: string;
  nombreArchivo?: string;
}