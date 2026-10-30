export type Role = "ADMIN" | "TRAINER" | "MEMBER";
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  age: number | null;
  role: Role;
  active: boolean;
}
export interface Session {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  role: Role;
}
export interface UserPage {
  content: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface Membership {
  id: number;
  userId: number;
  planName: string;
  price: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "SCHEDULED" | "CANCELLED";
  active: boolean;
}
export interface Payment {
  id: number;
  userId: number;
  membershipId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  active: boolean;
}
export interface Attendance {
  id: number;
  userId: number;
  checkIn: string;
  checkOut: string | null;
  active: boolean;
}
export interface Routine {
  id: number;
  userId: number;
  title: string;
  description: string;
  trainerName: string;
  active: boolean;
}
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  active: boolean;
  createdAt: string;
}
export type Entity =
  User | Membership | Payment | Attendance | Routine | Notification;
