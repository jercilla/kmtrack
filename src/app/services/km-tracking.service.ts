import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface KmEntry {
  id: string;
  date: string;
  kilometers: number;
  description?: string;
  type: 'walking' | 'running' | 'cycling' | 'driving';
}

@Injectable({
  providedIn: 'root'
})
export class KmTrackingService {
  private storageKey = 'kmtrack-entries';
  private entriesSubject = new BehaviorSubject<KmEntry[]>([]);

  entries$ = this.entriesSubject.asObservable();

  constructor() {
    this.loadEntries();
  }

  private loadEntries(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const entries = JSON.parse(stored);
        this.entriesSubject.next(entries);
      } catch (error) {
        console.error('Error loading entries:', error);
        this.entriesSubject.next([]);
      }
    }
  }

  private saveEntries(): void {
    const entries = this.entriesSubject.value;
    localStorage.setItem(this.storageKey, JSON.stringify(entries));
  }

  addEntry(entry: Omit<KmEntry, 'id'>): void {
    const newEntry: KmEntry = {
      ...entry,
      id: this.generateId()
    };

    const currentEntries = this.entriesSubject.value;
    const updatedEntries = [...currentEntries, newEntry].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    this.entriesSubject.next(updatedEntries);
    this.saveEntries();
  }

  updateEntry(id: string, updates: Partial<KmEntry>): void {
    const currentEntries = this.entriesSubject.value;
    const updatedEntries = currentEntries.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    );

    this.entriesSubject.next(updatedEntries);
    this.saveEntries();
  }

  deleteEntry(id: string): void {
    const currentEntries = this.entriesSubject.value;
    const updatedEntries = currentEntries.filter(entry => entry.id !== id);

    this.entriesSubject.next(updatedEntries);
    this.saveEntries();
  }

  getTotalKm(): number {
    return this.entriesSubject.value.reduce((total, entry) => total + entry.kilometers, 0);
  }

  // Method to completely reset all data
  resetAll(): void {
    localStorage.removeItem(this.storageKey);
    this.entriesSubject.next([]);
  }

  getKmByType(): Record<string, number> {
    const entries = this.entriesSubject.value;
    return entries.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + entry.kilometers;
      return acc;
    }, {} as Record<string, number>);
  }

  getKmByMonth(): Record<string, number> {
    const entries = this.entriesSubject.value;
    return entries.reduce((acc, entry) => {
      const month = entry.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + entry.kilometers;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}