import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ShowInMainModule } from './show-in-main';
import { MainService } from './main.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ShowInMainModule],
  providers: [MainService],
  bootstrap: [AppComponent],
})
export class AppModule {}
