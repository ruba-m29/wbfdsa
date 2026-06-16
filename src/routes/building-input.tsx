import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, MapPin, Building2, FileText, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/building-input")({
  head: () => ({ meta: [{ title: "Building Assessment Input — WB-FDVA" }] }),
  component: BuildingInputPage,
});

const FUNCTIONAL_CATEGORIES = {
  "Group A – Assembly": ["Theaters", "Cinemas", "Auditoriums", "Stadiums", "Restaurants", "Bars", "Churches", "Exhibition Halls"],
  "Group B – Business": ["Offices", "Banks", "Professional Services", "Clinics", "Research Labs"],
  "Group E – Educational": ["Schools", "Colleges", "Universities", "Daycare Centers"],
  "Group F – Factory / Industrial": ["Manufacturing Plants", "Workshops", "Food Processing Units", "Furniture Factories"],
  "Group H – Hazardous": ["Chemical Plants", "Flammable Liquid Storage", "Explosive Facilities", "Toxic Material Facilities"],
  "Group I – Institutional": ["Hospitals", "Nursing Homes", "Assisted Living", "Prisons", "Psychiatric Facilities"],
  "Group M – Mercantile": ["Shops", "Supermarkets", "Shopping Malls", "Retail Stores", "Wholesale Stores"],
  "Group R – Residential": ["Apartments", "Hotels", "Dormitories", "Lodging Houses", "Single Family Homes"],
  "Group S – Storage": ["Warehouses", "Aircraft Hangars", "Parking Garages", "Self Storage Units"],
  "Group U – Utility & Miscellaneous": ["Agricultural Buildings", "Barns", "Towers", "Garages", "Sheds", "Greenhouses"],
  "Additional Categories": ["Mixed Use", "Commercial", "Public Buildings", "Healthcare", "Religious", "Transportation", "Sports & Recreation", "Cultural", "Agricultural", "Data Centers", "Parking Structures"],
};

function BuildingInputPage() {
  const [activeTab, setActiveTab] = useState("basic");
  
  return (
    <AppShell title="Building Assessment Input" subtitle="Collect all building information required for fire vulnerability assessment.">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-2">
          <TabButton active={activeTab === "basic"} onClick={() => setActiveTab("basic")} icon={Building2} label="Basic Info" />
          <TabButton active={activeTab === "address"} onClick={() => setActiveTab("address")} icon={MapPin} label="Location & Address" />
          <TabButton active={activeTab === "cad"} onClick={() => setActiveTab("cad")} icon={Upload} label="CAD Drawing Upload" />
          <TabButton active={activeTab === "review"} onClick={() => setActiveTab("review")} icon={FileText} label="Review & Submit" />
        </nav>
        <div className="min-w-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {activeTab === "basic" && <BasicInfoForm onNext={() => setActiveTab("address")} />}
            {activeTab === "address" && <AddressForm onNext={() => setActiveTab("cad")} />}
            {activeTab === "cad" && <CADUploadForm onNext={() => setActiveTab("review")} />}
            {activeTab === "review" && <ReviewSection />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function BasicInfoForm({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">General details about the structure and ownership.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Building Name"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. Apollo Tower" /></Field>
        <Field label="Building ID"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="e.g. BLD-2024-001" /></Field>
        <Field label="Owner Name"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></Field>
        <Field label="Functional Category">
          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">Select category...</option>
            {Object.entries(FUNCTIONAL_CATEGORIES).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map(item => <option key={item} value={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Building Height (m)"><input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
        <Field label="Number of Floors"><input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
        <Field label="Total Built-up Area (sq.m)"><input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
        <Field label="Year of Construction"><input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
        <Field label="Contact Number"><input type="tel" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
        <Field label="Email"><input type="email" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={onNext} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next Step</button>
      </div>
    </div>
  );
}

function AddressForm({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-lg font-semibold">Address & Location</h2>
        <p className="text-sm text-muted-foreground">Geographical coordinates and physical address.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Address Line 1"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
          <Field label="Address Line 2"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
            <Field label="State"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Country"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
            <Field label="Pincode"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" /></Field>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-48 w-full rounded-md border border-border bg-secondary/50 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=13&size=600x300&maptype=roadmap')] bg-cover bg-center opacity-50 grayscale mix-blend-overlay"></div>
            <div className="z-10 flex flex-col items-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              <button className="rounded-md bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow-sm border border-border hover:bg-background">Search Location</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" readOnly placeholder="Auto-fill" /></Field>
            <Field label="Longitude"><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" readOnly placeholder="Auto-fill" /></Field>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button onClick={onNext} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next Step</button>
      </div>
    </div>
  );
}

function CADUploadForm({ onNext }: { onNext: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-lg font-semibold">CAD Drawing Upload</h2>
        <p className="text-sm text-muted-foreground">Upload DWG, DXF, PDF Floor Plans, PNG, or JPG files.</p>
      </div>
      
      <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-secondary/20">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-base mb-1">Drag and Drop files here</h3>
        <p className="text-sm text-muted-foreground mb-4">or click to browse your computer</p>
        <button className="rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium hover:bg-secondary/80">
          Select Files
        </button>
        <p className="text-xs text-muted-foreground mt-4">Supported formats: .dwg, .dxf, .pdf, .png, .jpg</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Uploaded Layouts</h4>
        <div className="rounded-md border border-border p-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-sm font-medium">ground_floor_plan.dwg</div>
              <div className="text-xs text-muted-foreground">1.2 MB • Ready for analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-risk-green bg-risk-green/10 px-2 py-1 rounded-full">Validated</span>
            <button className="text-xs text-risk-red hover:underline p-1">Delete</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button onClick={onNext} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Review Info</button>
      </div>
    </div>
  );
}

function ReviewSection() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="text-center py-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-risk-green/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-risk-green" />
        </div>
        <h2 className="text-xl font-bold">Ready to Submit</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          Please review the provided building information, location, and CAD drawings before submitting for vulnerability assessment.
        </p>
      </div>
      <div className="flex justify-center">
        <button className="rounded-md bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-md">
          Submit Assessment
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
