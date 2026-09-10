export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


export const WHATSAPP_NUMBER =
  (
    import.meta.env
      .VITE_WHATSAPP_NUMBER ||
    ""
  ).replace(/\D/g, "");


export const INSTAGRAM_URL =
  import.meta.env
    .VITE_INSTAGRAM_URL ||
  "https://instagram.com/sal.y.sol_swim";


export const CONTACT_EMAIL =
  import.meta.env
    .VITE_CONTACT_EMAIL ||
  "valerioyuneiry@gmail.com";
