

// src/app/interfaces/geo_clientes.ts

export interface GeoCliente {
  idcliente: number;
  razon_social: string;
  nombreComercio: string;
  rfc: string;
  nombreEncargado: string;
  regimen: string;
  idMetodoPago: number;
  direccionFiscal: string;
  usuarioCaptura: string;
  usuarioModifica: string;
  estado: string;
  codigoPostal: string;
  nombreArchivo: string;
}