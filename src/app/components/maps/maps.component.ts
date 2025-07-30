// src/app/components/maps/maps.component.ts

import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';

// Interfaz de Ruta con el ID del recorrido
export interface MapRoute {
  idRecorrido: number;
  path: google.maps.LatLngLiteral[];
  options: google.maps.PolylineOptions;
}

// Interfaz de Marcador
export interface MapMarker {
  position: google.maps.LatLngLiteral;
  options?: google.maps.MarkerOptions;
}

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css'],
})
export class MapsComponent {
  @Input() routes: MapRoute[] = [];
  @Input() markers: MapMarker[] = [];
  @Input() center: google.maps.LatLngLiteral = { lat: 20.9754, lng: -89.6169 };
  @Input() zoom = 12;

  @ViewChild(GoogleMap) public map!: GoogleMap;

  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 20,
    minZoom: 8,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };
}
