/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Rejected';

export interface Reservation {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  specialRequest: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
}

export interface AppConfig {
  googleSheetsUrl: string;
  isSyncEnabled: boolean;
  adminEmailWhitelist: string[];
}
