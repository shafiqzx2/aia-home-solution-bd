"use client";

import { useLocalDraft } from "./local-drafts";
import { Icon } from "@/components/ui/icon";
import type { CompanySnapshot } from "@/lib/business/company-settings";
import { renderEmail } from "@/lib/business/documents";
import { Button, Field, Empty, DocumentPreview, download } from "./ui";

export function EmailCenter({
  company,
  notify,
}: {
  company: CompanySnapshot;
  notify: (s: string) => void;
}) {
  const [subject, setSubject] = useLocalDraft("email:subject", ""),
    [body, setBody] = useLocalDraft("email:body", ""),
    [to, setTo] = useLocalDraft("email:to", ""),
    [cc, setCc] = useLocalDraft("email:cc", ""),
    [bcc, setBcc] = useLocalDraft("email:bcc", "");
  const [drafts, setDrafts] = useLocalDraft<
    { subject: string; body: string; to: string; cc: string; bcc: string }[]
  >("email:drafts", []);
  return (
    <>
      <div className="a-editor-grid">
        <section className="a-panel">
          <header className="a-panel-header">
            <div>
              <p className="a-overline">COMPOSE & REVIEW</p>
              <h2>A message worth opening</h2>
            </div>
            <span className="a-badge">Local draft</span>
          </header>
          <div className="a-form-grid">
            <Field label="From · Sending identity not configured" wide>
              <input readOnly value="Verified sending domain required" />
            </Field>
            {[
              ["To", to, setTo],
              ["CC", cc, setCc],
              ["BCC", bcc, setBcc],
            ].map(([name, value, setter]) => (
              <Field label={name as string} key={name as string} wide>
                <input
                  value={value as string}
                  type="email"
                  multiple
                  onChange={(e) =>
                    (setter as (s: string) => void)(e.target.value)
                  }
                  maxLength={3000}
                  placeholder="recipient@company.com"
                />
              </Field>
            ))}
            <Field label="Subject" wide>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={300}
              />
            </Field>
            <Field label="Message" wide>
              <textarea
                rows={13}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={30000}
                placeholder="Compose your message. The branded preview updates as you write."
              />
            </Field>
          </div>
          <div className="a-panel-bottom">
            <Button
              onClick={() => {
                if (!subject.trim() || !body.trim())
                  return notify("Add a subject and message before saving.");
                setDrafts([...drafts, { subject, body, to, cc, bcc }]);
                notify(
                  "Email draft saved in this tab only. No provider call or dispatch was made.",
                );
              }}
            >
              Save locally
            </Button>
            <Button
              secondary
              onClick={() =>
                download(
                  "aia-email-draft.json",
                  JSON.stringify(
                    {
                      subject,
                      body,
                      to,
                      cc,
                      bcc,
                      state: "UNREVIEWED_LOCAL_DRAFT",
                    },
                    null,
                    2,
                  ),
                )
              }
            >
              Export draft
            </Button>
          </div>
          {drafts.length > 0 && (
            <div className="a-saved-drafts">
              {drafts.map((d, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSubject(d.subject);
                    setBody(d.body);
                    setTo(d.to);
                    setCc(d.cc);
                    setBcc(d.bcc);
                  }}
                >
                  {d.subject}
                </button>
              ))}
            </div>
          )}
          <div className="a-locked-actions">
            <Icon name="lock" />
            <p>
              Dispatch requires a verified provider, authorized sender review,
              approved attachments, and durable idempotency. Rich HTML editing
              and delivery webhooks are planned. This composer safely renders
              plain text.
            </p>
          </div>
        </section>
        <DocumentPreview
          html={renderEmail(
            subject || "Your subject appears here",
            body,
            company,
          )}
          label="Branded email preview"
        />
      </div>
      <section className="a-panel a-email-history">
        <header className="a-panel-header">
          <div>
            <p className="a-overline">COMMUNICATION HISTORY</p>
            <h2>Every dispatch, traceable</h2>
          </div>
        </header>
        <Empty icon="arrow" title="No delivery service is connected">
          Accepted, failed, and delivered states will be recorded only when
          supported by real provider evidence.
        </Empty>
      </section>
    </>
  );
}
