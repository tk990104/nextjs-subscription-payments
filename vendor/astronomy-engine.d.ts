export enum Body {
  Sun = 'Sun',
  Moon = 'Moon',
  Mercury = 'Mercury',
  Venus = 'Venus',
  Earth = 'Earth',
  Mars = 'Mars',
  Jupiter = 'Jupiter',
  Saturn = 'Saturn',
  Uranus = 'Uranus',
  Neptune = 'Neptune',
  Pluto = 'Pluto'
}

export class Observer {
  constructor(latitude: number, longitude: number, height: number);
}

export function SunPosition(date: Date): { elon: number; elat: number };
export function EclipticGeoMoon(date: Date): { lon: number; lat: number };
export function GeoVector(body: Body, date: Date, aberration: boolean): unknown;
export function Rotation_EQJ_ECT(date: Date): unknown;
export function RotateVector(rotation: unknown, vector: unknown): unknown;
export function SphereFromVector(vector: unknown): { lon: number; lat: number };
export function MoonPhase(date: Date): number;
export function Equator(
  body: Body,
  date: Date,
  observer: Observer,
  ofDate: boolean,
  aberration: boolean
): { ra: number; dec: number };
export function Horizon(
  date: Date,
  observer: Observer,
  ra: number,
  dec: number,
  refraction: 'normal' | 'jplhor' | null
): { azimuth: number; altitude: number };
