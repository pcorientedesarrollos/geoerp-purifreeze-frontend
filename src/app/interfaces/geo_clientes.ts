export interface GeoCliente {

  idcliente: number;
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
  nombreComercial?: string; // Opcional porque es nullable
}