// app.config.ts (Versão Corrigida e Completa com Firebase)

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes'; 

// Importações dos Provedores do AngularFire
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';       
import { provideFirestore, getFirestore } from '@angular/fire/firestore'; 
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics'; // Adicionado o provider do Analytics

// Suas chaves de configuração do Firebase (Extraídas do seu código)
const firebaseConfig = {
    apiKey: "AIzaSyCsLEn_zYGYWQ5kILQvPT_J-5tE-lYs7I0",
    authDomain: "projeto-todo-91696.firebaseapp.com",
    projectId: "projeto-todo-91696",
    storageBucket: "projeto-todo-91696.firebasestorage.app",
    messagingSenderId: "985058247628",
    appId: "1:985058247628:web:be0508b862d74891b1d369",
    measurementId: "G-DCFV5G5JWJ"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // CORREÇÃO ESSENCIAL: No Angular Standalone, passamos os provedores 
    // do Firebase (que são EnvironmentProviders) diretamente para o array 'providers'.
    
    // Inicializa o app e o fornece globalmente
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    
    // Fornece os serviços injetáveis (Auth, Firestore, Analytics)
    provideAuth(() => getAuth()),         
    provideFirestore(() => getFirestore()),
    provideAnalytics(() => getAnalytics()), // Injetando o provedor de Analytics
  ]
};