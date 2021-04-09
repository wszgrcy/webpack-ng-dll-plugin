"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const loader_runner_1 = require("loader-runner");
const path = __importStar(require("path"));
describe('ng-named-export', () => {
    it('run', (done) => __awaiter(void 0, void 0, void 0, function* () {
        loader_runner_1.runLoaders({
            context: {
                resolve: (a, b, cb) => cb(null, './abc'),
            },
            resource: '../test/code.ts',
            loaders: [path.resolve(__dirname, './ng-named-export.ts')],
            readResource: (file, callback) => {
                callback(null, new Buffer(`import {a,b} from './abc'`));
            },
        }, (err, result) => {
            expect(result.result[0]).toContain('window.exportNgNamed');
            done();
        });
    }));
});
//# sourceMappingURL=ng-named-export.spec.js.map