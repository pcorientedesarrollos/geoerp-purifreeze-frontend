// src/app/interfaces/geo_clientes.ts

export interface GeoCliente {
  idcliente: number;
  nombreComercio?: string;
  razon_social?: string;
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
