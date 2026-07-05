"use client";

import { ChangeEvent, FormEvent, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Download,
  FileDown,
  Mail,
  Printer,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "BROUILLON" | "A_SAISIR_OBOTO" | "SAISI_OBOTO" | "RESTITUE" | "TRANSFERE_PREFECTURE" | "TRANSFERE_POLICE" | "ARCHIVE";

type OtRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deposant: string;
  agentName: string;
  service: string;
  email: string;
  lieu: string;
  trainRef: string | null;
  trainOperator: string | null;
  trainNumber: string | null;
  destination: string | null;
  departureTime: string | null;
  platform: string | null;
  carNumber: string | null;
  seatNumber: string | null;
  foundDate: string;
  objectType: string;
  category: string;
  colorState: string;
  brand: string;
  description: string;
  items: OtItem[];
  documents: string[];
  documentName: string;
  hasMoney: boolean;
  moneyAmount: string;
  photos: string[];
  sigDeposant: string;
  sigRde: string;
  obotoNumber: string;
  status: Status;
  closingReason: string;
  audit: Array<{ at: string; action: string; user: string }>;
};

type OtItem = {
  name: string;
  color: string;
  brand: string;
  quantity: string;
  notes: string;
};

type PhotoAnalysis = {
  objectType?: string;
  category?: string;
  colorState?: string;
  brand?: string;
  description?: string;
  items?: OtItem[];
  documents?: string[];
  hasMoney?: boolean;
  moneyAmount?: string;
  documentName?: string;
  confidence?: string;
};

const statusLabels: Record<Status, string> = {
  BROUILLON: "Brouillon",
  A_SAISIR_OBOTO: "À saisir OBOTO",
  SAISI_OBOTO: "Saisi OBOTO",
  RESTITUE: "Restitué",
  TRANSFERE_PREFECTURE: "Transféré Préfecture",
  TRANSFERE_POLICE: "Transféré Police",
  ARCHIVE: "Archivé"
};

const presets = {
  deposants: ["SNCF", "Eurostar", "Police ferroviaire", "SUGE", "Client", "Agent conciergerie", "Autre"],
  services: ["SNCF", "Eurostar", "TER", "TGV", "Transilien", "Sécurité", "Nettoyage", "Conciergerie", "Autre"],
  lieux: ["Voie", "Train", "Salle d’attente", "Local PSH", "File taxi", "Boutique", "Quai", "Toilette", "Autre"],
  operators: ["OUIGO", "Eurostar", "TGV INOUI", "TER", "RER B", "RER D", "Transilien H", "Transilien K", "Thalys / Eurostar rouge", "Autre"],
  destinations: [
    "Lille Flandres",
    "Lille Europe",
    "Arras",
    "Amiens",
    "Beauvais",
    "Calais Ville",
    "Calais Fréthun",
    "Dunkerque",
    "Boulogne Ville",
    "Valenciennes",
    "Maubeuge",
    "Saint-Quentin",
    "Laon",
    "Compiègne",
    "Creil",
    "Chantilly - Gouvieux",
    "Persan - Beaumont",
    "Pontoise",
    "Luzarches",
    "Crépy-en-Valois",
    "Aéroport CDG",
    "Mitry - Claye",
    "Robinson",
    "Saint-Rémy-lès-Chevreuse",
    "Melun",
    "Malesherbes",
    "Orry-la-Ville",
    "Bruxelles-Midi",
    "Amsterdam Centraal",
    "Rotterdam Centraal",
    "London St Pancras",
    "Cologne",
    "Dortmund",
    "Autre"
  ],
  types: [
    "Lot / plusieurs objets",
    "Sac",
    "Sac à dos",
    "Sac à main",
    "Pochette",
    "Valise cabine",
    "Grande valise",
    "Bagage",
    "Portefeuille",
    "Porte-monnaie",
    "Téléphone",
    "Tablette",
    "Ordinateur",
    "Console de jeux",
    "Écouteurs / casque",
    "Chargeur / câble",
    "Appareil photo",
    "Montre / bijou",
    "Documents",
    "Carte bancaire",
    "Clés",
    "Argent",
    "Vêtement",
    "Manteau / veste",
    "Chaussures",
    "Lunettes",
    "Parapluie",
    "Doudou / jouet",
    "Produit beauté / trousse toilette",
    "Objet médical",
    "Objet dangereux / à isoler",
    "Autre"
  ],
  categories: [
    "Lot multi-objets",
    "Bagage",
    "Électronique",
    "Document",
    "Valeur",
    "Vêtement",
    "Accessoire",
    "Enfant / jouet",
    "Santé / médical",
    "Objet personnel",
    "Divers"
  ],
  states: ["Bon état", "Abîmé", "Ouvert", "Fermé", "Humide", "Fragile", "Dangereux", "À vérifier"],
  documents: ["CNI", "Passeport", "Titre de séjour", "Permis", "Carte bancaire", "Carte Vitale", "Billets", "Autre"]
};

