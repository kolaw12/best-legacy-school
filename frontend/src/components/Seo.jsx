import { useEffect } from 'react';

export const SITE_URL = 'https://bestlegacydivineschool.com'; // TODO: swap for the real production domain once live
export const SITE_NAME = 'Best Legacy Divine School';
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.jpg`;

const upsertMeta = (attr, key, content) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
};

const upsertLink = (rel, href) => {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
};

const upsertJsonLd = (id, data) => {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('script');
        el.id = id;
        el.type = 'application/ld+json';
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
};

/**
 * Per-page title/meta/canonical/OG — this is a client-side SPA with no SSR,
 * so these only reach crawlers that execute JS (Google does; most social-
 * preview scrapers don't, hence the static fallback description in
 * index.html). Plain DOM upserts, not react-helmet, to avoid a new
 * dependency for something this small.
 */
const Seo = ({ title, description, path = '/', image, jsonLd }) => {
    useEffect(() => {
        const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
        document.title = fullTitle;

        if (description) {
            upsertMeta('name', 'description', description);
            upsertMeta('property', 'og:description', description);
            upsertMeta('name', 'twitter:description', description);
        }

        const url = `${SITE_URL}${path}`;
        upsertLink('canonical', url);
        upsertMeta('property', 'og:url', url);
        upsertMeta('property', 'og:title', fullTitle);
        upsertMeta('property', 'og:type', 'website');
        upsertMeta('property', 'og:site_name', SITE_NAME);
        upsertMeta('property', 'og:image', image || DEFAULT_IMAGE);
        upsertMeta('name', 'twitter:card', 'summary_large_image');
        upsertMeta('name', 'twitter:title', fullTitle);
        upsertMeta('name', 'twitter:image', image || DEFAULT_IMAGE);

        if (jsonLd) {
            upsertJsonLd('page-jsonld', jsonLd);
        }
        return () => {
            if (jsonLd) document.getElementById('page-jsonld')?.remove();
        };
    }, [title, description, path, image, jsonLd]);

    return null;
};

export default Seo;
