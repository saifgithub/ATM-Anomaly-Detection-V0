import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ATMLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastReport?: Date;
  anomalyCount: number;
}

export const MapOverview: React.FC = () => {
  const { user } = useAuth();
  const [mapLoaded, setMapLoaded] = useState(false);

  const { data: atmLocations, isLoading } = useQuery(
    ['atm-locations', user?.orgId],
    async () => {
      if (!user?.orgId) return [];

      const atmsRef = collection(db, 'atms');
      const atmsQuery = query(
        atmsRef,
        where('orgId', '==', user.orgId)
      );

      const snapshot = await getDocs(atmsQuery);
      const atms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ATMLocation[];

      const reportsRef = collection(db, 'reports');
      const reportsQuery = query(
        reportsRef,
        where('orgId', '==', user.orgId)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      
      const atmReports = new Map();
      reportsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const atmId = data.atmId;
        if (!atmReports.has(atmId)) {
          atmReports.set(atmId, { count: 0, anomalies: 0, lastReport: null });
        }
        const atmData = atmReports.get(atmId);
        atmData.count++;
        if (data.ai_result?.detected) {
          atmData.anomalies++;
        }
        if (!atmData.lastReport || data.created_at?.toDate() > atmData.lastReport) {
          atmData.lastReport = data.created_at?.toDate();
        }
        atmReports.set(atmId, atmData);
      });

      return atms.map(atm => ({
        ...atm,
        anomalyCount: atmReports.get(atm.id)?.anomalies || 0,
        lastReport: atmReports.get(atm.id)?.lastReport,
      }));
    },
    {
      enabled: !!user?.orgId,
    }
  );

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapLoaded && atmLocations && atmLocations.length > 0) {
      initializeMap();
    }
  }, [mapLoaded, atmLocations]);

  const initializeMap = () => {
    const mapElement = document.getElementById('map-container');
    if (!mapElement || !window.google) return;

    const map = new window.google.maps.Map(mapElement, {
      zoom: 10,
      center: atmLocations && atmLocations.length > 0 
        ? { lat: atmLocations[0].latitude, lng: atmLocations[0].longitude }
        : { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    if (atmLocations) {
      atmLocations.forEach(atm => {
        const marker = new window.google.maps.Marker({
          position: { lat: atm.latitude, lng: atm.longitude },
          map: map,
          title: `ATM ${atm.id}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: atm.anomalyCount > 0 ? '#ef4444' : '#10b981',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">ATM ${atm.id}</h3>
              <p class="text-sm text-gray-600">${atm.address}</p>
              <p class="text-sm">Status: <span class="capitalize">${atm.status}</span></p>
              <p class="text-sm">Anomalies: ${atm.anomalyCount}</p>
              ${atm.lastReport ? `<p class="text-xs text-gray-500">Last report: ${atm.lastReport.toLocaleDateString()}</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div id="map-container" className="w-full h-full rounded-lg" />
      {(!atmLocations || atmLocations.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-gray-500">No ATM locations found</p>
        </div>
      )}
    </div>
  );
};
