import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { assertIsolation, assertRestoreRole, createArgs, createPlan, restoreIsolated, validateArchive } from "./db-restore-test.mjs";

const image = `sha256:${"a".repeat(64)}`;
const id = "b".repeat(64);
const bytes = Buffer.concat([Buffer.from("PGDMP"), Buffer.alloc(64)]);
const manifest = {
  format: 1,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  snapshot: { rows: {}, columns: [], sequenceValues: {} },
};

function identity(database) {
  return { database, user: "aia_restore", superuser: false, createDb: false, createRole: false,
    replication: false, bypassRls: false, inherit: false, memberships: 0,
    databaseCreate: false, schemaCreate: true, schemaUsage: true, objects: 0 };
}

function inspection(plan) {
  const args = createArgs(plan);
  const tmpfs = {};
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--tmpfs") {
      const [target, options] = args[index + 1].split(":");
      tmpfs[target] = options;
    }
  }
  return { Id: id, Name: `/${plan.name}`, Image: image,
    Config: { User: "postgres", Labels: { "bd.aia.restore-test": plan.token } },
    HostConfig: { NetworkMode: "none", ReadonlyRootfs: true, Privileged: false,
      CapDrop: ["ALL"], SecurityOpt: ["no-new-privileges:true"], Tmpfs: tmpfs },
    NetworkSettings: { Networks: { none: {} } }, Mounts: [] };
}

function harness({ invalidIsolation = false, archiveFailure = false, roleChanges = {}, restoreFailure = false } = {}) {
  const calls = [];
  let plan;
  const run = async (args, options = {}) => {
    calls.push({ args, options });
    if (args[0] === "image") return image;
    if (args[0] === "create") {
      const name = args[args.indexOf("--name") + 1];
      const token = name.slice("aia-restore-test-".length);
      plan = { name, token, database: `aia_restore_test_${token}`, image };
      return id;
    }
    if (args[0] === "inspect") {
      const info = inspection(plan);
      if (invalidIsolation) info.HostConfig.NetworkMode = "bridge";
      return JSON.stringify([info]);
    }
    if (args.includes("pg_restore")) {
      if (args.includes("--file=/dev/null") && archiveFailure) throw new Error("Invalid archive data");
      if (args.includes("--exit-on-error") && restoreFailure) throw new Error("Restore failed");
    }
    if (args.includes("psql")) {
      if (options.input.includes("json_build_object('database'")) {
        return JSON.stringify({ ...identity(plan.database), ...roleChanges });
      }
      if (options.input.includes("SELECT coalesce(json_agg")) return "[]";
    }
    return "";
  };
  return { calls, run, delay: async () => {}, log: () => {} };
}

test("targets use unique names and a pinned local image, not a supplied database", () => {
  const plans = Array.from({ length: 50 }, () => createPlan(image));
  assert.equal(new Set(plans.map((plan) => plan.name)).size, plans.length);
  for (const plan of plans) {
    assert.match(plan.database, /^aia_restore_test_[a-f0-9]{32}$/);
    const args = createArgs(plan);
    assert.equal(args[args.indexOf("--network") + 1], "none");
    assert.equal(args[args.indexOf("--user") + 1], "postgres");
    for (const flag of ["--publish", "-p", "--mount", "--volume", "-v", "--volumes-from", "--privileged", "--env-file", "--rm"]) {
      assert.ok(!args.includes(flag));
    }
    assert.ok(args.includes("--pull=never"));
    assert.ok(args.includes("listen_addresses="));
  }
  assert.throws(() => createPlan("postgres:latest"));
});

