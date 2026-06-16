import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, MapPin, Building2, FileText, CheckCircle2, Search, ArrowUpDown,
  Download, FileSpreadsheet, HeartPulse, Bus, Church, Server, Dumbbell,
  Car, Landmark, Store, Wheat, Palette, Building, X, Eye, RotateCcw,
  Save, Send, AlertCircle, Calendar, User, MessageSquare, Trash2,
  FileImage, FileArchive, Loader2
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { db, logActivity, type Building as BuildingRecord } from "@/lib/db";

export const Route = createFileRoute("/building-input")({
  head: () => ({ meta: [{ title: "Building Assessment Input — WB-FDVA" }] }),
  component: BuildingInputPage,
});

// ── Constants ──────────────────────────────────────────────────────────────────

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

const OCCUPANCY_TYPES = [
  "Business (B)", "Assembly (A-1 to A-5)", "Educational (E)", "Factory (F-1, F-2)",
  "High Hazard (H-1 to H-5)", "Institutional (I-1 to I-4)", "Mercantile (M)",
  "Residential (R-1 to R-4)", "Storage (S-1, S-2)", "Utility (U)",
];

const BUILDING_TYPES = [
  "Residential", "Commercial", "Industrial", "Mixed Use", "Public Facility",
  "Hotel", "Hospital", "Shopping Mall", "Office", "School", "University", "Data Center",
];

const CAD_CATEGORIES = ["Site Plan", "Building Plan", "Floor Plan", "Fire Safety Layout", "Exit Route Layout"];

const ACCEPTED_EXTENSIONS = [".dwg", ".dxf", ".pdf", ".png", ".jpg", ".jpeg"];

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

// ── Form State Types ───────────────────────────────────────────────────────────

interface UploadedFile {
  file: File;
  id: string;
  category: string;
  progress: number;
  status: "uploading" | "complete" | "error";
}

interface FormData {
  // Building Info
  buildingName: string;
  buildingId: string;
  ownerName: string;
  buildingType: string;
  functionalCategory: string;
  occupancyType: string;
  numberOfFloors: string;
  buildingHeight: string;
  builtUpArea: string;
  yearOfConstruction: string;
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  // Map
  latitude: string;
  longitude: string;
  // Structural
  peoplePerFloor: string;
  numberOfLifts: string;
  numberOfStaircases: string;
  numberOfWindows: string;
  adjacentBuildingDistance: string;
  // Assessment
  assessmentDate: string;
  assessorName: string;
  remarks: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  buildingName: "", buildingId: "", ownerName: "", buildingType: "", functionalCategory: "",
  occupancyType: "", numberOfFloors: "", buildingHeight: "", builtUpArea: "", yearOfConstruction: "",
  addressLine1: "", addressLine2: "", city: "", state: "", country: "", postalCode: "",
  latitude: "", longitude: "",
  peoplePerFloor: "", numberOfLifts: "", numberOfStaircases: "", numberOfWindows: "", adjacentBuildingDistance: "",
  assessmentDate: new Date().toISOString().slice(0, 10), assessorName: "", remarks: "",
};

// ── Main Page ──────────────────────────────────────────────────────────────────

