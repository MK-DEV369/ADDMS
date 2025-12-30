import { Link } from 'react-router-dom'
import { Github, Linkedin, Shield, Brain, Globe, Clock, Lock, CheckCircle, ArrowRight, MapPin, Zap, Server, Cpu, Activity, Plane } from 'lucide-react'
import ADDMS from '../store/ADDMS.png';
import RVCE from '../store/RVCE.png';
import TiltedCard from '@/components/ui/TiltedCard'
import Morya from '../store/Morya.jpg';
import Mahantesh from '../store/Mahantesh.jpeg';
import LiquidEther from '@/components/ui/LiquidEther';

export default function HomePage() {
    const workflowSteps = [
        { icon: Lock, title: "User Authentication", desc: "JWT-based secure login for Admin/Manager/Customer" },
        { icon: MapPin, title: "Delivery Request", desc: "Geospatial validation using PostGIS" },
        { icon: CheckCircle, title: "Drone Availability", desc: "Real-time status check with Redis cache" },
        { icon: Brain, title: "AI Route Optimization", desc: "DGCA no-fly zone avoidance & weather analysis" },
        { icon: Plane, title: "Drone Assignment", desc: "Auto or manual assignment with approval" },
        { icon: Activity, title: "Flight Execution", desc: "Simulation with OpenStreetMaps-Buildings" },
        { icon: Globe, title: "Real-Time Monitoring", desc: "WebSocket telemetry streaming" },
        { icon: Shield, title: "Anomaly Handling", desc: "Auto-rerouting & restriction detection" },
        { icon: CheckCircle, title: "Delivery Completion", desc: "Package delivered with notifications" },
        { icon: Server, title: "Analytics & Logging", desc: "Fleet insights & audit trails" }
    ];

    const roles = [
        {
            title: "Admin Dashboard",
            color: "from-red-500 to-orange-600",
            icon: Shield,
            capabilities: ["Drone registration & maintenance", "No-fly zone management", "User & role management", "Fleet analytics & audit logs"],
            route: "/admin"
        },
        {
            title: "Manager Dashboard",
            color: "from-blue-500 to-indigo-600",
            icon: Cpu,
            capabilities: ["Assign drones to orders", "Monitor live flights", "Approve maintenance", "Handle anomalies"],
            route: "/manager"
        },
        {
            title: "Customer Dashboard",
            color: "from-green-500 to-emerald-600",
            icon: MapPin,
            capabilities: ["Request delivery", "Track drone in real-time", "Receive notifications", "View delivery history"],
            route: "/customer"
        }
    ];

    const techStack = [
        { category: "Backend & Database", items: ["Django + DRF", "PostgreSQL + PostGIS", "TimescaleDB"] },
        { category: "Async & Caching", items: ["Redis", "Celery", "Celery Beat"] },
        { category: "Frontend", items: ["React 18 + TypeScript", "Tailwind CSS", "Framer Motion"] },
        { category: "Simulation", items: ["OpenStreetMaps-Buildings", "Cesium"] },
        { category: "AI/ML", items: ["Route Optimization", "ETA Prediction"] },
        { category: "Security", items: ["JWT Auth", "RBAC", "DGCA Compliance"] }
    ];

    const innovations = [
        { icon: Shield, text: "DGCA Airspace Compliance" },
        { icon: Brain, text: "AI-Driven Routing" },
        { icon: Globe, text: "GeoSpatial Intelligence" },
        { icon: Clock, text: "Real-Time Telemetry" },
        { icon: Lock, text: "Secure RBAC Architecture" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <LiquidEther
                    colors={['#5227FF', '#FF9FFC', '#B19EEF']}
                    mouseForce={20}
                    cursorSize={60}
                    isViscous={false}
                    viscous={20}
                    iterationsViscous={16}
                    iterationsPoisson={16}
                    resolution={0.35}
                    isBounce={true}
                    autoDemo={!((typeof window !== 'undefined') && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)}
                    autoSpeed={0.25}
                    autoIntensity={0.9}
                    takeoverDuration={0.35}
                    autoResumeDelay={10000}
                    autoRampDuration={0.4}
                />
            </div>
            <div className="relative z-10">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <img src={ADDMS} alt="ADDMS Logo" className="w-10 h-10 rounded-lg" />
                                    <img src={RVCE} alt="RVCE Logo" className="w-10 h-10 rounded-lg" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">ADDMS</h1>
                                    <p className="text-sm text-gray-600">Autonomous Drone Delivery Management System</p>
                                </div>
                            </div>
                            <Link
                                to="/login"
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#e2feff] to-[#e2feff] rounded-3xl mb-8 shadow-2xl transform hover:rotate-6 transition-transform">
                            <img src={ADDMS} alt="ADDMS Logo" className="w-12 h-12 rounded-lg" />
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                            Autonomous Drone Delivery<br />
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Management System</span>
                        </h2>
                        <p className="text-2xl text-gray-600 mb-4 max-w-3xl mx-auto font-medium">
                            AI-Driven | Geo-Spatial | Real-Time Logistics Platform
                        </p>
                        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
                            Revolutionizing delivery systems with autonomous drone technology. Efficient, reliable, and sustainable solutions for modern logistics.
                        </p>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg font-semibold">
                                Get Started
                            </button>
                            <button className="bg-white/80 backdrop-blur text-gray-900 px-8 py-3 rounded-lg hover:bg-white transition-all transform hover:scale-105 shadow-lg font-semibold border border-gray-200">
                                View Workflow
                            </button>
                        </div>
                    </div>
                </section>

                {/* Innovation Badges */}
                <section className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-4">
                            {innovations.map((innovation, idx) => (
                                <div key={idx} className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full shadow-md hover:shadow-xl transition-all transform hover:scale-105 border border-white/40 flex items-center gap-2">
                                    <innovation.icon className="w-5 h-5 text-indigo-600" />
                                    <span className="text-gray-800 font-medium">{innovation.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Project Workflow Timeline */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-bold text-gray-900 mb-4">Project Workflow</h3>
                            <p className="text-xl text-gray-600">End-to-end delivery automation in 10 intelligent steps</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                            {workflowSteps.map((step, idx) => (
                                <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border border-white/50 group">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                            <step.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="text-sm font-bold text-indigo-600 mb-2">Step {idx + 1}</div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h4>
                                        <p className="text-sm text-gray-600">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Role-Based Access Cards */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-bold text-gray-900 mb-4">Role-Based Access Control</h3>
                            <p className="text-xl text-gray-600">Secure, hierarchical access for every user type</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {roles.map((role, idx) => (
                                <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden border border-white/50">
                                    <div className={`bg-gradient-to-r ${role.color} p-6 text-white`}>
                                        <role.icon className="w-12 h-12 mb-4" />
                                        <h4 className="text-2xl font-bold">{role.title}</h4>
                                    </div>
                                    <div className="p-6">
                                        <ul className="space-y-3 mb-6">
                                            {role.capabilities.map((cap, capIdx) => (
                                                <li key={capIdx} className="flex items-start gap-2">
                                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700">{cap}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            to={role.route}
                                            className={`flex items-center justify-center gap-2 bg-gradient-to-r ${role.color} text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all font-semibold`}
                                        >
                                            Access Dashboard
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-bold text-gray-900 mb-4">Technology Stack</h3>
                            <p className="text-xl text-gray-600">Built with industry-leading technologies</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {techStack.map((tech, idx) => (
                                <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all border border-white/50">
                                    <h4 className="text-xl font-bold text-indigo-600 mb-4">{tech.category}</h4>
                                    <ul className="space-y-2">
                                        {tech.items.map((item, itemIdx) => (
                                            <li key={itemIdx} className="flex items-center gap-2 text-gray-700">
                                                <Zap className="w-4 h-4 text-yellow-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h3>
                            <p className="text-xl text-gray-600">Passionate developers building the future of logistics</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <TiltedCard
                                imageSrc={Morya}
                                altText="L Moryakantha"
                                captionText="L Moryakantha"
                                containerHeight="320px"
                                containerWidth="100%"
                                imageHeight="320px"
                                imageWidth="100%"
                                rotateAmplitude={10}
                                scaleOnHover={1.04}
                                showMobileWarning={false}
                                showTooltip={false}
                                displayOverlayContent={true}
                                overlayContent={
                                    <div className="p-6 text-left">
                                        <div className="flex items-center space-x-4 mb-3">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900">L Moryakantha</h4>
                                                <p className="text-indigo-600 text-sm font-medium">Dept of AIML</p>
                                                <p className="text-gray-600 text-xs">USN: 1RV24AI406</p>
                                            </div>
                                        </div>
                                        {/* <p className="text-gray-700 mb-4 text-sm">Frontend Development & UI/UX Design</p> */}
                                        <div className="flex space-x-3">
                                            <a href="https://github.com/MK-DEV369" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900">
                                                <Github className="w-5 h-5" />
                                            </a>
                                            <a href="https://linkedin.com/in/l-morya-kantha" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900">
                                                <Linkedin className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                }
                            />

                            <TiltedCard
                                imageSrc={Mahantesh}
                                altText="Mahantesh PB"
                                captionText="Mahantesh PB"
                                containerHeight="320px"
                                containerWidth="100%"
                                imageHeight="320px"
                                imageWidth="100%"
                                rotateAmplitude={10}
                                scaleOnHover={1.04}
                                showMobileWarning={false}
                                showTooltip={false}
                                displayOverlayContent={true}
                                overlayContent={
                                    <div className="p-6 text-left">
                                        <div className="flex items-center space-x-4 mb-3">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900">Mahantesh PB</h4>
                                                <p className="text-indigo-600 text-sm font-medium">Dept of AIML</p>
                                                <p className="text-gray-600 text-xs">USN: 1RV24AI407</p>
                                            </div>
                                        </div>
                                        {/* <p className="text-gray-700 mb-4 text-sm">Backend Development & AI Integration</p> */}
                                        <div className="flex space-x-3">
                                            <a href="https://github.com/mahanteshpb1" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900">
                                                <Github className="w-5 h-5" />
                                            </a>
                                            <a href="https://linkedin.com/in/mahanteshpb" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900">
                                                <Linkedin className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </section>

                {/* Acknowledgment */}
                <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white/40">
                    <div className="max-w-7xl mx-auto text-center">
                        <p className="text-lg text-gray-600">
                            Special thanks to <span className="font-bold text-indigo-600">RV College of Engineering</span> for providing the platform and resources for this project.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">DBMS Mini Project | Academic Year 2024-25</p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <p className="text-gray-300 mb-2">
                            © 2025 DBMS - RVCE × Morya × Mahantesh. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    )
}