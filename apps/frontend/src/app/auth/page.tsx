'use client';

import { useEffect, useState } from 'react';
import { Auth } from '@aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Make sure this imports the fixed configuration
import '../../amplify-config';

function AuthPage({ signOut, user }: { signOut: () => void; user?: any }) {
  return (
    <div style={{ padding: 32 }}>
      <h1>Welcome, {user?.username || 'Guest'}</h1>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}

// Use withAuthenticator with minimal config first to get it working
export default withAuthenticator(AuthPage);