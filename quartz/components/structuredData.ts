// JSON-LD for search engines and AI answer engines (custom, not stock Quartz).
// Homepage: WebSite + Person. Om meg: ProfilePage about the same Person.
// Keep the facts here in sync with content/Om meg.md and content/llms.txt.
import { QuartzPluginData } from "../plugins/vfile"

const site = "https://jokvalen.no/"
const personId = `${site}#person`

const person = {
  "@type": "Person",
  "@id": personId,
  name: "Jo Aleksander Bakke Kvalen",
  alternateName: "Jo Kvalen",
  url: site,
  // Matches the LinkedIn headline, plus the Norwegian form used on the site.
  jobTitle: ["Senior Digital Analyst", "Senior digital analytiker"],
  description:
    "Senior digital analytiker i Oslo som jobber med analyse og eksperimentering: sporing og datakvalitet, kundereiser, A/B-testing, rapportering og praktisk bruk av AI.",
  email: "mailto:jo@jokvalen.no",
  address: { "@type": "PostalAddress", addressLocality: "Oslo", addressCountry: "NO" },
  knowsLanguage: ["nb", "en"],
  knowsAbout: [
    "Digital analyse",
    "Webanalyse",
    "Eksperimentering",
    "A/B-testing",
    "Konverteringsoptimalisering (CRO)",
    "Sporing og datakvalitet",
    "Google Analytics 4",
    "Google Tag Manager",
    "BigQuery",
    "Optimizely",
    "Looker Studio",
    "Power BI",
    "Python",
    "Praktisk AI",
    "UX",
    "SEO",
  ],
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Høgskolen i Gjøvik" },
    { "@type": "CollegeOrUniversity", name: "NTNU" },
  ],
  // Only active profiles that are clearly the same person.
  sameAs: ["https://www.linkedin.com/in/jokvalen/", "https://github.com/jokvalen"],
}

const website = {
  "@type": "WebSite",
  "@id": `${site}#website`,
  url: site,
  name: "Jo Aleksander Bakke Kvalen",
  inLanguage: "nb-NO",
  author: { "@id": personId },
}

export function structuredData(fileData: QuartzPluginData, canonicalUrl: string): object | null {
  if (fileData.slug === "index") {
    return { "@context": "https://schema.org", "@graph": [website, person] }
  }
  if (fileData.slug === "om-meg") {
    const modified = fileData.dates?.modified
    return {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${canonicalUrl}#profilepage`,
      url: canonicalUrl,
      name: fileData.frontmatter?.title,
      inLanguage: "nb-NO",
      isPartOf: website,
      ...(modified && { dateModified: modified.toISOString() }),
      mainEntity: person,
    }
  }
  return null
}

// Stringify for a <script> tag; escaping "<" stops text in the data from closing the tag.
export function jsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
