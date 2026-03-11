// Configuration globale Supabase pour être partagée entre le frontend public et l'admin

const SUPABASE_URL = "https://dgwreyphwuomyvsnlilh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnd3JleXBod3VvbXl2c25saWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODUzMzYsImV4cCI6MjA4ODc2MTMzNn0.1O1Skh9pEcpOQzaf1yXChBNdGnp16t8tPJHWn2e-s5w";

// On initialise le client Supabase globalement (nécessite d'importer le script CDN supabase dans le HTML)
window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);
