"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  Tooltip,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  getIncidentColor,
  getSeverityLevel,
  type Incident,
  type Resource,
  type OptimizationResponse,
  type GhostRoad,
  type CycloneCone,
  type FloodPolygon,
  type Shelter,
} from "@/lib/api";
import { Icons } from "./MapIcons";
import { getShelterColor, predictOccupancy1h, getCurrentPercent } from "@/lib/sheltrSat";
import EquaPulseOverlay from "./EquaPulseOverlay";

// Fix for default marker icon missing in React Leaflet
// @ts-expect-error - private property hack
delete L.Icon.Default.prototype._getIconUrl;

// Auto-zoom on center change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.flyTo(center, 12, { duration: 0.9 });
  }, [center, map]);

  return null;
}

// Live coordinate display overlay
function CoordinateDisplay() {
  const [position, setPosition] = useState({ lat: 7.8731, lng: 80.7718 });
  const [zoom, setZoom] = useState(8);
  const map = useMap();

  useEffect(() => {
    const update = () => {
      const c = map.getCenter();
      setPosition({ lat: c.lat, lng: c.lng });
      setZoom(map.getZoom());
    };

    update();
    map.on("move", update);
    map.on("zoom", update);

    return () => {
      map.off("move", update);
      map.off("zoom", update);
    };
  }, [map]);

  return (
    <>
      <div className="leaflet-bottom leaflet-left" style={{ pointerEvents: "none" }}>
        <div className="glass-panel rounded px-3 py-2 m-3 font-mono-data text-xs">
          <div className="text-slate-400">
            LAT: <span className="text-cyan-400 font-semibold">{position.lat.toFixed(4)}°</span>
          </div>
          <div className="text-slate-400 mt-1">
            LON: <span className="text-cyan-400 font-semibold">{position.lng.toFixed(4)}°</span>
          </div>
        </div>
      </div>

      <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: "none" }}>
        <div className="glass-panel rounded px-3 py-2 m-3 font-mono-data text-xs text-slate-400">
          ZOOM: <span className="text-cyan-400 font-semibold">{zoom}</span>
        </div>
      </div>
    </>
  );
}

interface MainMapProps {
  incidents: Incident[];
  resources: Resource[];
  viewCenter: [number, number];
  optimizedRoute?: OptimizationResponse | null;
  ghostRoads: GhostRoad[];
  cycloneCone: CycloneCone | null;
  floodPolygons: FloodPolygon[];
  shelters: Shelter[];
  selectedShelterId?: string | null;
  // Travel-Guard mode
  touristMarker?: { location: [number, number]; name: string } | null;
  destinationMarker?: { location: [number, number]; name: string } | null;
  corridorPath?: Array<[number, number]> | null;
  // EquaPulse mode
  equaPulseGrid?: import('@/lib/equaPulse').EquaPulseGrid | null;
  showRiskSurface?: boolean;
  showFairnessSurface?: boolean;
  showEvacLine?: boolean;
  evacBoundary?: Array<[number, number]> | null;
}

