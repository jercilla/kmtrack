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
  private gpsPermissionDeniedSubject = new BehaviorSubject<boolean>(false);

  currentSpeed$ = this.currentSpeedSubject.asObservable();
  isTracking$ = this.isTrackingSubject.asObservable();
  currentSession$ = this.currentSessionSubject.asObservable();
  gpsPermissionDenied$ = this.gpsPermissionDeniedSubject.asObservable();

  private watchId: number | null = null;
  private lastPosition: GpsData | null = null;
  private currentSession: TrackingSession | null = null;

  // GPS Simulation properties
  private simulationTimer: any = null;
  private simulationSpeed = 0; // km/h
  private simulationPosition = { lat: 40.4168, lng: -3.7038 }; // Madrid center
  private simulationDirection = 0; // degrees (0 = North)

  constructor() {}

  // Check GPS permission without starting tracking
  async checkGpsPermission(): Promise<void> {
    if (!navigator.geolocation) {
      this.gpsPermissionDeniedSubject.next(true);
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      this.gpsPermissionDeniedSubject.next(permission.state === 'denied');
    } catch (permError) {
      // Permission API not supported, assume available
      this.gpsPermissionDeniedSubject.next(false);
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      // Check GPS permission first
      if (navigator.geolocation) {
        try {
          // Request permission
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            this.gpsPermissionDeniedSubject.next(true);
            return false;
          }
        } catch (permError) {
          // Permission API not supported, try anyway
        }
      } else {
        this.gpsPermissionDeniedSubject.next(true);
        return false;
      }

      // Start session (only if GPS is available)
      this.currentSession = {
        id: this.generateId(),
        startTime: Date.now(),
        totalDistance: 0,
        maxSpeed: 0,
        averageSpeed: 0,
        positions: []
      };

      this.currentSessionSubject.next(this.currentSession);
      this.isTrackingSubject.next(true);
      this.gpsPermissionDeniedSubject.next(false);

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

      return true;

    } catch (error) {
      console.error('Error starting tracking session:', error);
      this.stopTracking();
      this.gpsPermissionDeniedSubject.next(true);
      return false;
    }
  }

  stopTracking(): TrackingSession | null {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Stop GPS simulation
    this.stopGpsSimulation();

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

    this.handleGpsDataUpdate(gpsData);
  }

  private handleGpsDataUpdate(gpsData: GpsData): void {
    this.currentSpeedSubject.next(gpsData.speed);

    if (this.currentSession) {
      this.currentSession.positions.push(gpsData);

      // Calculate distance if we have a previous position
      if (this.lastPosition) {
        const distance = this.calculateDistance(this.lastPosition, gpsData);
        console.log(`Distance calculation: from (${this.lastPosition.latitude}, ${this.lastPosition.longitude}) to (${gpsData.latitude}, ${gpsData.longitude}) = ${distance.toFixed(6)} km`);

        this.currentSession.totalDistance += distance;
        console.log(`Total distance updated: ${this.currentSession.totalDistance.toFixed(6)} km`);

        // Update max speed
        if (gpsData.speed > this.currentSession.maxSpeed) {
          this.currentSession.maxSpeed = gpsData.speed;
        }

        // Calculate average speed
        const sessionDuration = (gpsData.timestamp - this.currentSession.startTime) / 1000 / 3600; // hours
        if (sessionDuration > 0) {
          this.currentSession.averageSpeed = this.currentSession.totalDistance / sessionDuration;
        }
      } else {
        console.log('No previous position for distance calculation');
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
      this.gpsPermissionDeniedSubject.next(true);
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

  // Method to reset GPS state completely
  resetGpsState(): void {
    // Stop any active tracking
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Stop GPS simulation
    this.stopGpsSimulation();

    // Clear GPS state - THIS IS THE KEY!
    this.lastPosition = null;
    this.currentSession = null;
    this.currentSessionSubject.next(null);
    this.isTrackingSubject.next(false);
    this.currentSpeedSubject.next(0);

    // Reset simulation position to default
    this.simulationPosition = { lat: 40.4168, lng: -3.7038 };
    this.simulationDirection = 0;
  }

  // GPS Simulation for testing
  simulateSpeed(speed: number): void {
    this.simulationSpeed = speed;

    if (speed > 0 && this.isTrackingSubject.value) {
      this.startGpsSimulation();
    } else {
      this.stopGpsSimulation();
    }
  }

  private startGpsSimulation(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
    }

    // Update GPS position every second
    this.simulationTimer = setInterval(() => {
      if (this.simulationSpeed > 0 && this.isTrackingSubject.value) {
        this.updateSimulatedPosition();
      }
    }, 1000);
  }

  private stopGpsSimulation(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    this.simulationSpeed = 0;
  }

  private updateSimulatedPosition(): void {
    console.log(`GPS Simulation: Updating position at ${this.simulationSpeed} km/h`);

    // Calculate distance moved in 1 second at current speed
    const distancePerSecond = this.simulationSpeed / 3600; // km per second

    // Convert distance to degrees (rough approximation: 1 degree ≈ 111 km)
    const deltaLat = (distancePerSecond / 111) * Math.cos(this.degToRad(this.simulationDirection));
    const deltaLng = (distancePerSecond / 111) * Math.sin(this.degToRad(this.simulationDirection)) /
                     Math.cos(this.degToRad(this.simulationPosition.lat));

    // Update position
    this.simulationPosition.lat += deltaLat;
    this.simulationPosition.lng += deltaLng;

    // Slightly vary direction to simulate realistic movement
    this.simulationDirection += (Math.random() - 0.5) * 10; // ±5 degrees variation

    // Create GPS data that matches real GPS format
    const simulatedGpsData: GpsData = {
      latitude: this.simulationPosition.lat,
      longitude: this.simulationPosition.lng,
      speed: this.simulationSpeed,
      timestamp: Date.now()
    };

    console.log(`GPS Simulation: New position`, simulatedGpsData);

    // Process through the same pipeline as real GPS
    this.handleGpsDataUpdate(simulatedGpsData);
  }

}