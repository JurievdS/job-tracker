import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  CalendarCheck,
  Sparkles,
  Check,
  MapPin,
  Star,
  Clock,
} from 'lucide-react';
import { Button, Badge } from '@/components/common';
import { ROUTES } from '@/routes/routes';
import { useInView } from '@/hooks/useInView';

// ─── Hero Preview ────────────────────────────────────────────────────────────

function HeroPreview() {
  const columns = [
    {
      title: 'Applied',
      count: 4,
      color: 'bg-status-applied',
      cards: [
        { company: 'Stripe', role: 'Frontend Engineer' },
        { company: 'Vercel', role: 'Software Engineer' },
      ],
    },
    {
      title: 'Interviewing',
      count: 2,
      color: 'bg-status-phone_screen',
      cards: [
        { company: 'Linear', role: 'Full Stack Dev' },
        { company: 'Notion', role: 'Product Engineer' },
      ],
    },
    {
      title: 'Offer',
      count: 1,
      color: 'bg-status-offer',
      cards: [{ company: 'Figma', role: 'Design Engineer' }],
    },
  ];

  return (
    <div className="relative" aria-hidden="true">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-2xl" />

      {/* Card */}
      <div className="relative animate-[float_6s_ease-in-out_infinite] bg-surface rounded-[var(--radius-lg)] shadow-2xl border border-border overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-text-placeholder ml-2">
            Applications Board
          </span>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {columns.map((col) => (
            <div key={col.title} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">
                  {col.title}
                </span>
                <Badge variant="default" className="!text-[10px] !px-1.5 !py-0">
                  {col.count}
                </Badge>
              </div>
              {col.cards.map((card) => (
                <div
                  key={card.company}
                  className={`bg-surface-alt rounded-[var(--radius-md)] p-2 border-l-2 ${col.color}`}
                >
                  <p className="text-[11px] font-medium text-text">
                    {card.company}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {card.role}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Visuals ─────────────────────────────────────────────────────────

function PipelineVisual() {
  const segments = [
    { label: 'Bookmarked', color: 'bg-status-bookmarked', width: '12%' },
    { label: 'Applied', color: 'bg-status-applied', width: '28%' },
    { label: 'Interviewing', color: 'bg-status-phone_screen', width: '20%' },
    { label: 'Technical', color: 'bg-status-technical', width: '15%' },
    { label: 'Offer', color: 'bg-status-offer', width: '15%' },
    { label: 'Rejected', color: 'bg-status-rejected', width: '10%' },
  ];

  return (
    <div aria-hidden="true">
      <div className="h-3 rounded-full overflow-hidden flex mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} first:rounded-l-full last:rounded-r-full`}
            style={{ width: seg.width }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${seg.color}`} />
            <span className="text-xs text-text-muted">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyVisual() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-text">Acme Corp</p>
          <div className="flex items-center gap-1 mt-0.5 text-sm text-text-muted">
            <MapPin className="w-3.5 h-3.5" />
            San Francisco, CA
          </div>
        </div>
        <div className="inline-flex items-center gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
          ))}
          <Star className="w-4 h-4 text-text-placeholder" />
        </div>
      </div>
      <div className="border-t border-border pt-3 space-y-2.5">
        {[
          { initials: 'SJ', name: 'Sarah Johnson', title: 'Engineering Manager' },
          { initials: 'MK', name: 'Mike Kim', title: 'Tech Lead' },
        ].map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-xs font-medium text-text-secondary">
              {c.initials}
            </div>
            <div>
              <p className="text-sm font-medium text-text">{c.name}</p>
              <p className="text-xs text-text-muted">{c.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReminderVisual() {
  const reminders = [
    { text: 'Follow up with Stripe recruiter', date: 'Tomorrow', urgent: true },
    { text: 'Prepare for Notion technical round', date: 'In 3 days', urgent: false },
    { text: 'Send thank-you email to Linear', date: 'Today', urgent: true },
  ];

  return (
    <div className="space-y-2.5" aria-hidden="true">
      {reminders.map((r) => (
        <div
          key={r.text}
          className="flex items-center gap-3 p-2.5 rounded-[var(--radius-lg)] bg-surface-alt"
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.urgent ? 'bg-danger' : 'bg-primary'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text truncate">{r.text}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-text-placeholder" />
              <span className="text-xs text-text-muted">{r.date}</span>
            </div>
          </div>
          <Check className="w-4 h-4 text-text-placeholder flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Feature Section ─────────────────────────────────────────────────────────

const features = [
  {
    icon: Briefcase,
    title: 'Track Your Pipeline',
    description:
      'Visualize every application from bookmarked to offer with a drag-and-drop Kanban board. See your progress at a glance.',
    bullets: [
      'Drag-and-drop Kanban board',
      'Status tracking from applied to offer',
      'Quick-create for rapid entry',
    ],
    Visual: PipelineVisual,
  },
  {
    icon: Building2,
    title: 'Research Companies',
    description:
      'Keep structured notes, rate companies, and maintain a contact directory. Everything you need for due diligence.',
    bullets: [
      'Star ratings and personal notes',
      'Contact management with roles',
      'Link companies to applications',
    ],
    Visual: CompanyVisual,
  },
  {
    icon: CalendarCheck,
    title: 'Stay Organized',
    description:
      'Set reminders for follow-ups, log every interaction, and make sure nothing falls through the cracks.',
    bullets: [
      'Smart reminders with urgency levels',
      'Interaction logging by type',
      'Timeline view of your activity',
    ],
    Visual: ReminderVisual,
  },
];

function FeatureBlock({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const { ref, isInView } = useInView();
  const isEven = index % 2 === 0;
  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      className={`lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center ${
        isInView ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        animation: isInView ? 'fade-up 0.6s ease-out forwards' : 'none',
      }}
    >
      {/* Text */}
      <div className={isEven ? '' : 'lg:order-2'}>
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-primary-light flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-text">
          {feature.title}
        </h3>
        <p className="mt-2 text-text-secondary leading-relaxed">
          {feature.description}
        </p>
        <ul className="mt-4 space-y-2">
          {feature.bullets.map((bullet, i) => (
            <li
              key={bullet}
              className="flex items-center gap-2 text-sm text-text-secondary"
              style={{
                animation: isInView
                  ? `fade-up 0.5s ease-out ${(i + 1) * 100}ms both`
                  : 'none',
              }}
            >
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual */}
      <div className={isEven ? '' : 'lg:order-1'}>
        <div
          className={`mt-8 lg:mt-0 bg-surface rounded-[var(--radius-lg)] shadow-xl border border-border p-6 ${
            isEven ? 'lg:rotate-1' : 'lg:-rotate-1'
          }`}
        >
          <feature.Visual />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section
        className="relative py-16 sm:py-24 px-6"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 50%, oklch(from var(--color-primary) l c h / 0.12), transparent 50%), radial-gradient(ellipse at 80% 20%, oklch(from var(--color-primary) l c h / 0.09), transparent 50%)',
        }}
      >
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary rounded-full px-3 py-1 text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Free and open source
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text">
              Your job search,{' '}
              <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                under control
              </span>
            </h1>

            <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
              Track applications, research companies, manage contacts, and stay
              on top of every opportunity — all in one place.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to={ROUTES.REGISTER}>
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-12 lg:mt-0">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text">
              Everything you need to land the job
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              From first application to final offer, Job Tracker keeps your
              entire job search organized and on track.
            </p>
          </div>

          <div className="space-y-20 sm:space-y-28">
            {features.map((feature, i) => (
              <FeatureBlock key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 text-center border-t border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-text">
            Ready to organize your job search?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Create your free account in seconds. No credit card required.
          </p>
          <Link to={ROUTES.REGISTER} className="inline-block mt-8">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-[var(--radius-md)] flex items-center justify-center">
              <Briefcase className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-text">
              Job Tracker
            </span>
          </div>
          <p className="text-sm text-text-placeholder">
            &copy; {new Date().getFullYear()} Job Tracker &middot; Built with
            React &amp; Tailwind
          </p>
        </div>
      </footer>
    </div>
  );
}
