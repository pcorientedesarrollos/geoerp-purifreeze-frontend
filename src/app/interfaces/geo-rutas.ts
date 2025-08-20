// import { GeoRutasParada } from './geo-rutas-parada';


// export enum RutaStatus {
  //   PLANEADA = 'PLANEADA',
  //   EN_CURSO = 'EN_CURSO',
  //   FINALIZADA = 'FINALIZADA',
  //   CANCELADA = 'CANCELADA',
  //   ELIMINADA = "ELIMINADA",
  // }
  
  // export interface GeoRutas {
    //   idRuta: number;
    //   idUsuario: number;
    //   idUnidadTransporte: number;
    //   fechaHora: Date | string;
    //   kmInicial?: string;
    //   duracionMinutos?: number;
    //   statusRuta: RutaStatus; // <--- AÑADIR ESTA LÍNEA
    
    //   distanciaTotalKm?: number; // ¡NUEVO!
    //   consumoEstimadoLitros?: number; // ¡NUEVO!
    
    //   detalles: any[];
    //   usuario: {
      //     idUsuario: number;
      //     usuario: string; // Este es el nombre que mostraremos
      //   };
      //   unidadTransporte: {
        //     idUnidadTransporte: number;
        //     nombreUnidad: string; // Este es el nombre que mostraremos
        //   };
        
        //   // Asumiendo que `detalles` viene en la respuesta
        // }
        
        // export interface CreateGeoRutaPayload {
          //   idUsuario: number;
          //   idUnidadTransporte: number;
          //   kmInicial: string;
          // }
          
          
          // RUTA COMPLETA: src/app/interfaces/geo-rutas.ts
          
import { GeoStatus } from "./geo_status";
          
// COPIA Y PEGA ESTE CONTENIDO COMPLETO


export interface GeoRutas {
  idRuta: number;
  idUsuario: number;
  idUnidadTransporte: number;
  fechaHora: Date | string;
  kmInicial?: string;
  duracionMinutos?: number;
  
  // <-- ¡CAMBIO IMPORTANTE! Se elimina 'statusRuta'. Estas son las propiedades correctas.
  idEstatus: number;
  status: GeoStatus;

  distanciaTotalKm?: number;
  consumoEstimadoLitros?: number;

  detalles: any[]; // Considera crear una interfaz específica para 'detalles' en el futuro
  usuario: {
    idUsuario: number;
    usuario: string;
  };
  unidadTransporte: {
    idUnidadTransporte: number;
    nombreUnidad: string;
  };
}

export interface CreateGeoRutaPayload {
  idUsuario: number;
  idUnidadTransporte: number;
  kmInicial: string;
}