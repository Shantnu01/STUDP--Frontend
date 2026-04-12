import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

export default function LandingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // ── Particle Canvas Logic ──
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: any[] = [];
        const particleCount = 80;

        class Particle {
            x: number = 0;
            y: number = 0;
            size: number = 0;
            speedX: number = 0;
            speedY: number = 0;
            opacity: number = 0;

            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || (canvas && this.x > canvas.width)) this.speedX *= -1;
                if (this.y < 0 || (canvas && this.y > canvas.height)) this.speedY *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        let animationFrame: number;
        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrame = requestAnimationFrame(animateParticles);
        }

        window.addEventListener('resize', initCanvas);
        initCanvas();
        animateParticles();

        // ── Intersection Observer for Scroll Reveals ──
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Metric counter logic
                    if (entry.target.classList.contains('metric-num')) {
                        const el = entry.target as HTMLElement;
                        if (el.dataset.animated) return;
                        el.dataset.animated = "true";
                        const targetPrev = parseInt(el.dataset.val || "0");
                        let count = 0;
                        const duration = 2000;
                        const increment = targetPrev / (duration / 16);
                        const update = () => {
                            count += increment;
                            if (count < targetPrev) {
                                el.innerText = Math.ceil(count).toString();
                                requestAnimationFrame(update);
                            } else {
                                el.innerText = targetPrev.toString();
                            }
                        };
                        update();
                    }
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal, .fade-in, .metric-num').forEach(el => observer.observe(el));

        // ── Stagger Typography Entry ──
        document.querySelectorAll('.stagger-text').forEach(el => {
            const lines = el.getAttribute('data-text')?.split('|') || [];
            el.innerHTML = lines.map((line, i) => 
                `<span style="display: block; overflow: hidden;">
                    <span class="stagger-span" style="display: block; transform: translateY(100%); transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.15}s;">
                        ${line}
                    </span>
                </span>`
            ).join('');
            setTimeout(() => {
                el.querySelectorAll('.stagger-span').forEach(s => (s as HTMLElement).style.transform = 'translateY(0)');
            }, 100);
        });

        // ── Navbar Scroll Style ──
        const handleScroll = () => {
            const nav = document.querySelector('.glass-nav');
            if (window.scrollY > 50) nav?.classList.add('scrolled');
            else nav?.classList.remove('scrolled');
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('resize', initCanvas);
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(animationFrame);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="lp-container">
            <style>{styles}</style>
            
            <canvas ref={canvasRef} id="particleCanvas" />

            <nav className="glass-nav">
                <div className="nav-container">
                    <div className="brand">
                        <div className="logo-box">E</div>
                        <span>EduSync</span>
                    </div>
                    <ul className="nav-links">
                        <li><a href="#solutions">Solutions</a></li>
                        <li><a href="#features">Features</a></li>
                        <li><a href="#security">Security</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                        <li><a href="#faq">FAQ</a></li>
                    </ul>
                    <div className="nav-auth">
                        <Link to="/login" className="login-link">Sign In</Link>
                        <Link to="/signup" className="cta-nav">Initialize</Link>
                    </div>
                </div>
            </nav>

            <header className="hero">
                <div className="hero-bg" style={{ backgroundImage: "url('/hero.png')" }} />
                <div className="hero-content">
                    <div className="badge fade-in active">Simple • Secure • Fast</div>
                    <h1 className="stagger-text" data-text="MANAGE YOUR|SCHOOL EASILY."></h1>
                    <p className="fade-in active">Everything your school needs in one simple place. Track students, manage fees, and connect with parents without the complexity.</p>
                    <div className="hero-btns fade-in active">
                        <Link to="/signup" className="btn-primary">Access Gateway</Link>
                        <a href="#solutions" className="btn-outline">Explore Solutions</a>
                    </div>
                </div>
            </header>

            <section className="metrics">
                <div className="metrics-grid">
                    <div className="metric-item">
                        <div className="metric-num" data-val="840">0</div>
                        <div className="metric-label">INSTITUTIONS</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-num" data-val="320">0</div>
                        <div className="metric-label">STUDENT IDS (K)</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-num" data-val="50">0</div>
                        <div className="metric-label">FEE VOLUME (M+)</div>
                    </div>
                    <div className="metric-item">
                        <div className="metric-num" data-val="99">0</div>
                        <div className="metric-label">UPTIME %</div>
                    </div>
                </div>
            </section>

            <section id="solutions" className="solutions">
                <div className="section-head reveal">
                    <h2 className="sub-label">Segmented Solutions</h2>
                    <h3 className="main-label">Designed for every stakeholder.</h3>
                </div>
                <div className="solutions-grid">
                    <div className="solution-card reveal">
                        <div className="sol-icon">💰</div>
                        <h4>Money & Fees</h4>
                        <p>Track student fees, manage payments, and see detailed financial reports with zero effort.</p>
                    </div>
                    <div className="solution-card reveal">
                        <div className="sol-icon">🏫</div>
                        <h4>School Leaders</h4>
                        <p>Get a bird's eye view of your entire school. Check attendance, staff performance, and more instantly.</p>
                    </div>
                    <div className="solution-card reveal">
                        <div className="sol-icon">👨‍🏫</div>
                        <h4>Teachers</h4>
                        <p>Simple tools to manage your classes, mark attendance, and share results with parents easily.</p>
                    </div>
                    <div className="solution-card reveal">
                        <div className="sol-icon">👨‍👩‍👧</div>
                        <h4>Parents</h4>
                        <p>Stay connected with your child's progress. Get instant updates on attendance and marks on your phone.</p>
                    </div>
                </div>
            </section>

            <section id="features" className="features">
                <div className="features-split">
                    <div className="features-text reveal">
                        <h2 className="sub-label">Core Pillars</h2>
                        <h3 className="main-label">Built to make your life easier.</h3>
                        <ul className="feature-list">
                            <li>
                                <strong>Student Records</strong>
                                <p>Keep all student information in one secure place. No more messy paperwork or spreadsheets.</p>
                            </li>
                            <li>
                                <strong>Easy Fee Payments</strong>
                                <p>Let parents pay fees online and get instant receipts. Automate your whole billing process.</p>
                            </li>
                            <li>
                                <strong>Reports & Insights</strong>
                                <p>See how your school is performing with simple, easy-to-read charts and graphs.</p>
                            </li>
                        </ul>
                    </div>
                    <div className="features-visual reveal">
                        <div className="visual-box">
                            <img src="/dashboard.png" alt="EduSync Dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>
            </section>

            <section id="security" className="security-lockup reveal">
                <div className="security-inner">
                    <h2 className="main-label">Sovereign Data Security</h2>
                    <p className="sec-desc">EduSync employs military-grade AES-256 encryption and multi-region redundancy to ensure your institution's digital archive remains impervious to unauthorized access.</p>
                    <div className="sec-grid">
                        <div className="sec-item">
                            <h5>Encryption</h5>
                            <p>At-rest and in-transit protocols.</p>
                        </div>
                        <div className="sec-item">
                            <h5>RBAC</h5>
                            <p>Granular access control logic.</p>
                        </div>
                        <div className="sec-item">
                            <h5>Redundancy</h5>
                            <p>Daily backups across 3 regions.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pricing" className="pricing reveal">
                <div className="section-head">
                    <h2 className="sub-label">Service Tiers</h2>
                    <h3 className="main-label">Ready for every institution.</h3>
                </div>
                <div className="pricing-grid">
                    <div className="pricing-card reveal">
                        <div className="p-tier">Starter</div>
                        <h4 className="p-name">Institutional Starter</h4>
                        <div className="p-price">₹2,500<span>/mo</span></div>
                        <ul className="p-features">
                            <li><Check size={14} /> Up to 10 Members</li>
                            <li><Check size={14} /> Attendance Tracking</li>
                            <li><Check size={14} /> Core SIS Management</li>
                            <li><Check size={14} /> Basic Support</li>
                        </ul>
                        <Link to="/signup" className="btn-p-outline">Get Started</Link>
                    </div>
                    <div className="pricing-card reveal featured">
                        <div className="p-tag">BEST VALUE</div>
                        <div className="p-tier">Professional</div>
                        <h4 className="p-name">Academy Pro</h4>
                        <div className="p-price">₹7,500<span>/mo</span></div>
                        <ul className="p-features">
                            <li><Check size={14} /> Up to 500 Members</li>
                            <li><Check size={14} /> Advanced Analytics</li>
                            <li><Check size={14} /> Exam & Grading Module</li>
                            <li><Check size={14} /> 24/7 Priority Support</li>
                        </ul>
                        <Link to="/signup" className="btn-p-accent">Launch Pro</Link>
                    </div>
                    <div className="pricing-card reveal">
                        <div className="p-tier">Enterprise</div>
                        <h4 className="p-name">Enterprise Excellence</h4>
                        <div className="p-price">₹12,000<span>/mo</span></div>
                        <ul className="p-features">
                            <li><Check size={14} /> Up to 1,000 Members</li>
                            <li><Check size={14} /> Multi-Campus Support</li>
                            <li><Check size={14} /> Fiscal Intelligence</li>
                            <li><Check size={14} /> Custom White-labeling</li>
                        </ul>
                        <Link to="/signup" className="btn-p-outline">Scale Now</Link>
                    </div>
                </div>
            </section>

            <section id="faq" className="faq reveal">
                <div className="section-head">
                    <h2 className="sub-label">Common Queries</h2>
                    <h3 className="main-label">Frequently Asked.</h3>
                </div>
                <div className="faq-accordion">
                    {[
                        { q: "How secure is institutional data?", a: "Data is encrypted using AES-256 at rest and TLS 1.3 in transit. We maintain Tier-4 data centers with 99.99% availability." },
                        { q: "What is the migration protocol?", a: "Our technical teams provide white-glove migration services to ingest legacy data from any major SIS provider within 72 hours." },
                        { q: "Is mobile access supported?", a: "Yes, EduSync features dedicated native applications for both iOS and Android, optimized for parents and staff." }
                    ].map((item, i) => (
                        <div key={i} className="faq-item" onClick={(e) => e.currentTarget.classList.toggle('active')}>
                            <button className="faq-trigger">{item.q} <span className="arr"></span></button>
                            <div className="faq-content">{item.a}</div>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="footer-lp">
                <div className="footer-container">
                    <div className="footer-brand">
                        <div className="brand">
                            <div className="logo-box">E</div>
                            <span>EduSync</span>
                        </div>
                        <p>The global infrastructure for digital education management.</p>
                    </div>
                    <div className="footer-links">
                        <div className="link-col">
                            <h6>Platform</h6>
                            <a href="#">Solutions</a>
                            <a href="#">Security</a>
                            <a href="#">Network</a>
                        </div>
                        <div className="link-col">
                            <h6>Company</h6>
                            <a href="#">About</a>
                            <a href="#">Compliance</a>
                            <a href="#">Contact</a>
                        </div>
                        <div className="link-col">
                            <h6>Legal</h6>
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">SLA</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    &copy; 2026 EduSync Core. All protocols secured.
                </div>
            </footer>
        </div>
    );
}

const styles = `
.lp-container {
    --bg: #010208;
    --bg-alt: #050510;
    --accent: #D4AF37;
    --accent-glow: rgba(212, 175, 55, 0.4);
    --txt: #ffffff;
    --txt-dim: #888899;
    --border: rgba(255, 255, 255, 0.08);
    --glass: rgba(10, 10, 20, 0.6);
    --font-heading: 'Sora', sans-serif;
    --font-mono: 'DM Mono', monospace;
    background: var(--bg);
    color: var(--txt);
    min-height: 100vh;
}

#particleCanvas {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 1; pointer-events: none;
    opacity: 0.6;
}

.sub-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    letter-spacing: 0.5em;
    color: var(--accent);
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 1.5rem;
}

.main-label {
    font-family: var(--font-heading);
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin-bottom: 2rem;
}

.glass-nav {
    position: fixed;
    top: 0; left: 0;
    width: 100%; z-index: 100;
    padding: 1.5rem 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-nav.scrolled {
    background: var(--glass);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    padding: 1rem 0;
}

.nav-container {
    max-width: 1400px;
    margin: 0 auto; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
}

.brand { display: flex; align-items: center; gap: 12px; font-family: var(--font-heading); font-weight: 800; font-size: 1.4rem; }
.logo-box { width: 32px; height: 32px; background: var(--accent); color: var(--bg); border-radius: 8px; display: flex; align-items: center; justify-content: center; }

.nav-links { list-style: none; display: flex; gap: 40px; }
.nav-links a { text-decoration: none; color: var(--txt-dim); font-size: 0.9rem; font-weight: 600; transition: color 0.3s; }
.nav-links a:hover { color: var(--txt); }

.nav-auth { display: flex; align-items: center; gap: 30px; }
.login-link { text-decoration: none; color: var(--txt); font-weight: 600; }
.cta-nav { text-decoration: none; background: var(--accent); color: var(--bg); padding: 10px 24px; border-radius: 12px; font-weight: 800; }

.hero { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; padding: 0 40px; text-align: center; z-index: 10; }
.hero-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0.4; z-index: -1; filter: brightness(0.6); }

.badge { display: inline-block; padding: 8px 20px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 99px; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 2px; color: var(--accent); margin-bottom: 2rem; }
.hero h1 { font-family: var(--font-heading); font-size: clamp(4rem, 12vw, 9rem); font-weight: 950; line-height: 0.9; letter-spacing: -0.05em; margin-bottom: 2rem; }
.accent { color: var(--accent); }
.hero p { max-width: 800px; font-size: clamp(1.1rem, 2vw, 1.4rem); color: var(--txt-dim); margin-bottom: 4rem; line-height: 1.4; }
.hero-btns { display: flex; gap: 20px; }

.btn-primary { background: #ffffff; color: #000; padding: 20px 48px; border-radius: 16px; font-size: 1.2rem; font-weight: 900; text-decoration: none; }
.btn-outline { border: 2px solid var(--border); color: #fff; padding: 20px 48px; border-radius: 16px; font-size: 1.2rem; font-weight: 900; text-decoration: none; }

.metrics { padding: 8rem 40px; border-bottom: 1px solid var(--border); position: relative; z-index: 10; }
.metrics-grid { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 60px; }
.metric-num { font-family: var(--font-heading); font-size: 5rem; font-weight: 900; line-height: 1; }
.metric-label { font-family: var(--font-mono); font-size: 0.8rem; letter-spacing: 0.3em; color: var(--txt-dim); }

.solutions { padding: 12rem 40px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; }
.section-head { text-align: center; margin-bottom: 8rem; }
.solutions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2.5rem; }
.solution-card { padding: 4rem 3rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 40px; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.solution-card:hover { border-color: var(--accent); transform: translateY(-10px); }
.sol-icon { font-size: 2.5rem; margin-bottom: 2rem; }
.solution-card h4 { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; margin-bottom: 1.2rem; }
.solution-card p { color: var(--txt-dim); font-size: 1rem; line-height: 1.7; }

.features { padding: 12rem 40px; background: var(--bg-alt); position: relative; z-index: 10; }
.features-split { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; align-items: center; }
.feature-list { list-style: none; margin-top: 4rem; }
.feature-list li { margin-bottom: 3rem; }
.feature-list strong { display: block; font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; margin-bottom: 0.8rem; color: var(--txt); }
.feature-list p { color: var(--txt-dim); }

.visual-box { width: 100%; aspect-ratio: 16/9; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 30px; position: relative; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }

.security-lockup { padding: 12rem 40px; position: relative; z-index: 10; }
.security-inner { max-width: 1200px; margin: 0 auto; background: linear-gradient(145deg, #050510, #0a0a20); padding: 8rem 6rem; border-radius: 80px; text-align: center; border: 1px solid var(--border); }
.sec-desc { max-width: 800px; margin: 0 auto 6rem; font-size: 1.2rem; color: var(--txt-dim); }
.sec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.sec-item h5 { font-family: var(--font-mono); color: var(--accent); font-size: 1rem; letter-spacing: 2px; }

.faq { padding: 12rem 40px; max-width: 1000px; margin: 0 auto; position: relative; z-index: 10; }
.faq-accordion { margin-top: 6rem; }
.faq-item { border-bottom: 1px solid var(--border); cursor: pointer; }
.faq-trigger { width: 100%; padding: 40px 0; background: none; border: none; color: var(--txt); font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; text-align: left; display: flex; justify-content: space-between; }
.faq-content { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; color: var(--txt-dim); font-size: 1.1rem; }
.faq-item.active .faq-content { max-height: 200px; padding-bottom: 40px; }

.footer-lp { padding: 10rem 40px 4rem; border-top: 1px solid var(--border); position: relative; z-index: 10; }
.footer-container { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 2fr 3fr; gap: 100px; }
.footer-brand p { margin-top: 2rem; color: var(--txt-dim); max-width: 300px; }
.footer-links { display: grid; grid-template-columns: repeat(3, 1fr); }
.link-col h6 { font-family: var(--font-mono); color: var(--txt); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2.5rem; }
.link-col a { display: block; text-decoration: none; color: var(--txt-dim); margin-bottom: 1.2rem; }
.footer-bottom { max-width: 1400px; margin: 6rem auto 0; padding-top: 4rem; border-top: 1px solid var(--border); text-align: center; font-family: var(--font-mono); font-size: 0.8rem; color: #444; letter-spacing: 2px; }

.reveal { opacity: 0; transform: translateY(40px); transition: opacity 1s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
.reveal.active { opacity: 1; transform: translateY(0); }

.fade-in { opacity: 0; transform: translateY(20px); transition: opacity 1s, transform 1s ease-out; }
.fade-in.active { opacity: 1; transform: translateY(0); }

.pricing { padding: 8rem 40px; max-width: 1400px; margin: 0 auto; position: relative; z-index: 10; }
.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem; }
.pricing-card { padding: 4rem 3rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 40px; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; }
.pricing-card.featured { border-color: var(--accent); background: rgba(212,175,55,0.03); }
.p-tag { position: absolute; top: 20px; right: -30px; background: var(--accent); color: var(--bg); font-weight: 800; font-size: 0.6rem; padding: 5px 40px; transform: rotate(45deg); }
.p-tier { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); letter-spacing: 2px; margin-bottom: 1rem; text-transform: uppercase; }
.p-name { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; margin-bottom: 2rem; color: #fff; }
.p-price { font-family: var(--font-heading); font-size: 3.5rem; font-weight: 900; color: #fff; margin-bottom: 3rem; }
.p-price span { font-size: 1rem; color: var(--txt-dim); font-weight: 400; }
.p-features { list-style: none; margin-bottom: 4rem; display: flex; flexDirection: column; gap: 1rem; }
.p-features li { display: flex; align-items: center; gap: 10px; color: var(--txt-dim); font-size: 0.95rem; }
.p-features li svg { color: var(--accent); }
.btn-p-outline { display: block; text-align: center; border: 1px solid var(--border); color: #fff; padding: 18px; border-radius: 12px; font-weight: 800; text-decoration: none; transition: 0.3s; }
.btn-p-outline:hover { background: #fff; color: #000; }
.btn-p-accent { display: block; text-align: center; background: var(--accent); color: var(--bg); padding: 18px; border-radius: 12px; font-weight: 800; text-decoration: none; }
@media (max-width: 1024px) {
    .features-split { grid-template-columns: 1fr; gap: 60px; }
    .sec-grid { grid-template-columns: 1fr; }
    .footer-container { grid-template-columns: 1fr; gap: 60px; }
}
`
