import PageHero from '../components/PageHero';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import SectionEyebrow from '../components/ui/SectionEyebrow';

const VALUES = [
    { title: 'Child-First Learning', desc: 'Every decision starts with what helps a child grow into a confident, curious learner.' },
    { title: 'Character & Faith', desc: 'We pair academic rigour with moral instruction rooted in Christian values and Nigerian culture.' },
    { title: 'Warm Partnership', desc: 'Teachers and parents move in step — progress notes, open days, and honest conversation.' },
    { title: 'Play Meets Purpose', desc: 'Play-based activities in Nursery, structured learning in Basic, joyful discovery in both.' },
];

const MILESTONES = [
    { year: '2009', title: 'Our Beginning', desc: 'Started as a small nursery centre in Mowe, Ogun State with 14 children.' },
    { year: '2014', title: 'Primary Section Opens', desc: 'Expanded to offer Basic 1–6 with a full Nigerian curriculum.' },
    { year: '2019', title: 'ICT & Creative Studio', desc: 'Built our computer lab and creative arts room to support modern learning.' },
    { year: '2024', title: '500+ Legacy Builders', desc: 'Over 500 children have passed through our halls — and that number keeps growing.' },
];

const About = () => {
    return (
        <div className="bg-white">
            <PageHero
                eyebrow="ABOUT US"
                title="Sixteen years of raising confident, Christ-centred learners."
                subtitle="Best Legacy Divine School is a Nursery and Primary school in Mowe, Ogun State. We combine a strong Nigerian curriculum, warm teaching, and real partnership with parents."
                bgImage="/school_hero_Section.png"
            />

            {/* MISSION / VISION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-primary-soft rounded-3xl p-8 md:p-10">
                        <Badge tone="white" dot>Our Mission</Badge>
                        <h3 className="mt-5 text-2xl md:text-3xl font-black text-ink leading-tight">
                            To raise well-rounded Nigerian children — academically strong, morally grounded, and ready for the next stage.
                        </h3>
                        <p className="mt-4 text-gray-700">
                            We nurture every child through play-based Nursery learning, a rigorous Basic curriculum, and teachers who know each student by name.
                        </p>
                    </div>
                    <div className="bg-secondary-soft rounded-3xl p-8 md:p-10">
                        <Badge tone="white" dot>Our Vision</Badge>
                        <h3 className="mt-5 text-2xl md:text-3xl font-black text-ink leading-tight">
                            A primary school known for the quiet, steady confidence of its graduates.
                        </h3>
                        <p className="mt-4 text-gray-700">
                            By Basic 6, our pupils read fluently, think clearly, lead kindly, and carry a strong Christian foundation into secondary school.
                        </p>
                    </div>
                </div>
            </section>

            {/* VALUES */}
            <section className="bg-bg py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionEyebrow
                        eyebrow="Core Values"
                        title="What we believe about teaching children."
                        description="These four commitments shape how our teachers plan lessons, how we run the day, and how we speak with parents."
                    />
                    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {VALUES.map((v, i) => (
                            <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-card-lg transition">
                                <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-black">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <h4 className="mt-5 font-bold text-ink">{v.title}</h4>
                                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* OUR STORY / TIMELINE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    <div>
                        <SectionEyebrow
                            eyebrow="Our Story"
                            title="From fourteen children to a legacy."
                            description="What started in 2009 as a one-room nursery on Kolawole Street has grown into a full Nursery and Primary school serving families across Mowe and Ibafo."
                        />
                        <div className="mt-8 rounded-3xl overflow-hidden aspect-[4/3] shadow-card-lg">
                            <img src="/school_ceremony.jpg" alt="School life" className="w-full h-full object-cover"/>
                        </div>
                    </div>

                    <ol className="relative border-l-2 border-dashed border-primary/30 pl-8 space-y-8">
                        {MILESTONES.map((m) => (
                            <li key={m.year} className="relative">
                                <span className="absolute -left-[2.6rem] top-0 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                </span>
                                <div className="text-xs font-bold text-primary tracking-widest">{m.year}</div>
                                <div className="mt-1 font-bold text-ink">{m.title}</div>
                                <p className="mt-1 text-sm text-gray-600">{m.desc}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* PRINCIPAL / LEADERSHIP */}
            <section className="bg-bg py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-5 gap-10 items-center">
                    <div className="md:col-span-2">
                        <div className="rounded-3xl overflow-hidden aspect-[4/5] shadow-card-lg">
                            <img src="/staff_members.jpg" alt="School Principal" className="w-full h-full object-cover"/>
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <Badge tone="mint" dot>A Word From The Principal</Badge>
                        <h2 className="mt-5 text-3xl md:text-4xl font-black text-ink leading-tight">
                            "Our job is not just to teach — it's to know each child."
                        </h2>
                        <p className="mt-6 text-gray-600 leading-relaxed">
                            When a parent hands us their child, they are handing us a trust. We take that seriously. Every teacher here knows every pupil in their class — what they love, what they struggle with, what makes them laugh. That's the Best Legacy way.
                        </p>
                        <p className="mt-4 text-gray-600 leading-relaxed">
                            If you're considering our school, come and visit. Watch a Nursery class sing, sit in on a Basic 5 maths lesson, and talk to our teachers. Then decide.
                        </p>
                        <div className="mt-6">
                            <div className="font-bold text-ink">Mrs. Olusola Kolawole</div>
                            <div className="text-sm text-gray-500">Principal, Best Legacy Divine School</div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button to="/admissions">Start an Application</Button>
                            <Button to="/contact" variant="outline">Book a Visit</Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
