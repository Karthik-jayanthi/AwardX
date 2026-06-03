import React from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, Shield, Globe, Smartphone, Cloud, 
    Database, Lock, Share2, Printer, CreditCard,
    LayoutGrid, Settings, FileText, Bell, Search,
    LucideIcon
} from 'lucide-react';

const row1 = [
    { icon: Zap, label: "Real-time Scoring" },
    { icon: Shield, label: "Fraud Detection" },
    { icon: Globe, label: "Multi-language" },
    { icon: Smartphone, label: "Mobile Optimized" },
    { icon: Cloud, label: "Cloud Storage" },
    { icon: Database, label: "CRM Sync" },
    { icon: Lock, label: "GDPR Compliant" },
    { icon: Share2, label: "Social Sharing" },
];

const row2 = [
    { icon: Printer, label: "PDF Parsing" },
    { icon: CreditCard, label: "Global Payments" },
    { icon: LayoutGrid, label: "Custom Forms" },
    { icon: Settings, label: "API Access" },
    { icon: FileText, label: "Auto-Invoicing" },
    { icon: Bell, label: "WhatsApp Alerts" },
    { icon: Search, label: "SEO Optimized" },
    { icon: Shield, label: "Audit Logs" },
];

interface FeatureTagProps {
    icon: LucideIcon;
    label: string;
}

const FeatureTag: React.FC<FeatureTagProps> = ({ icon: Icon, label }) => (
    <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm whitespace-nowrap min-w-[200px] hover:shadow-md hover:border-indigo-100 transition-all duration-300 group">
        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
            <Icon className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
        </div>
        <span className="font-semibold text-slate-700 group-hover:text-slate-900 text-sm">{label}</span>
    </div>
);

export const FeatureScroll: React.FC = () => {
    return (
        <section className="py-20 bg-slate-50 overflow-hidden border-y border-slate-200/50">
             <div className="flex flex-col gap-8">
                {/* Row 1 - Scroll Left */}
                <div className="relative flex overflow-x-hidden">
                    <div className="animate-scroll flex space-x-8 px-4">
                        {[...row1, ...row1, ...row1, ...row1].map((item, idx) => (
                            <FeatureTag key={`r1-${idx}`} icon={item.icon} label={item.label} />
                        ))}
                    </div>
                </div>

                {/* Row 2 - Scroll Right */}
                <div className="relative flex overflow-x-hidden">
                    <div className="animate-scroll-reverse flex space-x-8 px-4">
                        {[...row2, ...row2, ...row2, ...row2].map((item, idx) => (
                            <FeatureTag key={`r2-${idx}`} icon={item.icon} label={item.label} />
                        ))}
                    </div>
                </div>
             </div>
             
             {/* Gradient Overlays to smooth edges */}
             <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
             <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
        </section>
    );
};