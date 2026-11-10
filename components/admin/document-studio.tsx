"use client";

import { useLocalDraft } from "./local-drafts";
import { Icon } from "@/components/ui/icon";
import type { CompanySnapshot } from "@/lib/business/company-settings";
import { renderLetter, type LetterDraft } from "@/lib/business/documents";
import { renderVariables } from "@/lib/business/contracts";
import { Button, Field, DocumentPreview, download } from "./ui";

export function DocumentStudio({
  company,
  locale,
  fontCss,
  notify,
}: {
  company: CompanySnapshot;
  locale: "en" | "bn";
  fontCss: string;
  notify: (s: string) => void;
}) {
  const [draft, setDraft] = useLocalDraft<LetterDraft>("letter:draft", {
    recipient: "",
    designation: "",
    organization: "",
    address: "",
    subject: "",
    body: "",
    date: "",
    sender: "",
    senderDesignation: "",
  });
  const [template, setTemplate] = useLocalDraft("letter:template", "custom"),
    [templateBody, setTemplateBody] = useLocalDraft(
      "letter:templateBody",
      "{{company_name}}\n{{document_date}}\n\n{{client_name}}\n\n",
    );
  const [localDrafts, setLocalDrafts] = useLocalDraft<LetterDraft[]>(
    "letter:localDrafts",
    [],
  );
  const templateValues = {
    company_name: company.name,
    company_address: company.address,
    client_name: draft.recipient,
    document_date: draft.date,
    sender_name: draft.sender,
  };
  const fieldNames: Record<string, string> = {
    company_name: "Company name in Settings",
    company_address: "Company address in Settings",
    client_name: "Recipient name",
    document_date: "Document date",
    sender_name: "Sender name",
  };
  const required = [
    ...new Set(
      [...templateBody.matchAll(/\{\{([^{}]*)\}\}/g)].map((m) => m[1].trim()),
    ),
  ];
  const missing = required.filter(
    (name) =>
      !Object.hasOwn(templateValues, name) ||
      !templateValues[name as keyof typeof templateValues].trim(),
  );
  let previewHtml = "",
    previewError = "";
  try {
    previewHtml = renderLetter(draft, company, locale, fontCss);
  } catch (e) {
    previewError = (e as Error).message;
  }
  function update(key: keyof LetterDraft, value: string) {
    setDraft({ ...draft, [key]: value });
  }
  return (
    <div className="a-editor-grid">
      <div className="a-editor-fields">
        <section className="a-panel">
          <header className="a-panel-header">
            <div>
              <p className="a-overline">LETTERHEAD STUDIO</p>
              <h2>Start with the right words</h2>
            </div>
            <Icon name="file" />
          </header>
          <div className="a-form-grid">
            <Field label="Document type" wide>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                <option value="custom">Custom correspondence</option>
                <option value="application">Formal application</option>
                <option value="cover">Quotation cover letter</option>
                <option value="proposal">Service proposal</option>
              </select>
            </Field>
            {(
              [
                ["recipient", "Recipient name"],
                ["designation", "Recipient designation"],
                ["organization", "Organization"],
                ["address", "Recipient address"],
                ["date", "Document date"],
                ["subject", "Subject"],
                ["sender", "Sender name"],
                ["senderDesignation", "Sender designation"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                wide={key === "subject" || key === "address"}
              >
                <input
                  type={key === "date" ? "date" : "text"}
                  value={draft[key]}
                  maxLength={1000}
                  onChange={(e) => update(key, e.target.value)}
                />
              </Field>
            ))}
            <Field label="Body · English or বাংলা" wide>
              <textarea
                rows={12}
                value={draft.body}
                maxLength={30000}
                onChange={(e) => update("body", e.target.value)}
                placeholder="Write the approved facts and intended message…"
              />
            </Field>
          </div>
          <div className="a-panel-bottom">
            <Button
              onClick={() => {
                if (!draft.subject.trim() || !draft.body.trim())
                  return notify(
                    "Add a subject and body before saving a local letter draft.",
                  );
                setLocalDrafts([...localDrafts, structuredClone(draft)]);
                notify(
                  "Letter draft saved in this tab only. Export it before closing.",
                );
              }}
            >
              Save locally
            </Button>
            <Button
              secondary
              onClick={() =>
                download(
                  "aia-letter-draft.json",
                  JSON.stringify(
                    { kind: "UNAPPROVED_LOCAL_LETTER", type: template, draft },
                    null,
                    2,
                  ),
                )
              }
            >
              Export draft
            </Button>
          </div>
          {localDrafts.length > 0 && (
            <div className="a-saved-drafts">
              {localDrafts.map((d, i) => (
                <button key={i} onClick={() => setDraft(structuredClone(d))}>
                  {d.subject}
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="a-panel">
          <header className="a-panel-header">
            <div>
              <p className="a-overline">REUSABLE WORDING</p>
              <h2>Template workbench</h2>
            </div>
          </header>
          <div className="a-form-grid">
            <Field label="Template body · plain text with safe variables" wide>
              <textarea
                rows={6}
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                maxLength={30000}
              />
            </Field>
          </div>
          <div className="a-inline-note" aria-live="polite">
            {missing.length ? (
              <p>
                Before applying, complete:{" "}
                {missing
                  .map(
                    (name) => fieldNames[name] || `Unknown variable: ${name}`,
                  )
                  .join(", ")}
                . Your letter body is kept until the template is ready.
              </p>
            ) : (
              <p>All variables in this template are ready.</p>
            )}
          </div>
          <p className="a-inline-note">
            Available:{" "}
            {
              "{{company_name}}, {{company_address}}, {{client_name}}, {{document_date}}, {{sender_name}}"
            }
            . Use the fields above to supply these values.
          </p>
          <div className="a-panel-bottom">
            <Button
              secondary
              disabled={missing.length > 0}
              onClick={() => {
                try {
                  update("body", renderVariables(templateBody, templateValues));
                  notify(
                    "Template variables resolved into the editable letter body.",
                  );
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              Apply template
            </Button>
            <Button
              secondary
              onClick={() =>
                download(
                  "aia-letter-template.txt",
                  templateBody,
                  "text/plain;charset=utf-8",
                )
              }
            >
              Export template
            </Button>
          </div>
        </section>
        <div className="a-locked-actions">
          <Icon name="lock" />
          <p>
            Versioned templates, approval, private attachments, reference
            allocation, and email dispatch are planned database workflows.
          </p>
        </div>
      </div>
      {previewError ? (
        <p role="alert" className="a-validation">
          {previewError}
        </p>
      ) : (
        <DocumentPreview html={previewHtml} label="Letterhead preview" />
      )}
    </div>
  );
}
