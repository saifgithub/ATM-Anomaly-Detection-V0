declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element | null, opts?: MapOptions);
    }
    
    class Marker {
      constructor(opts?: MarkerOptions);
      addListener(eventName: string, handler: Function): void;
    }
    
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker): void;
    }
    
    enum SymbolPath {
      CIRCLE = 0,
    }
    
    interface MapOptions {
      zoom?: number;
      center?: LatLngLiteral;
      styles?: MapTypeStyle[];
    }
    
    interface MarkerOptions {
      position?: LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: Symbol | string;
    }
    
    interface InfoWindowOptions {
      content?: string;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    interface Symbol {
      path: SymbolPath;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }
    
    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: Array<{ [key: string]: any }>;
    }
  }
}

export {};
