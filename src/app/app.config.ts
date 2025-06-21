import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { environment } from './config/environment';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),

    //Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),
  ]
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