// Auto-fit bounds helper
function AutoFitBounds({ 
  incidents, 
  cycloneCone,
  floodPolygons
}: { 
  incidents: Incident[]; 
  cycloneCone: CycloneCone | null;
  floodPolygons: FloodPolygon[];
}) {
  const map = useMap();

  useEffect(() => {
    const bounds: L.LatLngBounds = L.latLngBounds([]);
    
    // Add incidents to bounds
    incidents.forEach(inc => {
      bounds.extend([inc.lat, inc.lon]);
    });

    // Add cyclone cone polygon to bounds
    if (cycloneCone?.polygon && cycloneCone.polygon.length > 0) {
      cycloneCone.polygon.forEach((point: [number, number]) => {
        bounds.extend(point);
      });
    }

    // Add flood polygons to bounds
    if (floodPolygons && floodPolygons.length > 0) {
      floodPolygons.forEach(flood => {
        flood.polygon.forEach((point: [number, number]) => {
          bounds.extend(point);
        });
      });
    }

    // Fit bounds if we have any points
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [incidents, cycloneCone, floodPolygons, map]);

  return null;
}

export default function MainMap({
  incidents,
  resources,
  viewCenter,
  optimizedRoute,
  ghostRoads,
  cycloneCone,
  floodPolygons,
  shelters,
  selectedShelterId,
  touristMarker,
  destinationMarker,
  corridorPath,
  equaPulseGrid,
  showRiskSurface,
  showFairnessSurface,
  showEvacLine,
  evacBoundary,
}: MainMapProps) {
  const mapCenter: [number, number] = viewCenter || [7.8731, 80.7718];

  // Helper function to get flood risk styling
  const getFloodStyle = (depth: number, risk: string) => {
    const riskUpper = risk.toUpperCase();
    let fillOpacity = 0.12;
    let strokeOpacity = 0.65;
    let className = "flood-pulse";

    if (depth >= 2.0 || riskUpper === "EXTREME") {
      fillOpacity = 0.28;
      strokeOpacity = 0.85;
      className = "flood-pulse flood-depth-extreme";
    } else if (depth >= 1.2 || riskUpper === "HIGH") {
      fillOpacity = 0.22;
      strokeOpacity = 0.75;
      className = "flood-pulse flood-depth-high";
    } else if (depth >= 0.6 || riskUpper === "MODERATE") {
      fillOpacity = 0.16;
      strokeOpacity = 0.65;
      className = "flood-pulse flood-depth-moderate";
    }

    return { fillOpacity, strokeOpacity, className };
  };

  return (
    <div className="relative w-full h-full">
      {/* Scan Line Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 scan-line-effect opacity-30" />

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-400/50 z-10 pointer-events-none" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-400/50 z-10 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-400/50 z-10 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-400/50 z-10 pointer-events-none" />

      <MapContainer
        center={mapCenter}
        zoom={8}
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
        zoomControl={false}
        className="map-container-enhanced"
      >
        <ChangeView center={mapCenter} />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          opacity={0.85}
        />

        {/* Ghost Roads Layer - Blocked/Hazardous Roads */}
        {ghostRoads.map((ghostRoad) => (
          <div key={ghostRoad.id}>
            {/* Glow effect (thicker, lower opacity) */}
            <Polyline
              positions={ghostRoad.coords}
              pathOptions={{
                color: "#ef4444",
                weight: 8,
                opacity: 0.25,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* Main dashed line */}
            <Polyline
              positions={ghostRoad.coords}
              pathOptions={{
                color: "#ef4444",
                weight: 4,
                opacity: 0.9,
                dashArray: "8 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              <Tooltip permanent={false} direction="top" className="ghost-road-tooltip">
                <div className="bg-slate-900 p-2 rounded border border-red-500/50">
                  <div className="font-bold text-red-400 text-xs">GHOST ROAD — {ghostRoad.hazard}</div>
                  <div className="text-xs text-slate-300 mt-1">{ghostRoad.reason}</div>
                </div>
              </Tooltip>
            </Polyline>
          </div>
        ))}

        {/* Flood Risk Polygons Layer */}
        {floodPolygons.map((floodZone) => {
          const style = getFloodStyle(floodZone.depth_m, floodZone.risk);
          
          return (
            <div key={floodZone.id}>
              {/* Glow base polygon (thicker stroke, lower opacity) */}
              <Polygon
                positions={floodZone.polygon}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: style.fillOpacity * 0.4,
                  weight: 7,
                  opacity: 0.2,
                  lineCap: "round",
                  lineJoin: "round",
                  className: "flood-glow",
                }}
              />
              
              {/* Main flood polygon with pulse */}
              <Polygon
                positions={floodZone.polygon}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: style.fillOpacity,
                  weight: 2,
                  opacity: style.strokeOpacity,
                  lineCap: "round",
                  lineJoin: "round",
                  className: style.className,
                }}
              >
                <Tooltip permanent={false} direction="center">
                  <div className="bg-slate-900 p-2 rounded border border-blue-500/50">
                    <div className="font-bold text-blue-400 text-xs">FLOOD DEPTH: {floodZone.depth_m.toFixed(1)}m</div>
                    <div className="text-xs text-slate-300 mt-1">RISK: {floodZone.risk}</div>
                    <div className="text-xs text-slate-500 mt-1">Kalutara Basin Model</div>
                  </div>
                </Tooltip>
              </Polygon>
            </div>
          );
        })}

        {/* Cyclone Cone Layer */}
        {cycloneCone && (
          <>
            {/* Polygon with pulse effect */}
            <Polygon
              positions={cycloneCone.polygon}
              pathOptions={{
                color: "#facc15",
                fillColor: "#facc15",
                fillOpacity: 0.15,
                weight: 2,
                opacity: 0.8,
                className: "cyclone-cone-polygon",
              }}
            >
              <Tooltip permanent={false} direction="center">
                <div className="bg-slate-900 p-2 rounded border border-yellow-500/50">
                  <div className="font-bold text-yellow-400 text-xs">CYCLONE CONE</div>
                  <div className="text-xs text-slate-300 mt-1">Next {cycloneCone.hours}h uncertainty</div>
                </div>
              </Tooltip>
            </Polygon>

            {/* Centerline */}
            <Polyline
              positions={cycloneCone.centerline}
              pathOptions={{
                color: "#fde047",
                weight: 3,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              <Tooltip permanent={false} direction="top">
                <div className="bg-slate-900 p-2 rounded border border-yellow-500/50">
                  <div className="font-bold text-yellow-400 text-xs">Cyclone Track (Next {cycloneCone.hours}h)</div>
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* Optimized Route Polyline */}
        {optimizedRoute?.path && optimizedRoute.path.length > 1 && (
          <>
            <Polyline
              positions={optimizedRoute.path as [number, number][]}
              pathOptions={{
                color: "#06b6d4",
                weight: 4,
                opacity: 0.8,
                dashArray: "10, 8",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={optimizedRoute.path as [number, number][]}
              pathOptions={{
                color: "#06b6d4",
                weight: 8,
                opacity: 0.25,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* Incidents */}
        {incidents.map((incident) => {
          const color = getIncidentColor(incident.type);
          const { label: severityLabel, color: severityColor } = getSeverityLevel(incident.severity);

          const getIcon = () => {
            const type = String(incident.type).toUpperCase();
            if (type === "FLOOD") return Icons.FLOOD;
            if (type === "LANDSLIDE") return Icons.LANDSLIDE;
            if (type === "WIND") return Icons.WIND;
            if (incident.severity >= 9) return Icons.CRITICAL;
            return Icons.CRITICAL;
          };

          return (
            <div key={incident.id}>
              {/* 3) Red dotted circle for high severity */}
              {incident.severity > 8 && (
                <Circle
                  center={[incident.lat, incident.lon]}
                  radius={500}
                  pathOptions={{
                    color: "#ef4444",
                    weight: 2,
                    opacity: 0.9,
                    dashArray: "4 6", // dotted effect
                    fillColor: "#ef4444",
                    fillOpacity: 0.06,
                  }}
                />
              )}

              <Marker position={[incident.lat, incident.lon]} icon={getIcon()}>
                <Popup className="custom-popup">
                  <div className="bg-slate-900 p-3 rounded border" style={{ borderColor: `${color}30` }}>
                    <div className="font-bold mb-1" style={{ color }}>
                      INCIDENT: {incident.type}
                    </div>
                    <div className="text-xs text-slate-300">{incident.description}</div>
                    <div className="text-xs text-slate-300 mt-2">
                      Severity:{" "}
                      <span style={{ color: severityColor }} className="font-bold">
                        {incident.severity}/10 ({severityLabel})
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Status:{" "}
                      {incident.verified ? (
                        <span className="text-emerald-400 font-semibold">VERIFIED</span>
                      ) : (
                        <span className="text-yellow-400">UNVERIFIED</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Time: {incident.timestamp}</div>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}

        {/* Resources */}
        {resources.map((resource) => {
          const getResourceIcon = () => {
            const type = String(resource.type).toUpperCase();
            if (type === "BOAT") return Icons.BOAT;
            if (type === "TRUCK") return Icons.TRUCK;
            return Icons.TRUCK;
          };

          const statusColor =
            resource.status === "IDLE"
              ? "#10b981"
              : resource.status === "BUSY"
              ? "#f59e0b"
              : "#64748b";

          return (
            <Marker key={resource.id} position={[resource.lat, resource.lon]} icon={getResourceIcon()}>
              <Popup>
                <div className="bg-slate-900 p-3 rounded border border-emerald-500/30">
                  <div className="font-bold mb-1 text-emerald-400">RESOURCE: {resource.type}</div>
                  <div className="text-xs text-slate-300">ID: {resource.id}</div>
                  <div className="text-xs text-slate-300">
                    Status:{" "}
                    <span style={{ color: statusColor }} className="font-bold">
                      {resource.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">Capacity: {resource.capacity}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Shelters Layer */}
        {shelters.map((shelter) => {
          const currentPercent = getCurrentPercent(shelter);
          const colorInfo = getShelterColor(currentPercent);
          const prediction = predictOccupancy1h(shelter, { incidentLoad: incidents.length });
          const isSelected = selectedShelterId === shelter.id;
          
          // Calculate radius based on capacity (larger capacity = larger pin)
          const baseRadius = 50 + (shelter.capacity / 20);
          const radius = isSelected ? baseRadius * 1.3 : baseRadius;
          
          return (
            <div key={shelter.id}>
              {/* Glow effect (base circle) */}
              <Circle
                center={shelter.location}
                radius={radius * 1.8}
                pathOptions={{
                  color: colorInfo.stroke,
                  weight: 0,
                  fillColor: colorInfo.fill,
                  fillOpacity: 0.15,
                  className: "shelter-glow",
                }}
              />
              
              {/* Selection pulse ring (if selected) */}
              {isSelected && (
                <Circle
                  center={shelter.location}
                  radius={radius * 2.2}
                  pathOptions={{
                    color: "#06b6d4", // cyan
                    weight: 3,
                    fillOpacity: 0,
                    opacity: 0.8,
                    dashArray: "8 4",
                    className: "shelter-selected-pulse",
                  }}
                />
              )}
              
              {/* Main shelter circle */}
              <Circle
                center={shelter.location}
                radius={radius}
                pathOptions={{
                  color: isSelected ? "#06b6d4" : colorInfo.stroke,
                  weight: isSelected ? 4 : 3,
                  fillColor: colorInfo.fill,
                  fillOpacity: 0.7,
                  opacity: 0.9,
                  className: "shelter-marker",
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-slate-900 p-3 rounded border border-purple-500/30 min-w-[200px]">
                    <div className="font-bold mb-2 text-purple-400 text-sm flex items-center justify-between">
                      <span>🏠 {shelter.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        colorInfo.label === "GREEN" ? "bg-green-500/20 text-green-300" :
                        colorInfo.label === "YELLOW" ? "bg-yellow-500/20 text-yellow-300" :
                        "bg-red-500/20 text-red-300"
                      }`}>
                        {colorInfo.label}
                      </span>
                    </div>
                    
                    {/* Current Occupancy */}
                    <div className="text-xs text-slate-300 mb-1">
                      <span className="text-slate-500">Current:</span>{" "}
                      <span className="font-bold text-cyan-400">
                        {shelter.current_occupancy}
                      </span>
                      {" / "}
                      <span className="text-slate-400">{shelter.capacity}</span>
                      {" "}
                      <span className={`font-bold ${
                        currentPercent >= 80 ? "text-red-400" :
                        currentPercent >= 50 ? "text-yellow-400" :
                        "text-green-400"
                      }`}>
                        ({currentPercent.toFixed(0)}%)
                      </span>
                    </div>
                    
                    {/* Predicted Occupancy */}
                    <div className="text-xs text-slate-300 mb-2 pb-2 border-b border-slate-700">
                      <span className="text-slate-500">Predicted (1h):</span>{" "}
                      <span className="font-bold text-purple-400">
                        {prediction.predicted_occupancy_1h}
                      </span>
                      {" / "}
                      <span className="text-slate-400">{shelter.capacity}</span>
                      {" "}
                      <span className={`font-bold ${
                        prediction.predicted_status_1h === "FULL" ? "text-red-400" :
                        prediction.predicted_status_1h === "WARNING" ? "text-yellow-400" :
                        "text-green-400"
                      }`}>
                        ({prediction.predicted_percent_1h.toFixed(0)}%)
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="text-[10px] text-slate-500">
                      Status:{" "}
                      <span className={`font-bold ${
                        prediction.predicted_status_1h === "FULL" ? "text-red-400" :
                        prediction.predicted_status_1h === "WARNING" ? "text-yellow-400" :
                        "text-emerald-400"
                      }`}>
                        {prediction.predicted_status_1h}
                      </span>
                      {" "}
                      <span className="text-slate-600">|</span>
                      {" "}
                      <span className="text-slate-400">{shelter.status || "OPEN"}</span>
                    </div>
                  </div>
                </Popup>
                
                <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                  <div className="text-[10px] font-mono">
                    <div className="font-bold">{shelter.name}</div>
                    <div className="text-slate-300 mt-0.5">
                      {currentPercent.toFixed(0)}% → {prediction.predicted_percent_1h.toFixed(0)}%
                    </div>
                  </div>
                </Tooltip>
              </Circle>
            </div>
          );
        })}

        {/* Travel-Guard: Corridor Polyline */}
        {corridorPath && corridorPath.length > 0 && (
          <>
            {/* Glow base polyline */}
            <Polyline
              positions={corridorPath}
              pathOptions={{
                color: "#10b981",
                weight: 10,
                opacity: 0.2,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            
            {/* Main corridor polyline */}
            <Polyline
              positions={corridorPath}
              pathOptions={{
                color: "#34d399",
                weight: 4,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
                dashArray: "10 5",
              }}
            >
              <Tooltip permanent={false} direction="center">
                <div className="bg-slate-900 p-2 rounded border border-emerald-500/50">
                  <div className="font-bold text-emerald-400 text-xs">SAFE CORRIDOR</div>
                  <div className="text-xs text-slate-300 mt-1">Follow this route to safety</div>
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* Travel-Guard: Tourist Marker */}
        {touristMarker && (
          <Circle
            center={touristMarker.location}
            radius={300}
            pathOptions={{
              color: "#10b981",
              fillColor: "#34d399",
              fillOpacity: 0.3,
              weight: 3,
              opacity: 0.9,
              className: "tourist-marker-pulse",
            }}
          >
            <Popup>
              <div className="bg-slate-900 p-3 rounded border border-emerald-500/50">
                <div className="font-bold text-emerald-400 mb-1">📍 YOUR LOCATION</div>
                <div className="text-xs text-slate-300">{touristMarker.name}</div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {touristMarker.location[0].toFixed(4)}, {touristMarker.location[1].toFixed(4)}
                </div>
              </div>
            </Popup>
          </Circle>
        )}

        {/* Travel-Guard: Destination Marker */}
        {destinationMarker && (
          <Circle
            center={destinationMarker.location}
            radius={400}
            pathOptions={{
              color: "#06b6d4",
              fillColor: "#22d3ee",
              fillOpacity: 0.3,
              weight: 3,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div className="bg-slate-900 p-3 rounded border border-cyan-500/50">
                <div className="font-bold text-cyan-400 mb-1">✈️ SAFE DESTINATION</div>
                <div className="text-xs text-slate-300">{destinationMarker.name}</div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {destinationMarker.location[0].toFixed(4)}, {destinationMarker.location[1].toFixed(4)}
                </div>
              </div>
            </Popup>
          </Circle>
        )}

        {/* EquaPulse: Risk Surface */}
        {equaPulseGrid && showRiskSurface && (
          <EquaPulseOverlay
            grid={equaPulseGrid}
            mode="RISK"
            opacity={0.5}
            visible={showRiskSurface}
          />
        )}

        {/* EquaPulse: Fairness Surface */}
        {equaPulseGrid && showFairnessSurface && (
          <EquaPulseOverlay
            grid={equaPulseGrid}
            mode="FAIRNESS"
            opacity={0.5}
            visible={showFairnessSurface}
          />
        )}

        {/* EquaPulse: Evacuation Boundary */}
        {evacBoundary && evacBoundary.length > 0 && showEvacLine && (
          <>
            {/* Glow layer */}
            <Polygon
              positions={evacBoundary}
              pathOptions={{
                color: '#ef4444',
                weight: 8,
                opacity: 0.2,
                fillColor: '#ef4444',
                fillOpacity: 0.05
              }}
            />
            {/* Main boundary */}
            <Polygon
              positions={evacBoundary}
              pathOptions={{
                color: '#f87171',
                weight: 3,
                opacity: 0.9,
                dashArray: '10 5',
                fillOpacity: 0,
                className: 'evacuation-boundary-pulse'
              }}
            >
              <Tooltip permanent direction="top">
                <div className="text-center">
                  <div className="font-bold text-red-400 text-xs">⚠️ EVACUATION ZONE</div>
                  <div className="text-[10px] text-slate-300 mt-1">Evacuate Immediately</div>
                </div>
              </Tooltip>
            </Polygon>
          </>
        )}

        <AutoFitBounds incidents={incidents} cycloneCone={cycloneCone} floodPolygons={floodPolygons} />
        <CoordinateDisplay />
      </MapContainer>
    </div>
  );
}
