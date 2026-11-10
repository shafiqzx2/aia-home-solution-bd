"use client";
import { useLocalDraft } from "./local-drafts";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  assertRoleChange,
  permissionActions,
  permissionResources,
  type DemoRole,
  type MatrixScope,
} from "@/lib/business/role-matrix";
import { Button, download } from "./ui";

export function RolesManager({
  roles,
  setRoles,
  notify,
}: {
  roles: DemoRole[];
  setRoles: (r: DemoRole[]) => void;
  notify: (s: string) => void;
}) {
  const [selected, setSelected] = useState("DEMO-PRODUCT"),
    [actor, setActor] = useState("DEMO-ROOT"),
    [changes, setChanges] = useLocalDraft<string[]>("roles:changes", []),
    [suspended, setSuspended] = useLocalDraft<string[]>("roles:suspended", []);
  const role = roles.find((r) => r.id === selected)!,
    reviewer = roles.find((r) => r.id === actor)!;
  const [assignments, setAssignments] = useLocalDraft<Record<string, string>>(
    "roles:assignments",
    {},
  );
  const staff = [
    {
      id: "DEMO-STAFF-1",
      name: "Nabila Sultana · Demo",
      role: "Content Admin",
    },
    { id: "DEMO-STAFF-2", name: "Imran Hossain · Demo", role: "Product Staff" },
    {
      id: "DEMO-STAFF-3",
      name: "Mehedi Hasan · Demo",
      role: "Operations Staff",
    },
    { id: "DEMO-STAFF-4", name: "Sadia Akter · Demo", role: "Accounts Staff" },
  ];
  function toggle(scope: MatrixScope) {
    const next = {
      ...role,
      scopes: role.scopes.includes(scope)
        ? role.scopes.filter((s) => s !== scope)
        : [...role.scopes, scope],
    };
    try {
      assertRoleChange(reviewer, role, next);
      setRoles(roles.map((r) => (r.id === role.id ? next : r)));
      setChanges([
        `LOCAL · ${reviewer.name} ${next.scopes.includes(scope) ? "granted" : "revoked"} ${scope} for ${role.name}`,
        ...changes,
      ]);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <>
      <div className="a-security-intro">
        <span className="a-security-icon">
          <Icon name="shield" />
        </span>
        <div>
          <h2>Access follows responsibility.</h2>
          <p>
            Review configurable permissions in an isolated local matrix. No
            account or live permission is changed.
          </p>
        </div>
        <span className="a-chip">LOCAL SIMULATION</span>
      </div>
      <div className="a-role-layout">
        <aside className="a-panel a-role-list">
          <header>
            <h3>Roles</h3>
            <span>{roles.length} demo profiles</span>
          </header>
          {roles.map((r) => (
            <button
              key={r.id}
              aria-pressed={selected === r.id}
              onClick={() => setSelected(r.id)}
            >
              <Icon name={r.kind === "SUPER_ADMIN" ? "shield" : "user"} />
              <span>
                <strong>{r.name}</strong>
                <small>
                  {r.kind === "SUPER_ADMIN"
                    ? "Secure provisioning only"
                    : `${r.scopes.length} permission scopes`}
                </small>
              </span>
              <Icon name="chevron" />
            </button>
          ))}
        </aside>
        <section className="a-panel">
          <header className="a-panel-header">
            <div>
              <p className="a-overline">PERMISSION MATRIX</p>
              <h2>{role.name}</h2>
            </div>
            <Button
              secondary
              onClick={() =>
                download(
                  "aia-demo-role-matrix.json",
                  JSON.stringify({ demo: true, roles }, null, 2),
                )
              }
            >
              <Icon name="download" />
              Export
            </Button>
          </header>
          <div className="a-permission-review">
            <label>
              Review changes as{" "}
              <select value={actor} onChange={(e) => setActor(e.target.value)}>
                <option value="DEMO-ROOT">Root Admin · simulation</option>
                <option value="DEMO-CONTENT">Content Admin · simulation</option>
              </select>
            </label>
            <p>Scroll horizontally to review all 10 permission actions.</p>
            <p>
              {role.kind === "SUPER_ADMIN"
                ? "Root privileges are locked. Provisioning requires a verified operator workflow."
                : "Checked cells grant a scope only within this demo matrix."}
            </p>
          </div>
          <div className="a-table-wrap a-matrix-wrap">
            <table className="a-table a-matrix">
              <thead>
                <tr>
                  <th>Module</th>
                  {permissionActions.map((a) => (
                    <th key={a}>{a === "archive" ? "Archive / delete" : a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionResources.map((resource) => (
                  <tr key={resource}>
                    <th scope="row">{resource}</th>
                    {permissionActions.map((action) => {
                      const scope = `${resource}.${action}` as MatrixScope;
                      return (
                        <td key={action}>
                          <input
                            type="checkbox"
                            aria-label={`${role.name}: ${scope}`}
                            checked={role.scopes.includes(scope)}
                            disabled={role.kind === "SUPER_ADMIN"}
                            onChange={() => toggle(scope)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="a-panel-footnote">
            <Icon name="lock" />
            Server enforcement is required in Phase B. All current protected
            APIs remain closed.
          </footer>
        </section>
      </div>
      <section className="a-panel a-gap-top">
        <header className="a-panel-header">
          <h2>Staff access review</h2>
          <span className="a-chip">FICTIONAL STAFF</span>
        </header>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Role</th>
                <th>Account state</th>
                <th>Review action</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <small>{s.id}</small>
                  </td>
                  <td>
                    <select
                      aria-label={`Demo role for ${s.id}`}
                      value={assignments[s.id] || s.role}
                      onChange={(e) => {
                        if (reviewer.kind !== "SUPER_ADMIN")
                          return notify(
                            "Only the Root Admin review profile can assign demo staff roles.",
                          );
                        const value = e.target.value;
                        if (
                          !roles.some(
                            (r) => r.name === value && r.kind !== "SUPER_ADMIN",
                          )
                        )
                          return;
                        setAssignments({ ...assignments, [s.id]: value });
                        setChanges([
                          `LOCAL · Assigned ${value} to ${s.id}`,
                          ...changes,
                        ]);
                      }}
                    >
                      {roles
                        .filter((r) => r.kind !== "SUPER_ADMIN")
                        .map((r) => (
                          <option key={r.id}>{r.name}</option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <span
                      className={`a-status-label ${suspended.includes(s.id) ? "status-warn" : "status-good"}`}
                    >
                      {suspended.includes(s.id)
                        ? "Suspended in demo"
                        : "Active in demo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="a-text-button"
                      onClick={() => {
                        if (reviewer.kind !== "SUPER_ADMIN")
                          return notify(
                            "Only the Root Admin review profile can suspend this demo staff member.",
                          );
                        setSuspended(
                          suspended.includes(s.id)
                            ? suspended.filter((id) => id !== s.id)
                            : [...suspended, s.id],
                        );
                        setChanges([
                          `LOCAL · Staff status changed for ${s.id}`,
                          ...changes,
                        ]);
                      }}
                    >
                      {suspended.includes(s.id)
                        ? "Restore demo access"
                        : "Suspend demo access"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="a-panel a-gap-top">
        <header className="a-panel-header">
          <h2>Local permission-change review</h2>
          <span className="a-chip">NOT A PERSISTED AUDIT LOG</span>
        </header>
        <ul className="a-record-list">
          {changes.length ? (
            changes.slice(0, 8).map((s, i) => (
              <li key={i}>
                <Icon name="activity" />
                <span>{s}</span>
              </li>
            ))
          ) : (
            <li>No role changes in this tab.</li>
          )}
        </ul>
      </section>
    </>
  );
}