const emptyForm = {
  deposant: "",
  agentName: "",
  service: "",
  email: "",
  lieu: "",
  lieuLibre: "",
  trainRef: "",
  trainOperator: "",
  trainNumber: "",
  destination: "",
  destinationOther: "",
  departureTime: "",
  platform: "",
  carNumber: "",
  seatNumber: "",
  foundDate: new Date().toISOString().slice(0, 10),
  objectType: "",
  category: "",
  colorState: "",
  brand: "",
  description: "",
  items: [] as OtItem[],
  documentName: "",
  hasMoney: false,
  moneyAmount: "",
  obotoNumber: "",
  status: "A_SAISIR_OBOTO" as Status,
  closingReason: "",
  documents: [] as string[]
};

function nextOtNumber(records: OtRecord[]) {
  const year = new Date().getFullYear();
  const max = records.reduce((highest, record) => {
    const match = record.id.match(new RegExp(`^OT-${year}-(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `OT-${year}-${String(max + 1).padStart(4, "0")}`;
}

function isCanvasBlank(canvas: HTMLCanvasElement | null) {
  if (!canvas) return true;
  return !canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data.some((value) => value !== 0);
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function readFile(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function emptyItem(): OtItem {
  return { name: "", color: "", brand: "", quantity: "1", notes: "" };
}

function itemSummary(item: OtItem) {
  return [item.quantity ? `x${item.quantity}` : "", item.name, item.color, item.brand, item.notes].filter(Boolean).join(" - ");
}

function SignaturePad({ id, canvasRef }: { id: string; canvasRef: RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineWidth = 3;
    context.lineCap = "round";
    context.strokeStyle = "#111827";
    let drawing = false;
    const position = (event: MouseEvent | TouchEvent) => {
      const box = canvas.getBoundingClientRect();
      const point = "touches" in event ? event.touches[0] : event;
      return { x: (point.clientX - box.left) * (canvas.width / box.width), y: (point.clientY - box.top) * (canvas.height / box.height) };
    };
    const start = (event: MouseEvent | TouchEvent) => {
      drawing = true;
      const point = position(event);
      context.beginPath();
      context.moveTo(point.x, point.y);
      event.preventDefault();
    };
    const move = (event: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      const point = position(event);
      context.lineTo(point.x, point.y);
      context.stroke();
      event.preventDefault();
    };
    const stop = () => {
      drawing = false;
    };
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", stop);
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", stop);
    };
  }, [canvasRef]);

  return <canvas id={id} ref={canvasRef} width={520} height={180} className="h-36 w-full rounded-md border bg-white" />;
}

export function OtControlApp() {
  const [records, setRecords] = useState<OtRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TOUS" | Status>("TOUS");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const deposantRef = useRef<HTMLCanvasElement>(null);
  const rdeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/ot-records")
      .then(async (response) => {
        if (!response.ok) throw new Error("Base de données indisponible.");
        return response.json() as Promise<OtRecord[]>;
      })
      .then((data) => {
        setRecords(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch(() => setMessage("Impossible de charger la base de données OT. Vérifiez DATABASE_URL puis lancez les migrations."))
      .finally(() => setLoading(false));
  }, []);

  const nextId = useMemo(() => nextOtNumber(records), [records]);
  const selected = records.find((record) => record.id === selectedId) ?? records[0] ?? null;

  const stats = useMemo(
    () => ({
      total: records.length,
      todo: records.filter((record) => record.status === "A_SAISIR_OBOTO").length,
      done: records.filter((record) => record.status === "SAISI_OBOTO").length,
      controlled: records.filter((record) => ["SAISI_OBOTO", "RESTITUE", "ARCHIVE"].includes(record.status)).length
    }),
    [records]
  );

  const filtered = records.filter((record) => {
    const matchesQuery = JSON.stringify(record).toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "TOUS" || record.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const setField = (field: keyof typeof form, value: string | boolean | string[] | OtItem[]) => setForm((current) => ({ ...current, [field]: value }));

  const setItems = (items: OtItem[]) => setForm((current) => ({ ...current, items }));

  const updateItem = (index: number, field: keyof OtItem, value: string) => {
    setItems(form.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems([...form.items, emptyItem()]);

  const removeItem = (index: number) => setItems(form.items.filter((_item, itemIndex) => itemIndex !== index));

  const resetForm = () => {
    setForm({ ...emptyForm, foundDate: new Date().toISOString().slice(0, 10) });
    setPhotos([]);
    deposantRef.current?.getContext("2d")?.clearRect(0, 0, deposantRef.current.width, deposantRef.current.height);
    rdeRef.current?.getContext("2d")?.clearRect(0, 0, rdeRef.current.width, rdeRef.current.height);
  };

  const onPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setPhotos(await Promise.all(files.map(readFile)));
  };

  const allowedValue = (value: string | undefined, allowed: string[]) => (value && allowed.includes(value) ? value : "");

  const analyzePhotos = async () => {
    setMessage("");
    if (!photos.length) return setMessage("Ajoutez une photo avant de lancer la reconnaissance.");
    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: photos.slice(0, 3),
          allowedTypes: presets.types,
          allowedCategories: presets.categories,
          allowedStates: presets.states,
          allowedDocuments: presets.documents
        })
      });
      const analysis = (await response.json()) as PhotoAnalysis & { error?: string };
      if (!response.ok) throw new Error(analysis.error ?? "Analyse impossible.");

      setForm((current) => ({
        ...current,
        objectType: allowedValue(analysis.objectType, presets.types) || current.objectType,
        category: allowedValue(analysis.category, presets.categories) || current.category,
        colorState: allowedValue(analysis.colorState, presets.states) || current.colorState,
        brand: analysis.brand || current.brand,
        description: analysis.description
          ? current.description
            ? `${current.description}\n\nProposition reconnaissance photo :\n${analysis.description}`
            : analysis.description
          : current.description,
        items: analysis.items?.length ? analysis.items.map((item) => ({ ...emptyItem(), ...item })) : current.items,
        documents: analysis.documents?.filter((document) => presets.documents.includes(document)) ?? current.documents,
        hasMoney: typeof analysis.hasMoney === "boolean" ? analysis.hasMoney : current.hasMoney,
        moneyAmount: analysis.moneyAmount || current.moneyAmount,
        documentName: analysis.documentName || current.documentName
      }));
      setMessage(`Reconnaissance terminée${analysis.confidence ? `, confiance ${analysis.confidence}` : ""}. Vérifiez et corrigez avant d’enregistrer.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analyse photo impossible.");
    } finally {
      setAnalyzing(false);
    }
  };

  const insertTemplate = () => {
    const template = [
      "Type d’objet :",
      "Couleur / marque :",
      "Lieu précis de trouvaille :",
      "Transporteur :",
      "Numéro train / RER / TER :",
      "Destination :",
      "Heure :",
      "Voie / quai :",
      "Voiture :",
      "Place :",
      "État de l’objet :",
      "Contenu visible :",
      "Documents présents :",
      "Nom visible :",
      "Somme d’argent :",
      "Particularités :"
    ].join("\n");
    setField("description", form.description ? `${form.description}\n\n${template}` : template);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!photos.length) return setMessage("Ajoutez au moins une photo de l’objet.");
    if (isCanvasBlank(deposantRef.current)) return setMessage("La signature du déposant est obligatoire, sauf refus justifié à noter dans la description.");
    if (isCanvasBlank(rdeRef.current)) return setMessage("La signature RDE est obligatoire.");
    if (form.hasMoney && !form.moneyAmount.trim()) return setMessage("Indiquez le montant et la devise de l’argent déclaré.");
    if (form.documents.length > 0 && !form.documentName.trim()) return setMessage("Indiquez le nom visible si un document est présent.");
    if (!form.obotoNumber && ["SAISI_OBOTO", "RESTITUE", "ARCHIVE"].includes(form.status) && !form.closingReason.trim()) {
      return setMessage("Ajoutez le numéro OBOTO ou un motif de non-saisie avant clôture.");
    }

    setSaving(true);
    const payload = {
      deposant: form.deposant,
      agentName: form.agentName,
      service: form.service,
      email: form.email,
      lieu: [form.lieu, form.lieuLibre].filter(Boolean).join(" - "),
      trainRef: form.trainRef,
      trainOperator: form.trainOperator,
      trainNumber: form.trainNumber,
      destination: form.destination === "Autre" ? form.destinationOther : form.destination,
      departureTime: form.departureTime,
      platform: form.platform,
      carNumber: form.carNumber,
      seatNumber: form.seatNumber,
      foundDate: form.foundDate,
      objectType: form.objectType,
      category: form.category,
      colorState: form.colorState,
      brand: form.brand,
      description: form.description,
      items: form.items.filter((item) => item.name.trim() || item.notes.trim()),
      documents: form.documents,
      documentName: form.documentName,
      hasMoney: form.hasMoney,
      moneyAmount: form.moneyAmount,
      photos,
      sigDeposant: deposantRef.current?.toDataURL() ?? "",
      sigRde: rdeRef.current?.toDataURL() ?? "",
      obotoNumber: form.obotoNumber,
      status: form.status,
      closingReason: form.closingReason
    };
    try {
      const response = await fetch("/api/ot-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Enregistrement impossible.");
      const record = data as OtRecord;
      setRecords((current) => [record, ...current]);
      setSelectedId(record.id);
      resetForm();
      setMessage(`Fiche ${record.id} créée en base de données.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const patchRecord = async (id: string, body: Record<string, string>) => {
    const response = await fetch(`/api/ot-records/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Modification impossible.");
    const updated = data as OtRecord;
    setRecords((current) => current.map((record) => (record.id === id ? updated : record)));
    return updated;
  };

  const updateStatus = async (id: string, status: Status) => {
    setMessage("");
    try {
      await patchRecord(id, { status, auditAction: `Statut changé : ${statusLabels[status]}` });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Modification impossible.");
    }
  };

  const printRecord = async (record: OtRecord) => {
    setSelectedId(record.id);
    try {
      await patchRecord(record.id, { auditAction: "Impression A4" });
    } catch {
      setMessage("La fiche est imprimable, mais l’action d’impression n’a pas pu être historisée.");
    }
    setTimeout(() => window.print(), 50);
  };

  const mailRecord = async (record: OtRecord) => {
    try {
      await patchRecord(record.id, { auditAction: "Préparation e-mail" });
    } catch {
      setMessage("Le mail va s’ouvrir, mais l’action e-mail n’a pas pu être historisée.");
    }
    const subject = `Objet trouvé - ${record.id}`;
    const trainLine = [record.trainOperator, record.trainNumber, record.destination, record.departureTime].filter(Boolean).join(" - ");
    const itemsText = record.items?.length ? record.items.map((item, index) => `${index + 1}. ${itemSummary(item)}`).join("\n") : "Non détaillés";
    const body = `Bonjour,\n\nFiche OT : ${record.id}\nDate : ${new Date(record.createdAt).toLocaleString("fr-FR")}\nLieu : ${record.lieu}\nTrain : ${trainLine || "non renseigné"}\nVoie/quai : ${record.platform || "non renseigné"}\nVoiture : ${record.carNumber || "non renseignée"}\nPlace : ${record.seatNumber || "non renseignée"}\nDéposant : ${record.agentName} (${record.service})\nStatut : ${statusLabels[record.status]}\nOBOTO : ${record.obotoNumber || "à compléter"}\n\nObjets dans la souche :\n${itemsText}\n\nDescription :\n${record.description}\n\nCordialement,`;
    window.location.href = `mailto:${encodeURIComponent(record.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const exportCsv = () => {
    const rows = [
      [
        "Numero",
        "Creation",
        "Deposant",
        "Service",
        "Lieu",
        "Transporteur",
        "Numero train",
        "Destination",
        "Heure",
        "Voie quai",
        "Voiture",
        "Place",
        "Reference libre",
        "Objets meme souche",
        "Type",
        "Statut",
        "OBOTO",
        "Description"
      ],
      ...records.map((record) => [
        record.id,
        new Date(record.createdAt).toLocaleString("fr-FR"),
        record.agentName,
        record.service,
        record.lieu,
        record.trainOperator,
        record.trainNumber,
        record.destination,
        record.departureTime,
        record.platform,
        record.carNumber,
        record.seatNumber,
        record.trainRef,
        record.items?.map(itemSummary).join(" | "),
        record.objectType,
        statusLabels[record.status],
        record.obotoNumber,
        record.description
      ])
    ];
    const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    download(blob, `export-ot-control-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportJson = () => {
    download(new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }), `sauvegarde-ot-control-${Date.now()}.json`);
  };

  const download = (blob: Blob, fileName: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const deleteRecord = (id: string) => {
    if (!window.confirm("Supprimer cette fiche OT ?")) return;
    fetch(`/api/ot-records/${encodeURIComponent(id)}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) throw new Error("Suppression impossible.");
        setRecords((current) => current.filter((record) => record.id !== id));
        if (selectedId === id) setSelectedId(null);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Suppression impossible."));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">N&apos;ASSIST OT Control</p>
          <h1 className="text-2xl font-semibold tracking-normal">Traçabilité des objets trouvés</h1>
        <p className="text-sm text-muted-foreground">Création de fiches OT, photos, signatures, statuts OBOTO, impression A4, exports et historique en base de données.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportCsv}>
            <FileDown className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button type="button" variant="outline" onClick={exportJson}>
            <Download className="mr-2 h-4 w-4" /> Sauvegarde
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Fiches" value={stats.total} />
        <Metric label="À saisir OBOTO" value={stats.todo} tone="warning" />
        <Metric label="Saisies OBOTO" value={stats.done} tone="success" />
        <Metric label="Contrôlées" value={stats.controlled} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouvel objet trouvé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {message ? <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</div> : null}
              {loading ? <div className="rounded-md border bg-secondary px-4 py-3 text-sm text-muted-foreground">Chargement de l’historique depuis la base de données...</div> : null}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-md border bg-secondary px-4 py-3">
                  <p className="text-xs text-muted-foreground">Numéro automatique</p>
                  <p className="text-lg font-bold">{nextId}</p>
                </div>
                <Field label="Date de trouvaille" id="foundDate">
                  <Input id="foundDate" type="date" value={form.foundDate} onChange={(event) => setField("foundDate", event.target.value)} required />
                </Field>
                <Select label="Déposant" value={form.deposant} values={presets.deposants} onChange={(value) => setField("deposant", value)} required />
                <Select label="Service / entreprise" value={form.service} values={presets.services} onChange={(value) => setField("service", value)} required />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Nom et prénom agent" id="agentName">
                  <Input id="agentName" value={form.agentName} onChange={(event) => setField("agentName", event.target.value)} required />
                </Field>
                <Field label="Adresse mail destinataire" id="email">
                  <Input id="email" type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} placeholder="objets.trouves@..." />
                </Field>
                <Field label="Référence libre" id="trainRef">
                  <Input id="trainRef" value={form.trainRef} onChange={(event) => setField("trainRef", event.target.value)} placeholder="Info donnée par l’agent" />
                </Field>
              </div>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Train / destination</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Select label="Transporteur" value={form.trainOperator} values={presets.operators} onChange={(value) => setField("trainOperator", value)} />
                    <Field label="Numéro train / RER / TER" id="trainNumber">
                      <Input
                        id="trainNumber"
                        value={form.trainNumber}
                        onChange={(event) => setField("trainNumber", event.target.value.toUpperCase())}
                        placeholder="Ex : 7512, ES9044, B, D"
                      />
                    </Field>
                    <Select label="Destination" value={form.destination} values={presets.destinations} onChange={(value) => setField("destination", value)} />
                    <Field label="Heure" id="departureTime">
                      <Input id="departureTime" type="time" value={form.departureTime} onChange={(event) => setField("departureTime", event.target.value)} />
                    </Field>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Field label="Voie / quai" id="platform">
                      <Input id="platform" value={form.platform} onChange={(event) => setField("platform", event.target.value.toUpperCase())} placeholder="Ex : voie 8, quai 44" />
                    </Field>
                    <Field label="Voiture" id="carNumber">
                      <Input id="carNumber" value={form.carNumber} onChange={(event) => setField("carNumber", event.target.value.toUpperCase())} placeholder="Ex : 12" />
                    </Field>
                    <Field label="Place" id="seatNumber">
                      <Input id="seatNumber" value={form.seatNumber} onChange={(event) => setField("seatNumber", event.target.value.toUpperCase())} placeholder="Ex : 45A" />
                    </Field>
                    <Field label="Destination autre" id="destinationOther">
                      <Input
                        id="destinationOther"
                        value={form.destinationOther}
                        onChange={(event) => setField("destinationOther", event.target.value)}
                        disabled={form.destination !== "Autre"}
                        placeholder="Si destination absente"
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-4">
                <Select label="Lieu" value={form.lieu} values={presets.lieux} onChange={(value) => setField("lieu", value)} required />
                <Field label="Lieu libre" id="lieuLibre">
                  <Input id="lieuLibre" value={form.lieuLibre} onChange={(event) => setField("lieuLibre", event.target.value)} placeholder="Précision utile" />
                </Field>
                <Select label="Type d’objet" value={form.objectType} values={presets.types} onChange={(value) => setField("objectType", value)} required />
                <Select label="Catégorie" value={form.category} values={presets.categories} onChange={(value) => setField("category", value)} required />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Select label="Couleur / état" value={form.colorState} values={presets.states} onChange={(value) => setField("colorState", value)} required />
                <Field label="Marque" id="brand">
                  <Input id="brand" value={form.brand} onChange={(event) => setField("brand", event.target.value)} />
                </Field>
                <Select label="Statut" value={form.status} values={Object.keys(statusLabels)} labels={statusLabels} onChange={(value) => setField("status", value as Status)} required />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="description">Description détaillée</Label>
                  <Button type="button" variant="outline" size="sm" onClick={insertTemplate}>
                    Modèle de description
                  </Button>
                </div>
                <textarea
                  id="description"
                  className="min-h-64 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6"
                  maxLength={6000}
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">{form.description.length}/6000 caractères</p>
              </div>

              <Card className="shadow-none">
                <CardHeader>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <CardTitle className="text-base">Objets dans la même souche</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" /> Ajouter un objet
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {form.items.length === 0 ? (
                    <div className="rounded-md border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                      Exemple : Switch, manette, chargeur, sac rouge, écouteurs, manteau. Tout restera dans la même fiche OT.
                    </div>
                  ) : null}
                  {form.items.map((item, index) => (
                    <div key={index} className="rounded-md border p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Objet {index + 1}</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Retirer
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[90px_1fr_1fr_1fr]">
                        <Field label="Qté" id={`itemQuantity-${index}`}>
                          <Input id={`itemQuantity-${index}`} value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                        </Field>
                        <Field label="Objet" id={`itemName-${index}`}>
                          <Input id={`itemName-${index}`} value={item.name} onChange={(event) => updateItem(index, "name", event.target.value)} placeholder="Ex : Nintendo Switch" />
                        </Field>
                        <Field label="Couleur" id={`itemColor-${index}`}>
                          <Input id={`itemColor-${index}`} value={item.color} onChange={(event) => updateItem(index, "color", event.target.value)} placeholder="Ex : rouge, noir" />
                        </Field>
                        <Field label="Marque" id={`itemBrand-${index}`}>
                          <Input id={`itemBrand-${index}`} value={item.brand} onChange={(event) => updateItem(index, "brand", event.target.value)} placeholder="Ex : Nintendo, Apple" />
                        </Field>
                      </div>
                      <div className="mt-3">
                        <Field label="Détail / état / contenu" id={`itemNotes-${index}`}>
                          <Input
                            id={`itemNotes-${index}`}
                            value={item.notes}
                            onChange={(event) => updateItem(index, "notes", event.target.value)}
                            placeholder="Ex : avec chargeur, manette, housse, écouteurs, manteau plié"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Documents et argent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {presets.documents.map((document) => (
                        <label key={document} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.documents.includes(document)}
                            onChange={(event) =>
                              setField(
                                "documents",
                                event.target.checked ? [...form.documents, document] : form.documents.filter((item) => item !== document)
                              )
                            }
                          />
                          {document}
                        </label>
                      ))}
                    </div>
                    <Field label="Nom figurant sur document" id="documentName">
                      <Input id="documentName" value={form.documentName} onChange={(event) => setField("documentName", event.target.value)} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={form.hasMoney} onChange={(event) => setField("hasMoney", event.target.checked)} />
                      Argent trouvé
                    </label>
                    <Field label="Montant + devise" id="moneyAmount">
                      <Input id="moneyAmount" value={form.moneyAmount} onChange={(event) => setField("moneyAmount", event.target.value)} placeholder="Ex : 100 USD + 20 EUR" />
                    </Field>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Preuves</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Field label="Photos obligatoires" id="photos">
                      <Input id="photos" type="file" accept="image/*" capture="environment" multiple onChange={onPhotoChange} />
                    </Field>
                    <Button type="button" variant="outline" onClick={analyzePhotos} disabled={analyzing || photos.length === 0} className="w-full">
                      <Sparkles className="mr-2 h-4 w-4" /> {analyzing ? "Analyse en cours..." : "Analyser la photo"}
                    </Button>
                    <div className="grid grid-cols-4 gap-2">
                      {photos.map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={photo} src={photo} alt="Aperçu objet" className="h-20 w-full rounded-md border object-cover" />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-secondary p-3 text-sm text-muted-foreground">
                      <Camera className="h-4 w-4" /> Minimum une photo de l’objet, et une photo du contenu si ouvert.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Signature déposant" id="sigDeposant">
                  <SignaturePad id="sigDeposant" canvasRef={deposantRef} />
                </Field>
                <Field label="Signature RDE" id="sigRde">
                  <SignaturePad id="sigRde" canvasRef={rdeRef} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <Field label="Numéro OBOTO" id="obotoNumber">
                  <Input id="obotoNumber" value={form.obotoNumber} onChange={(event) => setField("obotoNumber", event.target.value)} />
                </Field>
                <Field label="Motif de non-saisie / clôture" id="closingReason">
                  <Input id="closingReason" value={form.closingReason} onChange={(event) => setField("closingReason", event.target.value)} />
                </Field>
                <div className="flex items-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Effacer
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" /> {saving ? "Enregistrement..." : "Créer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Date, numéro, nom, statut, train..." />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "TOUS" | Status)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="TOUS">Tous les statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
                {filtered.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setSelectedId(record.id)}
                    className="w-full rounded-md border bg-card p-3 text-left text-sm hover:bg-secondary"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{record.id}</span>
                      <StatusPill status={record.status} />
                    </div>
                    <p className="mt-2 text-muted-foreground">{new Date(record.createdAt).toLocaleString("fr-FR")}</p>
                    <p className="font-medium">{record.objectType || "Objet"} - {record.lieu}</p>
                    <p className="text-muted-foreground">
                      {[record.trainOperator, record.trainNumber, record.destination].filter(Boolean).join(" - ") || "Train non renseigné"}
                    </p>
                    <p className="line-clamp-2 text-muted-foreground">{record.description}</p>
                  </button>
                ))}
                {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Aucune fiche trouvée.</p> : null}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {selected ? (
        <Card className="ot-print-area">
          <CardHeader>
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <CardTitle>Fiche détail {selected.id}</CardTitle>
              <div className="flex flex-wrap gap-2 ot-no-print">
                <Button type="button" variant="outline" onClick={() => mailRecord(selected)}>
                  <Mail className="mr-2 h-4 w-4" /> Mail
                </Button>
                <Button type="button" variant="outline" onClick={() => printRecord(selected)}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimer / PDF
                </Button>
                <Button type="button" variant="outline" onClick={() => updateStatus(selected.id, "SAISI_OBOTO")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> OBOTO OK
                </Button>
                <Button type="button" variant="outline" onClick={() => updateStatus(selected.id, "ARCHIVE")}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Archiver
                </Button>
                <Button type="button" variant="destructive" onClick={() => deleteRecord(selected.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <PrintableRecord record={selected} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "warning" | "success" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={tone === "warning" ? "text-3xl font-semibold text-amber-700" : tone === "success" ? "text-3xl font-semibold text-emerald-700" : "text-3xl font-semibold"}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Select({
  label,
  value,
  values,
  labels,
  onChange,
  required
}: {
  label: string;
  value: string;
  values: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <Field label={label} id={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        <option value="">Choisir</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {labels?.[item] ?? item}
          </option>
        ))}
      </select>
    </Field>
  );
}

function StatusPill({ status }: { status: Status }) {
  const className =
    status === "A_SAISIR_OBOTO"
      ? "bg-amber-100 text-amber-800"
      : status === "SAISI_OBOTO" || status === "RESTITUE"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-secondary text-muted-foreground";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{statusLabels[status]}</span>;
}

function PrintableRecord({ record }: { record: OtRecord }) {
  const infos = [
    ["Créée le", new Date(record.createdAt).toLocaleString("fr-FR")],
    ["Date de trouvaille", new Date(record.foundDate).toLocaleDateString("fr-FR")],
    ["Déposant", `${record.agentName} (${record.deposant})`],
    ["Service", record.service],
    ["Lieu", record.lieu],
    ["Transporteur", record.trainOperator || "Non renseigné"],
    ["Numéro train / RER / TER", record.trainNumber || "Non renseigné"],
    ["Destination", record.destination || "Non renseignée"],
    ["Heure", record.departureTime || "Non renseignée"],
    ["Voie / quai", record.platform || "Non renseigné"],
    ["Voiture", record.carNumber || "Non renseignée"],
    ["Place", record.seatNumber || "Non renseignée"],
    ["Référence libre", record.trainRef || "Non renseignée"],
    ["Type", record.objectType],
    ["Catégorie", record.category],
    ["État", record.colorState],
    ["Marque", record.brand || "Non renseignée"],
    ["Statut", statusLabels[record.status]],
    ["Numéro OBOTO", record.obotoNumber || "À compléter"]
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center border-2 border-foreground text-3xl font-black">N</div>
          <div>
            <h2 className="text-xl font-bold">N&apos;ASSIST OT CONTROL</h2>
            <p className="text-sm text-muted-foreground">Fiche objet trouvé - Gare du Nord</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{record.id}</p>
          <StatusPill status={record.status} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {infos.map(([label, value]) => (
          <div key={label} className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-md border p-4">
        <h3 className="font-semibold">Description détaillée</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{record.description}</p>
      </section>
      <section className="rounded-md border p-4">
        <h3 className="font-semibold">Objets dans la même souche</h3>
        {record.items?.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2">Qté</th>
                  <th>Objet</th>
                  <th>Couleur</th>
                  <th>Marque</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {record.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`} className="border-b">
                    <td className="py-2">{item.quantity || "1"}</td>
                    <td>{item.name || "Non renseigné"}</td>
                    <td>{item.color || "Non renseignée"}</td>
                    <td>{item.brand || "Non renseignée"}</td>
                    <td>{item.notes || "Néant"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Aucun objet détaillé séparément.</p>
        )}
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-md border p-4">
          <h3 className="font-semibold">Documents / argent</h3>
          <p className="mt-2 text-sm">Documents : {record.documents.length ? record.documents.join(", ") : "Aucun renseigné"}</p>
          <p className="text-sm">Nom visible : {record.documentName || "Non renseigné"}</p>
          <p className="text-sm">Argent : {record.hasMoney ? record.moneyAmount : "Non"}</p>
          <p className="text-sm">Motif / clôture : {record.closingReason || "Néant"}</p>
        </section>
        <section className="rounded-md border p-4">
          <h3 className="font-semibold">Journal d’audit</h3>
          <div className="mt-2 space-y-2 text-sm">
            {record.audit.slice(0, 6).map((entry) => (
              <p key={`${entry.at}-${entry.action}`}>
                {new Date(entry.at).toLocaleString("fr-FR")} - {entry.action}
              </p>
            ))}
          </div>
        </section>
      </div>
      <section>
        <h3 className="font-semibold">Photos</h3>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          {record.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo} src={photo} alt="Objet trouvé" className="h-40 w-full rounded-md border object-cover" />
          ))}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-4">
          <h3 className="font-semibold">Signature déposant</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={record.sigDeposant} alt="Signature déposant" className="mt-2 h-28 max-w-full object-contain" />
        </div>
        <div className="rounded-md border p-4">
          <h3 className="font-semibold">Signature RDE</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={record.sigRde} alt="Signature RDE" className="mt-2 h-28 max-w-full object-contain" />
        </div>
      </section>
    </div>
  );
}
