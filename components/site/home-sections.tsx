import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { services } from "@/lib/site-content";

export function DesignPrinciples() {
  return (
    <div className="principles">
      <div className="shell grid gap-7 md:grid-cols-3">
        <div>
          <Icon name="architecture" />
          <span>
            Designed for your space<small>Architecture comes first.</small>
          </span>
        </div>
        <div>
          <Icon name="sun" />
          <span>
            Considered in every detail
            <small>Balance, warmth, and atmosphere.</small>
          </span>
        </div>
        <div>
          <Icon name="layers" />
          <span>
            A complete lighting perspective
            <small>From the idea to the finishing touch.</small>
          </span>
        </div>
      </div>
    </div>
  );
}

export function Services() {
  return (
    <section id="services" className="section-space services-section">
      <div className="shell grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            eyebrow="More than a light fitting"
            title={
              <>
                Your vision.
                <br />
                Our perspective.
                <br />
                <em>A brighter outcome.</em>
              </>
            }
          >
            A thoughtful lighting plan changes everything. We bring design,
            product understanding, and a personal approach to every
            conversation.
          </SectionHeading>
          <a href="#contact" className="text-link">
            Explore your project with us <Icon name="diagonal" />
          </a>
          <div className="service-seal" aria-hidden="true">
            <Icon name="spark" />
            <span>
              DESIGN-LED.
              <br />
              DETAIL-DRIVEN.
            </span>
          </div>
        </div>
        <div className="service-list">
          {services.map((service, index) => (
            <details
              key={service.title}
              name="lighting-services"
              open={index === 0}
            >
              <summary>
                <span className="service-number">0{index + 1}</span>
                <Icon name={service.icon} />
                <span>
                  <strong>{service.title}</strong>
                  <small>{service.description}</small>
                </span>
                <Icon name="plus" className="service-plus" />
              </summary>
              <p>{service.detail}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Spaces() {
  return (
    <section id="spaces" className="section-space spaces-section">
      <div className="shell">
        <div className="section-topline">
          <SectionHeading
            eyebrow="Spaces, reimagined"
            title={
              <>
                See the space.
                <br />
                <em>Feel the difference.</em>
              </>
            }
          />
          <p className="topline-note">
            A little inspiration for what comes next.
            <br />
            Lighting concepts for the way you live.
          </p>
        </div>
        <div className="grid gap-7 md:grid-cols-[1.15fr_0.85fr]">
          <article className="space-card">
            <div className="space-image">
              <Image
                src="/images/residential-concept.webp"
                alt="Residential concept with warm cove lighting, a sculptural pendant, and natural materials"
                fill
                sizes="(max-width: 767px) 100vw, 58vw"
              />
              <span className="image-tag">RESIDENTIAL CONCEPT</span>
            </div>
            <div className="space-caption">
              <div>
                <p>A quieter kind of luxury</p>
                <h3>Warmth, made architectural.</h3>
              </div>
              <a
                href="#contact"
                className="round-arrow"
                aria-label="Discuss residential lighting"
              >
                <Icon name="diagonal" />
              </a>
            </div>
          </article>
          <article className="space-card space-card-offset">
            <div className="space-image">
              <Image
                src="/images/hospitality-concept.webp"
                alt="Hospitality lighting concept with warm pendants over a dark oak and stone counter"
                fill
                sizes="(max-width: 767px) 100vw, 42vw"
              />
              <span className="image-tag">HOSPITALITY CONCEPT</span>
            </div>
            <div className="space-caption">
              <div>
                <p>An atmosphere to remember</p>
                <h3>Light that sets the mood.</h3>
              </div>
              <a
                href="#contact"
                className="round-arrow"
                aria-label="Discuss hospitality lighting"
              >
                <Icon name="diagonal" />
              </a>
            </div>
          </article>
        </div>
        <p className="concept-note">
          Original visual concepts for inspiration—not completed client
          projects. Our project portfolio will be shared when verified imagery
          is available.
        </p>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="section-space about-section">
      <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
        <div className="about-visual">
          <Image
            src="/images/residential-concept.webp"
            alt="A conceptual interior exploring the relationship between light, texture, and architectural form"
            fill
            sizes="(max-width: 1023px) 100vw, 50vw"
          />
          <div className="about-note">
            <Icon name="spark" />
            <p>
              Light isn’t the last detail.
              <br />
              <em>It’s what brings everything together.</em>
            </p>
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="AIA Home Solution BD"
            title={
              <>
                A considered approach.
                <br />
                <em>A lasting impression.</em>
              </>
            }
          >
            We are a Bangladesh-based architectural lighting and home solution
            brand, bringing a design-led perspective to homes, buildings, and
            modern spaces.
          </SectionHeading>
          <p className="about-copy">
            For us, the right light doesn’t compete with a space. It reveals its
            character. From a softly illuminated corner to a complete
            architectural concept, we help you explore the possibilities with
            intention.
          </p>
          <div className="about-values">
            <span>
              <Icon name="check" /> Design with purpose
            </span>
            <span>
              <Icon name="check" /> Details that matter
            </span>
            <span>
              <Icon name="check" /> Solutions around you
            </span>
          </div>
          <a href="#contact" className="text-link">
            Get to know your possibilities <Icon name="diagonal" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function Consultation() {
  return (
    <section className="consultation-banner">
      <div className="consultation-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="shell relative">
        <p className="eyebrow">Every space has a story</p>
        <h2>
          Let’s make yours
          <br />
          <em>beautifully illuminated.</em>
        </h2>
        <a href="#contact" className="button button-gold">
          Start with your vision <Icon name="diagonal" />
        </a>
        <p className="consultation-caption">
          A home. A building. An idea worth bringing to light.
        </p>
      </div>
    </section>
  );
}
