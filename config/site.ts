import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const email_r2_domain = env.NEXT_PUBLIC_EMAIL_R2_DOMAIN || "";
const support_email = env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@Mail1s.net";
const app_name = env.NEXT_PUBLIC_APP_NAME || "Mail1s.net";

export const siteConfig: SiteConfig = {
  name: app_name,
  description:
    "Shorten links with analytics, manage emails and control subdomains—all on one platform.",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/yesmoree",
    github: "https://github.com/oiov/Mail1s.net",
    feedback: "https://github.com/oiov/Mail1s.net/issues",
    discord: "https://discord.gg/AHPQYuZu3m",
    oichat: "https://oi.Mail1s.net",
  },
  mailSupport: support_email,
  emailR2Domain: email_r2_domain,
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Company",
    items: [
      { title: "About", href: "/docs" },
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
      { title: "Blog", href: "https://www.oiov.dev" },
      { title: "Feedback", href: siteConfig.links.feedback },
    ],
  },
  {
    title: "Products",
    items: [
      { title: "Vmail", href: "https://Mail1s.net" },
      { title: "Moise", href: "https://moise.oiov.dev" },
      { title: "Iconce", href: "https://iconce.com" },
      { title: "OiChat", href: siteConfig.links.oichat },
    ],
  },
  {
    title: "Docs",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Guide", href: "/docs/quick-start" },
      { title: "Developer", href: "/docs/developer" },
      { title: "Contact", href: siteConfig.mailSupport },
    ],
  },
];
