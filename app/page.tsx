import { BeforeAfter } from "@/components/BeforeAfter";
import { CtaButton } from "@/components/CtaButton";
import { HeroScroll } from "@/components/HeroScroll";
import { Icon } from "@/components/Icon";
import { PriceTable } from "@/components/PriceTable";
import { Reveal } from "@/components/Reveal";
import { SiteHeader } from "@/components/SiteHeader";
import { BEFORE_AFTER, BUSINESS, WEEKDAYS } from "@/lib/content";
import { getHours, getServices } from "@/lib/data";
import { brl } from "@/lib/money";
import { fmtDuration, hourLabel, todaySP, weekday } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [services, hours] = await Promise.all([getServices(), getHours()]);
  const today = weekday(todaySP());
  const order = [1, 2, 3, 4, 5, 6, 0];
  const waText = encodeURIComponent("Olá! Vim pelo site da BL Barber Studio.");

  return (
    <>
      <SiteHeader />
      <main>
        <HeroScroll />

        <section id="sobre" className="section">
          <div className="container split">
            <Reveal>
              <p className="eyebrow">Sobre</p>
              <h2 className="shimmer">Mais que um corte. Sua identidade.</h2>
              <p className="lead">
                Um corte de cabelo vai muito além da aparência. É uma forma de expressar quem você é, transmitir confiança e valorizar
                seu estilo.
              </p>
              <p>
                Na <strong>BL Barber Studio</strong>, acredito que cada cliente tem sua própria identidade. Por isso, meu compromisso é
                oferecer mais do que um serviço: é proporcionar uma experiência personalizada, com atenção aos detalhes, dedicação e
                respeito ao seu estilo.
              </p>
              <p className="punch">Porque um bom corte não transforma apenas o visual. Ele valoriza quem você é.</p>
            </Reveal>
            <Reveal delay={150}>
              <figure className="photo-frame" style={{ margin: 0 }}>
                <img src="/corte.webp" alt="Corte com degradê feito na BL Barber Studio" loading="lazy" />
                <figcaption>Degradê feito no estúdio · @{BUSINESS.instagram}</figcaption>
              </figure>
            </Reveal>
          </div>
          <div className="container">
            <CtaButton />
          </div>
        </section>

        <section id="servicos" className="section">
          <div className="container">
            <Reveal className="section-head">
              <p className="eyebrow">Serviços</p>
              <h2 className="shimmer">Cuidado em cada detalhe. Excelência em cada serviço.</h2>
              <p>
                Seu visual merece atenção, precisão e cuidado. Na <strong>BL Barber Studio</strong>, cada serviço é pensado para
                valorizar sua aparência e destacar o melhor do seu estilo.
              </p>
              <p>
                Do <strong>corte masculino</strong> ao alinhamento da <strong>sobrancelha</strong>, passando pelos{" "}
                <strong>cuidados essenciais</strong>, cada detalhe faz a diferença no resultado final.
              </p>
              <p>
                Mais do que cuidar da aparência, meu compromisso é proporcionar uma experiência de qualidade, com dedicação, confiança
                e atenção ao que torna você único.
              </p>
            </Reveal>
            <div className="cards">
              {services.map((s, i) => (
                <Reveal key={s.id} as="article" className="card draw" delay={i * 140}>
                  <Icon name={s.icon} />
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <div className="meta">
                    <span>{fmtDuration(s.duration_min)}</span>
                    <b>{brl(s.price_cents)}</b>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <p className="punch" style={{ maxWidth: 760, margin: "48px auto 0" }}>
                Porque estilo não está apenas no corte, mas em cada detalhe que faz você se destacar.
              </p>
            </Reveal>
            <CtaButton />
          </div>
        </section>

        <section id="precos" className="section">
          <div className="container">
            <Reveal className="section-head">
              <p className="eyebrow">Tabela de preços</p>
              <h2 className="shimmer">Preço claro, sem surpresa.</h2>
              <p>Escolha um ou mais serviços na hora de agendar. O tempo e o valor são somados automaticamente.</p>
            </Reveal>
            <PriceTable services={services} />
            <p className="price-note">
              Para confirmar o horário, você paga 50% do valor no Pix pelo site. O restante é pago na barbearia.
            </p>
            <CtaButton />
          </div>
        </section>

        {BEFORE_AFTER.length > 0 && (
          <section id="galeria" className="section">
            <div className="container">
              <Reveal className="section-head">
                <p className="eyebrow">Antes e depois</p>
                <h2 className="shimmer">Arraste e veja a diferença.</h2>
              </Reveal>
              <div className="cards">
                {BEFORE_AFTER.map((b) => (
                  <BeforeAfter key={b.after} {...b} />
                ))}
              </div>
              <CtaButton />
            </div>
          </section>
        )}

        <section id="horarios" className="section">
          <div className="container split" style={{ alignItems: "start" }}>
            <Reveal>
              <p className="eyebrow">Horário de atendimento</p>
              <h2 className="shimmer">Quando você pode vir.</h2>
              <ul className="hours">
                {order.map((d) => {
                  const h = hours[String(d)];
                  return (
                    <li key={d} className={`${d === today ? "today" : ""} ${h ? "" : "closed"}`}>
                      <span>
                        {WEEKDAYS[d]}
                        {d === today ? " (hoje)" : ""}
                      </span>
                      <span>{h ? `${hourLabel(h.open)} às ${hourLabel(h.close)}` : "Fechado"}</span>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
            <Reveal delay={150}>
              <p className="eyebrow">Como agendar</p>
              <h2 className="shimmer">Em três passos.</h2>
              <ol className="steps-how">
                <li>
                  <span className="ic"><Icon name="tesoura" /></span>
                  <div><b>Escolha os serviços, o dia e o horário</b><span>Só aparecem horários livres de verdade.</span></div>
                </li>
                <li>
                  <span className="ic"><Icon name="user" /></span>
                  <div><b>Informe seu nome e WhatsApp</b><span>É por lá que você recebe os avisos.</span></div>
                </li>
                <li>
                  <span className="ic"><Icon name="pix" /></span>
                  <div><b>Pague 50% no Pix</b><span>O horário é confirmado assim que o pagamento cai.</span></div>
                </li>
              </ol>
            </Reveal>
          </div>
          <div className="container">
            <CtaButton />
          </div>
        </section>

        <section id="contato" className="section">
          <div className="container">
            <Reveal className="section-head">
              <p className="eyebrow">Contato</p>
              <h2 className="shimmer">Fale com a BL Barber Studio.</h2>
              <p>Tire dúvidas, acompanhe os cortes e fique por dentro das novidades.</p>
            </Reveal>
            <div className="contact-cards">
              <Reveal delay={0}>
                <a className="contact-card" href={BUSINESS.instagramUrl} target="_blank" rel="noopener">
                  <Icon name="instagram" />
                  <div><small>Instagram</small><strong>@{BUSINESS.instagram}</strong></div>
                </a>
              </Reveal>
              <Reveal delay={120}>
                <a className="contact-card" href={`https://wa.me/${BUSINESS.whatsapp}?text=${waText}`} target="_blank" rel="noopener">
                  <Icon name="whatsapp" />
                  <div><small>WhatsApp</small><strong>{BUSINESS.whatsappLabel}</strong></div>
                </a>
              </Reveal>
              <Reveal delay={240}>
                <div className="contact-card">
                  <Icon name="local" />
                  <div><small>Onde estamos</small><strong>{BUSINESS.city}</strong></div>
                </div>
              </Reveal>
            </div>
            <CtaButton />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <img src="/logo-badge-160.png" alt="BL Barber Studio" width={84} height={84} />
          <p style={{ color: "var(--grey)" }}>{BUSINESS.slogan}</p>
          <p style={{ color: "var(--grey)", fontSize: 13 }}>
            <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener">@{BUSINESS.instagram}</a> ·{" "}
            <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener">{BUSINESS.whatsappLabel}</a> · {BUSINESS.city}
          </p>
          <p style={{ color: "#5c5c63", fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} BL Barber Studio</p>
        </div>
      </footer>

      <a className="wa-float" href={`https://wa.me/${BUSINESS.whatsapp}?text=${waText}`} target="_blank" rel="noopener" aria-label="Chamar no WhatsApp">
        <svg viewBox="0 0 32 32"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.2-3.8 1.2 1.2-3.7-.3-.4c-1.2-1.8-1.8-3.8-1.8-5.9C5 9.9 9.9 5.1 16 5.1s11 4.8 11 10.7-4.9 10.6-11 10.6zm6-7.9c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.6-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.6-.6-.7-.6h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 2-.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.4z" /></svg>
      </a>
    </>
  );
}
