import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GpsData {
  latitude: number;
  longitude: number;
  speed: number; // km/h
  timestamp: number;
}

export interface TrackingSession {
  id: string;
  startTime: number;
  endTime?: number;
  totalDistance: number;
  maxSpeed: number;
  averageSpeed: number;
  positions: GpsData[];
}

@Injectable({
  providedIn: 'root'
})
export class GpsTrackingService {
  private currentSpeedSubject = new BehaviorSubject<number>(0);
  private isTrackingSubject = new BehaviorSubject<boolean>(false);
  private currentSessionSubject = new BehaviorSubject<TrackingSession | null>(null);

  currentSpeed$ = this.currentSpeedSubject.asObservable();
  isTracking$ = this.isTrackingSubject.asObservable();
  currentSession$ = this.currentSessionSubject.asObservable();

  private watchId: number | null = null;
  private lastPosition: GpsData | null = null;
  private currentSession: TrackingSession | null = null;

  constructor() {}

  async startTracking(): Promise<boolean> {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      // Request permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        throw new Error('Geolocation permission denied');
      }

      // Start session
      this.currentSession = {
        id: this.generateId(),
        startTime: Date.now(),
        totalDistance: 0,
        maxSpeed: 0,
        averageSpeed: 0,
        positions: []
      };

      this.currentSessionSubject.next(this.currentSession);

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handlePositionError(error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }
      );

      this.isTrackingSubject.next(true);
      return true;

    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      this.stopTracking();
      return false;
    }
  }

  stopTracking(): TrackingSession | null {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      const session = { ...this.currentSession };
      this.currentSession = null;
      this.currentSessionSubject.next(null);
      this.isTrackingSubject.next(false);
      this.currentSpeedSubject.next(0);
      this.lastPosition = null;
      return session;
    }

    this.isTrackingSubject.next(false);
    this.currentSpeedSubject.next(0);
    return null;
  }

  private handlePositionUpdate(position: GeolocationPosition): void {
    const speed = position.coords.speed ? Math.max(0, position.coords.speed * 3.6) : 0; // Convert m/s to km/h

    const gpsData: GpsData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: speed,
      timestamp: position.timestamp
    };

    this.currentSpeedSubject.next(speed);

    if (this.currentSession) {
      this.currentSession.positions.push(gpsData);

      // Calculate distance if we have a previous position
      if (this.lastPosition) {
        const distance = this.calculateDistance(this.lastPosition, gpsData);
        this.currentSession.totalDistance += distance;

        // Update max speed
        if (speed > this.currentSession.maxSpeed) {
          this.currentSession.maxSpeed = speed;
        }

        // Calculate average speed
        const sessionDuration = (gpsData.timestamp - this.currentSession.startTime) / 1000 / 3600; // hours
        if (sessionDuration > 0) {
          this.currentSession.averageSpeed = this.currentSession.totalDistance / sessionDuration;
        }
      }

      this.currentSessionSubject.next({ ...this.currentSession });
    }

    this.lastPosition = gpsData;
  }

  private handlePositionError(error: GeolocationPositionError): void {
    console.error('GPS position error:', error);

    // On error, set speed to 0 but don't stop tracking
    this.currentSpeedSubject.next(0);

    // If it's a serious error, you might want to stop tracking
    if (error.code === error.PERMISSION_DENIED) {
      this.stopTracking();
    }
  }

  private calculateDistance(pos1: GpsData, pos2: GpsData): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.degToRad(pos2.latitude - pos1.latitude);
    const dLon = this.degToRad(pos2.longitude - pos1.longitude);

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(pos1.latitude)) * Math.cos(this.degToRad(pos2.latitude)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Mock speed for testing (remove in production)
  simulateSpeed(speed: number): void {
    this.currentSpeedSubject.next(speed);
  }
}