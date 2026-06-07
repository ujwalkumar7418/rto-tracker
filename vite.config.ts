import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ registerType: 'autoUpdate' })
  ],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://clqhdiofrmexmnuuoldz.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscWhkaW9mcmV4bW51dW9sZHoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0OTMyNjQ4MywiZXhwIjoyMDY0ODg2NDgzfQ.8Oq0C29M8rlyUvT_wO-23yV77Xf87_R9U_VwZl8K7E4')
  }
});
