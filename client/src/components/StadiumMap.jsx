import React, { useMemo, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";

const CROWD_COLORS = {
  low: "#34a853",
  medium: "#fbbc04",
  high: "#ea4335",
  very_high: "#9c27b0",
};

function LabelMarker({ position, text, offset = [0, -14] }) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: "marker-label",
        html: `<div role="img" aria-label="${text}" style="font-size:11px;font-weight:600;color:#333;text-shadow:1px 1px 2px white,-1px -1px 2px white;white-space:nowrap;">${text}</div>`,
        iconSize: [0, 0],
        iconAnchor: offset,
      })}
    />
  );
}

function FlyToLocation({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

function StadiumMap({ stadiumData, activeRoute, profile }) {
  const center = [40.8125, -74.0735];

  const sectionMarkers = useMemo(() => {
    if (!stadiumData?.layout) return [];
    const zoneSections = {};
    stadiumData.layout.sections.forEach((sec) => {
      if (!zoneSections[sec.zone]) zoneSections[sec.zone] = [];
      zoneSections[sec.zone].push(sec);
    });
    const result = [];
    Object.entries(zoneSections).forEach(([zone, secs]) => {
      const zoneCoords = stadiumData.layout.zones[zone];
      const zoneDir = { north: [1, 0], south: [-1, 0], east: [0, -1], west: [0, 1] };
      const dir = zoneDir[zone] || [0, 0];
      secs.forEach((sec, idx) => {
        const levelOffset = (sec.level - 1) * 0.0004;
        const idxOffset = (idx - (secs.length - 1) / 2) * 0.0006;
        const lat = zoneCoords.lat + dir[0] * levelOffset + dir[1] * idxOffset;
        const lng = zoneCoords.lng + dir[1] * levelOffset + dir[0] * idxOffset;
        result.push({ ...sec, position: [lat, lng] });
      });
    });
    return result;
  }, [stadiumData]);

  const amenityMarkers = useMemo(() => {
    if (!stadiumData?.layout) return [];
    return stadiumData.layout.amenities;
  }, [stadiumData]);

  const gateMarkers = useMemo(() => {
    if (!stadiumData?.layout) return [];
    return stadiumData.layout.gates;
  }, [stadiumData]);

  const routeCoordinates = useMemo(() => {
    if (!activeRoute || activeRoute.length === 0) return [];
    return activeRoute.map((pt) => [pt.lat, pt.lng]);
  }, [activeRoute]);

  const profileLocation = useMemo(() => {
    if (!stadiumData?.layout) return null;
    const loc = profile.location;
    const gate = stadiumData.layout.gates.find((g) => g.name === loc);
    if (gate) return [gate.lat, gate.lng];
    const section = sectionMarkers.find((s) => s.name === loc);
    if (section) return section.position;
    return null;
  }, [profile.location, stadiumData, sectionMarkers]);

  const amenityTypeIcons = {
    food: "🍔",
    restroom: "🚻",
    merchandise: "🛍️",
    first_aid: "🏥",
    security: "🛡️",
    water: "💧",
  };

  return (
    <div className="stadium-map-container">
      <MapContainer
        center={center}
        zoom={18}
        minZoom={17}
        maxZoom={19}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToLocation center={profileLocation} />

        {/* Zone crowd density circles */}
        {stadiumData?.layout &&
          Object.entries(stadiumData.layout.zones).map(([zone, coords]) => {
            if (zone === "center") return null;
            const level = stadiumData.live?.zoneCrowdDensity?.[zone] || "low";
            return (
              <CircleMarker
                key={zone}
                center={[coords.lat, coords.lng]}
                radius={20}
                fillColor={CROWD_COLORS[level]}
                fillOpacity={0.25}
                stroke={false}
              />
            );
          })}

        {/* Section markers */}
        {sectionMarkers.map((sec) => (
          <LabelMarker
            key={sec.id}
            position={sec.position}
            text={sec.name}
          />
        ))}

        {/* Gate markers */}
        {gateMarkers.map((gate) => {
          const isOpen = stadiumData?.live?.gateStatus?.[gate.id] !== false;
          return (
            <React.Fragment key={gate.id}>
              <Marker
                position={[gate.lat, gate.lng]}
                icon={L.divIcon({
                  className: "",
                  html: `<div role="img" aria-label="${gate.name}, ${isOpen ? "open" : "closed"}" style="background:${isOpen ? "#1e8e3e" : "#d93025"};color:white;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3);">${isOpen ? "●" : "✕"} ${gate.name}</div>`,
                  iconSize: [0, 0],
                  iconAnchor: [0, -10],
                })}
              />
            </React.Fragment>
          );
        })}

        {/* Amenity markers */}
        {amenityMarkers.map((am) => (
          <Marker
            key={am.id}
            position={[am.lat, am.lng]}
            icon={L.divIcon({
              className: "",
              html: `<div role="img" aria-label="${am.name} (${am.type}${am.wheelchair_accessible ? ", wheelchair accessible" : ""})" style="font-size:16px;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${amenityTypeIcons[am.type] || "📍"}</div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>
              <strong>{am.name}</strong><br />
              {am.type} {am.tags.length > 0 && `(${am.tags.join(", ")})`}
              {am.wheelchair_accessible && <br />}
              {am.wheelchair_accessible && "♿ Accessible"}
            </Popup>
          </Marker>
        ))}

        {/* Current location marker - visually dominant */}
        {profileLocation && (
          <React.Fragment>
            <CircleMarker
              center={profileLocation}
              radius={18}
              fillColor="#1a73e8"
              fillOpacity={0.15}
              stroke={true}
              color="#1a73e8"
              weight={1}
            />
            <Marker
              position={profileLocation}
              icon={L.divIcon({
                className: "",
                html: `<div class="current-location-marker" role="img" aria-label="Your location: ${profile.location}" style="width:24px;height:24px;background:#1a73e8;border:3px solid white;border-radius:50%;box-shadow:0 0 0 2px #1a73e8, 0 2px 8px rgba(0,0,0,0.4);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup><strong>Your Location</strong><br />{profile.location}</Popup>
            </Marker>
          </React.Fragment>
        )}

        {/* Active route polyline - prominent solid line */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#1a73e8"
            weight={5}
            opacity={0.9}
          />
        )}

        {/* Route waypoint markers */}
        {activeRoute && activeRoute.map((pt, i) => (
          <CircleMarker
            key={`route-pt-${i}`}
            center={[pt.lat, pt.lng]}
            radius={6}
            fillColor="#1a73e8"
            fillOpacity={1}
            color="white"
            weight={2}
          >
            <Popup>{pt.label}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default memo(StadiumMap);
