"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { BrandArtwork } from "@/components/site/brand-artwork";
import { company } from "@/lib/public-content";
import type { CompanySnapshot } from "@/lib/business/company-settings";
import { Button, Field, download } from "./ui";

export function Settings({
  settings,
  apply,
}: {
  settings: CompanySnapshot;
  apply: (s: CompanySnapshot) => void;
}) {
  const [draft, setDraft] = useState(settings);
  return (
    <div className="a-settings-grid">
      <section className="a-panel">
        <header className="a-panel-header">
          <div>
            <p className="a-overline">COMPANY IDENTITY</p>
            <h2>Details that travel with your work</h2>
          </div>
          <Icon name="architecture" />
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply(structuredClone(draft));
          }}
        >
          <div className="a-form-grid">
            {(
              [
                ["name", "Official company name"],
                ["address", "Office address"],
                ["phone", "Phone"],
                ["email", "Contact email"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                wide={key === "name" || key === "address"}
              >
                <input
                  required
                  type={key === "email" ? "email" : "text"}
                  maxLength={1000}
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </Field>
            ))}
            <Field label="Document footer · optional" wide>
              <textarea
                rows={3}
                maxLength={2000}
                value={draft.documentFooter}
                onChange={(e) =>
                  setDraft({ ...draft, documentFooter: e.target.value })
                }
              />
            </Field>
            <div className="a-field a-wide">
              <span>Official letterhead logo</span>
              <div className="a-logo-preview">
                <BrandArtwork
                  variants={company.logos.header}
                  appearance="light"
                />
                <span>Official artwork · Managed uploads planned</span>
              </div>
            </div>
          </div>
          <div className="a-panel-bottom">
            <button className="a-button" type="submit">
              Apply to local previews
            </button>
            <Button
              secondary
              onClick={() =>
                download(
                  "aia-company-settings-review.json",
                  JSON.stringify(draft, null, 2),
                )
              }
            >
              Export review copy
            </Button>
          </div>
        </form>
      </section>
      <aside className="a-settings-notes">
        <span className="a-large-symbol">
          <Icon name="lock" />
        </span>
        <h2>
          A single source.
          <br />A reliable record.
        </h2>
        <p>
          The existing public contact details feed new quotation, letter, and
          email previews.
        </p>
        <p>
          Local edits affect only this tab. A persisted CMS revision will power
          public contact widgets, structured data, and new documents after
          database approval.
        </p>
        <p>
          Issued quotations retain their original company and financial
          snapshots when current settings change.
        </p>
        <div className="a-badge">CMS persistence planned</div>
        <p className="a-inline-note">
          Sender and reply-to identities, branch details, terms, social links,
          logo management, and numbering preferences are defined in the database
          proposal.
        </p>
        <p className="a-inline-note">Current trusted company: {company.name}</p>
      </aside>
    </div>
  );
}
