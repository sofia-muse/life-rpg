import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SITE_URL = 'https://life-rpg-opal-nine.vercel.app';
const TITLE = 'Life RPG — Turn habits into an RPG';
const DESCRIPTION =
  'Create a hero, complete real-life quests across six stats, earn XP, unlock skills, and evolve your class. Offline-first React Native + ASP.NET Core portfolio demo.';
const OG_IMAGE = `${SITE_URL}/og.png`;

/**
 * Web document shell — Open Graph / Twitter cards for LinkedIn & GitHub shares.
 * Static export copies public/og.png into the deploy root.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="theme-color" content="#0F0F1A" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Life RPG" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
