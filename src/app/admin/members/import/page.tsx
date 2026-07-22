"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ImportMembersPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/members/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Import failed");
        return;
      }

      setResult(data.data);
    } catch {
      alert("Something went wrong during import");
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const csv = `fullName,phone,whatsappNumber,email,ageGroup,gender,area
John Abraham,+919876543211,+919876543211,john@example.com,ADULT,MALE,Downtown
Mary Thomas,+919876543212,+919876543212,,FEMALE,Uptown
Samuel Raj,+919876543213,,sam@example.com,YOUTH,MALE,Suburbs`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "member-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Import Members</h1>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to add multiple members at once
        </p>
      </div>

      <div className="card space-y-4">
        <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-3xl block mb-2">📄</span>
          {file ? (
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="btn btn-secondary mt-3"
          >
            Choose File
          </button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">CSV Format Requirements:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Required columns: <code className="bg-background px-1 rounded">fullName</code> (or <code className="bg-background px-1 rounded">name</code>) and <code className="bg-background px-1 rounded">phone</code></li>
            <li>• Optional columns: whatsappNumber, email, ageGroup, gender, area</li>
            <li>• Phone numbers should include country code (e.g., +919876543210)</li>
            <li>• Duplicate phone numbers will be skipped</li>
            <li>• Maximum file size: 5MB</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="text-sm text-primary font-medium mt-2 hover:underline"
          >
            ↓ Download sample template
          </button>
        </div>

        {file && !result && (
          <button
            onClick={handleUpload}
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Importing...
              </>
            ) : (
              `Import Members from ${file.name}`
            )}
          </button>
        )}

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">{result.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <p className="text-2xl font-bold text-warning">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-3 bg-destructive/5 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-sm font-medium mb-1">Errors:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">{err}</p>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push("/admin/members")}
              className="btn btn-primary w-full"
            >
              View Members →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
