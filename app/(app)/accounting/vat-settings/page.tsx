"use client";



import { useEffect, useState } from "react";

import PageHint from "@/components/PageHint";

import DatePicker from "@/components/ui/DatePicker";

import { PageShell, Button, Card, SectionTitle } from "@/components/ui";



export default function VatSettingsPage() {

  const [settings, setSettings] = useState({

    vatEnabled: false,

    vatRate: 15,

    vatBin: "",

    vatMethod: "inclusive",

  });

  const [saving, setSaving] = useState(false);



  useEffect(() => {

    fetch("/api/accounting/vat-settings").then((r) => r.json()).then(setSettings);

  }, []);



  async function save() {

    setSaving(true);

    await fetch("/api/accounting/vat-settings", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(settings),

    });

    setSaving(false);

  }



  return (

    <PageShell

      title="VAT Settings"

      subtitle="ভ্যাট সেটিংস"

      breadcrumbs={[{ label: "Accounting", href: "/accounting" }, { label: "VAT Settings" }]}

      className="max-w-lg"

    >

      <PageHint page="accounting" text="Bangladesh VAT (15%) settings for your shop." />

      <Card padding="lg" className="space-y-4">

        <label className="flex items-center gap-3">

          <input

            type="checkbox"

            checked={settings.vatEnabled}

            onChange={(e) => setSettings((s) => ({ ...s, vatEnabled: e.target.checked }))}

          />

          <span className="font-semibold">Enable VAT</span>

        </label>

        <div>

          <SectionTitle title="BIN Number" className="mb-2" />

          <input

            value={settings.vatBin ?? ""}

            onChange={(e) => setSettings((s) => ({ ...s, vatBin: e.target.value }))}

            className="w-full h-11 border rounded-xl px-3"

            style={{ borderColor: "var(--c-border)" }}

          />

        </div>

        <div>

          <SectionTitle title="VAT Rate (%)" className="mb-2" />

          <input

            type="number"

            value={settings.vatRate}

            onChange={(e) => setSettings((s) => ({ ...s, vatRate: parseFloat(e.target.value) || 15 }))}

            className="w-full h-11 border rounded-xl px-3"

            style={{ borderColor: "var(--c-border)" }}

          />

        </div>

        <div>

          <SectionTitle title="Calculation Method" className="mb-2" />

          <select

            value={settings.vatMethod}

            onChange={(e) => setSettings((s) => ({ ...s, vatMethod: e.target.value }))}

            className="w-full h-11 border rounded-xl px-3"

            style={{ borderColor: "var(--c-border)" }}

          >

            <option value="inclusive">Inclusive (মূল্যের মধ্যে)</option>

            <option value="exclusive">Exclusive (মূল্যের উপরে)</option>

          </select>

        </div>

        <Button onClick={save} loading={saving} className="w-full">

          {saving ? "Saving..." : "Save Settings"}

        </Button>

      </Card>

    </PageShell>

  );

}


