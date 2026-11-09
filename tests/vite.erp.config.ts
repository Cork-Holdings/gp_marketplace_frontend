import {defineConfig,mergeConfig} from 'vite';
import base from '../vite.config';
// Isolated ERP acceptance server. The normal app's API and database are untouched.
export default mergeConfig(base,defineConfig({server:{port:5174,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:8086',changeOrigin:true}}}}));
