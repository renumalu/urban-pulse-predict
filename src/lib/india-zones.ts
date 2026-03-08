// All 36 Indian States and Union Territories with capital coordinates and metadata

export interface IndianZone {
  id: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
  elevation: number; // avg elevation in meters
  population: number; // in millions (approx 2024)
  roadDensity: number; // relative 0-1 scale
}

export const INDIAN_ZONES: IndianZone[] = [
  { id: 'z0', name: 'Andhra Pradesh', capital: 'Amaravati', lat: 16.5062, lng: 80.6480, elevation: 200, population: 53, roadDensity: 0.65 },
  { id: 'z1', name: 'Arunachal Pradesh', capital: 'Itanagar', lat: 27.0844, lng: 93.6053, elevation: 1500, population: 1.7, roadDensity: 0.2 },
  { id: 'z2', name: 'Assam', capital: 'Dispur', lat: 26.1445, lng: 91.7362, elevation: 55, population: 35, roadDensity: 0.45 },
  { id: 'z3', name: 'Bihar', capital: 'Patna', lat: 25.6093, lng: 85.1376, elevation: 53, population: 130, roadDensity: 0.7 },
  { id: 'z4', name: 'Chhattisgarh', capital: 'Raipur', lat: 21.2514, lng: 81.6296, elevation: 300, population: 30, roadDensity: 0.4 },
  { id: 'z5', name: 'Goa', capital: 'Panaji', lat: 15.4909, lng: 73.8278, elevation: 37, population: 1.6, roadDensity: 0.8 },
  { id: 'z6', name: 'Gujarat', capital: 'Gandhinagar', lat: 23.2156, lng: 72.6369, elevation: 81, population: 71, roadDensity: 0.7 },
  { id: 'z7', name: 'Haryana', capital: 'Chandigarh', lat: 30.7333, lng: 76.7794, elevation: 220, population: 30, roadDensity: 0.75 },
  { id: 'z8', name: 'Himachal Pradesh', capital: 'Shimla', lat: 31.1048, lng: 77.1734, elevation: 2200, population: 7.5, roadDensity: 0.3 },
  { id: 'z9', name: 'Jharkhand', capital: 'Ranchi', lat: 23.3441, lng: 85.3096, elevation: 650, population: 40, roadDensity: 0.45 },
  { id: 'z10', name: 'Karnataka', capital: 'Bengaluru', lat: 12.9716, lng: 77.5946, elevation: 920, population: 68, roadDensity: 0.7 },
  { id: 'z11', name: 'Kerala', capital: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, elevation: 10, population: 35, roadDensity: 0.85 },
  { id: 'z12', name: 'Madhya Pradesh', capital: 'Bhopal', lat: 23.2599, lng: 77.4126, elevation: 500, population: 85, roadDensity: 0.5 },
  { id: 'z13', name: 'Maharashtra', capital: 'Mumbai', lat: 19.0760, lng: 72.8777, elevation: 14, population: 126, roadDensity: 0.75 },
  { id: 'z14', name: 'Manipur', capital: 'Imphal', lat: 24.8170, lng: 93.9368, elevation: 790, population: 3.2, roadDensity: 0.25 },
  { id: 'z15', name: 'Meghalaya', capital: 'Shillong', lat: 25.5788, lng: 91.8933, elevation: 1500, population: 3.8, roadDensity: 0.3 },
  { id: 'z16', name: 'Mizoram', capital: 'Aizawl', lat: 23.7271, lng: 92.7176, elevation: 1100, population: 1.2, roadDensity: 0.2 },
  { id: 'z17', name: 'Nagaland', capital: 'Kohima', lat: 25.6751, lng: 94.1086, elevation: 1500, population: 2.2, roadDensity: 0.2 },
  { id: 'z18', name: 'Odisha', capital: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, elevation: 45, population: 46, roadDensity: 0.5 },
  { id: 'z19', name: 'Punjab', capital: 'Chandigarh', lat: 30.7333, lng: 76.7794, elevation: 230, population: 31, roadDensity: 0.8 },
  { id: 'z20', name: 'Rajasthan', capital: 'Jaipur', lat: 26.9124, lng: 75.7873, elevation: 431, population: 81, roadDensity: 0.5 },
  { id: 'z21', name: 'Sikkim', capital: 'Gangtok', lat: 27.3389, lng: 88.6065, elevation: 1650, population: 0.7, roadDensity: 0.2 },
  { id: 'z22', name: 'Tamil Nadu', capital: 'Chennai', lat: 13.0827, lng: 80.2707, elevation: 6, population: 78, roadDensity: 0.8 },
  { id: 'z23', name: 'Telangana', capital: 'Hyderabad', lat: 17.3850, lng: 78.4867, elevation: 542, population: 40, roadDensity: 0.7 },
  { id: 'z24', name: 'Tripura', capital: 'Agartala', lat: 23.8315, lng: 91.2868, elevation: 13, population: 4.2, roadDensity: 0.35 },
  { id: 'z25', name: 'Uttar Pradesh', capital: 'Lucknow', lat: 26.8467, lng: 80.9462, elevation: 123, population: 235, roadDensity: 0.7 },
  { id: 'z26', name: 'Uttarakhand', capital: 'Dehradun', lat: 30.3165, lng: 78.0322, elevation: 640, population: 12, roadDensity: 0.35 },
  { id: 'z27', name: 'West Bengal', capital: 'Kolkata', lat: 22.5726, lng: 88.3639, elevation: 11, population: 100, roadDensity: 0.7 },
  // Union Territories
  { id: 'z28', name: 'Andaman & Nicobar', capital: 'Port Blair', lat: 11.6234, lng: 92.7265, elevation: 16, population: 0.4, roadDensity: 0.15 },
  { id: 'z29', name: 'Chandigarh', capital: 'Chandigarh', lat: 30.7333, lng: 76.7794, elevation: 321, population: 1.2, roadDensity: 0.9 },
  { id: 'z30', name: 'Dadra & Nagar Haveli and Daman & Diu', capital: 'Daman', lat: 20.3974, lng: 72.8328, elevation: 12, population: 0.6, roadDensity: 0.5 },
  { id: 'z31', name: 'Delhi', capital: 'New Delhi', lat: 28.6139, lng: 77.2090, elevation: 216, population: 32, roadDensity: 0.95 },
  { id: 'z32', name: 'Jammu & Kashmir', capital: 'Srinagar', lat: 34.0837, lng: 74.7973, elevation: 1585, population: 14, roadDensity: 0.35 },
  { id: 'z33', name: 'Ladakh', capital: 'Leh', lat: 34.1526, lng: 77.5771, elevation: 3500, population: 0.3, roadDensity: 0.1 },
  { id: 'z34', name: 'Lakshadweep', capital: 'Kavaratti', lat: 10.5593, lng: 72.6358, elevation: 2, population: 0.07, roadDensity: 0.1 },
  { id: 'z35', name: 'Puducherry', capital: 'Puducherry', lat: 11.9416, lng: 79.8083, elevation: 6, population: 1.7, roadDensity: 0.8 },
];

export const ZONE_MAP: Record<string, IndianZone> = Object.fromEntries(
  INDIAN_ZONES.map(z => [z.id, z])
);

export const ZONE_POSITIONS: Record<string, [number, number]> = Object.fromEntries(
  INDIAN_ZONES.map(z => [z.id, [z.lat, z.lng] as [number, number]])
);

export function getZoneName(zoneId: string): string {
  return ZONE_MAP[zoneId]?.name ?? zoneId;
}

export function getElevation(zoneId: string): number {
  return ZONE_MAP[zoneId]?.elevation ?? 100;
}
