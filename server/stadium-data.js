// Stadium data model — gates, sections, amenities, accessibility, zone geometry.
// This is the static layout; live state (gate open/closed, crowd density) is
// generated in live-data.js and keyed by the ids defined here.

export const stadiumLayout = {
  name: "MetLife Stadium",
  sections: [
    { id: "sec_101", name: "Section 101", zone: "north", level: 1, seats: 450, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_102", name: "Section 102", zone: "north", level: 1, seats: 450, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_103", name: "Section 103", zone: "north", level: 2, seats: 380, wheelchair_accessible: false, stairs_only: true },
    { id: "sec_104", name: "Section 104", zone: "east", level: 1, seats: 500, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_105", name: "Section 105", zone: "east", level: 2, seats: 400, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_106", name: "Section 106", zone: "east", level: 3, seats: 350, wheelchair_accessible: false, stairs_only: true },
    { id: "sec_107", name: "Section 107", zone: "south", level: 1, seats: 450, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_108", name: "Section 108", zone: "south", level: 1, seats: 450, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_109", name: "Section 109", zone: "south", level: 2, seats: 380, wheelchair_accessible: false, stairs_only: true },
    { id: "sec_110", name: "Section 110", zone: "west", level: 1, seats: 500, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_111", name: "Section 111", zone: "west", level: 2, seats: 400, wheelchair_accessible: true, stairs_only: false },
    { id: "sec_112", name: "Section 112", zone: "west", level: 3, seats: 350, wheelchair_accessible: false, stairs_only: true },
  ],

  // Gates sit on the outer perimeter, clear of the zone-center cluster where
  // section/amenity markers are jittered — otherwise gate and section labels
  // collide on the map. Open/closed state lives in live-data.js, not here.
  gates: [
    { id: "gate_n", name: "North Gate", zone: "north", lat: 40.8160, lng: -74.0740 },
    { id: "gate_e", name: "East Gate", zone: "east", lat: 40.8128, lng: -74.0685 },
    { id: "gate_s", name: "South Gate", zone: "south", lat: 40.8090, lng: -74.0735 },
    { id: "gate_w", name: "West Gate", zone: "west", lat: 40.8128, lng: -74.0785 },
    { id: "gate_vip", name: "VIP Gate", zone: "east", lat: 40.8135, lng: -74.0695 },
  ],

  amenities: [
    { id: "am_1", type: "food", name: "Burger Shack", zone: "north", tags: ["halal", "nut-free"], lat: 40.8138, lng: -74.0738, wheelchair_accessible: true },
    { id: "am_2", type: "food", name: "Pizza Corner", zone: "east", tags: ["vegetarian", "gluten-free"], lat: 40.8130, lng: -74.0715, wheelchair_accessible: true },
    { id: "am_3", type: "food", name: "Taco Stand", zone: "south", tags: ["vegan", "nut-free"], lat: 40.8115, lng: -74.0732, wheelchair_accessible: false },
    { id: "am_4", type: "food", name: "Sushi Bar", zone: "west", tags: ["gluten-free"], lat: 40.8130, lng: -74.0755, wheelchair_accessible: true },
    { id: "am_5", type: "food", name: "Hot Dog Cart", zone: "north", tags: [], lat: 40.8135, lng: -74.0740, wheelchair_accessible: true },
    { id: "am_6", type: "restroom", name: "Restroom North", zone: "north", tags: ["accessible"], lat: 40.8137, lng: -74.0736, wheelchair_accessible: true },
    { id: "am_7", type: "restroom", name: "Restroom East", zone: "east", tags: ["accessible"], lat: 40.8129, lng: -74.0713, wheelchair_accessible: true },
    { id: "am_8", type: "restroom", name: "Restroom South", zone: "south", tags: ["accessible"], lat: 40.8113, lng: -74.0733, wheelchair_accessible: true },
    { id: "am_9", type: "restroom", name: "Restroom West", zone: "west", tags: ["accessible"], lat: 40.8129, lng: -74.0757, wheelchair_accessible: true },
    { id: "am_10", type: "merchandise", name: "Team Store", zone: "east", tags: [], lat: 40.8127, lng: -74.0712, wheelchair_accessible: true },
    { id: "am_11", type: "merchandise", name: "Fan Shop", zone: "west", tags: [], lat: 40.8127, lng: -74.0758, wheelchair_accessible: true },
    { id: "am_12", type: "first_aid", name: "Medical Station North", zone: "north", tags: [], lat: 40.8139, lng: -74.0737, wheelchair_accessible: true },
    { id: "am_13", type: "first_aid", name: "Medical Station South", zone: "south", tags: [], lat: 40.8112, lng: -74.0734, wheelchair_accessible: true },
    { id: "am_14", type: "security", name: "Security Post East", zone: "east", tags: [], lat: 40.8131, lng: -74.0711, wheelchair_accessible: true },
    { id: "am_15", type: "security", name: "Security Post West", zone: "west", tags: [], lat: 40.8126, lng: -74.0759, wheelchair_accessible: true },
    { id: "am_16", type: "water", name: "Water Station North", zone: "north", tags: [], lat: 40.8136, lng: -74.0739, wheelchair_accessible: true },
    { id: "am_17", type: "water", name: "Water Station South", zone: "south", tags: [], lat: 40.8114, lng: -74.0731, wheelchair_accessible: true },
  ],

  // Zone centers for map rendering and route waypoint fallback
  zones: {
    north: { lat: 40.8140, lng: -74.0738 },
    east: { lat: 40.8128, lng: -74.0710 },
    south: { lat: 40.8110, lng: -74.0735 },
    west: { lat: 40.8128, lng: -74.0760 },
    center: { lat: 40.8125, lng: -74.0735 },
  },
};

// Exact-name lookups (O(1)) for route waypoint resolution. Most AI-generated
// route labels match a real name exactly (e.g. "Section 101", "Burger Shack");
// callers should try these first and only fall back to a substring scan for
// fuzzier labels (e.g. "North Concourse").
export const gatesByName = new Map(stadiumLayout.gates.map((g) => [g.name.toLowerCase(), g]));
export const amenitiesByName = new Map(stadiumLayout.amenities.map((a) => [a.name.toLowerCase(), a]));
export const sectionsByName = new Map(stadiumLayout.sections.map((s) => [s.name.toLowerCase(), s]));
