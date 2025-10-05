import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardSubtitle,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { play, stop, speedometer } from 'ionicons/icons';
import { KmTrackingService } from '../services/km-tracking.service';
import { GpsTrackingService, TrackingSession } from '../services/gps-tracking.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonGrid, IonRow, IonCol, IonCard,
    IonCardHeader, IonCardContent, IonCardSubtitle, IonText
  ],
})
export class HomePage implements OnInit, OnDestroy {
  currentDate = '';
  currentSpeed = 0;
  totalKilometers = 0;
  isTracking = false;
  currentSession: TrackingSession | null = null;
  simulatedSpeed = 0;
  gpsPermissionDenied = false;
  showManualInstructions = false;

  private subscription?: Subscription;

  constructor(
    private kmService: KmTrackingService,
    private gpsService: GpsTrackingService
  ) {
    addIcons({ play, stop, speedometer });
  }

  ngOnInit() {
    this.updateCurrentDate();

    // Update date every minute
    setInterval(() => this.updateCurrentDate(), 60000);

    // Check GPS permission on page load
    this.gpsService.checkGpsPermission();

    // Subscribe to all services
    this.subscription = combineLatest([
      this.kmService.entries$,
      this.gpsService.currentSpeed$,
      this.gpsService.isTracking$,
      this.gpsService.currentSession$,
      this.gpsService.gpsPermissionDenied$
    ]).subscribe(([entries, speed, tracking, session, permissionDenied]) => {
      // If tracking and session exists, show current session distance + saved km
      // Otherwise just show saved km
      if (tracking && session) {
        this.totalKilometers = this.kmService.getTotalKm() + session.totalDistance;
      } else {
        this.totalKilometers = this.kmService.getTotalKm();
      }
      this.currentSpeed = speed;
      this.isTracking = tracking;
      this.currentSession = session;
      this.gpsPermissionDenied = permissionDenied;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    if (this.isTracking) {
      this.stopTracking();
    }
  }

  private updateCurrentDate() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async toggleTracking() {
    if (this.isTracking) {
      this.stopTracking();
    } else {
      await this.startTracking();
    }
  }

  private async startTracking() {
    const success = await this.gpsService.startTracking();
    if (!success) {
      // Handle error - could show toast/alert
      console.error('Failed to start GPS tracking');
    }
  }

  private stopTracking() {
    const session = this.gpsService.stopTracking();

    if (session && session.totalDistance > 0) {
      // Save the session as a km entry
      this.kmService.addEntry({
        date: new Date(session.startTime).toISOString().split('T')[0],
        kilometers: session.totalDistance,
        type: 'driving', // Default to driving, could be configurable
        description: `Sesión GPS: ${session.totalDistance.toFixed(1)}km en ${this.formatDuration(session.endTime! - session.startTime)}`
      });
    }
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async retryGpsPermission() {
    console.log('HomePage: retryGpsPermission button clicked');

    // Request GPS permission (will trigger browser prompt)
    const granted = await this.gpsService.requestGpsPermission();

    console.log('HomePage: Permission request result:', granted);

    // If permission was denied again, show manual instructions
    if (!granted) {
      this.showManualInstructions = true;
    }

    // If permission is now granted, the observable will update automatically
    // and gpsPermissionDenied will become false, showing the dashboard
  }

  // For testing purposes - remove in production
  testSpeed(speed: number) {
    console.log(`HomePage: Testing speed ${speed}, tracking: ${this.isTracking}`);
    this.simulatedSpeed = speed;
    this.gpsService.simulateSpeed(speed);
  }

  resetStorage() {
    // Reset GPS service completely (clears lastPosition!)
    this.gpsService.resetGpsState();

    // Reset km service properly
    this.kmService.resetAll();

    // Clear all storage completely
    localStorage.clear();
    sessionStorage.clear();

    // Reset local component state
    this.totalKilometers = 0;
    this.simulatedSpeed = 0;

    // Force hard reload with cache clear
    window.location.reload();
  }
}