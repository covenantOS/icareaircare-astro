import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/blog';
import { SITE } from '../lib/site';

// Minimal XML escape for CDATA-unsafe chars
function esc(s: string) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRFC822(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

export const GET: APIRoute = async () => {
  const BLOG_POSTS = await getAllPosts();
  // Redirected / canonical-consolidated slugs — exclude from feed
  const EXCLUDE = new Set([
    'emergency-ac-repair-wesley-chapel-fl',
    'air-duct-cleaning-in-wesley-chapel-fl-what-you-need-to-know',
    'ac-not-cooling-solutions',
  ]);

  // Newest first — BLOG_POSTS may already be ordered, but sort defensively
  const items = [...BLOG_POSTS]
    .filter(p => !EXCLUDE.has(p.slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(p => {
      const url = `${SITE.url}/blogs/${p.slug}/`;
      return `
    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRFC822(p.date)}</pubDate>
      <category>${esc(p.tag || 'HVAC')}</category>
      <author>tim@icareaircare.com (${esc(SITE.owner)})</author>
      <description><![CDATA[${p.description}]]></description>
      ${p.image ? `<enclosure url="${SITE.url}${p.image}" type="image/webp" length="0" />` : ''}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(SITE.name)} — HVAC Library</title>
    <link>${SITE.url}/blogs/</link>
    <description>HVAC tips, troubleshooting, and guides from Wesley Chapel's licensed family-run HVAC team. Real pricing, real neighborhoods, written by the people who actually show up.</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${esc(SITE.legalName)}</copyright>
    <managingEditor>${SITE.email} (${esc(SITE.owner)})</managingEditor>
    <webMaster>${SITE.email} (${esc(SITE.owner)})</webMaster>
    <generator>Astro</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE.url}/favicon-bear.png</url>
      <title>${esc(SITE.name)}</title>
      <link>${SITE.url}/</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
