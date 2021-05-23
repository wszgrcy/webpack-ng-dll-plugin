import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ShowInMainModule } from './show-in-main';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule,ShowInMainModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
