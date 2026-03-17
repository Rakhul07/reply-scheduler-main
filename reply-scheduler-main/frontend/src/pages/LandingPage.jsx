import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-violet-200">
            {/* Header / Nav */}
            <header className="absolute top-0 w-full z-10 px-6 py-5 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight">QA Automation Team</span>
                </div>
                <div>
                    <Link to="/scheduler" className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                        Go to App &rarr;
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 -translate-y-12 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-400/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 drop-shadow-sm">
                        Smarter Replay <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                            Scheduling &amp; Analytics
                        </span>
                    </h1>
                    <p className="mt-6 text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        We build high-performance automation tools for QA Engineering. Stop waiting in line and start prioritizing your critical tests with our centralized queue manager.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/scheduler" className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300">
                            Launch Match Replay Scheduler
                        </Link>
                        <a href="#what-we-do" className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300">
                            See how it works ↓
                        </a>
                    </div>
                </div>
            </section>

            {/* What We Do Section */}
            <section id="what-we-do" className="py-24 bg-white relative border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">What We Do</h2>
                        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">We solve the chaos of manual QA testing by providing structured, automated, and prioritized simulation pipelines.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Centralized Queuing</h3>
                            <p className="text-slate-500 leading-relaxed">Stop running replays locally. Queue matches centrally where up to 5 worker nodes process them concurrently.</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Smart Priority Engine</h3>
                            <p className="text-slate-500 leading-relaxed">VIP matches automatically jump the line. Failed runs are automatically boosted on reschedule so blockers are cleared fast.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">Actionable Analytics</h3>
                            <p className="text-slate-500 leading-relaxed">Track failure patterns and queue backlog through real-time visualizations and heatmap tracking of completion rates.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Our Tech Stack</h2>
                    <p className="mt-4 text-slate-500">Built using modern, scalable, and resilient technologies.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" className="w-14 h-14 mb-4" />
                        <h4 className="font-bold text-slate-700">React 19</h4>
                        <span className="text-xs text-slate-400 mt-1">Frontend UI</span>
                    </div>

                    <div className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" className="w-14 h-14 mb-4" />
                        <h4 className="font-bold text-slate-700">TailwindCSS</h4>
                        <span className="text-xs text-slate-400 mt-1">Utility Styling</span>
                    </div>

                    <div className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" alt="FastAPI" className="w-14 h-14 mb-4" />
                        <h4 className="font-bold text-slate-700">FastAPI</h4>
                        <span className="text-xs text-slate-400 mt-1">Async API Backend</span>
                    </div>

                    <div className="flex flex-col items-center p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow">
                        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" alt="MongoDB" className="w-14 h-14 mb-4" />
                        <h4 className="font-bold text-slate-700">MongoDB Atlas</h4>
                        <span className="text-xs text-slate-400 mt-1">Persistent Storage</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-10 bg-white">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} QA Automation Team. All rights reserved.</p>
                    <div className="mt-4 md:mt-0 flex gap-6">
                        <Link to="/scheduler" className="hover:text-slate-600 transition-colors">Scheduler Tool</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
