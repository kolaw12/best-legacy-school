/**
 * The school crest. The image lives at /logo.png in the public folder
 * (heraldic shield: "Legacy Divine Best Schools — Crèche, Nur & Pry — To the Glory of God").
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
const SIZE_CLASSES = {
    xs:   'h-5',
    sm:   'h-7',
    md:   'h-9',
    lg:   'h-12',
    xl:   'h-16',
    hero: 'h-24',
};

const Logo = ({ size = 'md', className = '', alt = 'Best Legacy Divine School' }) => (
    <img
        src="/logo.png"
        alt={alt}
        className={`w-auto object-contain shrink-0 ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${className}`}
        loading="eager"
        draggable={false}
    />
);

export default Logo;
