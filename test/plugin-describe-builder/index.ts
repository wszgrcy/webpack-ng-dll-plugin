import { join, normalize } from '@angular-devkit/core';

import { setWorkspaceRoot } from 'cyia-ngx-devkit';
export * from 'cyia-ngx-devkit';
setWorkspaceRoot(join(normalize(__dirname), `../hello-world-app/`));
