// @ts-nocheck
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Server-side redirect to login page
  redirect('/auth/login');
}
