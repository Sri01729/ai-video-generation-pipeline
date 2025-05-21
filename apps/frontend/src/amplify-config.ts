'use client';

import { Amplify } from 'aws-amplify';

// Only run on client side
if (typeof window !== 'undefined') {
  try {
    // Create a complete configuration object
    const amplifyConfig = {
      Auth: {
        mandatorySignIn: true,
        region: process.env.NEXT_PUBLIC_COGNITO_REGION,
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID,
        ...(process.env.NEXT_PUBLIC_COGNITO_DOMAIN && {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
            scope: ['email', 'openid', 'profile'],
            redirectSignIn: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN || window.location.origin,
            redirectSignOut: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT || window.location.origin,
            responseType: 'code'
          }
        })
      }
    };

    // Apply configuration
    Amplify.configure(amplifyConfig as any);

    console.log('Amplify configuration applied successfully');
  } catch (error) {
    console.error('Error configuring Amplify:', error);
  }
}