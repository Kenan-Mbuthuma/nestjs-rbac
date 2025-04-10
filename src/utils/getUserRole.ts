'use client';

import { fetchAuthSession } from '@aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  "cognito:groups"?: string[];
}

export async function getUserRole(): Promise<string> {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const mockRole = url.searchParams.get('mockRole');
    if (mockRole) return mockRole;
  }

  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() ?? '';
    if (!idToken) return 'None';

    const decoded: DecodedToken = jwtDecode(idToken);
    return decoded["cognito:groups"]?.[0] || 'None';
  } catch {
    return 'None';
  }
}
