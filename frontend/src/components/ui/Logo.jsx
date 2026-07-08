import { useState } from 'react';

/**
 * The school crest, served from /logo.png in the public folder
 * (heraldic shield: "Legacy Divine Best Schools — Crèche, Nur & Pry — To the Glory of God").
 * Falls through to the monogram badge below if the image fails to load.
 *
 * Sizing rule of thumb for this crest:
 *   - xs (h-5)    : inline body text accents
 *   - sm (h-7)    : compact nav, mobile header
 *   - md (h-9)    : default sidebar / nav (desktop)
 *   - lg (h-12)   : login + signup card
 *   - xl (h-16)   : auth hero, splash
 *   - hero (h-24) : landing-page hero (sparingly)
 *
 * Always keep `object-contain` so the ribbon never crops.
 */
const HEIGHT_CLASSES = {
    xs:   'h-5',
    sm:   'h-7',
    md:   'h-9',
    lg:   'h-12',
    xl:   'h-16',
    hero: 'h-24',
};

// Square + text size for the monogram fallback (the crest image has no
// intrinsic width, but a badge needs one).
const BADGE_CLASSES = {
    xs:   'h-5 w-5 text-[9px]',
    sm:   'h-7 w-7 text-[11px]',
    md:   'h-9 w-9 text-xs',
    lg:   'h-12 w-12 text-sm',
    xl:   'h-16 w-16 text-base',
    hero: 'h-24 w-24 text-xl',
};

const Logo = ({ size = 'md', className = '', alt = 'Best Legacy Divine School' }) => {
    const [imageFailed, setImageFailed] = useState(false);

    if (imageFailed) {
        return (
            <span
                role="img"
                aria-label={alt}
                title={alt}
                className={`inline-flex items-center justify-center shrink-0 rounded-full font-black tracking-tight text-white ${BADGE_CLASSES[size] || BADGE_CLASSES.md} ${className}`}
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
            >
                BLS
            </span>
        );
    }

    return (
        <img
            src="/logo.png"
            alt={alt}
            className={`w-auto object-contain shrink-0 ${HEIGHT_CLASSES[size] || HEIGHT_CLASSES.md} ${className}`}
            loading="eager"
            draggable={false}
            onError={() => setImageFailed(true)}
        />
    );
};

export default Logo;
