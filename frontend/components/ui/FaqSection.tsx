"use client";

import { useState } from "react";
import { FAQ_DATA, FaqAudience } from "@/data/faqData";

export function FaqSection() {
  const [activeTab, setActiveTab] = useState<FaqAudience>("owners");
  const [openId, setOpenId] = useState<string | null>(
    FAQ_DATA.owners.items[0]?.id ?? null
  );

  const currentGroup = FAQ_DATA[activeTab];
  const isClinical = activeTab === "vets";

  const handleTabChange = (audience: FaqAudience) => {
    setActiveTab(audience);
    setOpenId(FAQ_DATA[audience].items[0]?.id ?? null);
  };

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-labelledby="faq-heading"
      className={`mx-auto w-full max-w-4xl px-4 py-12 transition-colors ${
        isClinical ? "theme-clinical" : ""
      }`}
    >
      <div className="mb-8 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {isClinical ? "Portal Veterinario y Diagnóstico" : "Centro de Ayuda"}
        </span>

        <h2
          id="faq-heading"
          className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Preguntas Frecuentes
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {currentGroup.subtitle}
        </p>

        {/* Selector de audiencia */}
        <div
          role="tablist"
          aria-label="Seleccionar tipo de usuario"
          className="mt-6 inline-flex rounded-xl border border-border bg-muted p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "owners"}
            onClick={() => handleTabChange("owners")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "owners"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Para Dueños
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "vets"}
            onClick={() => handleTabChange("vets")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "vets"
                ? "bg-card text-primary shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Para Veterinarias y Centros
          </button>
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
        {currentGroup.items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="p-4 sm:p-5">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleItem(item.id)}
                className="group flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                    isOpen
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/50 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                  }`}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}