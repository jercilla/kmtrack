import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { car, bicycle, walk, fitness, calendar, statsChart, trash, create } from 'ionicons/icons';
import { KmTrackingService, KmEntry } from '../services/km-tracking.service';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonLabel, IonIcon, IonBadge, IonItemSliding, IonItemOptions,
    IonItemOption, IonSegment, IonSegmentButton
  ],
})
export class HistoryPage implements OnInit, OnDestroy {
  entries: KmEntry[] = [];
  totalKm = 0;
  kmByType: Record<string, number> = {};
  kmByMonth: Record<string, number> = {};
  selectedView = 'entries';

  private subscription?: Subscription;

  constructor(private kmService: KmTrackingService) {
    addIcons({ car, bicycle, walk, fitness, calendar, statsChart, trash, create });
  }

  ngOnInit() {
    this.subscription = this.kmService.entries$.subscribe(entries => {
      this.entries = entries;
      this.totalKm = this.kmService.getTotalKm();
      this.kmByType = this.kmService.getKmByType();
      this.kmByMonth = this.kmService.getKmByMonth();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'walking': return 'walk';
      case 'running': return 'fitness';
      case 'cycling': return 'bicycle';
      case 'driving': return 'car';
      default: return 'walk';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'walking': return 'Caminar';
      case 'running': return 'Correr';
      case 'cycling': return 'Bicicleta';
      case 'driving': return 'Conducir';
      default: return type;
    }
  }

  getMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }

  getObjectKeys(obj: Record<string, number>): string[] {
    return Object.keys(obj);
  }

  deleteEntry(id: string) {
    this.kmService.deleteEntry(id);
  }

  onSegmentChanged(event: any) {
    this.selectedView = event.detail.value;
  }
}