import {
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  WHATSAPP_NUMBER,
} from "../config";


function Contact() {
  const whatsappUrl =
    WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}`
      : "#";


  const emailUrl =
    CONTACT_EMAIL
      ? `mailto:${CONTACT_EMAIL}`
      : "#";


  return (
    <section className="contact-page">
      <div className="store-header">
        <p className="section-label">
          CONTACTO
        </p>

        <h1>
          Estamos para ayudarte
        </h1>

        <p>
          Escríbenos para
          disponibilidad, tallas,
          colores, pedidos,
          entregas o cualquier
          pregunta.
        </p>
      </div>


      <div className="contact-grid">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="contact-card"
        >
          <span>◎</span>

          <h3>
            Instagram
          </h3>

          <p>
            @sal.y.sol_swim
          </p>
        </a>


        <a
          href={whatsappUrl}
          target={
            WHATSAPP_NUMBER
              ? "_blank"
              : undefined
          }
          rel="noreferrer"
          className="contact-card"
          onClick={(event) => {
            if (
              !WHATSAPP_NUMBER
            ) {
              event.preventDefault();
            }
          }}
        >
          <span>☏</span>

          <h3>
            WhatsApp
          </h3>

          <p>
            {WHATSAPP_NUMBER
              ? "Escríbenos directamente"
              : "Próximamente"}
          </p>
        </a>


        <a
          href={emailUrl}
          className="contact-card"
          onClick={(event) => {
            if (!CONTACT_EMAIL) {
              event.preventDefault();
            }
          }}
        >
          <span>✉</span>

          <h3>
            Email
          </h3>

          <p>
            {CONTACT_EMAIL ||
              "Próximamente"}
          </p>
        </a>
      </div>
    </section>
  );
}


export default Contact;