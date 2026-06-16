import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, MapPin, Building2, FileText, CheckCircle2, Search, ArrowUpDown, Download, FileSpreadsheet, HeartPulse, Bus, Church, Server, Dumbbell, Car, Landmark, Store, Wheat, Palette, Building } from "lucide-react";
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
};

const ADDITIONAL_CATEGORIES_DATA = [
  { category: "Mixed-Use", examples: "Buildings combining residential + commercial functions (e.g., ground-floor shops with upper-floor apartments)", icon: Building },
  { category: "Commercial", examples: "General term for Business + Mercantile occupancies", icon: Store },
  { category: "Public", examples: "Government buildings, libraries, museums, post offices", icon: Landmark },
  { category: "Healthcare", examples: "Specialized healthcare facilities and medical centers", icon: HeartPulse },
  { category: "Religious", examples: "Mosques, temples, churches, prayer halls", icon: Church },
  { category: "Transportation", examples: "Airports, railway stations, metro stations, bus terminals", icon: Bus },
  { category: "Sports & Recreation", examples: "Gymnasiums, swimming pools, sports complexes, stadiums", icon: Dumbbell },
  { category: "Cultural", examples: "Museums, art galleries, libraries, cultural centers", icon: Palette },
  { category: "Agricultural", examples: "Farms, silos, greenhouses, agricultural storage buildings", icon: Wheat },
  { category: "Data Centers", examples: "Server farms, cloud infrastructure facilities, IT operations centers", icon: Server },
  { category: "Parking Structures", examples: "Multi-level parking garages and parking facilities", icon: Car },
];

function BuildingInputPage() {
  const [activeTab, setActiveTab] = useState("basic");
  
  return (
    <AppShell title="Building Assessment Input" subtitle="Collect all building information required for fire vulnerability assessment.">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-2">
          <TabButton active={activeTab === "basic"} onClick={() => setActiveTab("basic")} icon={Building2} label="Basic Info" />
          <TabButton active={activeTab === "address"} onClick={() => setActiveTab("address")} icon={MapPin} label="Location & Address" />
          <TabButton active={activeTab === "cad"} onClick={() => setActiveTab("cad")} icon={Upload} label="Upload & Processing" />
          <TabButton active={activeTab === "review"} onClick={() => setActiveTab("review")} icon={FileText} label="Review & Submit" />
        </nav>
        <div className="min-w-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {activeTab === "basic" && <BasicInfoForm onNext={() => setActiveTab("address")} />}
            {activeTab === "address" && <AddressForm onNext={() => setActiveTab("cad")} />}
            {activeTab === "cad" && <UploadAndProcessingForm onNext={() => setActiveTab("review")} />}
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

      <AdditionalCategoriesTable />

      <div className="flex justify-end pt-4 border-t border-border mt-6">
        <button onClick={onNext} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next Step</button>
      </div>
    </div>
  );
}

function AdditionalCategoriesTable() {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredData = ADDITIONAL_CATEGORIES_DATA
    .filter(item => item.category.toLowerCase().includes(search.toLowerCase()) || item.examples.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortAsc ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category));

  const exportCsv = () => {
    const csvContent = "Category,Examples\n" + filteredData.map(row => `"${row.category}","${row.examples}"`).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "additional_categories.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPdf = () => {
    // Basic printable view for this table
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Additional Functional Categories</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f4f4f5; }
            </style>
          </head>
          <body>
            <h2>Additional Functional Categories</h2>
            <p>Often Used in Planning & Architecture</p>
            <table>
              <thead>
                <tr><th>Category</th><th>Examples</th></tr>
              </thead>
              <tbody>
                ${filteredData.map(row => `<tr><td>${row.category}</td><td>${row.examples}</td></tr>`).join('')}
              </tbody>
            </table>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="mt-10 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Additional Functional Categories <span className="text-sm font-normal text-muted-foreground">(Often Used in Planning & Architecture)</span></h3>
      </div>
      
      <div className="rounded-md border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
        These additional categories are commonly used in planning, architecture, occupancy classification, and fire vulnerability assessments.
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-border bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={exportCsv} className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-muted transition-colors">
              <FileSpreadsheet className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> Export Excel
            </button>
            <button onClick={exportPdf} className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-muted transition-colors">
              <Download className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /> Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold w-1/3">
                  <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1.5 hover:text-foreground transition-colors uppercase tracking-wider">
                    Category <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 font-semibold tracking-wider">Examples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length > 0 ? filteredData.map((row) => {
                const Icon = row.icon;
                return (
                  <tr key={row.category} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      {row.category}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground leading-relaxed">
                      {row.examples}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">No categories found matching "{search}"</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
      <div className="flex justify-end pt-4 border-t border-border mt-6">
        <button onClick={onNext} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next Step</button>
      </div>
    </div>
  );
}

function UploadAndProcessingForm({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Structural Details & Processing Form</h2>
          <p className="text-sm text-muted-foreground">Provide specific building structural elements and population data for processing.</p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Type of Building">
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">Select type...</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="mixed">Mixed Use</option>
              <option value="public">Public Facility</option>
            </select>
          </Field>
          <Field label="Number of People (per floor)">
            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" placeholder="Avg. occupancy" />
          </Field>
          <Field label="Number of Lifts">
            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" placeholder="Total lifts" />
          </Field>
          <Field label="Number of Staircases">
            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" placeholder="Total staircases" />
          </Field>
          <Field label="Number of Windows">
            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" placeholder="Total exterior windows" />
          </Field>
          <Field label="Adjacent Building Distance">
            <div className="flex items-center gap-2">
              <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" placeholder="Distance" />
              <span className="text-sm text-muted-foreground">meters</span>
            </div>
          </Field>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
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
      </div>

      <div className="flex justify-end pt-4 border-t border-border mt-6">
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
