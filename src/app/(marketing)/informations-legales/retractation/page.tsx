import type { Metadata } from "next";
import Link from "next/link";
import { SectionKicker } from "@/components/brand/section-kicker";
import { FinalCta } from "@/components/marketing/final-cta";
import { IMPRINT, SITE } from "@/lib/content/site";
import { createPublicMetadata } from "@/lib/seo";
import { WithdrawalForm } from "./withdrawal-form";

const LAST_UPDATED = "2026-08-05";

export const metadata: Metadata = createPublicMetadata({
  title: "Droit de rétractation",
  description: `Informations sur le droit de rétractation des consommateurs de l’UE et de l’EEE pour ${SITE.name}, y compris la fonction de rétractation en ligne et le modèle d’avis.`,
  path: "/informations-legales/retractation",
});

export default function WithdrawalPage() {
  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-6 pb-24 pt-20 md:pt-28">
        <SectionKicker>Légal</SectionKicker>
        <h1 className="mt-4 text-5xl leading-tight text-foreground md:text-6xl">
          Droit de rétractation
        </h1>
        <p className="mt-6 text-base text-foreground/60">
          Dernière mise à jour : {formatDate(LAST_UPDATED)}
        </p>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/75">
          La présente notice explique le droit légal de rétractation des
          consommateurs qui concluent un contrat à distance éligible. Elle ne
          limite aucun droit impératif plus favorable prévu par le droit du
          pays qui vous est applicable.
        </p>
        {/* TODO(legal-review): This page mirrors the EU Consumer Rights Directive wording from the English build. A lawyer should verify the whole notice against the French transposition (Code de la consommation, art. L221-18 to L221-28), including the exact French statutory wording for the start of the 14-day period, the express-consent/acknowledgement conditions, and the proportionate-payment rule of art. L221-25. */}

        <Section title="1. Qui bénéficie de ce droit">
          <p>
            Si vous êtes un consommateur de l’UE ou de l’EEE et commandez en
            ligne à des fins qui n’entrent pas principalement dans le cadre de
            votre activité commerciale, industrielle, artisanale ou libérale,
            vous disposez en règle générale de 14 jours pour vous rétracter
            d’un contrat de service éligible sans donner de motif. Le délai
            court normalement à compter du jour de la conclusion du contrat.
          </p>
          <p>
            Les clients professionnels ne bénéficient pas de ce droit légal de
            rétractation des consommateurs, mais peuvent demander une
            annulation dans le cadre de la{" "}
            <Link
              href="/informations-legales/remboursements"
              className="text-foreground underline-offset-4 hover:underline"
            >
              politique de remboursement
            </Link>
            . Les consommateurs d’autres pays peuvent bénéficier d’un droit
            local similaire ou plus long.
          </p>
        </Section>

        <Section title="2. Comment respecter le délai">
          <p>
            Il suffit d’envoyer une déclaration dénuée d’ambiguïté avant
            l’expiration du délai applicable. Vous pouvez utiliser la fonction
            en ligne ou le modèle d’avis ci-dessous, ou écrire à{" "}
            <a
              href={`mailto:${IMPRINT.email}?subject=Withdrawal%20from%20contract`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {IMPRINT.email}
            </a>
            . Vous n’avez pas à expliquer pourquoi vous vous rétractez.
            Conservez la confirmation ou l’e-mail envoyé comme preuve.
          </p>
        </Section>

        <Section title="3. Début des travaux pendant le délai de 14 jours">
          <p>
            Nos commandes peuvent comprendre un contrat de service, du contenu
            numérique fourni sans support matériel, ou les deux. La conséquence
            juridique dépend de ce qui a été commandé et de la manière dont
            l’exécution a commencé.
          </p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Services :</strong> si vous nous demandez expressément de
              commencer pendant le délai de rétractation puis vous rétractez
              avant la complète exécution, vous pouvez devoir payer un montant
              proportionnel au travail fourni jusqu’à la notification de la
              rétractation, lorsque les conditions légales sont réunies. Le
              droit n’est perdu après la pleine exécution du service que si le
              consentement exprès préalable et la reconnaissance requis ont été
              donnés.
            </li>
            <li>
              <strong>Contenu numérique :</strong> le droit ne peut être perdu
              dès le début de la fourniture que si vous avez donné votre
              consentement exprès préalable à la fourniture immédiate, reconnu
              la perte du droit et reçu la confirmation du contrat requise sur
              un support durable.
            </li>
          </ul>
          <p>
            Une case à cocher acceptant des conditions générales ne remplace
            pas, à elle seule, une demande expresse distincte ou une
            reconnaissance exigée par la loi. Si l’information, la demande, le
            consentement, la reconnaissance ou la confirmation requis n’ont pas
            été correctement fournis, les conséquences légales de cette
            omission s’appliquent.
          </p>
        </Section>

        <Section title="4. Effets d’une rétractation valable">
          <p>
            Lorsque la rétractation est valable, nous remboursons les sommes
            dues sans retard injustifié et au plus tard dans le délai
            impératif, normalement 14 jours après en avoir été informés. Nous
            utilisons le moyen de paiement d’origine, sauf accord exprès de
            votre part pour un autre moyen, et nous ne facturons aucuns frais
            de remboursement. PayPal ou votre prestataire de financement
            contrôle le moment où le crédit apparaît sur votre solde ou votre
            relevé.
          </p>
          <p>
            Un montant proportionnel peut rester dû pour un service
            régulièrement commencé à votre demande expresse avant la
            rétractation. Les recours légaux distincts applicables aux contenus
            ou services numériques non conformes ou défectueux continuent de
            s’appliquer et ne sont pas remplacés par la présente notice.
          </p>
        </Section>

        <section id="online-withdrawal" className="mt-14 scroll-mt-24 rounded-xl border border-border/60 bg-secondary/25 p-6 md:p-8">
          <h2 className="text-3xl text-foreground">Exercer votre droit de rétractation ici</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/70">
            Cette fonction envoie une déclaration de rétractation dénuée
            d’ambiguïté. Saisissez d’abord les informations du contrat, puis
            relisez et confirmez la déclaration. Nous enregistrons l’heure de
            réception sur le serveur et vous envoyons une copie durable par
            e-mail. L’envoi du formulaire ne vous demande de renoncer à aucun
            droit ni de donner un motif.
          </p>
          <div className="mt-7">
            <WithdrawalForm />
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-border/60 bg-secondary/30 p-6 md:p-8">
          <h2 className="text-2xl text-foreground">Modèle d’avis de rétractation</h2>
          {/* TODO(legal-review): Compare this model notice with the statutory French model withdrawal form (annexe à l'article R221-1 Code de la consommation) and align the wording if the French form is mandatory for consumers in France. */}
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            Complétez et envoyez cet avis uniquement si vous souhaitez vous
            rétracter. Le formulaire en ligne ci-dessus est facultatif ; une
            déclaration claire par e-mail est également valable si elle est
            envoyée dans le délai.
          </p>
          <div className="mt-5 space-y-3 rounded-lg bg-background/70 p-5 font-mono text-sm leading-relaxed text-foreground/80">
            <p>À l’attention de : {IMPRINT.legalName}</p>
            <p>Adresse : {IMPRINT.street}, {IMPRINT.postalCode} {IMPRINT.city}, {IMPRINT.country}</p>
            <p>E-mail : {IMPRINT.email}</p>
            <p>
              Je vous notifie par la présente ma rétractation du contrat
              portant sur la fourniture du service ou du contenu numérique
              suivant :
            </p>
            <p>Numéro de contrat ou de commande :</p>
            <p>Commandé le :</p>
            <p>Nom du consommateur :</p>
            <p>Adresse du consommateur :</p>
            <p>E-mail du consommateur :</p>
            <p>Date :</p>
          </div>
        </section>
      </article>
      <FinalCta />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}
