import {
  enableProdMode,
  importProvidersFrom,
  LOCALE_ID,
  DOCUMENT,
  provideZoneChangeDetection,
} from '@angular/core';
import { environment } from '~environments/environment';
import { enableElfProdMode } from '@ngneat/elf';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { APP_CONFIG, AppConfig } from './app/configs/app.config';
import { provideRouter, Router } from '@angular/router';
import { appPaths } from './app/app-routes';
import { authPaths, authRoutes } from '~modules/auth/shared/auth-routes';
import { Error404PageComponent } from '~modules/shared/pages/error404-page/error404-page.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { userPaths } from '~modules/user/shared/user-routes';
import { TokenInterceptor } from '~modules/shared/interceptors/token.interceptor';
import { AuthService } from '~modules/auth/shared/auth.service';
import { AuthRepository } from '~modules/auth/store/auth.repository';

import { Apollo, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';

if (environment.production) {
  enableProdMode();
  enableElfProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(HttpClientModule),
    provideRouter([
      {
        path: appPaths.home,
        redirectTo: authRoutes.logIn,
        pathMatch: 'full',
      },
      {
        path: authPaths.base,
        loadChildren: () => import('./app/modules/auth/auth.routes').then(mod => mod.AUTH_ROUTES),
      },
      {
        path: userPaths.base,
        loadChildren: () => import('./app/modules/user/user.routes').then(mod => mod.USER_ROUTES),
      },
      { path: '404', component: Error404PageComponent },
      { path: '**', redirectTo: '404' },
    ]),
    { provide: APP_CONFIG, useValue: AppConfig },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
      deps: [Router, AuthService, AuthRepository, DOCUMENT],
    },
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink, authRepository: AuthRepository): ApolloClient.Options => ({
        link: ApolloLink.from([
          setContext((_operation, prevContext) => ({
            headers: {
              ...(prevContext['headers'] as Record<string, string>),
              'Accept-Language': authRepository.locale,
            },
          })),
          httpLink.create({ uri: environment.graphqlHost + AppConfig.endpoints.graphql }),
        ]),
        cache: new InMemoryCache(),
      }),
      deps: [HttpLink, AuthRepository, LOCALE_ID],
    },
    Apollo,
  ],
});
