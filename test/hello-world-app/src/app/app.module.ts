import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ShowInMainModule } from './show-in-main';
import { MainService } from './main.service';
import { THIS_NOT_EXPORT } from './must-export';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ShowInMainModule],
  providers: [MainService],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    console.log(THIS_NOT_EXPORT);
  }
}
