"use client";

import { useState } from "react";
import { Field, Empty } from "./ui";

export function CustomerDirectory() {
  const [query, setQuery] = useState("");
  return (
    <section className="a-panel">
      <header className="a-panel-header">
        <div>
          <p className="a-overline">CUSTOMER DIRECTORY</p>
          <h2>Relationships with context</h2>
        </div>
        <span className="a-badge">Not connected</span>
      </header>
      <div className="a-directory-filter">
        <input
          aria-label="Search customers"
          placeholder="Search customers, organizations, or verified contacts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="a-table-wrap">
        <table className="a-table">
          <thead>
            <tr>
              <th>Customer / organization</th>
              <th>Verified contact</th>
              <th>Requests</th>
              <th>Last activity</th>
            </tr>
          </thead>
        </table>
      </div>
      <Empty
        icon="user"
        title={
          query
            ? "No connected directory to search"
            : "A considered customer history"
        }
      >
        Customer records will appear after CRM persistence is enabled. Contact
        matching alone will never attach a guest request to an account.
      </Empty>
    </section>
  );
}

export function Operations() {
  const [view, setView] = useState("list"),
    [date, setDate] = useState("");
  return (
    <section className="a-panel">
      <header className="a-panel-header">
        <div>
          <p className="a-overline">VISITS & BOOKINGS</p>
          <h2>Your operations, in view</h2>
        </div>
        <div className="a-tabs">
          <button
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List
          </button>
          <button aria-pressed={view === "map"} onClick={() => setView("map")}>
            Map
          </button>
        </div>
      </header>
      <div className="a-directory-filter">
        <Field label="Scheduled date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>
      <Empty
        icon="pin"
        title={
          view === "map"
            ? "A map starts with verified locations"
            : "No visit schedule is connected"
        }
      >
        {view === "map"
          ? "No mapping provider or authorized coordinates are configured. Use the list view until real site locations are available."
          : `Scheduled visits${date ? ` for ${date}` : ""}, assigned staff, and status changes will appear after operations persistence is connected.`}
      </Empty>
    </section>
  );
}
