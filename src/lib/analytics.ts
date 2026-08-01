import { AnalyticsEvent } from '@auren/shared/analytics/events';

/**
 * EventTracker is a private analytics client for the Auren platform.
 * It strictly types the permitted events using the shared schema.
 */
export class EventTracker {
  /**
   * Tracks an event by sending it to the backend (mocked for now with console).
   * @param event The strictly-typed analytics event
   */
  static track(event: AnalyticsEvent) {
    // In production, this would send an async fetch request to the Analytics Backend
    // e.g., fetch('/v1/analytics/events', { body: JSON.stringify(event) })
    
    // For now, log safely (in tests, we can mock this static method)
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log(`[EventTracker] ${event.name}`, event.properties);
    }
  }
}
