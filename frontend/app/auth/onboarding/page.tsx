"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  TrendingUp, 
  HeartPulse, 
  Cog, 
  Wallet, 
  GraduationCap, 
  Users, 
  Globe,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Award,
  Scale,
  Palette,
  Wrench
} from "lucide-react";
import { SiteLogo } from "@/components/SiteLogo";

interface CareerField {
  id: string;
  name: string;
  desc: string;
  icon: any;
  skills: string[];
}

const ROLES_BY_FIELD: Record<string, string[]> = {
  "Tech & Engineering": ["Software Engineer", "Frontend Engineer", "Backend Engineer", "DevOps Engineer", "Data Scientist", "Product Manager"],
  "Sales & Development": ["Account Manager", "B2B Sales Representative", "Business Development Executive", "Growth Specialist"],
  "Marketing & Content": ["SEO Specialist", "Content Writer", "Brand Manager", "Social Media Marketer"],
  "Healthcare & Medicine": ["Nurse", "Clinical Assistant", "Medical Coordinator", "Healthcare Administrator"],
  "Operations & Logistics": ["Operations Manager", "Logistics Coordinator", "Supply Chain Analyst", "Project Manager"],
  "Finance & Accounting": ["Financial Analyst", "Corporate Accountant", "Investment Analyst", "Risk Analyst"],
  "Education & Training": ["Teacher", "Corporate Trainer", "Lesson Planner", "Instructional Designer"],
  "HR & Recruitment": ["Talent Acquisition Specialist", "HR Coordinator", "Employee Relations Manager", "HR Generalist"],
  "Legal": ["Corporate Counsel", "Compliance Officer", "Paralegal", "Contract Administrator", "Legal Consultant"],
  "Design & Creative": ["UI/UX Designer", "Graphic Designer", "Video Editor", "Product Designer", "Art Director"],
  "Engineering (Civil/Mech/Electrical)": ["Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "Structural Engineer", "Quality Assurance Engineer"]
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Selection states
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fields: CareerField[] = [
    {
      id: "Tech & Engineering",
      name: "Tech & Engineering",
      desc: "Software engineering, DevOps, Data Science, Product Management.",
      icon: Cog,
      skills: ["React", "TypeScript", "Python", "SQL", "Git"]
    },
    {
      id: "Sales & Development",
      name: "Sales & Development",
      desc: "Account management, B2B sales, client relations, growth strategy.",
      icon: TrendingUp,
      skills: ["Enterprise Sales", "Lead Generation", "Negotiation", "CRM", "Account Management"]
    },
    {
      id: "Marketing & Content",
      name: "Marketing & Content",
      desc: "SEO, copy creation, social media strategy, brand management.",
      icon: Globe,
      skills: ["SEO", "Google Analytics", "Content Strategy", "Copywriting", "Social Media Marketing"]
    },
    {
      id: "Healthcare & Medicine",
      name: "Healthcare & Medicine",
      desc: "Patient care, clinical services, medicine, healthcare admin.",
      icon: HeartPulse,
      skills: ["Patient Care", "Medical Records", "Clinical Procedures", "Healthcare Compliance", "Patient Education"]
    },
    {
      id: "Operations & Logistics",
      name: "Operations & Logistics",
      desc: "Supply chain, process optimization, logistics, management.",
      icon: Briefcase,
      skills: ["Process Optimization", "Logistics", "Supply Chain", "Project Management", "Vendor Management"]
    },
    {
      id: "Finance & Accounting",
      name: "Finance & Accounting",
      desc: "Investment banking, tax, corporate finance, financial analysis.",
      icon: Wallet,
      skills: ["Financial Modeling", "Corporate Finance", "Excel", "Data Analysis", "Risk Assessment"]
    },
    {
      id: "Education & Training",
      name: "Education & Training",
      desc: "Classroom teaching, corporate instruction, academic research.",
      icon: GraduationCap,
      skills: ["Curriculum Development", "Classroom Management", "Lesson Planning", "Student Assessment", "E-Learning"]
    },
    {
      id: "HR & Recruitment",
      name: "HR & Recruitment",
      desc: "Talent acquisition, employee relations, onboarding, operations.",
      icon: Users,
      skills: ["Talent Acquisition", "Onboarding", "Employee Relations", "Performance Management", "HRIS"]
    },
    {
      id: "Legal",
      name: "Legal",
      desc: "Law practice, corporate compliance, legal research, paralegal work.",
      icon: Scale,
      skills: ["Legal Research", "Contract Drafting", "Corporate Compliance", "Litigation Support", "Analytical Thinking"]
    },
    {
      id: "Design & Creative",
      name: "Design & Creative",
      desc: "UI/UX, graphic design, art direction, animation, video production.",
      icon: Palette,
      skills: ["UI/UX Design", "Figma", "Adobe Photoshop", "Video Editing", "Creative Direction"]
    },
    {
      id: "Engineering (Civil/Mech/Electrical)",
      name: "Engineering (Civil/Mech/Electrical)",
      desc: "Civil planning, mechanical design, electrical circuitry, industrial engineering.",
      icon: Wrench,
      skills: ["AutoCAD", "MATLAB", "Project Estimation", "SolidWorks", "Electrical Troubleshooting"]
    }
  ];

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) => 
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleNextStep = () => {
    if (step === 1 && selectedField) {
      setSelectedRoles([]);
      setStep(2);
    } else if (step === 2 && selectedRoles.length > 0) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedField || selectedRoles.length === 0 || !selectedExperience) return;
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      router.push("/auth/login");
      return;
    }

    const selectedData = fields.find(f => f.id === selectedField);
    if (!selectedData) return;

    let experienceYears = 1.0;
    if (selectedExperience === "Mid") experienceYears = 3.0;
    if (selectedExperience === "Senior") experienceYears = 7.0;

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const apiBase = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

    try {
      const res1 = await fetch(`${apiBase}/users/me`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profession: selectedField
        })
      });

      const res2 = await fetch(`${apiBase}/users/me/profile-data`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          primary_skills: selectedData.skills,
          preferred_roles: selectedRoles,
          years_of_experience: experienceYears,
          current_status: "Looking for Job"
        })
      });

      if (res1.ok && res2.ok) {
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ 
          ...localUser, 
          profession: selectedField,
          preferred_roles: selectedRoles,
          years_of_experience: experienceYears
        }));
        router.push("/dashboard");
      } else {
        alert("Failed to save onboarding selections.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred during onboarding.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 font-sans selection:bg-accent-soft text-text">
      {/* Mesh background matching overall system */}
      <div className="mesh-bg absolute inset-0 opacity-10 pointer-events-none" />
      
      {/* 🧬 Logo header */}
      <div className="absolute top-8 flex flex-col items-center z-20">
        <SiteLogo className="w-14 h-14" />
        <span className="mt-2 text-[8px] font-black tracking-[0.6em] text-text-muted/40 uppercase">Core Setup</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-bg-surface border border-border p-8 lg:p-10 rounded-[2.5rem] relative z-10 shadow-lg space-y-8"
      >
        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step 
                  ? "w-10 bg-accent" 
                  : s < step 
                    ? "w-4 bg-accent/40" 
                    : "w-4 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-text">
            {step === 1 && "Select Career Path"}
            {step === 2 && "Configure Target Roles"}
            {step === 3 && "Select Experience"}
          </h1>
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em]">
            {step === 1 && "Calibrate your AmiSync intelligence node"}
            {step === 2 && `Pick specific disciplines under ${selectedField}`}
            {step === 3 && "Define your professional seniority level"}
          </p>
        </div>

        <div className="min-h-[250px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
                key="step1"
              >
                {fields.map((field) => {
                  const IconComponent = field.icon;
                  const isSelected = selectedField === field.id;
                  return (
                    <div
                      key={field.id}
                      onClick={() => setSelectedField(field.id)}
                      className={`p-6 rounded-3xl border cursor-pointer flex flex-col justify-between h-52 transition-all relative overflow-hidden group ${
                        isSelected 
                          ? "border-accent bg-accent-soft/30 text-text shadow-md"
                          : "border-border/60 bg-bg-surface hover:border-accent/40 hover:bg-bg-raised/50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected ? "bg-accent/20 text-accent" : "bg-bg-raised text-text-muted group-hover:text-text"
                      }`}>
                        <IconComponent size={20} />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-xs font-black uppercase tracking-wider text-text">{field.name}</h3>
                        <p className="text-[10px] text-text-muted leading-relaxed font-bold">{field.desc}</p>
                      </div>

                      {isSelected && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {step === 2 && selectedField && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center w-full max-w-2xl"
                key="step2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
                  {ROLES_BY_FIELD[selectedField]?.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <div
                        key={role}
                        onClick={() => handleToggleRole(role)}
                        className={`p-5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected 
                            ? "border-accent bg-accent-soft/20 text-text shadow-sm"
                            : "border-border/60 bg-bg-surface text-text-muted hover:border-border hover:text-text"
                        }`}
                      >
                        <span className="text-xs font-bold tracking-tight">{role}</span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-accent border-accent text-bg-surface" : "border-border"
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl"
                key="step3"
              >
                {[
                  { id: "Junior", label: "Junior Level", desc: "0 - 2 Years Experience", level: "L1" },
                  { id: "Mid", label: "Mid Level", desc: "3 - 5 Years Experience", level: "L2" },
                  { id: "Senior", label: "Senior Level", desc: "6+ Years Experience", level: "L3" }
                ].map((exp) => {
                  const isSelected = selectedExperience === exp.id;
                  return (
                    <div
                      key={exp.id}
                      onClick={() => setSelectedExperience(exp.id)}
                      className={`p-8 rounded-3xl border cursor-pointer flex flex-col justify-between h-48 text-center transition-all relative ${
                        isSelected 
                          ? "border-accent bg-accent-soft/40 text-text shadow-lg"
                          : "border-border/60 bg-bg-surface hover:border-border"
                      }`}
                    >
                      <div className="mx-auto w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-2">
                        <Award size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-text mb-1">{exp.label}</h3>
                        <p className="text-[10px] text-text-muted font-bold">{exp.desc}</p>
                      </div>
                      <span className="text-[9px] font-black text-text-muted/30 tracking-widest">{exp.level}</span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-border/60">
          <div>
            {step > 1 && (
              <button
                onClick={handlePrevStep}
                className="px-6 py-3.5 rounded-xl border border-border text-text-muted hover:text-text hover:border-border/80 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest text-center sm:text-left">
              {step === 1 && (selectedField ? `Field: ${selectedField}` : "Select a career field")}
              {step === 2 && `${selectedRoles.length} roles selected`}
              {step === 3 && (selectedExperience ? `Experience: ${selectedExperience}` : "Select experience level")}
            </span>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={(step === 1 && !selectedField) || (step === 2 && selectedRoles.length === 0)}
                className="w-full sm:w-auto px-10 py-4 bg-accent hover:bg-accent-hover text-bg-surface rounded-xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedExperience}
                className="w-full sm:w-auto px-10 py-4 bg-accent hover:bg-accent-hover text-bg-surface rounded-xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Calibrating...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Calibration</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