test("container inspection rejects wrong identities, networks, mounts, ports, and privileges", () => {
  const plan = createPlan(image);
  assert.doesNotThrow(() => assertIsolation(inspection(plan), plan, id));
  const mutations = [
    (info) => { info.Id = "c".repeat(64); },
    (info) => { info.Name = "/aia-home-solution-bd-postgres-1"; },
    (info) => { info.Config.Labels = {}; },
    (info) => { info.HostConfig.NetworkMode = "bridge"; },
    (info) => { info.NetworkSettings.Networks.development = {}; },
    (info) => { info.Mounts.push({ Type: "volume", Destination: "/var/lib/postgresql/data" }); },
    (info) => { info.HostConfig.Binds = ["/var/run/docker.sock:/var/run/docker.sock"]; },
    (info) => { info.HostConfig.VolumesFrom = ["main-database"]; },
    (info) => { info.HostConfig.PortBindings = { "5432/tcp": [{ HostPort: "5432" }] }; },
    (info) => { info.HostConfig.ReadonlyRootfs = false; },
    (info) => { info.HostConfig.Privileged = true; },
    (info) => { info.Config.User = "root"; },
    (info) => { info.HostConfig.CapDrop = []; },
    (info) => { info.HostConfig.SecurityOpt = []; },
    (info) => { info.HostConfig.Tmpfs["/unexpected"] = "rw"; },
  ];
  for (const mutate of mutations) {
    const info = inspection(plan);
    mutate(info);
    assert.throws(() => assertIsolation(info, plan, id));
  }
  const reordered = inspection(plan);
  reordered.HostConfig.Tmpfs = Object.fromEntries(Object.entries(reordered.HostConfig.Tmpfs).reverse());
  assert.doesNotThrow(() => assertIsolation(reordered, plan, id));
});

test("role validation rejects admin privileges, memberships, wrong targets, and nonempty targets", () => {
  const database = createPlan(image).database;
  assert.doesNotThrow(() => assertRestoreRole(identity(database), database));
  for (const changes of [{ database: "aia" }, { user: "aia_app" }, { superuser: true },
    { createDb: true }, { createRole: true }, { replication: true }, { bypassRls: true },
    { inherit: true }, { memberships: 1 }, { databaseCreate: true }, { schemaCreate: false }, { objects: 1 }]) {
    assert.throws(() => assertRestoreRole({ ...identity(database), ...changes }, database));
  }
});

test("invalid backup inputs fail before any Docker call", async () => {
  for (const [data, metadata] of [[Buffer.from("bad"), manifest], [bytes, { ...manifest, sha256: "0".repeat(64) }],
    [bytes, { ...manifest, snapshot: {} }], [bytes, null]]) {
    assert.throws(() => validateArchive(data, metadata));
    const mock = harness();
    await assert.rejects(restoreIsolated(data, metadata, mock));
    assert.equal(mock.calls.length, 0);
  }
});

test("mock-only restore validates isolation and archive before setup, then uses restricted credentials", async () => {
  const mock = harness();
  await restoreIsolated(bytes, manifest, mock);
  const calls = mock.calls;
  assert.ok(calls.findIndex(({ args }) => args.includes("--file=/dev/null")) <
    calls.findIndex(({ options }) => options.input?.includes?.("CREATE ROLE")));
  const restore = calls.find(({ args }) => args.includes("--exit-on-error"));
  assert.ok(restore.args.includes("--username=aia_restore"));
  assert.ok(restore.args.includes("--single-transaction"));
  assert.ok(restore.args.some((arg) => /^--dbname=aia_restore_test_[a-f0-9]{32}$/.test(arg)));
  assert.equal(restore.options.input, bytes);
  const create = calls.find(({ args }) => args[0] === "create");
  assert.match(restore.options.env.PGPASSWORD, /^[a-f0-9]{64}$/);
  assert.notEqual(restore.options.env.PGPASSWORD, create.options.env.POSTGRES_PASSWORD);
  for (const { args } of calls) {
    assert.ok(!args.includes("compose"));
    for (const forbidden of ["rm", "stop", "kill", "prune", "--clean", "--create", "--username=aia_app", "--dbname=aia"]) {
      assert.ok(!args.includes(forbidden));
    }
  }
});

test("failed isolation, archive parsing, or role validation blocks the actual restore", async () => {
  for (const config of [{ invalidIsolation: true }, { archiveFailure: true }, { roleChanges: { superuser: true } }]) {
    const mock = harness(config);
    await assert.rejects(restoreIsolated(bytes, manifest, mock));
    assert.ok(!mock.calls.some(({ args }) => args.includes("--exit-on-error")));
    if (config.invalidIsolation || config.archiveFailure) {
      assert.ok(!mock.calls.some(({ options }) => typeof options.input === "string" && options.input.includes("CREATE ROLE")));
    }
  }
});

test("a failed mock restore never stops, deletes, or reuses any container", async () => {
  const mock = harness({ restoreFailure: true });
  await assert.rejects(restoreIsolated(bytes, manifest, mock), /Restore failed/);
  assert.equal(mock.calls.filter(({ args }) => args[0] === "create").length, 1);
  assert.ok(!mock.calls.some(({ args }) => ["rm", "stop", "kill", "prune"].includes(args[0])));
});
