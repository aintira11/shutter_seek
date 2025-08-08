import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// --- Firebase Imports ---
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { environment } from './config/environment';

// --- Google Login Imports ---
import { GoogleLoginProvider, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // --- Angular & Firebase Providers (ของคุณมีอยู่แล้ว) ---
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled'
    })),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),

    // ---  Provider สำหรับ Google Login  ---
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' // <-- วาง Client ID ของคุณที่นี่
            )
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }
  ],
};
// export const appConfig: ApplicationConfig = {
//   providers: [provideRouter(routes),
//     provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
//     provideDatabase(() => getDatabase()),
//     provideAnimationsAsync(), provideAnimationsAsync(), provideFirebaseApp(() => initializeApp(
//     {
//       "projectId":"shutter-seek",
//       "appId":"1:574406601635:web:c3f07e5859a114b7d24816",
//       "storageBucket":"shutter-seek.firebasestorage.app",
//       "apiKey":"AIzaSyCe9D9hXXhD0NMREi-nTr_GJEtYWIsOe80",
//       "authDomain":"shutter-seek.firebaseapp.com",
//       "messagingSenderId":"574406601635",
//       "measurementId":"G-0JYFXGFDTZ"
//     }
//   )), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideDatabase(() => getDatabase()), provideStorage(() => getStorage())]
// };
