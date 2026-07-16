import React, { useMemo, useEffect, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";

const CROWD_COLORS = {
  low: "#34a853",
  medium: "#fbbc04",
  high: "#ea4335",
  very_high: "#9c27b0",
};

const AMENITY_TYPE_ICONS = {
  food: "🍔",
  restroom: "🚻",
  merchandise: "🛍️",
  first_aid: "🏥",
  security: "🛡️",
  water: "💧",
};

// Degree-offset per section level/index, used to jitter section markers apart
// within a zone so labels don't collide. Must stay comfortably larger than
// GPS-noise scale (~1e-5 deg) — these were previously 0.00008/0.00012, too
// small to visually separate labels at any usable zoom (see task.md Phase 4).
const SECTION_LEVEL_OFFSET_DEG = 0.0004;
const SECTION_INDEX_OFFSET_DEG = 0.0006;

// Which direction each zone's section row fans out (lat, lng multipliers).
const ZONE_DIRECTIONS = { north: [1, 0], south: [-1, 0], east: [0, -1], west: [0, 1] };

const MAP_CENTER = [40.8125, -74.0735];
const MAP_DEFAULT_ZOOM = 18;
const MAP_MIN_ZOOM = 17;
const MAP_MAX_ZOOM = 19;

// Marker visuals live in App.css (.marker-label, .gate-badge, .amenity-icon,
// .current-location-marker); the html here only carries content + a11y attributes.
function LabelMarker({ position, text, offset = [0, -14] }) {
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: "marker-label",
        html: `<div role="img" aria-label="${text}">${text}</div>`,
        iconSize: [0, 0],
        iconAnchor: offset,
      })}
    />
  );
}

function FlyToLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

function StadiumMap({ layout, live, activeRoute, profile }) {
  // Everything derived from layout is computed exactly once — layout is fetched
  // a single time and its identity never changes, unlike the polled live data.
  const sectionMarkers = useMemo(() => {
    if (!layout) return [];
    const zoneSections = {};
    layout.sections.forEach((sec) => {
      if (!zoneSections[sec.zone]) zoneSections[sec.zone] = [];
      zoneSections[sec.zone].push(sec);
    });
    const result = [];
    Object.entries(zoneSections).forEach(([zone, secs]) => {
      const zoneCoords = layout.zones[zone];
      const dir = ZONE_DIRECTIONS[zone] || [0, 0];
      secs.forEach((sec, idx) => {
        const levelOffset = (sec.level - 1) * SECTION_LEVEL_OFFSET_DEG;
        const idxOffset = (idx - (secs.length - 1) / 2) * SECTION_INDEX_OFFSET_DEG;
        const lat = zoneCoords.lat + dir[0] * levelOffset + dir[1] * idxOffset;
        const lng = zoneCoords.lng + dir[1] * levelOffset + dir[0] * idxOffset;
        result.push({ ...sec, position: [lat, lng] });
      });
    });
    return result;
  }, [layout]);

  const routeCoordinates = useMemo(() => {
    if (!activeRoute || activeRoute.length === 0) return [];
    return activeRoute.map((pt) => [pt.lat, pt.lng]);
  }, [activeRoute]);

  const profileLocation = useMemo(() => {
    if (!layout) return null;
    const loc = profile.location;
    const gate = layout.gates.find((g) => g.name === loc);
    if (gate) return [gate.lat, gate.lng];
    const section = sectionMarkers.find((s) => s.name === loc);
    if (section) return section.position;
    return null;
  }, [profile.location, layout, sectionMarkers]);

  return (
    <div className="stadium-map-container">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToLocation center={profileLocation} />

        {/* Zone crowd density circles */}
        {layout &&
          Object.entries(layout.zones).map(([zone, coords]) => {
            if (zone === "center") return null;
            const level = live?.zoneCrowdDensity?.[zone] || "low";
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
        {layout?.gates.map((gate) => {
          const isOpen = live?.gateStatus?.[gate.id] !== false;
          return (
            <Marker
              key={gate.id}
              position={[gate.lat, gate.lng]}
              icon={L.divIcon({
                className: "",
                html: `<div role="img" aria-label="${gate.name}, ${isOpen ? "open" : "closed"}" class="gate-badge ${isOpen ? "gate-badge--open" : "gate-badge--closed"}">${isOpen ? "●" : "✕"} ${gate.name}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, -10],
              })}
            />
          );
        })}

        {/* Amenity markers */}
        {layout?.amenities.map((am) => (
          <Marker
            key={am.id}
            position={[am.lat, am.lng]}
            icon={L.divIcon({
              className: "",
              html: `<div role="img" aria-label="${am.name} (${am.type}${am.wheelchair_accessible ? ", wheelchair accessible" : ""})" class="amenity-icon">${AMENITY_TYPE_ICONS[am.type] || "📍"}</div>`,
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
          <>
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
                html: `<div class="current-location-marker" role="img" aria-label="Your location: ${profile.location}"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              <Popup><strong>Your Location</strong><br />{profile.location}</Popup>
            </Marker>
          </>
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
            key={`${pt.label}-${i}`}
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