function BuildingInputPage() {
  const [activeTab, setActiveTab] = useState("building");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const validate = (): boolean => {
    const e: ValidationErrors = {};
    if (!formData.buildingName.trim()) e.buildingName = "Building name is required";
    if (!formData.buildingType) e.buildingType = "Building type is required";
    if (!formData.numberOfFloors || Number(formData.numberOfFloors) < 1) e.numberOfFloors = "At least 1 floor required";
    if (!formData.builtUpArea) e.builtUpArea = "Built-up area is required";
    if (!formData.addressLine1.trim()) e.addressLine1 = "Address is required";
    if (!formData.city.trim()) e.city = "City is required";
    if (!formData.assessorName.trim()) e.assessorName = "Assessor name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildRecord = (status: "draft" | "submitted"): Omit<BuildingRecord, "id"> => ({
    name: formData.buildingName,
    buildingId: formData.buildingId || undefined,
    ownerName: formData.ownerName || undefined,
    type: formData.buildingType || "Office",
    functionalCategory: formData.functionalCategory || undefined,
    occupancyType: formData.occupancyType || undefined,
    floors: Number(formData.numberOfFloors) || 1,
    buildingHeight: Number(formData.buildingHeight) || undefined,
    totalArea: Number(formData.builtUpArea) || 0,
    yearOfConstruction: Number(formData.yearOfConstruction) || undefined,
    address: [formData.addressLine1, formData.addressLine2, formData.city, formData.state, formData.country, formData.postalCode].filter(Boolean).join(", "),
    addressLine1: formData.addressLine1 || undefined,
    addressLine2: formData.addressLine2 || undefined,
    city: formData.city || undefined,
    state: formData.state || undefined,
    country: formData.country || undefined,
    pincode: formData.postalCode || undefined,
    latitude: Number(formData.latitude) || undefined,
    longitude: Number(formData.longitude) || undefined,
    constructionType: "Standard",
    fireResistanceRating: "Not Rated",
    numberOfLifts: Number(formData.numberOfLifts) || undefined,
    numberOfStaircases: Number(formData.numberOfStaircases) || undefined,
    numberOfWindows: Number(formData.numberOfWindows) || undefined,
    adjacentBuildingDistance: Number(formData.adjacentBuildingDistance) || undefined,
    peoplePerFloor: Number(formData.peoplePerFloor) || undefined,
    assessmentDate: formData.assessmentDate || undefined,
    assessorName: formData.assessorName || undefined,
    remarks: formData.remarks || undefined,
    status,
    cadFiles: uploadedFiles.filter(f => f.status === "complete").map(f => f.file.name),
    cadFileCategories: Object.fromEntries(uploadedFiles.filter(f => f.status === "complete").map(f => [f.file.name, f.category])),
    createdAt: Date.now(),
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const record = buildRecord("draft");
      await db.buildings.add(record as BuildingRecord);
      await logActivity("building", `Draft saved: ${formData.buildingName || "Untitled"}`);
      showToast("✅ Draft saved successfully!");
    } catch {
      showToast("❌ Error saving draft");
    }
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast("⚠️ Please fix validation errors before submitting");
      return;
    }
    setSaving(true);
    try {
      const record = buildRecord("submitted");
      await db.buildings.add(record as BuildingRecord);
      await logActivity("building", `Assessment submitted: ${formData.buildingName}`);
      setSubmitSuccess(true);
      showToast("✅ Assessment submitted successfully!");
    } catch {
      showToast("❌ Error submitting assessment");
    }
    setSaving(false);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setUploadedFiles([]);
    setErrors({});
    setSubmitSuccess(false);
    setActiveTab("building");
    showToast("🔄 Form reset");
  };

  if (submitSuccess) {
    return (
      <AppShell title="Building Assessment Input" subtitle="Assessment submitted successfully.">
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="h-20 w-20 rounded-full bg-risk-green/20 flex items-center justify-center animate-in zoom-in">
            <CheckCircle2 className="h-10 w-10 text-risk-green" />
          </div>
          <h2 className="text-2xl font-bold">Assessment Submitted!</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Building <strong>{formData.buildingName}</strong> has been saved and is now available across all modules — Dashboard, Vulnerability Assessment, Commander View, and Reports.
          </p>
          <div className="flex gap-3">
            <button onClick={handleReset} className="rounded-md border border-border bg-secondary px-6 py-2.5 text-sm font-semibold hover:bg-secondary/80">New Assessment</button>
          </div>
        </div>
      </AppShell>
    );
  }

  const TABS = [
    { id: "building", label: "Building Info", icon: Building2 },
    { id: "address", label: "Address & Map", icon: MapPin },
    { id: "cad", label: "CAD Upload", icon: Upload },
    { id: "assessment", label: "Assessment", icon: Calendar },
    { id: "review", label: "Review & Submit", icon: FileText },
  ];

  return (
    <AppShell title="Building Assessment Input" subtitle="Collect all building information required for fire vulnerability assessment.">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-card border border-border shadow-xl px-4 py-3 text-sm font-medium animate-in slide-in-from-top-2 fade-in">
          {toastMessage}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && <PreviewModal formData={formData} files={uploadedFiles} onClose={() => setShowPreview(false)} />}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar Tabs */}
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((tab) => (
            <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} />
          ))}
        </nav>

        {/* Main Content */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {activeTab === "building" && (
              <BuildingInfoForm formData={formData} errors={errors} updateField={updateField} onNext={() => setActiveTab("address")} />
            )}
            {activeTab === "address" && (
              <AddressMapForm formData={formData} errors={errors} updateField={updateField} onNext={() => setActiveTab("cad")} />
            )}
            {activeTab === "cad" && (
              <CADUploadForm files={uploadedFiles} setFiles={setUploadedFiles} onNext={() => setActiveTab("assessment")} />
            )}
            {activeTab === "assessment" && (
              <AssessmentInfoForm formData={formData} errors={errors} updateField={updateField} onNext={() => setActiveTab("review")} />
            )}
            {activeTab === "review" && (
              <ReviewSection formData={formData} files={uploadedFiles} />
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <button onClick={handleSaveDraft} disabled={saving} className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary/80 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
            </button>
            <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
            </button>
            <button onClick={handleReset} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={() => setShowPreview(true)} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary ml-auto">
              <Eye className="h-4 w-4" /> Preview
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Tab Button ─────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}

// ── Section 1: Building Information ────────────────────────────────────────────

function BuildingInfoForm({ formData, errors, updateField, onNext }: { formData: FormData; errors: ValidationErrors; updateField: (f: keyof FormData, v: string) => void; onNext: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-lg font-semibold">Building Information</h2>
        <p className="text-sm text-muted-foreground">General details about the structure, ownership, and classification.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Building Name *" error={errors.buildingName}>
          <Input value={formData.buildingName} onChange={v => updateField("buildingName", v)} placeholder="e.g. Apollo Tower" error={!!errors.buildingName} />
        </Field>
        <Field label="Building ID">
          <Input value={formData.buildingId} onChange={v => updateField("buildingId", v)} placeholder="e.g. BLD-2024-001" />
        </Field>
        <Field label="Owner Name">
          <Input value={formData.ownerName} onChange={v => updateField("ownerName", v)} placeholder="Property owner" />
        </Field>
        <Field label="Building Type *" error={errors.buildingType}>
          <Select value={formData.buildingType} onChange={v => updateField("buildingType", v)} options={BUILDING_TYPES} placeholder="Select type..." error={!!errors.buildingType} />
        </Field>
        <Field label="Functional Category">
          <select value={formData.functionalCategory} onChange={e => updateField("functionalCategory", e.target.value)} className={selectClasses}>
            <option value="">Select category...</option>
            {Object.entries(FUNCTIONAL_CATEGORIES).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map(item => <option key={item} value={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Occupancy Type">
          <Select value={formData.occupancyType} onChange={v => updateField("occupancyType", v)} options={OCCUPANCY_TYPES} placeholder="Select occupancy..." />
        </Field>
        <Field label="Number of Floors *" error={errors.numberOfFloors}>
          <Input type="number" value={formData.numberOfFloors} onChange={v => updateField("numberOfFloors", v)} placeholder="e.g. 12" error={!!errors.numberOfFloors} />
        </Field>
        <Field label="Building Height (m)">
          <Input type="number" value={formData.buildingHeight} onChange={v => updateField("buildingHeight", v)} placeholder="Height in meters" />
        </Field>
        <Field label="Built-up Area (sq.m) *" error={errors.builtUpArea}>
          <Input type="number" value={formData.builtUpArea} onChange={v => updateField("builtUpArea", v)} placeholder="Total area" error={!!errors.builtUpArea} />
        </Field>
        <Field label="Year of Construction">
          <Input type="number" value={formData.yearOfConstruction} onChange={v => updateField("yearOfConstruction", v)} placeholder="e.g. 2015" />
        </Field>
      </div>

      {/* Structural Details Sub-section */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-base font-semibold mb-4">Structural Details</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="People per Floor">
            <Input type="number" value={formData.peoplePerFloor} onChange={v => updateField("peoplePerFloor", v)} placeholder="Avg. occupancy" />
          </Field>
          <Field label="Number of Lifts">
            <Input type="number" value={formData.numberOfLifts} onChange={v => updateField("numberOfLifts", v)} placeholder="Total lifts" />
          </Field>
          <Field label="Number of Staircases">
            <Input type="number" value={formData.numberOfStaircases} onChange={v => updateField("numberOfStaircases", v)} placeholder="Total staircases" />
          </Field>
          <Field label="Number of Windows">
            <Input type="number" value={formData.numberOfWindows} onChange={v => updateField("numberOfWindows", v)} placeholder="Total windows" />
          </Field>
          <Field label="Adjacent Building Distance (m)">
            <Input type="number" value={formData.adjacentBuildingDistance} onChange={v => updateField("adjacentBuildingDistance", v)} placeholder="Distance in meters" />
          </Field>
        </div>
      </div>

      <AdditionalCategoriesTable />

      <div className="flex justify-end pt-4 border-t border-border">
        <button onClick={onNext} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next: Address & Map →</button>
      </div>
    </div>
  );
}

// ── Section 2: Address & Google Map ────────────────────────────────────────────

function AddressMapForm({ formData, errors, updateField, onNext }: { formData: FormData; errors: ValidationErrors; updateField: (f: keyof FormData, v: string) => void; onNext: () => void }) {
  const [mapSearch, setMapSearch] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleSearchLocation = () => {
    // Simulate geocoding — in production, integrate with a geocoding API
    const lat = (20 + Math.random() * 10).toFixed(6);
    const lng = (72 + Math.random() * 10).toFixed(6);
    updateField("latitude", lat);
    updateField("longitude", lng);
    setMapLoaded(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-lg font-semibold">Address & Location</h2>
        <p className="text-sm text-muted-foreground">Physical address and geographical coordinates.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Address Fields */}
        <div className="space-y-4">
          <Field label="Address Line 1 *" error={errors.addressLine1}>
            <Input value={formData.addressLine1} onChange={v => updateField("addressLine1", v)} placeholder="Street address" error={!!errors.addressLine1} />
          </Field>
          <Field label="Address Line 2">
            <Input value={formData.addressLine2} onChange={v => updateField("addressLine2", v)} placeholder="Apartment, suite, etc." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City *" error={errors.city}>
              <Input value={formData.city} onChange={v => updateField("city", v)} placeholder="City" error={!!errors.city} />
            </Field>
            <Field label="State">
              <Input value={formData.state} onChange={v => updateField("state", v)} placeholder="State" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Country">
              <Input value={formData.country} onChange={v => updateField("country", v)} placeholder="Country" />
            </Field>
            <Field label="Postal Code">
              <Input value={formData.postalCode} onChange={v => updateField("postalCode", v)} placeholder="Pincode" />
            </Field>
          </div>
        </div>

        {/* Map Section */}
        <div className="space-y-4">
          <Field label="Search Location">
            <div className="flex gap-2">
              <Input value={mapSearch} onChange={setMapSearch} placeholder="Search for a place..." />
              <button onClick={handleSearchLocation} className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </Field>
          <div className="h-56 w-full rounded-lg border border-border bg-secondary/30 flex items-center justify-center relative overflow-hidden">
            {mapLoaded ? (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-10 w-10 text-primary mx-auto animate-bounce" />
                  <p className="text-sm font-medium">Location pinned</p>
                  <p className="text-xs text-muted-foreground">{formData.latitude}, {formData.longitude}</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-sm text-muted-foreground">Search a location or enter coordinates</p>
                <button onClick={handleSearchLocation} className="rounded-md bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow-sm border border-border hover:bg-background">
                  Place Marker
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude">
              <Input value={formData.latitude} onChange={v => updateField("latitude", v)} placeholder="Auto-fill" />
            </Field>
            <Field label="Longitude">
              <Input value={formData.longitude} onChange={v => updateField("longitude", v)} placeholder="Auto-fill" />
            </Field>
          </div>
          {formData.latitude && formData.longitude && (
            <button onClick={() => { updateField("latitude", ""); updateField("longitude", ""); setMapLoaded(false); }}
              className="text-xs text-risk-red hover:underline">
              Clear Coordinates
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-border">
        <button onClick={onNext} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next: CAD Upload →</button>
      </div>
    </div>
  );
}

// ── Section 3: CAD Drawing Upload ──────────────────────────────────────────────

function CADUploadForm({ files, setFiles, onNext }: { files: UploadedFile[]; setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>; onNext: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const simulateUpload = (file: File, category: string) => {
    const id = `${file.name}-${Date.now()}`;
    const newFile: UploadedFile = { file, id, category, progress: 0, status: "uploading" };
    setFiles(prev => [...prev, newFile]);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 100, status: "complete" } : f));
      } else {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: Math.min(progress, 99) } : f));
      }
    }, 300);
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(file => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (ACCEPTED_EXTENSIONS.includes(ext)) {
        simulateUpload(file, "Floor Plan");
      }
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateCategory = (id: string, category: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, category } : f));
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="h-8 w-8 text-red-500" />;
    if (ext === "png" || ext === "jpg" || ext === "jpeg") return <FileImage className="h-8 w-8 text-blue-500" />;
    return <FileArchive className="h-8 w-8 text-amber-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-lg font-semibold">CAD Drawing Upload</h2>
        <p className="text-sm text-muted-foreground">Upload building plans, floor layouts, fire safety diagrams, and exit route maps.</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 bg-secondary/20"
        }`}
      >
        <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-4 transition-colors ${dragOver ? "bg-primary/20" : "bg-primary/10"}`}>
          <Upload className={`h-7 w-7 ${dragOver ? "text-primary animate-bounce" : "text-primary"}`} />
        </div>
        <h3 className="font-semibold text-base mb-1">Drag & Drop files here</h3>
        <p className="text-sm text-muted-foreground mb-4">or click to browse your computer</p>
        <span className="rounded-md bg-secondary border border-border px-4 py-2 text-sm font-medium">Select Files</span>
        <p className="text-xs text-muted-foreground mt-4">Supported: .dwg, .dxf, .pdf, .png, .jpg — Multiple files allowed</p>
      </div>
      <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS.join(",")} className="hidden" onChange={e => handleFiles(e.target.files)} />

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            Uploaded Files <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{files.length}</span>
          </h4>
          <div className="space-y-2">
            {files.map(f => (
              <div key={f.id} className="rounded-lg border border-border p-4 bg-background">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(f.file.name)}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{f.file.name}</div>
                      <div className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <select value={f.category} onChange={e => updateCategory(f.id, e.target.value)}
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                      {CAD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {f.status === "complete" && (
                      <span className="text-xs font-medium text-risk-green bg-risk-green/10 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    )}
                    <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-risk-red p-1"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {f.status === "uploading" && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${f.progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(f.progress)}% uploaded</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-border">
        <button onClick={onNext} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next: Assessment →</button>
      </div>
    </div>
  );
}

// ── Section 4: Assessment Info ─────────────────────────────────────────────────

function AssessmentInfoForm({ formData, errors, updateField, onNext }: { formData: FormData; errors: ValidationErrors; updateField: (f: keyof FormData, v: string) => void; onNext: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Assessment Information</h2>
        <p className="text-sm text-muted-foreground">Details about the assessment being conducted.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assessment Date">
          <Input type="date" value={formData.assessmentDate} onChange={v => updateField("assessmentDate", v)} />
        </Field>
        <Field label="Assessor Name *" error={errors.assessorName}>
          <Input value={formData.assessorName} onChange={v => updateField("assessorName", v)} placeholder="Full name of assessor" error={!!errors.assessorName} />
        </Field>
      </div>
      <Field label="Remarks / Notes">
        <textarea
          value={formData.remarks}
          onChange={e => updateField("remarks", e.target.value)}
          placeholder="Add any additional notes, observations, or instructions..."
          rows={5}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </Field>
      <div className="flex justify-end pt-4 border-t border-border">
        <button onClick={onNext} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Next: Review →</button>
      </div>
    </div>
  );
}

// ── Section 5: Review ──────────────────────────────────────────────────────────

function ReviewSection({ formData, files }: { formData: FormData; files: UploadedFile[] }) {
  const sections = [
    {
      title: "Building Information", icon: Building2,
      items: [
        ["Building Name", formData.buildingName], ["Building ID", formData.buildingId], ["Owner", formData.ownerName],
        ["Type", formData.buildingType], ["Category", formData.functionalCategory], ["Occupancy", formData.occupancyType],
        ["Floors", formData.numberOfFloors], ["Height", formData.buildingHeight ? `${formData.buildingHeight} m` : ""],
        ["Area", formData.builtUpArea ? `${formData.builtUpArea} sq.m` : ""], ["Year Built", formData.yearOfConstruction],
        ["People/Floor", formData.peoplePerFloor], ["Lifts", formData.numberOfLifts], ["Staircases", formData.numberOfStaircases],
        ["Windows", formData.numberOfWindows], ["Adj. Distance", formData.adjacentBuildingDistance ? `${formData.adjacentBuildingDistance} m` : ""],
      ],
    },
    {
      title: "Address & Location", icon: MapPin,
      items: [
        ["Address", [formData.addressLine1, formData.addressLine2].filter(Boolean).join(", ")],
        ["City", formData.city], ["State", formData.state], ["Country", formData.country],
        ["Postal Code", formData.postalCode], ["Latitude", formData.latitude], ["Longitude", formData.longitude],
      ],
    },
    {
      title: "Assessment", icon: Calendar,
      items: [
        ["Date", formData.assessmentDate], ["Assessor", formData.assessorName], ["Remarks", formData.remarks],
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="text-center py-4">
        <h2 className="text-xl font-bold">Review Your Submission</h2>
        <p className="text-sm text-muted-foreground mt-1">Verify all information before submitting. Use the action buttons below to Save Draft, Submit, or Reset.</p>
      </div>

      {sections.map(section => {
        const Icon = section.icon;
        const filledItems = section.items.filter(([, v]) => v);
        if (filledItems.length === 0) return null;
        return (
          <div key={section.title} className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
              <Icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{section.title}</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {filledItems.map(([label, value]) => (
                <div key={label} className="px-4 py-3 bg-card">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium mt-0.5 break-words">{value}</dd>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* CAD Files */}
      {files.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
            <Upload className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">CAD Files ({files.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {files.map(f => (
              <div key={f.id} className="px-4 py-3 flex items-center justify-between bg-card">
                <span className="text-sm">{f.file.name}</span>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{f.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────

function PreviewModal({ formData, files, onClose }: { formData: FormData; files: UploadedFile[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur flex items-center justify-between px-6 py-4 border-b border-border z-10">
          <h2 className="text-lg font-bold">Assessment Preview</h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">
          <ReviewSection formData={formData} files={files} />
        </div>
      </div>
    </div>
  );
}

// ── Additional Categories Table ────────────────────────────────────────────────

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
            <script>window.print(); window.close();<\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Additional Functional Categories <span className="text-sm font-normal text-muted-foreground">(Often Used in Planning & Architecture)</span></h3>
      </div>
      
      <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
        These additional categories are commonly used in planning, architecture, occupancy classification, and fire vulnerability assessments.
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
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
                    <td className="px-6 py-4 text-muted-foreground leading-relaxed">{row.examples}</td>
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

// ── Reusable UI Components ─────────────────────────────────────────────────────

const inputClasses = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const selectClasses = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const errorInputClasses = "border-risk-red focus-visible:ring-risk-red";

function Input({ value, onChange, placeholder, type = "text", error }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClasses} ${error ? errorInputClasses : ""}`}
    />
  );
}

function Select({ value, onChange, options, placeholder, error }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; error?: boolean }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`${selectClasses} ${error ? errorInputClasses : ""}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-muted-foreground">{label}</span>
      {children}
      {error && (
        <span className="flex items-center gap-1 mt-1 text-xs text-risk-red">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </label>
  );
}
