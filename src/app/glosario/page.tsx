"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArcadeHeader } from "@/components/arcade/ArcadeHeader";

interface GlossaryTerm {
  sigla: string;
  nombre: string;
  definicion: string;
  ejemplo: string;
  requisitoPci?: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    sigla: "PAN",
    nombre: "Primary Account Number (Card Number)",
    definicion: "The unique payment card number (typically 15 or 16 digits) embossed on a credit or debit card that identifies the issuer and the cardholder account.",
    ejemplo: "Must always be masked or truncated (e.g. 4111 **** **** 1111) on printed reports, logs, and agent screens.",
    requisitoPci: "PCI DSS Req. 3.4",
  },
  {
    sigla: "SAD",
    nombre: "Sensitive Authentication Data",
    definicion: "Security-related cardholder information including full magnetic stripe tracks, card verification codes (CVV/CVC), and PIN/PIN blocks.",
    ejemplo: "Strictly forbidden to retain or store anywhere after transaction authorization is completed.",
    requisitoPci: "PCI DSS Req. 3.2 & 3.3",
  },
  {
    sigla: "CVV / CVC",
    nombre: "Card Verification Value / Code",
    definicion: "A 3-digit (or 4-digit for Amex) numeric security code printed on the signature panel or front of the payment card used in card-not-present transactions.",
    ejemplo: "Never write CVV codes on sticky notes, desk pads, or save them in any chat or text file.",
    requisitoPci: "PCI DSS Req. 3.2.1",
  },
  {
    sigla: "CDE",
    nombre: "Cardholder Data Environment",
    definicion: "The people, processes, and technology (networks, servers, agent workstations) that store, process, or transmit cardholder data.",
    ejemplo: "Enforces Clean Desk policy, automatic screen lockouts (Win + L), and bans personal smartphones with cameras.",
    requisitoPci: "General Scope PCI DSS",
  },
  {
    sigla: "MFA",
    nombre: "Multi-Factor Authentication",
    definicion: "A security method that requires two or more distinct verification factors: something you know (password), something you have (token/device), or something you are (biometrics).",
    ejemplo: "Mandatory for all remote administrative access and connections into the Cardholder Data Environment.",
    requisitoPci: "PCI DSS Req. 8.4.2",
  },
  {
    sigla: "QSA",
    nombre: "Qualified Security Assessor",
    definicion: "A certified security professional qualified by the PCI Security Standards Council to perform formal audits and validate an organization's compliance.",
    ejemplo: "Represented by our arcade auditor mascot inspecting operations workstations for compliance.",
    requisitoPci: "External PCI SSC Audit",
  },
];

export default function GlossaryPage() {
  const [search, setSearch] = useState("");

  const filtered = GLOSSARY_TERMS.filter(
    (t) =>
      t.sigla.toLowerCase().includes(search.toLowerCase()) ||
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.definicion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-brand-bg text-white font-sans">
      <ArcadeHeader showBackToMenu />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-slide-up">
        <div className="icx-card rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-primary/15 text-brand-primary">
                SECURITY REFERENCE
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Security & PCI DSS Glossary
              </h1>
              <p className="text-xs sm:text-sm text-brand-muted">
                Key terms and concepts applicable across InTouchCX daily operations
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search term or acronym..."
                className="w-full h-11 px-3.5 rounded-xl bg-[#051B0B] border border-brand-primary/30 text-xs font-semibold focus:outline-none focus:border-brand-primary transition placeholder-brand-muted/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="icx-subcard rounded-2xl p-4 sm:p-5 space-y-2 border-brand-primary/25 hover:border-brand-primary transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xl font-black text-brand-primary tracking-wider">
                    {item.sigla}
                  </span>
                  {item.requisitoPci && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-primary/15 text-brand-primary font-bold">
                      {item.requisitoPci}
                    </span>
                  )}
                </div>

                <div className="text-xs font-extrabold text-white">
                  {item.nombre}
                </div>

                <p className="text-xs text-brand-muted leading-relaxed">
                  {item.definicion}
                </p>

                <div className="pt-2 border-t border-brand-primary/15 text-[11px] text-emerald-300">
                  <strong className="text-white">Day-to-day practice: </strong>
                  {item.ejemplo}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-brand-primary/15 flex justify-between items-center text-xs text-brand-muted">
            <Link href="/menu" className="hover:text-white transition">
              ← Return to Menu
            </Link>
            <span className="font-mono text-[10px]">
              Compliance Standard: PCI DSS v4.0.1
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
